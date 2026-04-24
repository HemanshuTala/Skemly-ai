import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * §7.9 Templates Collection
 * Reusable diagram layouts – §4.8
 */
export interface ITemplate extends Document {
  name: string;
  description: string;
  category: 'System Design' | 'Flowchart' | 'UML' | 'ERD' | 'Mind Map' | 'Org Chart'; // Categories §TMPL-02
  thumbnail: string | null;  // URL – §7.9
  diagramType: string;       // flowchart | sequence | etc §TMPL-02
  syntax: string;            // §7.9
  nodes: object[];           // §7.9
  edges: object[];           // §7.9
  isBuiltIn: boolean;        // global built-ins versus custom ones – §TMPL-01
  workspaceId: Types.ObjectId | null; // null = global; ObjectId = team/personal custom §7.9
  createdBy: Types.ObjectId;
  usageCount: number;        // track popular templates §7.9
  createdAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    category: {
      type: String,
      enum: ['System Design', 'Flowchart', 'UML', 'ERD', 'Mind Map', 'Org Chart'],
      required: true,
      index: true,
    },
    thumbnail: { type: String, default: null },
    diagramType: { type: String, required: true },
    syntax: { type: String, default: '' },
    nodes: { type: [Schema.Types.Mixed], default: [] },
    edges: { type: [Schema.Types.Mixed], default: [] },
    isBuiltIn: { type: Boolean, default: false, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes
TemplateSchema.index({ diagramType: 1 });

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);
