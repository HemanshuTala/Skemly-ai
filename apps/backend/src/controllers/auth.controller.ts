import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { authService } from '../services/auth.service';
import { ApiError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

/**
 * §4.1 Authentication Controller
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: { userId: user._id },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const deviceInfo = req.headers['user-agent'];

    const { user, accessToken, refreshToken } = await authService.login(email, password, deviceInfo);

    // §4.1 AUTH-05: Refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        user,
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const hash = authService.hashToken(refreshToken);
      await User.updateOne(
        { 'activeSessions.refreshTokenHash': hash },
        { $pull: { activeSessions: { refreshTokenHash: hash } } }
      );
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw new ApiError(401, 'AUTH_REQUIRED', 'Refresh token missing');
    }

    const { accessToken, newRefreshToken } = await authService.refresh(refreshToken);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      throw new ApiError(400, 'AUTH_INVALID', 'Invalid or expired verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiresAt = null;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId!);
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await User.findByIdAndUpdate(req.userId!, req.body, { new: true });
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (err) {
    next(err);
  }
};

export const revokeSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    await User.findByIdAndUpdate(req.userId!, {
      $pull: { activeSessions: { _id: sessionId } }
    });
    res.json({ success: true, message: 'Session revoked' });
  } catch (err) {
    next(err);
  }
};

/**
 * §AUTH-09 OAuth Controllers
 */
export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Handled by passport middleware
};

export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'OAUTH_FAILED', 'OAuth authentication failed');
    }

    const user = req.user as any;
    const accessToken = authService.generateAccessToken(user._id.toString());
    const refreshToken = authService.generateRefreshToken();
    const tokenHash = authService.hashToken(refreshToken);

    // Add session
    user.activeSessions.push({
      refreshTokenHash: tokenHash,
      deviceInfo: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });
    await user.save();

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with access token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  } catch (err) {
    next(err);
  }
};

export const githubAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Handled by passport middleware
};

export const githubCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'OAUTH_FAILED', 'OAuth authentication failed');
    }

    const user = req.user as any;
    const accessToken = authService.generateAccessToken(user._id.toString());
    const refreshToken = authService.generateRefreshToken();
    const tokenHash = authService.hashToken(refreshToken);

    // Add session
    user.activeSessions.push({
      refreshTokenHash: tokenHash,
      deviceInfo: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });
    await user.save();

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with access token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  } catch (err) {
    next(err);
  }
};

/**
 * OAuth Provider config status (no secrets).
 * Helps debugging local OAuth setup.
 */
export const providersStatus = async (_req: Request, res: Response) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

  const isReal = (v: string | undefined, placeholder: string) =>
    Boolean(v && v.trim() !== '' && v !== placeholder);

  const googleConfigured =
    isReal(googleClientId, 'your-google-client-id') &&
    isReal(googleClientSecret, 'your-google-client-secret');

  const githubConfigured =
    isReal(githubClientId, 'your-github-client-id') &&
    isReal(githubClientSecret, 'your-github-client-secret');

  res.json({
    success: true,
    data: {
      google: {
        configured: googleConfigured,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || null,
      },
      github: {
        configured: githubConfigured,
        callbackUrl: process.env.GITHUB_CALLBACK_URL || null,
      },
    },
  });
};
