import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorHandler';

/**
 * Reusable Zod Validation Middleware
 */
export function validate(schema: z.ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction) => {
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
        const summary = messages.length ? messages.join('; ') : 'Validation failed';
        next(new ApiError(400, 'VALIDATION_ERROR', summary));
      } else {
        next(error);
      }
    }
  };
}
