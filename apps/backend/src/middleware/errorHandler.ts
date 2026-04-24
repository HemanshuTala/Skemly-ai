import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class ApiError extends Error implements AppError {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Something went wrong';

  // Log all errors for debugging
  logger.error('Error occurred:', { 
    statusCode, 
    code, 
    message, 
    error: err,
    stack: err.stack,
    isOperational: err.isOperational 
  });

  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}
