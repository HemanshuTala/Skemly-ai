import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── Sub-document interfaces ──────────────────────────────────────────────────

export interface IWorkspaceMember {
  userId: Types.ObjectId;
  role: 'owner' | 'admin' | 'editor' | 'commenter' | 'viewer';
  invitedBy: Types.ObjectId | null;
  joinedAt: Date;
}

export interface IPendingInvite {
  _id?: Types.ObjectId;
  email: string;
  role: 'admin' | 'editor' | 'commenter' | 'viewer';
  token: string;       // cryptographic random – hashed before storage
  tokenHash: string;   // SHA-256 of token stored in DB
  invitedBy: Types.ObjectId;
  expiresAt: Date;
  sentAt: Date;
}

export interface IWorkspaceSettings {
  defaultMemberRole: 'editor' | 'commenter' | 'viewer';
  allowPublicLinks: boolean;
  allowGuestComments: boolean;
}

// ─── Main interface ───────────────────────────────────────────────────────────

export interface IWorkspace extends Document {
  name: string;
  slug: string;              // URL-safe unique identifier
  type: 'personal' | 'team';
  ownerId: Types.ObjectId;
  members: IWorkspaceMember[];
  pendingInvites: IPendingInvite[];
  settings: IWorkspaceSettings;
  plan: 'free' | 'pro' | 'team';
  avatarUrl: string | null;
  // Activity log is in separate AuditLog collection (§14.4)
  diagramCount: number;     // cached count for plan enforcement – §16.4
  storageUsedBytes: number; // cached total – §13.1
  deletedAt: Date | null;   // soft-delete §17.5
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const MemberSchema = new Schema<IWorkspaceMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'commenter', 'viewer'],
      default: 'viewer',
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PendingInviteSchema = new Schema<IPendingInvite>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['admin', 'editor', 'commenter', 'viewer'], default: 'viewer' },
    token: { type: String, required: true, select: false }, // raw token sent to user
    tokenHash: { type: String, required: true },            // hash stored in DB
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    type: { type: String, enum: ['personal', 'team'], default: 'personal' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: { type: [MemberSchema], default: [] },
    pendingInvites: { type: [PendingInviteSchema], default: [] },
    settings: {
      defaultMemberRole: { type: String, enum: ['editor', 'commenter', 'viewer'], default: 'viewer' },
      allowPublicLinks: { type: Boolean, default: true },
      allowGuestComments: { type: Boolean, default: false },
    },
    plan: { type: String, enum: ['free', 'pro', 'team'], default: 'free', index: true },
    avatarUrl: { type: String, default: null },
    diagramCount: { type: Number, default: 0, min: 0 },
    storageUsedBytes: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
WorkspaceSchema.index({ 'members.userId': 1 });
WorkspaceSchema.index({ deletedAt: 1 }, { sparse: true });

// Auto-generate slug from name
WorkspaceSchema.pre('validate', async function (next) {
  if (this.isNew && !this.slug) {
    const base = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Math.random().toString(36).slice(2, 7);
    this.slug = `${base}-${suffix}`;
  }
  next();
});

export const Workspace = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
