import { Router } from 'express';
import passport from 'passport';
import * as AuthController from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validator';

const router = Router();

// Email/Password Authentication
router.post('/register', authRateLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);
router.post('/verify-email', AuthController.verifyEmail);

// User Profile
router.get('/me', authenticateToken, AuthController.getMe);
router.put('/me', authenticateToken, validate(updateProfileSchema), AuthController.updateMe);
router.delete('/sessions/:sessionId', authenticateToken, AuthController.revokeSession);

// OAuth - Google
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false 
}));
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  AuthController.googleCallback
);

// OAuth - GitHub
router.get('/github', passport.authenticate('github', { 
  scope: ['user:email'],
  session: false 
}));
router.get('/github/callback', 
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  AuthController.githubCallback
);

// Debug: OAuth config status (no secrets returned)
router.get('/providers/status', AuthController.providersStatus);

export default router;
