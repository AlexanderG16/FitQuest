import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import type { ZodSchema } from 'zod';
import { AppError } from './error-handler.js';
import { HTTP_STATUS } from '@repo/shared';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateDocId(id: string, model: string): RequestHandler {
  return (_req, _res, next) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, `Invalid ${model} ID`)
      }

      next();
    } catch (err) {
      next(err);
    }
  }
}