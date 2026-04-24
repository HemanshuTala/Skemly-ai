import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';
import { IUser } from '../models/user.model';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticateToken(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return next(new ApiError(401, 'AUTH_REQUIRED', 'Authentication required'));
  }

  try {
    const secret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
    const decoded = jwt.verify(token, secret) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    next(new ApiError(401, 'AUTH_EXPIRED', 'Token expired or invalid'));
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) return next();

  try {
    const secret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
    const decoded = jwt.verify(token, secret) as { userId: string };
    req.userId = decoded.userId;
  } catch {
    // silently ignore
  }
  next();
}
