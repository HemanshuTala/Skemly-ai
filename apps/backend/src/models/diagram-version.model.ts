import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * §7.5 DiagramVersions Collection
 * Stores named and auto snapshots of diagrams.
 * Plan limits (§13.1): free=5, pro=30, team=unlimited
 */
export interface IDiagramVersion extends Document {
  diagramId: Types.ObjectId;
  workspaceId: Types.ObjectId;  // denormalized for efficient cleanup
  version: number;              // matches diagram.version at time of save
  name: string | null;          // user-named snapshot e.g. "v1.0 - MVP design"
  isAutoSave: boolean;          // true = system auto-save; false = manual snapshot
  syntax: string;
  nodes: object[];
  edges: object[];
  viewport: { x: number; y: number; zoom: number };
  savedBy: Types.ObjectId;
  createdAt: Date;
}

const DiagramVersionSchema = new Schema<IDiagramVersion>(
  {
    diagramId: { type: Schema.Types.ObjectId, ref: 'Diagram', required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    version: { type: Number, required: true },
    name: { type: String, default: null, maxlength: 100 },
    isAutoSave: { type: Boolean, default: true },
    syntax: { type: String, default: '' },
    nodes: { type: [Schema.Types.Mixed], default: [] },
    edges: { type: [Schema.Types.Mixed], default: [] },
    viewport: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      zoom: { type: Number, default: 1 },
    },
    savedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // immutable snapshots
  }
);

DiagramVersionSchema.index({ diagramId: 1, version: -1 });
DiagramVersionSchema.index({ diagramId: 1, isAutoSave: 1, createdAt: -1 });

export const DiagramVersion = mongoose.model<IDiagramVersion>('DiagramVersion', DiagramVersionSchema);
