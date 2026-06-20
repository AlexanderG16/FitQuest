import type { ErrorRequestHandler } from 'express';
import { HTTP_STATUS } from '@repo/shared';
import type { ApiErrorResponse } from '@repo/shared';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ err }, 'Unhandled error');

  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      error: err.message,
      statusCode: err.statusCode,
      details: err.details,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof ZodError) {
    const response: ApiErrorResponse = {
      success: false,
      error: 'Validation error',
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      details: err.flatten().fieldErrors,
    };
    res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(response);
    return;
  }

  const response: ApiErrorResponse = {
    success: false,
    error: 'Internal server error',
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  };
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
};
