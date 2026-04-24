import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * §14.4 Audit Log — records all sensitive actions
 * Actions: login, logout, plan_change, permission_change, delete, export,
 *          password_reset, 2fa_change, invite_sent, member_removed, workspace_deleted
 */

export type AuditAction =
  | 'login'
  | 'logout'
  | 'register'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'email_verified'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'plan_cancelled'
  | 'payment_failed'
  | 'payment_success'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'session_revoked'
  | 'workspace_created'
  | 'workspace_deleted'
  | 'workspace_transferred'
  | 'member_invited'
  | 'member_removed'
  | 'member_role_changed'
  | 'diagram_created'
  | 'diagram_deleted'
  | 'diagram_restored'
  | 'diagram_shared'
  | 'diagram_unshared'
  | 'collaborator_added'
  | 'collaborator_removed'
  | 'export_requested'
  | 'account_deleted';

export interface IAuditLog extends Document {
  actorId: Types.ObjectId | null;     // userId performing the action; null = system
  actorEmail: string | null;          // denormalized snapshot (user email may change)
  action: AuditAction;
  resourceType: 'user' | 'workspace' | 'diagram' | 'note' | 'subscription' | 'system';
  resourceId: string | null;
  workspaceId: Types.ObjectId | null; // for scoped audit log view – §WS-11
  metadata: Record<string, unknown>;  // additional context (old role, new role, etc.)
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  failureReason: string | null;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorEmail: { type: String, default: null },
    action: { type: String, required: true, index: true },
    resourceType: {
      type: String,
      enum: ['user', 'workspace', 'diagram', 'note', 'subscription', 'system'],
      required: true,
    },
    resourceId: { type: String, default: null },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', default: null, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    success: { type: Boolean, default: true },
    failureReason: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // immutable
    capped: false, // keep all; prune via TTL or archival job
  }
);

// TTL index – retain audit logs for 1 year (365 days)
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
AuditLogSchema.index({ workspaceId: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1, action: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
