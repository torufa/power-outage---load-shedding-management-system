import type { ErrorRequestHandler } from 'express';
import httpStatus from 'http-status';
import { ZodError } from 'zod';
import { config } from '../config/index.js';

export class AppError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string, stack = '') {
    super(message);
    this.statusCode = statusCode;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong!';
  let errors: Array<{ path: string; message: string }> = [];

  if (err instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Validation Error';
    errors = err.issues.map((issue) => ({
      path: issue.path[issue.path.length - 1]?.toString() || 'field',
      message: issue.message,
    }));
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = [{ path: '', message: err.message }];
  } else if (err?.name === 'JsonWebTokenError') {
    statusCode = httpStatus.UNAUTHORIZED;
    message = 'Invalid authentication token';
    errors = [{ path: 'token', message: err.message }];
  } else if (err?.name === 'TokenExpiredError') {
    statusCode = httpStatus.UNAUTHORIZED;
    message = 'Authentication token has expired';
    errors = [{ path: 'token', message: err.message }];
  } else if (err instanceof Error) {
    message = err.message;
    errors = [{ path: '', message: err.message }];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(config.env === 'development' ? { stack: err?.stack } : {}),
  });
};
