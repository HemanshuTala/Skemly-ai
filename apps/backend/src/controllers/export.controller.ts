import { Request, Response, NextFunction } from 'express';
import { ExportJob } from '../models/export-job.model';
import { Diagram } from '../models/diagram.model';
import { exportService } from '../services/export.service';
import { ApiError } from '../middleware/errorHandler';

/**
 * §4.7 Export System Controller
 * Server-side rendering with Puppeteer + BullMQ job queue + S3 storage
 */

export const exportPNG = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { diagramId, scale = 1 } = req.body;
    
    if (!diagramId) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'diagramId is required');
    }

    if (![1, 2, 4].includes(scale)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'scale must be 1, 2, or 4');
    }

    const job = await exportService.exportPNG(req.userId, diagramId, scale);
    
    res.json({
      success: true,
      data: {
        jobId: job._id,
        status: job.status,
        message: 'Export job queued. Check status with GET /api/exports/:jobId',
      },
    });
  } catch (err) {
    next(err);
  }
};

export const exportSVG = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { diagramId } = req.body;
    
    if (!diagramId) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'diagramId is required');
    }

    const job = await exportService.exportSVG(req.userId, diagramId);
    
    res.json({
      success: true,
      data: {
        jobId: job._id,
        status: job.status,
        message: 'Export job queued. Check status with GET /api/exports/:jobId',
      },
    });
  } catch (err) {
    next(err);
  }
};

export const exportPDF = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { diagramId } = req.body;
    
    if (!diagramId) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'diagramId is required');
    }

    const job = await exportService.exportPDF(req.userId, diagramId);
    
    res.json({
      success: true,
      data: {
        jobId: job._id,
        status: job.status,
        message: 'Export job queued. Check status with GET /api/exports/:jobId',
      },
    });
  } catch (err) {
    next(err);
  }
};

export const exportSyntax = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { diagramId } = req.body;
    
    const diagram = await Diagram.findById(diagramId);
    if (!diagram) {
      throw new ApiError(404, 'NOT_FOUND', 'Diagram not found');
    }
    
    // Simple syntax export (no job queue needed)
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${diagram.title}.dgrm"`);
    res.send(diagram.syntax);
  } catch (err) {
    next(err);
  }
};

export const getExportStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    
    const job = await ExportJob.findOne({
      _id: jobId,
      requestedBy: req.userId,
    });
    
    if (!job) {
      throw new ApiError(404, 'NOT_FOUND', 'Export job not found');
    }
    
    res.json({
      success: true,
      data: {
        jobId: job._id,
        status: job.status,
        format: job.format,
        fileUrl: job.fileUrl,
        fileSizeBytes: job.fileSizeBytes,
        errorMessage: job.errorMessage,
        expiresAt: job.expiresAt,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const downloadExport = async (req: any, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.fileId;

    const job = await ExportJob.findOne({
      _id: jobId,
      requestedBy: req.userId,
    });
    
    if (!job) {
      throw new ApiError(404, 'NOT_FOUND', 'Export job not found');
    }

    if (job.status !== 'done') {
      throw new ApiError(400, 'EXPORT_NOT_READY', `Export is ${job.status}. Please wait for completion.`);
    }

    // Check if URL expired, regenerate if needed
    if (!job.fileUrl || (job.expiresAt && new Date() > job.expiresAt)) {
      const newUrl = await exportService.regeneratePresignedUrl(jobId);
      res.json({
        success: true,
        data: {
          fileUrl: newUrl,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          fileUrl: job.fileUrl,
          expiresAt: job.expiresAt,
        },
      });
    }
  } catch (err) {
    next(err);
  }
};
