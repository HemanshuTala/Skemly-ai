import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── Sub-document interfaces ──────────────────────────────────────────────────

export interface IDiagramNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: string; style?: Record<string, unknown> };
  width?: number;
  height?: number;
  selected?: boolean;
  dragging?: boolean;
}

export interface IDiagramEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  type?: string;
  style?: Record<string, unknown>;
  animated?: boolean;
  markerEnd?: string;
}

export interface IDiagramViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface IAIConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface IDiagramCollaborator {
  userId: Types.ObjectId;
  role: 'editor' | 'commenter' | 'viewer';
  addedAt: Date;
  addedBy: Types.ObjectId;
}

// ─── Main interface ───────────────────────────────────────────────────────────

export interface IDiagram extends Document {
  workspaceId: Types.ObjectId;
  projectId: Types.ObjectId | null;
  title: string;
  type: 'flowchart' | 'sequence' | 'uml' | 'erd' | 'mindmap' | 'system' | 'gantt' | 'state' | 'network' | 'orgchart';

  // Canvas data
  syntax: string;
  nodes: IDiagramNode[];
  edges: IDiagramEdge[];
  viewport: IDiagramViewport;

  // AI conversation context (keep last 10 turns – §AI-05)
  aiConversation: IAIConversationTurn[];

  // Version tracking
  version: number;

  // Sharing – §4.9, §14.5
  isPublic: boolean;
  publicLinkToken: string | null;     // 64-byte hex – §14.5
  publicLinkExpiresAt: Date | null;
  publicLinkPasswordHash: string | null; // bcrypt hashed – §14.5
  publicLinkViewCount: number;        // for rate-limiting analytics

  // Storage
  thumbnail: string | null;          // S3 URL

  // Soft delete / trash – §WS-09, §WS-10
  isTrashed: boolean;
  trashedAt: Date | null;
  trashedBy: Types.ObjectId | null;
  autoDeleteAt: Date | null;          // 30 days after trash – §WS-09

  // Collaborators (diagram-level overrides – §4.9 SHARE-02)
  collaborators: IDiagramCollaborator[];

  // Starred by users – §WS-08
  starredBy: Types.ObjectId[];

  // Authorship
  createdBy: Types.ObjectId;
  lastEditedBy: Types.ObjectId | null;
  lastEditedAt: Date;

  // Edge-case flags
  nodeCount: number;          // cached for quick large-diagram detection – §16.1
  hasCycleWarning: boolean;   // §16.1 circular reference detected
  syntaxError: string | null; // last syntax parse error message – §16.1

  createdAt: Date;
  updatedAt: Date;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const NodeSchema = new Schema<IDiagramNode>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true, default: 'default' },
    position: {
      x: { type: Number, required: true, default: 0 },
      y: { type: Number, required: true, default: 0 },
    },
    data: {
      label: { type: String, default: '(unnamed)' }, // §16.1 node with no label
      style: { type: Schema.Types.Mixed, default: {} },
    },
    width: Number,
    height: Number,
    selected: { type: Boolean, default: false },
    dragging: { type: Boolean, default: false },
  },
  { _id: false }
);

const EdgeSchema = new Schema<IDiagramEdge>(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: String,
    targetHandle: String,
    label: { type: String, default: '' },
    type: { type: String, default: 'default' },
    style: { type: Schema.Types.Mixed, default: {} },
    animated: { type: Boolean, default: false },
    markerEnd: String,
  },
  { _id: false }
);

const AITurnSchema = new Schema<IAIConversationTurn>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 50000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CollaboratorSchema = new Schema<IDiagramCollaborator>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['editor', 'commenter', 'viewer'], default: 'viewer' },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

const DiagramSchema = new Schema<IDiagram>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },

    title: { type: String, required: true, trim: true, maxlength: 200, default: 'Untitled Diagram' },
    type: {
      type: String,
      enum: ['flowchart', 'sequence', 'uml', 'erd', 'mindmap', 'system', 'gantt', 'state', 'network', 'orgchart'],
      default: 'flowchart',
      required: true,
    },

    syntax: { type: String, default: '' },
    nodes: { type: [Schema.Types.Mixed], default: [] },
    edges: { type: [Schema.Types.Mixed], default: [] },
    viewport: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      zoom: { type: Number, default: 1, min: 0.1, max: 10 },
    },

    // AI – keep max 10 turns (§AI-05); overflow truncated in service layer
    aiConversation: { type: [AITurnSchema], default: [], validate: [(v: unknown[]) => v.length <= 10, 'Max 10 AI turns per diagram'] },

    version: { type: Number, default: 1, min: 1 },

    // Sharing
    isPublic: { type: Boolean, default: false },
    publicLinkToken: { type: String, default: null },
    publicLinkExpiresAt: { type: Date, default: null },
    publicLinkPasswordHash: { type: String, default: null, select: false },
    publicLinkViewCount: { type: Number, default: 0 },

    thumbnail: { type: String, default: null },

    // Trash
    isTrashed: { type: Boolean, default: false },
    trashedAt: { type: Date, default: null },
    trashedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    autoDeleteAt: { type: Date, default: null },

    // Collaborators
    collaborators: { type: [CollaboratorSchema], default: [] },
    starredBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // Authorship
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    // Edge-case flags
    nodeCount: { type: Number, default: 0, min: 0 },
    hasCycleWarning: { type: Boolean, default: false },
    syntaxError: { type: String, default: null },
  },
  { timestamps: true }
);

// ─── Indexes (§15.3) ─────────────────────────────────────────────────────────
DiagramSchema.index({ workspaceId: 1, isTrashed: 1, updatedAt: -1 });
DiagramSchema.index({ workspaceId: 1, projectId: 1, isTrashed: 1 });
DiagramSchema.index({ publicLinkToken: 1 }, { sparse: true });
DiagramSchema.index({ starredBy: 1 });
DiagramSchema.index({ createdBy: 1, isTrashed: 1 });
DiagramSchema.index({ autoDeleteAt: 1 }, { sparse: true }); // TTL-style cleanup job

// Full-text search on title (§WS-06)
DiagramSchema.index({ title: 'text', 'nodes.data.label': 'text' });

// ─── Pre-save: sync nodeCount ─────────────────────────────────────────────────
DiagramSchema.pre('save', function (next) {
  this.nodeCount = this.nodes.length;
  // Cap AI conversation to 10 turns
  if (this.aiConversation.length > 10) {
    this.aiConversation = this.aiConversation.slice(-10);
  }
  // Set autoDeleteAt when trashed (30-day purge – §WS-09)
  if (this.isTrashed && !this.autoDeleteAt) {
    this.autoDeleteAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  if (!this.isTrashed) {
    this.autoDeleteAt = undefined as never;
    this.trashedAt = null;
    this.trashedBy = null;
  }
  next();
});

export const Diagram = mongoose.model<IDiagram>('Diagram', DiagramSchema);
