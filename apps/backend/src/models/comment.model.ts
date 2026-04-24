import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * §7.7 Comments Collection
 * Canvas-locked feedback on diagrams – §COLLAB-07
 * Supports thread replies – §COLLAB-08
 */
export interface IComment extends Document {
  diagramId: Types.ObjectId;
  parentId: Types.ObjectId | null; // for thread replies §7.7
  authorId: Types.ObjectId;
  content: string;
  position: { x: number; y: number }; // click anywhere on canvas §COLLAB-07
  resolved: boolean;
  resolvedBy: Types.ObjectId | null;
  resolvedAt: Date | null;
  mentions: Types.ObjectId[]; // @ mentions §COLLAB-09
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    diagramId: { type: Schema.Types.ObjectId, ref: 'Diagram', required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    position: {
      x: { type: Number, required: true, default: 0 },
      y: { type: Number, required: true, default: 0 },
    },
    resolved: { type: Boolean, default: false, index: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Compound index for rendering all comments on a diagram (§15.3 Table)
CommentSchema.index({ diagramId: 1, parentId: 1, createdAt: 1 });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
