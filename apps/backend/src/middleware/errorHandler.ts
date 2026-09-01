import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AIProviderError } from '../modules/ai/providers/llm-provider.interface';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
  retryable?: boolean;
}

export class ApiError extends Error implements AppError {
  statusCode: number;
  code: string;
  isOperational: boolean;
  retryable?: boolean;

  constructor(statusCode: number, code: string, message: string, retryable?: boolean) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.retryable = retryable;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Something went wrong';
  let retryable = err.retryable || false;

  // Map AIProviderError
  if (err instanceof AIProviderError) {
    retryable = err.retryable;
    if (err.code === 'AI_RATE_LIMITED' || err.code === 'AI_QUOTA_EXCEEDED') {
      statusCode = 429;
    } else if (err.code === 'AI_UNAVAILABLE') {
      statusCode = 503;
    } else {
      statusCode = 500;
    }
    code = err.code;
    message = err.message;
  }

  const requestId = (req.headers['x-request-id'] as string) || 'unknown';

  // Log all errors for debugging
  logger.error('Error occurred:', { 
    statusCode, 
    code, 
    message, 
    requestId,
    retryable,
    error: err,
    stack: err.stack,
    isOperational: err.isOperational 
  });

  res.status(statusCode).json({
    success: false,
    error: { 
      code, 
      message,
      requestId,
      retryable
    },
  });
}
