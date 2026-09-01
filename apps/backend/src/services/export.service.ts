import { Queue, Worker, Job } from 'bullmq';
import { ExportJob, IExportJob } from '../models/export-job.model';
import { Diagram } from '../models/diagram.model';
import { User } from '../models/user.model';
import { ApiError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import Redis from 'ioredis';
import { s3Service } from './s3.service';
import { exportRenderer } from './export-renderer.service';

/**
 * §12 Export System Service
 * Server-side rendering with Puppeteer + BullMQ job queue + S3 storage
 */
class ExportService {
  private exportQueue: Queue | null = null;
  private worker: Worker | null = null;
  private redis: Redis | null = null;

  constructor() {
    this.initializeQueue();
  }

  private preferInlineExportStorage(): boolean {
    const mode = String(process.env.EXPORT_STORAGE_MODE || '').trim().toLowerCase();
    return mode === 'inline' || mode === 'local';
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

      const buffer = await exportRenderer.renderDiagram(
        diagram,
        exportJob.format,
        exportJob.scale,
        exportJob.withWatermark
      );

      if (s3Service.isAvailable() && !this.preferInlineExportStorage()) {
        try {
          const fileKey = `exports/${exportJob._id}.${exportJob.format}`;
          await s3Service.uploadFile(buffer, fileKey, exportJob.format);
          const fileUrl = await s3Service.getPresignedUrl(fileKey);

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

  private bufferToDataUrl(buffer: Buffer, format: string): string {
    const contentType =
      format === 'svg'
        ? 'image/svg+xml'
        : format === 'pdf'
          ? 'application/pdf'
          : 'image/png';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  }

  async regeneratePresignedUrl(jobId: string): Promise<string> {
    const job = await ExportJob.findById(jobId);
    if (!job) throw new ApiError(404, 'NOT_FOUND', 'Export job not found');
    if (!job.fileKey || !s3Service.isAvailable()) throw new ApiError(500, 'EXPORT_ERROR', 'Cannot regenerate URL');

    const newUrl = await s3Service.getPresignedUrl(job.fileKey);
    job.fileUrl = newUrl;
    job.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await job.save();

    return newUrl;
  }
}

export const exportService = new ExportService();
