import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * §7.8 Notifications Collection
 * In-app notification tracking – §4.10
 */
export type NotificationType =
  | 'WORKSPACE_INVITE'
  | 'DIAGRAM_SHARE'
  | 'COMMENT_ADD'
  | 'COMMENT_MENTION'
  | 'EXPORT_FINISH'
  | 'AI_GEN_FINISH'
  | 'PLAN_UPGRADE'
  | 'PLAN_EXPIRE'
  | 'PAYMENT_FAIL'
  | 'PAYMENT_SUCCESS';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType; // §7.8 enum of types – §4.10
  title: string;          // §7.8
  message: string;        // §7.8
  link: string | null;    // §7.8 redirect URL (§4.10 NOTIF-03 examples) – §NOTIF-01
  read: boolean;          // §7.8 unread count tracking (§NOTIF-01)
  emailSent: boolean;     // §7.8 email log tracking (§NOTIF-02)
  metadata: Record<string, unknown>; // §7.8 additional context
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'WORKSPACE_INVITE',
        'DIAGRAM_SHARE',
        'COMMENT_ADD',
        'COMMENT_MENTION',
        'EXPORT_FINISH',
        'AI_GEN_FINISH',
        'PLAN_UPGRADE',
        'PLAN_EXPIRE',
        'PAYMENT_FAIL',
        'PAYMENT_SUCCESS',
      ],
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },
    link: { type: String, default: null },
    read: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes (§15.3 Table)
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
