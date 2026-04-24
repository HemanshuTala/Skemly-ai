import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { User, IUser } from '../models/user.model';
import { ApiError } from '../middleware/errorHandler';
import { emailService } from './email.service';
import logger from '../utils/logger';

/**
 * §4.1 Authentication Service logic
 * Handles registration, login, token management, OAuth, and verification emails.
 */
class AuthService {
  // §9.1 Token Strategy – 15m access, 7d refresh
  private readonly accessSecret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
  private readonly accessExpiry = '15m';
  private readonly refreshExpiry = '7d';

  constructor() {
    this.initializeOAuth();
  }

  /**
   * §AUTH-09 Initialize OAuth strategies
   */
  private initializeOAuth(): void {
    // Google OAuth
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (googleClientId && googleClientSecret &&
        googleClientId.trim() !== '' &&
        googleClientSecret.trim() !== '' &&
        googleClientId !== 'your-google-client-id' &&
        googleClientSecret !== 'your-google-client-secret') {
      passport.use(new GoogleStrategy({
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          `${process.env.BACKEND_URL}/api/v1/auth/google/callback`,
      }, async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await this.handleOAuthLogin('google', profile.id, profile.emails?.[0]?.value, profile.displayName);
          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }));
      logger.info('✅ Google OAuth initialized');
    }

    // GitHub OAuth
    const githubClientId = process.env.GITHUB_CLIENT_ID;
    const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (githubClientId && githubClientSecret &&
        githubClientId.trim() !== '' &&
        githubClientSecret.trim() !== '' &&
        githubClientId !== 'your-github-client-id' &&
        githubClientSecret !== 'your-github-client-secret') {
      passport.use(new GitHubStrategy({
        clientID: githubClientId,
        clientSecret: githubClientSecret,
        callbackURL:
          process.env.GITHUB_CALLBACK_URL ||
          `${process.env.BACKEND_URL}/api/v1/auth/github/callback`,
      }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const user = await this.handleOAuthLogin('github', profile.id, profile.emails?.[0]?.value, profile.displayName || profile.username);
          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      }));
      logger.info('✅ GitHub OAuth initialized');
    }
  }

  /**
   * §AUTH-09 Handle OAuth login/registration
   */
  private async handleOAuthLogin(provider: 'google' | 'github', providerId: string, email?: string, name?: string): Promise<IUser> {
    // Try to find user by OAuth provider ID
    let user = await User.findOne({ [`oauth.${provider}.id`]: providerId });

    if (user) {
      // Update last login
      user.lastLoginAt = new Date();
      await user.save();
      return user;
    }

    // Try to find user by email (account merging)
    if (email) {
      user = await User.findOne({ email });
      
      if (user) {
        // Link OAuth account to existing user
        if (!user.oauth) {
          user.oauth = {} as any;
        }
        (user.oauth as any)[provider] = { id: providerId };
        user.lastLoginAt = new Date();
        await user.save();
        logger.info(`Linked ${provider} account to existing user ${user._id}`);
        return user;
      }
    }

    // Create new user
    if (!email) {
      throw new ApiError(400, 'OAUTH_NO_EMAIL', `No email provided by ${provider}. Please use email/password registration.`);
    }

    user = new User({
      email,
      name: name || email.split('@')[0],
      emailVerified: true, // OAuth emails are pre-verified
      oauth: {
        [provider]: { id: providerId },
      },
    });

    await user.save();
    
    // §WS-01 Auto-create personal workspace
    const { workspaceService } = await import('./workspace.service');
    await workspaceService.createPersonalWorkspace(user._id.toString(), user.name);
    
    logger.info(`New user registered via ${provider}: ${user._id}`);
    return user;
  }

  generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, this.accessSecret, { expiresIn: this.accessExpiry });
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  // §14.2 SHA-256 hashing for refresh tokens – NEVER store raw tokens
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async registerUser(userData: Partial<IUser>): Promise<IUser> {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      throw new ApiError(409, 'AUTH_CONFLICT', 'User already exists');
    }

    // §4.1 AUTH-01 verification logic
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = new User({
      ...userData,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    await user.save();
    
    // §WS-01 Auto-create personal workspace
    const { workspaceService } = await import('./workspace.service');
    await workspaceService.createPersonalWorkspace(user._id.toString(), user.name);
    
    await emailService.sendVerificationEmail(user.email, verificationToken);
    return user;
  }

  async login(email: string, pass: string, deviceInfo?: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ email }).select('+password +activeSessions');
    if (!user) {
      throw new ApiError(401, 'AUTH_INVALID', 'Invalid credentials');
    }

    if (user.isLocked()) {
      throw new ApiError(401, 'AUTH_LOCKED', 'Account is temporarily locked');
    }

    const matches = await user.comparePassword(pass);
    if (!matches) {
       await user.incrementLoginAttempts();
       throw new ApiError(401, 'AUTH_INVALID', 'Invalid credentials');
    }

    await user.resetLoginAttempts();
    user.lastLoginAt = new Date();

    const accessToken = this.generateAccessToken(user._id as string);
    const refreshToken = this.generateRefreshToken();
    const tokenHash = this.hashToken(refreshToken);

    // §AUTH-08 Session management
    user.activeSessions.push({
      refreshTokenHash: tokenHash,
      deviceInfo,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });

    // prune old sessions if list exceeded
    if (user.activeSessions.length > 10) user.activeSessions.shift();

    await user.save();
    return { user, accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; newRefreshToken: string }> {
    // 1. Verify token exists in any user's session
    const hash = this.hashToken(refreshToken);
    const user = await User.findOne({ 'activeSessions.refreshTokenHash': hash }).select('+activeSessions');

    if (!user) {
      throw new ApiError(401, 'AUTH_EXPIRED', 'Invalid refresh token');
    }

    const sessionIdx = user.activeSessions.findIndex(s => s.refreshTokenHash === hash);
    const session = user.activeSessions[sessionIdx];

    if (!session || !session.expiresAt || new Date() > session.expiresAt) {
      if (session) {
        user.activeSessions.splice(sessionIdx, 1);
        await user.save();
      }
      throw new ApiError(401, 'AUTH_EXPIRED', 'Refresh token expired');
    }

    // 2. Rotate refresh token (§14.2 optional security best practice)
    const newRefreshToken = this.generateRefreshToken();
    const newHash = this.hashToken(newRefreshToken);

    session.refreshTokenHash = newHash;
    session.lastUsedAt = new Date();
    await user.save();

    const accessToken = this.generateAccessToken(user._id as string);
    return { accessToken, newRefreshToken };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists – security best practice
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(resetToken);

    user.passwordResetToken = tokenHash;
    user.passwordResetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetTokenExpiresAt: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetTokenExpiresAt');

    if (!user) {
      throw new ApiError(400, 'AUTH_INVALID', 'Invalid or expired reset token');
    }

    user.password = newPassword; // will be hashed by pre-save hook
    user.passwordResetToken = null;
    user.passwordResetTokenExpiresAt = null;
    await user.save();
  }
}

export const authService = new AuthService();
