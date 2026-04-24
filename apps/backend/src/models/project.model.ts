import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * §7.3 Projects Collection
 * Represents a folder-like container within a workspace.
 */
export interface IProject extends Document {
  workspaceId: Types.ObjectId;
  name: string;
  icon: string;   // emoji or icon key – §WS-04
  color: string;  // hex color – §WS-04
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    icon: { type: String, default: '📁' },
    color: { type: String, default: '#09090b' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Indexes
ProjectSchema.index({ workspaceId: 1, name: 1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
