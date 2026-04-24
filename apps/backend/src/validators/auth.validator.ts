import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';

/**
 * §14.1 Input Validation with Zod
 * All API inputs validated before processing
 */

// Auth schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').max(320),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string().min(1, 'Name is required').max(100),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    bio: z.string().max(500).optional(),
    avatar: z.string().url().optional(),
    preferences: z
      .object({
        theme: z.enum(['light', 'dark', 'system']).optional(),
        defaultDiagramType: z.string().optional(),
        editorFontSize: z.number().min(10).max(24).optional(),
        notifications: z
          .object({
            email: z.boolean().optional(),
            inApp: z.boolean().optional(),
            digest: z.boolean().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
});

// Validation middleware factory
export function validate(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors
          .map((err) => {
            const field = err.path.filter((p) => p !== 'body').join('.') || 'field';
            return `${field}: ${err.message}`;
          })
          .filter(Boolean);
        const summary = messages.length
          ? messages.join(' ')
          : 'Validation failed';
        next(new ApiError(400, 'VALIDATION_ERROR', summary));
      } else {
        next(error);
      }
    }
  };
}
