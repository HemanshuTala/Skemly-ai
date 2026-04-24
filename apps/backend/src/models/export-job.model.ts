import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * §12.2 Export Jobs — server-side PNG/SVG/PDF via Puppeteer + BullMQ
 * Client polls /export/status/:jobId until status = 'done' | 'failed'
 */
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'syntax';
export type ExportStatus = 'queued' | 'processing' | 'done' | 'failed';

export interface IExportJob extends Document {
  diagramId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  format: ExportFormat;
  scale: 1 | 2 | 4;           // §EXP-09 resolution options
  withWatermark: boolean;      // §EXP-10 free plan watermark
  status: ExportStatus;
  bullJobId: string | null;    // BullMQ job id for tracking
  fileUrl: string | null;      // S3 signed URL (15-min expiry)
  fileKey: string | null;      // S3 object key for re-signing
  fileSizeBytes: number | null;
  errorMessage: string | null;
  retryCount: number;          // §16.5 retry 3x with backoff
  startedAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date | null;      // presigned URL expiry
  createdAt: Date;
  updatedAt: Date;
}

const ExportJobSchema = new Schema<IExportJob>(
  {
    diagramId: { type: Schema.Types.ObjectId, ref: 'Diagram', required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    format: { type: String, enum: ['png', 'svg', 'pdf', 'syntax'], required: true },
    scale: { type: Number, enum: [1, 2, 4], default: 1 },
    withWatermark: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['queued', 'processing', 'done', 'failed'],
      default: 'queued',
      index: true,
    },
    bullJobId: { type: String, default: null },
    fileUrl: { type: String, default: null },
    fileKey: { type: String, default: null },
    fileSizeBytes: { type: Number, default: null },
    errorMessage: { type: String, default: null },
    retryCount: { type: Number, default: 0, max: 3 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-expire completed jobs after 24 hours
ExportJobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });
ExportJobSchema.index({ requestedBy: 1, status: 1, createdAt: -1 });

export const ExportJob = mongoose.model<IExportJob>('ExportJob', ExportJobSchema);
