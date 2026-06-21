import { clampPageSize, DEFAULT_PAGE_SIZE, HTTP_STATUS, MAX_PAGE_SIZE } from "@repo/shared";
import type { ApiResponse, Exercise, PaginatedResponse } from '@repo/shared';
import { type Router as RouterType, Router } from "express";
import z from "zod";
import { ExerciseModel } from "../models/exercise.model.js";
import { validate, validateDocId, validateMusclesExists } from "../middleware/validate.js";
import { AppError } from "../middleware/error-handler.js";
import mongoose from "mongoose";

const router: RouterType = Router();

function toExercise(doc: { toJSON: () => Record<string, unknown> }): Exercise {
    const json = doc.toJSON();
    const createdAt = json['createdAt'];
    const updatedAt = json['updatedAt'];
    return {
        id: json['id'] as string,
        name: json['name'] as string,
        primary_muscle_id: json['primary_muscle_id'] as string,
        secondary_muscle_ids: json['secondary_muscle_id'] as string[],
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
        updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : String(updatedAt),
    }    
}

export const createExerciseSchema = z.object({
    name: z.string().min(1).max(100),
    primary_muscle_id: z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        "Invalid MongoDB ObjectId"
    ),
    secondary_muscle_ids: z.array(z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        "Invalid MongoDB ObjectId"
    )).optional()
})

export const updatedExerciseSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    primary_muscle_id: z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        "Invalid MongoDB ObjectId"
    ).optional(),
    secondary_muscle_ids: z.array(z.string().regex(
        /^[0-9a-fA-F]{24}$/,
        "Invalid MongoDB ObjectId"
    )).optional()
})

// List exercises
router.get('/', async (req, res, next) => {
    try {
        const page = Number(req.query['page']) || 1;
        const pageSize = Number(req.query['pageSize']) || DEFAULT_PAGE_SIZE;
        const clampedSize = clampPageSize(pageSize, MAX_PAGE_SIZE);
        const total = await ExerciseModel.countDocuments();
        const skip = (page - 1) * clampedSize;
        const docs = await ExerciseModel.find().sort({ createdAt: -1 }).skip(skip).limit(clampedSize);
        const items = docs.map(toExercise);

        const data: PaginatedResponse<Exercise> = {
            items,
            total,
            page,
            pageSize: clampedSize,
            totalPages: Math.ceil(total / clampedSize),
        }

        const response: ApiResponse<PaginatedResponse<Exercise>> = { success: true, data };
        res.json(response);
    } catch (err) {
        next(err);
    }
})

// Get exercise by ID
router.get('/:id', async (req, res, next) => {
    try {
        const id = String(req.params['id'])

        validateDocId(id, 'Exercise')

        const doc = await ExerciseModel.findById(id);
        if (!doc) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Exercise not found')
        }

        const exercise = toExercise(doc);

        const response: ApiResponse<Exercise> = { success: true, data: exercise };
        res.json(response);
    } catch (err) {
        next(err);
    }
})

router.post('/', validate({ body: createExerciseSchema }), validateMusclesExists({ body: createExerciseSchema }), async (req, res, next) => {
    try {
        const data = req.body as z.infer<typeof createExerciseSchema>;

        const existing = await ExerciseModel.findOne({ name: data.name })
        if (existing) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'Exercise with that name already exists')
        }

        const doc = await ExerciseModel.create({ name: data.name, primary_muscle_id: data.primary_muscle_id, secondary_muscle_ids: data.secondary_muscle_ids })
        const exercise = toExercise(doc)

        const response: ApiResponse<Exercise> = { success: true, data: exercise };
        res.status(HTTP_STATUS.CREATED).json(response);
    } catch (err) {
        next(err)
    }
})

router.put('/:id', validate({ body: updatedExerciseSchema }), validateMusclesExists({ body: updatedExerciseSchema}), async (req, res, next) => {
    try {
        const id = String(req.params['id']);
        const updates = req.body as z.infer<typeof updatedExerciseSchema>;

        validateDocId(id, 'Exercise');

        const existing = await ExerciseModel.findOne({
            name: updates.name,
            _id: { $ne: new mongoose.Types.ObjectId(id) },
        });
        if (existing) {
            throw new AppError(HTTP_STATUS.CONFLICT, "Exercise with that name already exists")
        }

        const doc = await ExerciseModel.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
        if (!doc) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'Exercise not found')
        }

        const exercise = toExercise(doc);

        const response: ApiResponse<Exercise> = { success: true, data: exercise };
        res.json(response);
    } catch (err) {
        next(err);
    }
})

router.delete('/:id', async (req, res, next) => {
    try {
        const id = String(req.params['id'])

        validateDocId(id, "Exercise")

        const doc = await ExerciseModel.findByIdAndDelete(id);
        if (!doc) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'Exercise not found')
        }

        res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (err) {
        next(err);
    }
})

export { router as exercisesRouter };