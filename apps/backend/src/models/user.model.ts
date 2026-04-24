import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── Sub-document interfaces ──────────────────────────────────────────────────

export interface IOAuthProvider {
  provider: 'google' | 'github';
  providerId: string;
  accessToken?: string; // encrypted at application layer
  refreshToken?: string;
}

export interface IActiveSession {
  _id?: Types.ObjectId;
  refreshTokenHash: string; // SHA-256 of the real token – NEVER store raw
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
}

export interface IAIUsageEntry {
  count: number;
  resetAt: Date; // first of each month
}

export interface IAIUsage {
  generate: IAIUsageEntry;
  explain: IAIUsageEntry;
  improve: IAIUsageEntry;
  autofix: IAIUsageEntry;
}

export interface IUserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultDiagramType: string;
  editorFontSize: number;
  notifications: {
    email: boolean;
    inApp: boolean;
    digest: boolean;
    // granular event toggles (§4.10)
    onInvite: boolean;
    onComment: boolean;
    onMention: boolean;
    onPlanChange: boolean;
    onPaymentFail: boolean;
  };
}

// ─── Main interface ───────────────────────────────────────────────────────────

export interface IUser extends Document {
  // Identity
  email: string;
  emailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationTokenExpiresAt: Date | null;
  password: string | null;

  // OAuth
  oauthProviders: IOAuthProvider[];

  // Profile
  name: string;
  avatar?: string;
  bio?: string;

  // Plan & billing
  plan: 'free' | 'starter' | 'basic' | 'pro' | 'team';
  planExpiresAt: Date | null;
  planGracePeriodUntil: Date | null; // §16.4 – 3-day grace on payment fail
  isTrial: boolean;
  trialEndsAt: Date | null;
  razorpayContactId: string | null;
  razorpaySubscriptionId: string | null;
  razorpayCustomerId: string | null; // Razorpay customer entity (different from contact)

  // Storage usage tracking
  storageUsedBytes: number;

  // Security – §AUTH-09, §14.2
  loginAttempts: number;
  lockUntil: Date | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null; // encrypted before storing
  twoFactorBackupCodes: string[]; // hashed backup codes

  // Password reset
  passwordResetToken: string | null;
  passwordResetTokenExpiresAt: Date | null;

  // Sessions – §AUTH-08: stored as hashes, never raw
  activeSessions: IActiveSession[];

  // AI usage counters – §4.4.5
  aiUsage: IAIUsage;

  // Preferences
  preferences: IUserPreferences;

  // Timestamps
  lastLoginAt: Date | null;
  deletedAt: Date | null; // soft-delete for GDPR §17.5
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidate: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  canUseAI(feature: keyof IAIUsage): boolean;
  getRemainingAI(feature: keyof IAIUsage): number;
}

// ─── Plan limits constant (single source of truth) ───────────────────────────

export const PLAN_LIMITS = {
  free: {
    diagrams: 10,
    versionHistory: 5,
    aiGenerate: 5,
    aiExplain: 10,
    aiImprove: 3,
    aiAutofix: 3,
    customTemplates: 0,
    storageBytes: 50 * 1024 * 1024, // 50 MB
  },
  starter: {
    diagrams: 25,
    versionHistory: 10,
    aiGenerate: 20,
    aiExplain: 20,
    aiImprove: 10,
    aiAutofix: 10,
    customTemplates: 2,
    storageBytes: 200 * 1024 * 1024, // 200 MB
  },
  basic: {
    diagrams: 50,
    versionHistory: 15,
    aiGenerate: 50,
    aiExplain: 50,
    aiImprove: 20,
    aiAutofix: 20,
    customTemplates: 5,
    storageBytes: 500 * 1024 * 1024, // 500 MB
  },
  pro: {
    diagrams: Infinity,
    versionHistory: 30,
    aiGenerate: 100,
    aiExplain: Infinity,
    aiImprove: 50,
    aiAutofix: Infinity,
    customTemplates: 10,
    storageBytes: 2 * 1024 * 1024 * 1024, // 2 GB
  },
  team: {
    diagrams: Infinity,
    versionHistory: Infinity,
    aiGenerate: Infinity,
    aiExplain: Infinity,
    aiImprove: Infinity,
    aiAutofix: Infinity,
    customTemplates: Infinity,
    storageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
  },
} as const;

// ─── Schema ───────────────────────────────────────────────────────────────────

const AIUsageEntrySchema = new Schema<IAIUsageEntry>(
  {
    count: { type: Number, default: 0, min: 0 },
    resetAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const ActiveSessionSchema = new Schema<IActiveSession>(
  {
    refreshTokenHash: { type: String, required: true, select: false },
    deviceInfo: String,
    ipAddress: String,
    userAgent: String,
    expiresAt: { type: Date, required: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const UserSchema = new Schema<IUser>(
  {
    // Identity
    email: {
      type: String, required: true, unique: true,
      lowercase: true, trim: true, index: true,
      maxlength: 320,
    },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null, select: false },
    emailVerificationTokenExpiresAt: { type: Date, default: null, select: false },
    password: { type: String, default: null, select: false },

    // OAuth
    oauthProviders: [
      {
        provider: { type: String, enum: ['google', 'github'], required: true },
        providerId: { type: String, required: true },
        accessToken: { type: String, select: false },
        refreshToken: { type: String, select: false },
      },
    ],

    // Profile
    name: { type: String, required: true, trim: true, maxlength: 100 },
    avatar: { type: String, default: null },
    bio: { type: String, default: null, maxlength: 500 },

    // Plan & billing
    plan: { type: String, enum: ['free', 'starter', 'basic', 'pro', 'team'], default: 'free', index: true },
    planExpiresAt: { type: Date, default: null },
    planGracePeriodUntil: { type: Date, default: null },
    isTrial: { type: Boolean, default: false },
    trialEndsAt: { type: Date, default: null },
    razorpayContactId: { type: String, default: null, index: true },
    razorpaySubscriptionId: { type: String, default: null },
    razorpayCustomerId: { type: String, default: null },

    // Storage
    storageUsedBytes: { type: Number, default: 0, min: 0 },

    // Security
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: null, select: false },
    twoFactorBackupCodes: { type: [String], default: [], select: false },

    // Password reset
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetTokenExpiresAt: { type: Date, default: null, select: false },

    // Sessions
    activeSessions: { type: [ActiveSessionSchema], default: [] },

    // AI usage
    aiUsage: {
      generate: { type: AIUsageEntrySchema, default: () => ({}) },
      explain:  { type: AIUsageEntrySchema, default: () => ({}) },
      improve:  { type: AIUsageEntrySchema, default: () => ({}) },
      autofix:  { type: AIUsageEntrySchema, default: () => ({}) },
    },

    // Preferences
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      defaultDiagramType: { type: String, default: 'flowchart' },
      editorFontSize: { type: Number, default: 14, min: 10, max: 24 },
      notifications: {
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        digest: { type: Boolean, default: false },
        onInvite: { type: Boolean, default: true },
        onComment: { type: Boolean, default: true },
        onMention: { type: Boolean, default: true },
        onPlanChange: { type: Boolean, default: true },
        onPaymentFail: { type: Boolean, default: true },
      },
    },

    // Timestamps
    lastLoginAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true }, // GDPR soft delete
  },
  {
    timestamps: true,
    // Exclude sensitive fields from toJSON by default
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.twoFactorSecret;
        delete ret.twoFactorBackupCodes;
        delete ret.passwordResetToken;
        delete ret.emailVerificationToken;
        delete ret.activeSessions;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
UserSchema.index({ 'oauthProviders.provider': 1, 'oauthProviders.providerId': 1 });
// Note: razorpayContactId and deletedAt indexes are defined inline in schema with sparse: true

// ─── Pre-save: hash password if changed ──────────────────────────────────────
UserSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// ─── Instance methods ─────────────────────────────────────────────────────────
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // [AUTH-09] max 5 fails → 15-min lockout
  if (this.lockUntil && this.lockUntil < new Date()) {
    // lockout expired, reset
    await this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: '' } });
    return;
  }
  const updates: Record<string, unknown> = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + 15 * 60 * 1000) };
  }
  await this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  await this.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: '' } });
};

UserSchema.methods.canUseAI = function (feature: keyof IAIUsage): boolean {
  const limit = PLAN_LIMITS[this.plan as 'free' | 'starter' | 'basic' | 'pro' | 'team'][`ai${feature.charAt(0).toUpperCase()}${feature.slice(1)}` as keyof typeof PLAN_LIMITS['free']];
  if (limit === Infinity) return true;
  const usage = this.aiUsage[feature];
  // reset counter if month has rolled over
  const now = new Date();
  if (usage.resetAt && new Date(usage.resetAt).getMonth() !== now.getMonth()) {
    usage.count = 0;
    usage.resetAt = now;
  }
  return usage.count < limit;
};

UserSchema.methods.getRemainingAI = function (feature: keyof IAIUsage): number {
  const key = `ai${feature.charAt(0).toUpperCase()}${feature.slice(1)}` as keyof typeof PLAN_LIMITS['free'];
  const limit = PLAN_LIMITS[this.plan as 'free' | 'starter' | 'basic' | 'pro' | 'team'][key];
  if (limit === Infinity) return Infinity;
  const usage = this.aiUsage[feature];
  return Math.max(0, (limit as number) - usage.count);
};

export const User = mongoose.model<IUser>('User', UserSchema);
