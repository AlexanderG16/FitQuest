import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import type { ZodSchema } from 'zod';
import { AppError } from './error-handler.js';
import { HTTP_STATUS } from '@repo/shared';
import { MuscleGroupModel } from '../models/muscleGroup.model.js';
import { createExerciseSchema, updatedExerciseSchema } from '../routes/exercise.js';

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

export function validateMusclesExists(schemas: ValidationSchemas): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body)
        const parsed = createExerciseSchema.safeParse(req.body).success
          ? createExerciseSchema.parse(req.body)
          : updatedExerciseSchema.parse(req.body);
   
        const allMuscleIds = [parsed.primary_muscle_id, ...(parsed.secondary_muscle_ids || [])];

        // Refactored: Make the function async and await MuscleGroupModel.find, then check the result.
        const muscles = await MuscleGroupModel.find({
          _id: { $in: allMuscleIds.map((m) => new mongoose.Types.ObjectId(m))}
        });
        if (!muscles || muscles.length !== allMuscleIds.length) {

          throw new AppError(HTTP_STATUS.NOT_FOUND, "Muscle groups not found")
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  }
}