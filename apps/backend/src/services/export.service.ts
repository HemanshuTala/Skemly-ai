import puppeteer from 'puppeteer';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Queue, Worker, Job } from 'bullmq';
import { ExportJob, IExportJob } from '../models/export-job.model';
import { Diagram } from '../models/diagram.model';
import { User, PLAN_LIMITS } from '../models/user.model';
import { ApiError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import Redis from 'ioredis';
import { NodeHttpHandler } from '@smithy/node-http-handler';

/**
 * §12 Export System Service
 * Server-side rendering with Puppeteer + BullMQ job queue + S3 storage
 */
class ExportService {
  private s3Client: S3Client | null = null;
  private exportQueue: Queue | null = null;
  private worker: Worker | null = null;
  private redis: Redis | null = null;

  constructor() {
    this.initializeS3();
    this.initializeQueue();
  }

  private preferInlineExportStorage(): boolean {
    const mode = String(process.env.EXPORT_STORAGE_MODE || '').trim().toLowerCase();
    return mode === 'inline' || mode === 'local';
  }

  private initializeS3(): void {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';

    if (accessKeyId && secretAccessKey && 
        accessKeyId !== 'your-aws-access-key' && 
        secretAccessKey !== 'your-aws-secret-key') {
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        maxAttempts: 5,
        requestHandler: new NodeHttpHandler({
          connectionTimeout: 10_000,
          socketTimeout: 120_000,
        }),
      });
      logger.info('✅ AWS S3 client initialized');
    } else {
      logger.warn('⚠️  AWS S3 not configured - exports will be limited');
    }
  }

  private initializeQueue(): void {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      logger.warn('⚠️  Redis not configured - export queue disabled');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
      
      this.exportQueue = new Queue('exports', {
        connection: this.redis,
      });

      this.worker = new Worker(
        'exports',
        async (job: Job) => await this.processExportJob(job),
        { connection: this.redis }
      );

      this.worker.on('completed', (job) => {
        logger.info(`Export job ${job.id} completed`);
      });

      this.worker.on('failed', (job, err) => {
        logger.error(`Export job ${job?.id} failed:`, err);
      });

      logger.info('✅ Export queue initialized');
    } catch (error) {
      logger.error('Failed to initialize export queue:', error);
    }
  }

  /**
   * §EXP-01 Export diagram as PNG
   */
  async exportPNG(
    userId: string,
    diagramId: string,
    scale: 1 | 2 | 4 = 1
  ): Promise<IExportJob> {
    return this.queueExport(userId, diagramId, 'png', scale);
  }

  /**
   * §EXP-02 Export diagram as SVG
   */
  async exportSVG(
    userId: string,
    diagramId: string
  ): Promise<IExportJob> {
    return this.queueExport(userId, diagramId, 'svg', 1);
  }

  /**
   * §EXP-03 Export diagram as PDF
   */
  async exportPDF(
    userId: string,
    diagramId: string
  ): Promise<IExportJob> {
    return this.queueExport(userId, diagramId, 'pdf', 1);
  }

  /**
   * Queue export job
   */
  private async queueExport(
    userId: string,
    diagramId: string,
    format: 'png' | 'svg' | 'pdf',
    scale: number
  ): Promise<IExportJob> {
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found');
    }

    const withWatermark = user.plan === 'free';

    const exportJob = await ExportJob.create({
      diagramId,
      workspaceId: diagram.workspaceId,
      requestedBy: userId,
      format,
      scale,
      withWatermark,
      status: 'queued',
    });

    if (this.exportQueue) {
      const bullJob = await this.exportQueue.add('export', {
        exportJobId: exportJob._id.toString(),
        diagramId,
        format,
        scale,
        withWatermark,
      });

      exportJob.bullJobId = bullJob.id as string;
      await exportJob.save();
    } else {
      await this.processExportJobDirect(exportJob);
    }

    return exportJob;
  }

  private async processExportJob(job: Job): Promise<void> {
    const { exportJobId } = job.data;
    const exportJob = await ExportJob.findById(exportJobId);
    
    if (!exportJob) {
      throw new Error('Export job not found');
    }

    await this.processExportJobDirect(exportJob);
  }

  private async processExportJobDirect(exportJob: IExportJob): Promise<void> {
    try {
      exportJob.status = 'processing';
      exportJob.startedAt = new Date();
      await exportJob.save();

      const diagram = await Diagram.findById(exportJob.diagramId);
      if (!diagram) {
        throw new Error('Diagram not found');
      }

      const buffer = await this.renderDiagram(
        diagram,
        exportJob.format,
        exportJob.scale,
        exportJob.withWatermark
      );

      if (this.s3Client && !this.preferInlineExportStorage()) {
        try {
          const fileKey = `exports/${exportJob._id}.${exportJob.format}`;
          await this.uploadToS3(buffer, fileKey, exportJob.format);
          const fileUrl = await this.getPresignedUrl(fileKey);

          exportJob.fileKey = fileKey;
          exportJob.fileUrl = fileUrl;
          exportJob.fileSizeBytes = buffer.length;
          exportJob.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        } catch (s3Error: any) {
          logger.warn(`S3 upload failed for export ${exportJob._id}, falling back to inline URL`, {
            message: s3Error?.message,
            code: s3Error?.Code || s3Error?.name,
          });
          exportJob.fileKey = null;
          exportJob.fileUrl = this.bufferToDataUrl(buffer, exportJob.format);
          exportJob.fileSizeBytes = buffer.length;
          exportJob.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        }
      } else {
        exportJob.fileKey = null;
        exportJob.fileUrl = this.bufferToDataUrl(buffer, exportJob.format);
        exportJob.fileSizeBytes = buffer.length;
        exportJob.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      }

      exportJob.status = 'done';
      exportJob.completedAt = new Date();
      await exportJob.save();

      logger.info(`Export completed: ${exportJob._id}`);
    } catch (error: any) {
      exportJob.status = 'failed';
      exportJob.errorMessage = error.message;
      exportJob.retryCount += 1;
      await exportJob.save();

      logger.error(`Export failed: ${exportJob._id}`, error);
      throw error;
    }
  }

  private async renderDiagram(
    diagram: any,
    format: 'png' | 'svg' | 'pdf' | 'syntax',
    scale: number,
    withWatermark: boolean
  ): Promise<Buffer> {
    const graph = this.buildExportGraph(diagram);
    if (format === 'syntax') {
      return Buffer.from(String(diagram.syntax || ''), 'utf-8');
    }
    if (format === 'svg') {
      const svg = this.generateDiagramSVG(graph, withWatermark);
      return Buffer.from(svg, 'utf-8');
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      const viewportWidth = Math.max(1024, Math.ceil(graph.width + 48));
      const viewportHeight = Math.max(768, Math.ceil(graph.height + 48));
      
      await page.setViewport({
        width: viewportWidth,
        height: viewportHeight,
        deviceScaleFactor: scale,
      });

      const html = this.generateDiagramHTML(graph, withWatermark);
      await page.setContent(html, { waitUntil: 'networkidle0' });

      let buffer: Buffer;

      if (format === 'png') {
        await page.waitForSelector('#diagram-root');
        const clip = await page.$eval('#diagram-root', (el) => {
          const r = (el as any).getBoundingClientRect();
          return {
            x: Math.max(0, Math.floor(r.left)),
            y: Math.max(0, Math.floor(r.top)),
            width: Math.max(1, Math.ceil(r.width)),
            height: Math.max(1, Math.ceil(r.height)),
          };
        });
        buffer = await page.screenshot({
          type: 'png',
          clip,
        });
      } else if (format === 'pdf') {
        buffer = await page.pdf({
          width: `${Math.ceil(graph.width + 24)}px`,
          height: `${Math.ceil(graph.height + 24)}px`,
          printBackground: true,
          preferCSSPageSize: true,
        });
      } else {
        buffer = Buffer.from('', 'utf-8');
      }

      return buffer;
    } finally {
      await browser.close();
    }
  }

  private renderNodeToSVG(n: any, i: number, filterUrl: string): string {
    const textX = n.x + n.width / 2;
    const textY = n.y + n.height / 2 + Math.max(3, Math.floor(Number(n.fontSize || 12) / 3));
    const fs = Number(n.fontSize || 12);
    const ff = this.escapeHtml(String(n.fontFamily || 'ui-sans-serif, system-ui, sans-serif'));
    const fw = Number(n.fontWeight) >= 700 ? '700' : String(n.fontWeight || '600');
    const fst = n.fontStyle === 'italic' ? 'italic' : 'normal';
    const deco = n.textDecoration === 'underline' ? 'underline' : 'none';
    const anchor = n.textAlign === 'left' ? 'start' : n.textAlign === 'right' ? 'end' : 'middle';
    const tx = n.textAlign === 'left' ? n.x + 16 : n.textAlign === 'right' ? n.x + n.width - 16 : textX;
    const tstyle = `fill="${n.textColor}" font-size="${fs}" font-family="${ff}" font-weight="${fw}" font-style="${fst}" text-decoration="${deco}" text-anchor="${anchor}"`;
    const sw = Number(n.strokeW || 0);
    const nodeRadius = Math.max(0, Number(n.borderRadius || 0));

    const filterAttr = filterUrl ? ` filter="url(#${filterUrl})"` : '';

    if (n.kind === 'decision') {
      const cx = n.x + n.width / 2;
      const cy = n.y + n.height / 2;
      const rx = n.width / 2;
      const ry = n.height / 2;
      return `
        <g id="node-${i}"${filterAttr}>
          <polygon points="${cx},${cy - ry} ${cx + rx},${cy} ${cx},${cy + ry} ${cx - rx},${cy}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"/>
          <text x="${tx}" y="${textY}" ${tstyle}>${this.escapeHtml(n.label)}</text>
        </g>
      `;
    }
    if (n.kind === 'startend') {
      const radius =
        nodeRadius > 0 ? Math.min(nodeRadius, Math.floor(n.height / 2)) : Math.floor(n.height / 2);
      return `
        <g id="node-${i}"${filterAttr}>
          <rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="${radius}" ry="${radius}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"/>
          <text x="${tx}" y="${textY}" ${tstyle}>${this.escapeHtml(n.label)}</text>
        </g>
      `;
    }
    if (n.kind === 'database') {
      const ry = 12;
      return `
        <g id="node-${i}"${filterAttr}>
          <!-- Cylinder body -->
          <path d="M${n.x},${n.y+ry} L${n.x},${n.y+n.height-ry} C${n.x},${n.y+n.height+2} ${n.x+n.width},${n.y+n.height+2} ${n.x+n.width},${n.y+n.height-ry} L${n.x+n.width},${n.y+ry} Z" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"/>
          <!-- Cylinder lid -->
          <ellipse cx="${n.x + n.width/2}" cy="${n.y+ry}" rx="${n.width/2}" ry="${ry}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"/>
          <!-- Faint decorative ring -->
          <ellipse cx="${n.x + n.width/2}" cy="${n.y+ry+10}" rx="${n.width/2}" ry="8" fill="transparent" stroke="${n.stroke}" stroke-width="1" stroke-dasharray="3 3" opacity="0.4"/>
          <!-- Label -->
          <text x="${tx}" y="${textY + 2}" ${tstyle}>${this.escapeHtml(n.label)}</text>
        </g>
      `;
    }
    if (n.kind === 'io') {
      const skewX = 16;
      return `
        <g id="node-${i}"${filterAttr}>
          <polygon points="${n.x + skewX},${n.y} ${n.x + n.width},${n.y} ${n.x + n.width - skewX},${n.y + n.height} ${n.x},${n.y + n.height}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"/>
          <text x="${tx}" y="${textY}" ${tstyle}>${this.escapeHtml(n.label)}</text>
        </g>
      `;
    }
    if (n.kind === 'actor') {
      return `
        <g id="node-${i}"${filterAttr}>
          <rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="${nodeRadius || 8}" ry="${nodeRadius || 8}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw || 2}" stroke-dasharray="4 4"/>
          <text x="${tx}" y="${n.y + 20}" fill="#71717a" font-size="10" font-family="${ff}" font-weight="700" text-anchor="middle">ACTOR</text>
          <text x="${tx}" y="${textY + 6}" ${tstyle}>${this.escapeHtml(n.label)}</text>
        </g>
      `;
    }
    if (n.kind === 'entity') {
      const lines = String(n.label || '').split('\n');
      const headerText = lines[0] || 'Entity';
      const fields = lines.slice(1);
      
      const enforcedWidth = Math.max(n.width, 180);
      const dynamicHeight = Math.max(n.height, 42 + fields.length * 26 + 8);
      
      const fieldTexts = fields.map((f, idx) => {
        const lineY = n.y + 54 + (idx * 26);
        const parts = String(f || ' ').split(':');
        const colName = parts[0] || ' ';
        const colType = parts.slice(1).join(':');

        return `
          <!-- Row bullet -->
          <rect x="${n.x + 8}" y="${lineY - 7}" width="5" height="5" fill="#3f3f46" transform="rotate(45, ${n.x + 10.5}, ${lineY - 4.5})" />
          <!-- Column Name -->
          <text x="${n.x + 20}" y="${lineY}" fill="${n.textColor}" font-size="10.5" font-family="${ff}" font-weight="500" text-anchor="start">${this.escapeHtml(colName)}</text>
          <!-- Column Type -->
          ${colType ? `<text x="${n.x + enforcedWidth - 10}" y="${lineY}" fill="#a1a1aa" font-size="9" font-family="${ff}" text-anchor="end">${this.escapeHtml(colType)}</text>` : ''}
          <!-- Border-bottom faint line -->
          <path d="M${n.x + 4},${lineY + 10} L${n.x + enforcedWidth - 4},${lineY + 10}" stroke="#ffffff" stroke-width="1" opacity="0.05"/>
        `;
      }).join('');
      
      return `
        <g id="node-${i}"${filterAttr}>
          <!-- Dark background wrapping entire table -->
          <rect x="${n.x}" y="${n.y}" width="${enforcedWidth}" height="${dynamicHeight}" rx="${nodeRadius || 8}" ry="${nodeRadius || 8}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"/>
          
          <!-- Exact Top-Rounded-Only Header Path -->
          <path d="M${n.x},${n.y + 8} a8,8 0 0,1 8,-8 h${enforcedWidth - 16} a8,8 0 0,1 8,8 v24 h-${enforcedWidth} z" fill="${n.stroke}"/>
          
          <!-- Explicit Header text -->
          <text x="${n.x + 12}" y="${n.y + 20}" fill="#ffffff" font-size="11" font-family="${ff}" font-weight="900" letter-spacing="0.05em" text-anchor="start">${this.escapeHtml(headerText)}</text>
          
          <!-- 'TABLE' Tag -->
          <rect x="${n.x + enforcedWidth - 42}" y="${n.y + 10}" width="32" height="12" rx="2" fill="#000000" opacity="0.4"/>
          <text x="${n.x + enforcedWidth - 26}" y="${n.y + 19}" fill="#a1a1aa" font-size="7" font-weight="800" text-anchor="middle" letter-spacing="0.1em">TABLE</text>
          
          <!-- Field mapping -->
          ${fieldTexts}
        </g>
      `;
    }
    if (n.kind === 'queue') {
      return `
        <g id="node-${i}"${filterAttr}>
          <rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="${nodeRadius || 8}" ry="${nodeRadius || 8}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"/>
          <path d="M${n.x+16},${n.y} v${n.height}" stroke="${n.stroke}" stroke-width="2" stroke-dasharray="2 4" opacity="0.3"/>
          <text x="${tx + 4}" y="${textY}" ${tstyle}>${this.escapeHtml(n.label)}</text>
        </g>
      `;
    }
    
    // Default Node
    return `
      <g id="node-${i}"${filterAttr}>
        <rect x="${n.x}" y="${n.y}" width="${n.width}" height="${n.height}" rx="${nodeRadius || 10}" ry="${nodeRadius || 10}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"/>
        <text x="${tx}" y="${textY}" ${tstyle}>${this.escapeHtml(n.label)}</text>
      </g>
    `;
  }

  private generateDiagramHTML(graph: { nodes: any[]; edges: any[]; width: number; height: number }, withWatermark: boolean): string {
    const { nodes, edges, width, height } = graph;
    const bgColor = '#09090b';

    const markerDefs = edges
      .map((e: any, i: number) => {
        const c = e.stroke || '#ffffff';
        return `<marker id="arrow-${i}" viewBox="0 0 18 18" refX="15" refY="9" markerWidth="18" markerHeight="18" orient="auto-start-reverse">
            <path d="M 0 0 L 18 9 L 0 18 z" fill="${c}"></path>
          </marker>`;
      })
      .join('');

    const edgeSvg = edges
      .map((e: any, i: number) => {
        const from = nodes.find((n) => n.id === e.source);
        const to = nodes.find((n) => n.id === e.target);
        if (!from || !to) return '';
        const points = this.getEdgeAnchorPoints(
          from,
          to,
          e.sourceHandle,
          e.targetHandle,
          e.sourcePosition,
          e.targetPosition
        );
        const x1 = points.x1;
        const y1 = points.y1;
        const x2 = points.x2;
        const y2 = points.y2;
        const hasExactCoords =
          Number.isFinite(e.sourceX) &&
          Number.isFinite(e.sourceY) &&
          Number.isFinite(e.targetX) &&
          Number.isFinite(e.targetY);
        const fx1 = hasExactCoords ? Number(e.sourceX) : x1;
        const fy1 = hasExactCoords ? Number(e.sourceY) : y1;
        const fx2 = hasExactCoords ? Number(e.targetX) : x2;
        const fy2 = hasExactCoords ? Number(e.targetY) : y2;
        const d = this.buildSmoothEdgePath(fx1, fy1, fx2, fy2, points.fromSide, points.toSide);
        const midX = Math.floor((fx1 + fx2) / 2);
        const sw = Number(e.strokeWidth || 2);
        const dash = e.dash ? ` stroke-dasharray="${this.escapeHtml(e.dash)}"` : '';
        const mk = e.markerEnd === 'none' ? '' : ` marker-end="url(#arrow-${i})"`;
        const lf = e.labelFill || '#ffffff';
        const lfs = Number(e.labelFontSize || 12);
        const labelY = Math.floor((fy1 + fy2) / 2) - 10;
        const label = e.label
          ? `<text x="${midX}" y="${labelY}" fill="${lf}" font-size="${lfs}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600">${this.escapeHtml(e.label)}</text>`
          : '';
        return `
          <g id="edge-${i}">
            <path d="${d}" fill="none" stroke="${e.stroke}" stroke-width="${sw}"${dash}${mk}/>
            ${label}
          </g>
        `;
      })
      .join('');

    const nodeSvg = nodes.map((n: any, i: number) => this.renderNodeToSVG(n, i, 'drop-shadow')).join('');

    const watermarkHTML = withWatermark
      ? '<div style="position: absolute; bottom: 10px; right: 10px; opacity: 0.5; font-size: 12px; color: #a1a1aa">Made with Skemly — skemly.com</div>'
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 12px;
              font-family: Arial, sans-serif;
              background: ${bgColor};
            }
            .diagram-container {
              position: relative;
              width: ${width}px;
              height: ${height}px;
              overflow: hidden;
              background: ${bgColor};
            }
            #diagram-root {
              position: relative;
              width: ${width}px;
              height: ${height}px;
            }
            .edges {
              position: absolute;
              inset: 0;
              pointer-events: none;
            }
          </style>
        </head>
        <body>
          <div class="diagram-container">
            <div id="diagram-root">
              <svg class="edges" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                <defs>
                  <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.4"/>
                  </filter>
                  ${markerDefs}
                </defs>
                ${edgeSvg}
                ${nodeSvg}
              </svg>
            </div>
            ${watermarkHTML}
          </div>
        </body>
      </html>
    `;
  }

  private generateDiagramSVG(graph: { nodes: any[]; edges: any[]; width: number; height: number }, withWatermark: boolean): string {
    const { nodes, edges, width, height } = graph;
    const bgColor = '#09090b';

    const markerDefs = edges
      .map((e: any, i: number) => {
        const c = e.stroke || '#ffffff';
        return `<marker id="svg-arrow-${i}" viewBox="0 0 18 18" refX="15" refY="9" markerWidth="18" markerHeight="18" orient="auto-start-reverse">
      <path d="M 0 0 L 18 9 L 0 18 z" fill="${c}"></path>
    </marker>`;
      })
      .join('');

    const edgeSvg = edges
      .map((e: any, i: number) => {
        const from = nodes.find((n) => n.id === e.source);
        const to = nodes.find((n) => n.id === e.target);
        if (!from || !to) return '';
        const points = this.getEdgeAnchorPoints(
          from,
          to,
          e.sourceHandle,
          e.targetHandle,
          e.sourcePosition,
          e.targetPosition
        );
        const x1 = points.x1;
        const y1 = points.y1;
        const x2 = points.x2;
        const y2 = points.y2;
        const hasExactCoords =
          Number.isFinite(e.sourceX) &&
          Number.isFinite(e.sourceY) &&
          Number.isFinite(e.targetX) &&
          Number.isFinite(e.targetY);
        const fx1 = hasExactCoords ? Number(e.sourceX) : x1;
        const fy1 = hasExactCoords ? Number(e.sourceY) : y1;
        const fx2 = hasExactCoords ? Number(e.targetX) : x2;
        const fy2 = hasExactCoords ? Number(e.targetY) : y2;
        const d = this.buildSmoothEdgePath(fx1, fy1, fx2, fy2, points.fromSide, points.toSide);
        const midX = Math.floor((fx1 + fx2) / 2);
        const sw = Number(e.strokeWidth || 2);
        const dash = e.dash ? ` stroke-dasharray="${this.escapeHtml(e.dash)}"` : '';
        const mk = e.markerEnd === 'none' ? '' : ` marker-end="url(#svg-arrow-${i})"`;
        const lf = e.labelFill || '#ffffff';
        const lfs = Number(e.labelFontSize || 12);
        const labelY = Math.floor((fy1 + fy2) / 2) - 10;
        const label = e.label
          ? `<text x="${midX}" y="${labelY}" fill="${lf}" font-size="${lfs}" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600">${this.escapeHtml(e.label)}</text>`
          : '';
        return `
          <g id="edge-${i}">
            <path d="${d}" fill="none" stroke="${e.stroke}" stroke-width="${sw}"${dash}${mk}/>
            ${label}
          </g>
        `;
      })
      .join('');

    const nodeSvg = nodes.map((n: any, i: number) => this.renderNodeToSVG(n, i, 'svg-shadow')).join('');

    const watermarkSvg = withWatermark
      ? `<text x="${width - 12}" y="${height - 12}" fill="#52525b" font-size="12" text-anchor="end" opacity="0.8">Made with Skemly</text>`
      : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="${bgColor}"/>
  <defs>
    <filter id="svg-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
    ${markerDefs}
  </defs>
  ${edgeSvg}
  ${nodeSvg}
  ${watermarkSvg}
</svg>`;
  }

  private escapeHtml(input: string): string {
    return String(input)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private resolveExportColor(input: string | undefined, fallback: string): string {
    const s = String(input || '').trim();
    if (!s) return fallback;
    
    if (s.includes('--color-background')) return '#09090b';
    if (s.includes('--color-card')) return '#18181b';
    if (s.includes('--color-primary')) return '#ffffff';
    if (s.includes('--color-foreground')) return '#ffffff';
    if (s.includes('--color-muted')) return '#27272a';
    if (s.includes('--color-border')) return '#27272a';
    if (s.startsWith('var(')) return fallback;
    
    return s;
  }

  private buildSmoothEdgePath(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    fromSide: 'top' | 'right' | 'bottom' | 'left',
    _toSide: 'top' | 'right' | 'bottom' | 'left'
  ): string {
    const round = 16;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const horizontal = fromSide === 'left' || fromSide === 'right';
    const midX = x1 + dx / 2;
    const midY = y1 + dy / 2;

    if (horizontal) {
      if (Math.abs(dx) < 32) {
        const bend = fromSide === 'right' ? x1 + 36 : x1 - 36;
        return `M ${x1} ${y1} L ${bend} ${y1} L ${bend} ${y2} L ${x2} ${y2}`;
      }
      const c1 = midX - Math.sign(dx || 1) * round;
      const c2 = midX + Math.sign(dx || 1) * round;
      return `M ${x1} ${y1} L ${c1} ${y1} Q ${midX} ${y1} ${midX} ${y1 + Math.sign(dy || 1) * round} L ${midX} ${y2 - Math.sign(dy || 1) * round} Q ${midX} ${y2} ${c2} ${y2} L ${x2} ${y2}`;
    }

    if (Math.abs(dy) < 32) {
      const bend = fromSide === 'bottom' ? y1 + 36 : y1 - 36;
      return `M ${x1} ${y1} L ${x1} ${bend} L ${x2} ${bend} L ${x2} ${y2}`;
    }
    const c1 = midY - Math.sign(dy || 1) * round;
    const c2 = midY + Math.sign(dy || 1) * round;
    return `M ${x1} ${y1} L ${x1} ${c1} Q ${x1} ${midY} ${x1 + Math.sign(dx || 1) * round} ${midY} L ${x2 - Math.sign(dx || 1) * round} ${midY} Q ${x2} ${midY} ${x2} ${c2} L ${x2} ${y2}`;
  }

  private resolveAnchorFromHandle(
    node: any,
    side: 'top' | 'right' | 'bottom' | 'left'
  ): { x: number; y: number } {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    if (side === 'left') return { x: node.x, y: cy };
    if (side === 'right') return { x: node.x + node.width, y: cy };
    if (side === 'top') {
      const topOffset = node.kind === 'decision' ? node.height * 0.1 : 0;
      return { x: cx, y: node.y + topOffset };
    }
    const bottomOffset = node.kind === 'decision' ? node.height * 0.1 : 0;
    return { x: cx, y: node.y + node.height - bottomOffset };
  }

  private sideFromHandle(
    handle: unknown,
    fallback: 'top' | 'right' | 'bottom' | 'left'
  ): 'top' | 'right' | 'bottom' | 'left' {
    const v = String(handle || '').toLowerCase();
    if (v.includes('left')) return 'left';
    if (v.includes('right')) return 'right';
    if (v.includes('top')) return 'top';
    if (v.includes('bottom')) return 'bottom';
    return fallback;
  }

  private getDefaultSidesForKinds(
    from: any,
    to: any
  ): { fromSide: 'top' | 'right' | 'bottom' | 'left'; toSide: 'top' | 'right' | 'bottom' | 'left' } {
    const fromCx = from.x + from.width / 2;
    const fromCy = from.y + from.height / 2;
    const toCx = to.x + to.width / 2;
    const toCy = to.y + to.height / 2;
    const dx = toCx - fromCx;
    const dy = toCy - fromCy;
    const isDefaultFrom = from.kind === 'node';
    const isDefaultTo = to.kind === 'node';
    if (isDefaultFrom || isDefaultTo) {
      if (Math.abs(dx) >= Math.abs(dy)) {
        return { fromSide: dx >= 0 ? 'right' : 'left', toSide: dx >= 0 ? 'left' : 'right' };
      }
      return { fromSide: dy >= 0 ? 'bottom' : 'top', toSide: dy >= 0 ? 'top' : 'bottom' };
    }
    return { fromSide: dx >= 0 ? 'right' : 'left', toSide: dx >= 0 ? 'left' : 'right' };
  }

  private getEdgeAnchorPoints(
    from: any,
    to: any,
    sourceHandle?: unknown,
    targetHandle?: unknown,
    sourcePosition?: unknown,
    targetPosition?: unknown
  ): {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    fromSide: 'top' | 'right' | 'bottom' | 'left';
    toSide: 'top' | 'right' | 'bottom' | 'left';
  } {
    const defaults = this.getDefaultSidesForKinds(from, to);
    const posFrom = this.sideFromHandle(sourcePosition, defaults.fromSide);
    const posTo = this.sideFromHandle(targetPosition, defaults.toSide);
    const fromSide = this.sideFromHandle(sourceHandle, posFrom);
    const toSide = this.sideFromHandle(targetHandle, posTo);
    const p1 = this.resolveAnchorFromHandle(from, fromSide);
    const p2 = this.resolveAnchorFromHandle(to, toSide);
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, fromSide, toSide };
  }

  private getKindBorderRadius(kind: string): number {
    if (kind === 'startend') return 9999;
    if (kind === 'decision') return 4;
    if (kind === 'entity') return 8;
    if (kind === 'actor') return 8;
    if (kind === 'queue') return 8;
    if (kind === 'io') return 4;
    return 10;
  }

  private getDefaultSizeByKind(kind: string): { width: number; height: number } {
    if (kind === 'decision') return { width: 132, height: 132 };
    if (kind === 'startend') return { width: 140, height: 52 };
    if (kind === 'database') return { width: 168, height: 64 };
    if (kind === 'entity') return { width: 176, height: 80 };
    if (kind === 'actor') return { width: 152, height: 56 };
    if (kind === 'queue') return { width: 168, height: 52 };
    if (kind === 'io') return { width: 172, height: 52 };
    return { width: 160, height: 52 };
  }

  private slugifySyntaxNodeId(input: string): string {
    return String(input || '')
      .trim()
      .toLowerCase()
      .replace(/[\s]+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');
  }

  private unwrapSyntaxNodeRef(raw: string): { label: string; kind: string } {
    const s = String(raw || '').trim();
    const kindMatch = s.match(/^(.*)::(node|decision|startend|database|entity|actor|queue|io)$/i);
    const base = kindMatch ? kindMatch[1].trim() : s;
    const explicitKind = kindMatch ? kindMatch[2].toLowerCase() : '';
    const dbl = base.match(/^\[\[(.*)\]\]$/);
    if (dbl) return { label: dbl[1], kind: explicitKind || 'database' };
    const square = base.match(/^\[(.*)\]$/);
    if (square) return { label: square[1], kind: explicitKind || 'node' };
    const curly = base.match(/^\{(.*)\}$/);
    if (curly) return { label: curly[1], kind: explicitKind || 'decision' };
    const paren = base.match(/^\((.*)\)$/);
    if (paren) return { label: paren[1], kind: explicitKind || 'startend' };
    const io = base.match(/^\/\/(.*)\/\/$/);
    if (io) return { label: io[1], kind: explicitKind || 'io' };
    return { label: base, kind: explicitKind || 'node' };
  }

  private parseSyntaxFallbackGraph(syntax: string): { nodes: any[]; edges: any[] } {
    const lines = String(syntax || '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const nodeById = new Map<string, any>();
    const edges: any[] = [];
    const arrowRegex = /\s*(?:-{2,}>|={1,}>|-{1,}>)\s*/;

    const ensureNode = (raw: string): any | null => {
      const trimmed = String(raw || '').trim();
      if (!trimmed) return null;
      const { label, kind } = this.unwrapSyntaxNodeRef(trimmed);
      const id = this.slugifySyntaxNodeId(label || trimmed) || `node-${nodeById.size + 1}`;
      if (nodeById.has(id)) return nodeById.get(id);
      const def = this.getDefaultSizeByKind(kind);
      const created = {
        id,
        label,
        kind,
        x: 0,
        y: 0,
        width: def.width,
        height: def.height,
        fill: '#18181b',
        stroke: '#ffffff',
        strokeW: 2,
        fontSize: 12,
        fontWeight: 600,
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        textColor: '#ffffff',
        borderRadius: this.getKindBorderRadius(kind),
      };
      nodeById.set(id, created);
      return created;
    };

    lines.forEach((line, index) => {
      if (line.startsWith('@') || line.startsWith('#')) return;
      const low = line.toLowerCase();
      if (
        low.startsWith('flowchart ') ||
        low === 'flowchart' ||
        low.startsWith('graph ') ||
        low === 'graph' ||
        low.startsWith('subgraph ') ||
        low === 'subgraph' ||
        low === 'end'
      ) {
        return;
      }

      const labeledMatch = line.match(/^(.+?)\s+--\s+(.+?)\s*(?:-{2,}>|={1,}>|-{1,}>)\s*(.+)$/);
      if (labeledMatch) {
        const fromNode = ensureNode(labeledMatch[1]);
        const toNode = ensureNode(labeledMatch[3]);
        if (fromNode && toNode) {
          edges.push({
            id: `e-${fromNode.id}-${toNode.id}-${index}`,
            source: fromNode.id,
            target: toNode.id,
            label: String(labeledMatch[2] || '').trim() || undefined,
            stroke: '#ffffff',
            strokeWidth: 2,
            dash: '',
            labelFill: '#ffffff',
            labelFontSize: 12,
            markerEnd: 'arrowclosed',
          });
        }
        return;
      }

      const parts = line.split(arrowRegex);
      if (parts.length >= 2) {
        let lastNode = ensureNode(parts[0]);
        for (let i = 1; i < parts.length; i += 1) {
          const currentNode = ensureNode(parts[i]);
          if (lastNode && currentNode) {
            edges.push({
              id: `e-${lastNode.id}-${currentNode.id}-${index}-${i}`,
              source: lastNode.id,
              target: currentNode.id,
              stroke: '#ffffff',
              strokeWidth: 2,
              dash: '',
              labelFill: '#ffffff',
              labelFontSize: 12,
              markerEnd: 'arrowclosed',
            });
          }
          lastNode = currentNode;
        }
        return;
      }

      ensureNode(line);
    });

    const nodes = Array.from(nodeById.values());
    const incoming = new Map<string, number>();
    nodes.forEach((n) => incoming.set(n.id, 0));
    edges.forEach((e) => incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1));

    const roots = nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0);
    if (roots.length === 0 && nodes.length > 0) roots.push(nodes[0]);

    const adj = new Map<string, string[]>();
    nodes.forEach((n) => adj.set(n.id, []));
    edges.forEach((e) => adj.set(e.source, [...(adj.get(e.source) ?? []), e.target]));

    const depth = new Map<string, number>();
    const visit = (id: string, d: number) => {
      depth.set(id, Math.max(depth.get(id) ?? 0, d));
      (adj.get(id) ?? []).forEach((next) => visit(next, d + 1));
    };
    roots.forEach((r) => visit(r.id, 0));

    const levels = new Map<number, any[]>();
    nodes.forEach((n) => {
      const d = depth.get(n.id) ?? 0;
      const arr = levels.get(d) ?? [];
      arr.push(n);
      levels.set(d, arr);
    });

    const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);
    const cellX = 280;
    const cellY = 180;
    sortedLevels.forEach((levelIndex, i) => {
      const list = levels.get(levelIndex) ?? [];
      list
        .slice()
        .sort((a, b) => String(a.label ?? a.id).localeCompare(String(b.label ?? b.id)))
        .forEach((node, idx) => {
          node.x = i * cellX + 80;
          node.y = idx * cellY + 60;
        });
    });

    return { nodes, edges };
  }

  private buildExportGraph(diagram: any): {
    nodes: any[];
    edges: any[];
    width: number;
    height: number;
  } {
    const persistedNodes = Array.isArray(diagram.nodes) ? diagram.nodes : [];
    const persistedEdges = Array.isArray(diagram.edges) ? diagram.edges : [];

    if (persistedNodes.length > 0) {
      const nodes = persistedNodes.map((n: any, idx: number) => {
        const rawKind = String(n.data?.kind || n.type || 'node');
        const kind = ['decision', 'startend', 'database', 'entity', 'actor', 'queue', 'io'].includes(rawKind) ? rawKind : 'node';
        const defaults = this.getDefaultSizeByKind(kind);
        const st = n.data?.style || {};
        const rw = Number(n.width);
        const rh = Number(n.height);
        const w =
          Number(st.width) >= 20 ? Number(st.width) : rw >= 20 ? rw : defaults.width;
        const h =
          Number(st.height) >= 20 ? Number(st.height) : rh >= 20 ? rh : defaults.height;

        return {
          id: String(n.id || `n${idx}`),
          label: String(n.data?.label || n.id || `Node ${idx + 1}`),
          kind,
          x: Number(n.position?.x || 0),
          y: Number(n.position?.y || 0),
          width: w,
          height: h,
          fill: this.resolveExportColor(st.fillColor, '#18181b'),
          stroke: this.resolveExportColor(st.strokeColor, '#ffffff'),
          strokeW: Math.max(0, Number(st.strokeWidth || 2)),
          fontSize: Number(st.fontSize || 12),
          fontWeight: st.fontWeight ?? 600,
          fontStyle: st.fontStyle === 'italic' ? 'italic' : 'normal',
          textDecoration: st.textDecoration || 'none',
          textAlign: st.textAlign || 'center',
          fontFamily:
            st.fontFamily && String(st.fontFamily) !== 'inherit'
              ? String(st.fontFamily)
              : 'Inter, ui-sans-serif, system-ui, sans-serif',
          textColor: this.resolveExportColor(st.color, '#ffffff'),
          borderRadius: Number(st.borderRadius || this.getKindBorderRadius(kind)),
        };
      });

      const minX = Math.min(...nodes.map((n: any) => n.x));
      const minY = Math.min(...nodes.map((n: any) => n.y));
      const pad = 40;
      const offsetX = pad - minX;
      const offsetY = pad - minY;
      const normalized = nodes.map((n: any) => ({ ...n, x: n.x + offsetX, y: n.y + offsetY }));
      const maxX = Math.max(...normalized.map((n: any) => n.x + n.width));
      const maxY = Math.max(...normalized.map((n: any) => n.y + n.height));

      const edges = persistedEdges.map((e: any) => {
        const est = e.style || {};
        const rawMarker = e.markerEnd;
        let markerEnd = 'arrowclosed';
        if (rawMarker === 'none' || rawMarker === false) markerEnd = 'none';
        else if (typeof rawMarker === 'string' && rawMarker.toLowerCase() === 'none')
          markerEnd = 'none';
        else if (typeof rawMarker === 'string') markerEnd = rawMarker;
        else if (rawMarker && typeof rawMarker === 'object' && (rawMarker as any).type) {
          const t = String((rawMarker as any).type).toLowerCase();
          markerEnd = t.includes('arrow') ? 'arrowclosed' : 'none';
        }
        return {
          source: String(e.source),
          target: String(e.target),
          label: e.label ? String(e.label) : undefined,
          stroke: this.resolveExportColor(est.stroke, '#ffffff'),
          strokeWidth: Number(est.strokeWidth || 2),
          dash: String(est.strokeDasharray || ''),
          labelFill: this.resolveExportColor(e.labelStyle?.fill, '#ffffff'),
          labelFontSize: Number(e.labelStyle?.fontSize || 12),
          markerEnd,
          sourceHandle: e.sourceHandle ? String(e.sourceHandle) : undefined,
          targetHandle: e.targetHandle ? String(e.targetHandle) : undefined,
          sourceX: Number.isFinite(e.sourceX) ? Number(e.sourceX) + offsetX : undefined,
          sourceY: Number.isFinite(e.sourceY) ? Number(e.sourceY) + offsetY : undefined,
          targetX: Number.isFinite(e.targetX) ? Number(e.targetX) + offsetX : undefined,
          targetY: Number.isFinite(e.targetY) ? Number(e.targetY) + offsetY : undefined,
          sourcePosition: e.sourcePosition ? String(e.sourcePosition).toLowerCase() : undefined,
          targetPosition: e.targetPosition ? String(e.targetPosition).toLowerCase() : undefined,
        };
      });

      return {
        nodes: normalized,
        edges,
        width: Math.max(320, Math.ceil(maxX + pad)),
        height: Math.max(220, Math.ceil(maxY + pad)),
      };
    }

    const parsed = this.parseSyntaxFallbackGraph(String(diagram.syntax || ''));
    const nodes = parsed.nodes;
    const richEdges = parsed.edges;
    const maxX = nodes.length ? Math.max(...nodes.map((n) => n.x + n.width)) : 860;
    const maxY = nodes.length ? Math.max(...nodes.map((n) => n.y + n.height)) : 480;

    return {
      nodes,
      edges: richEdges,
      width: Math.max(320, Math.ceil(maxX + 40)),
      height: Math.max(220, Math.ceil(maxY + 40)),
    };
  }

  private async uploadToS3(
    buffer: Buffer,
    key: string,
    format: string
  ): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 not configured');
    }

    const contentType = {
      png: 'image/png',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
    }[format];

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
  }

  private bufferToDataUrl(buffer: Buffer, format: string): string {
    const contentType =
      format === 'svg'
        ? 'image/svg+xml'
        : format === 'pdf'
          ? 'application/pdf'
          : 'image/png';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  }

  private async getPresignedUrl(key: string): Promise<string> {
    if (!this.s3Client) return '';

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 15 * 60 });
  }
}

export const exportService = new ExportService();
