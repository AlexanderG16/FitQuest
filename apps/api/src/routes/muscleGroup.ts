import { clampPageSize, DEFAULT_PAGE_SIZE, HTTP_STATUS, MAX_PAGE_SIZE } from "@repo/shared";
import type { ApiResponse, MuscleGroup, PaginatedResponse } from '@repo/shared';
import { Router, type Router as RouterType } from "express";
import z from "zod";
import { MuscleGroupModel } from "../models/muscleGroup.model.js";
import mongoose from "mongoose";
import { AppError } from "../middleware/error-handler.js";
import { validate, validateDocId } from "../middleware/validate.js";

const router: RouterType = Router();

function toMuscleGroup(doc: { toJSON: () => Record<string, unknown> }): MuscleGroup {
    const json = doc.toJSON();
    const createdAt = json['createdAt'];
    const updatedAt = json['updatedAt'];
    return {
        id: json['id'] as string,
        name: json['name'] as string,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
        updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : String(updatedAt),
    };
}

const createMuscleGroupSchema = z.object({
    name: z.string().min(1).max(100),
})

const updateMuscleGroupSchema = z.object({
    name: z.string().min(1).max(100).optional(),
})

const batchDeleteMuscleGroupSchema = z.object({
    ids: z.array(z.string().min(1).max(100)).min(1),
})

// List muscle groups
router.get('/', async (req, res, next) => {
    try {
        const page = Number(req.query['page']) || 1;
        const pageSize = Number(req.query['pageSize']) || DEFAULT_PAGE_SIZE;
        const clampedSize = clampPageSize(pageSize, MAX_PAGE_SIZE);
        const total = await MuscleGroupModel.countDocuments();
        const skip = (page-1) * clampedSize;
        const docs = await MuscleGroupModel.find().sort({ createdAt: -1 }).skip(skip).limit(clampedSize);
        const items = docs.map(toMuscleGroup)

        const data: PaginatedResponse<MuscleGroup> = {
            items,
            total,
            page,
            pageSize: clampedSize,
            totalPages: Math.ceil(total / clampedSize),
        };

        const response: ApiResponse<PaginatedResponse<MuscleGroup>> = { success: true, data, message: "Sucessfully fetched muscle groups" };
        res.json(response);
    } catch (err) {
        next(err);
    }
})

// Get muscle group by ID
router.get('/:id', async (req, res, next) => {
    try {
        const id = String(req.params['id']);

        validateDocId(id, 'Muscle Group');

        const doc = await MuscleGroupModel.findById(id);
        if (!doc) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Muscle group not found');
        }

        const muscleGroup = toMuscleGroup(doc);

        const response: ApiResponse<MuscleGroup> = { success: true, data: muscleGroup, message: "Sucessfully fetch muscle group" }
        res.json(response);
    } catch (err) {
        next(err);
    }
});

router.post('/', validate({ body: createMuscleGroupSchema }), async (req, res, next) => {
    try {
        const { name } = req.body as z.infer<typeof createMuscleGroupSchema>;

        const existing = await MuscleGroupModel.findOne({ name });
        if (existing) {
            throw new AppError(HTTP_STATUS.CONFLICT, 'Muscle group with that name already exists');
        }

        const doc = await MuscleGroupModel.create({ name });
        const muscleGroup = toMuscleGroup(doc);

        const response: ApiResponse<MuscleGroup> = { success: true, data: muscleGroup, message: "Sucessfully created muscle group"}
        res.status(HTTP_STATUS.CREATED).json(response);
    } catch (err) {
        next(err)
    }
})

router.put('/:id', validate({ body: updateMuscleGroupSchema }), async (req, res, next) => {
    try {
        const id = String(req.params['id']);
        const updates = req.body as z.infer<typeof updateMuscleGroupSchema>

        validateDocId(id, "Muscle Group");

        const existing = await MuscleGroupModel.findOne({
            name: updates.name,
            _id: { $ne: new mongoose.Types.ObjectId(id) },
        });
        if (existing) {
            throw new AppError(HTTP_STATUS.CONFLICT, "Muscle group with that name already exists")
        }

        const doc = await MuscleGroupModel.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
        if (!doc) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, "Muscle group not found")
        }

        const muscleGroup = toMuscleGroup(doc);

        const response: ApiResponse<MuscleGroup> = { success: true, data: muscleGroup, message: "Sucessfully updated muscle group" };
        res.json(response);
    } catch (err) {
        next(err);
    }
})

router.delete('/', validate({ query: batchDeleteMuscleGroupSchema }), async (req, res, next) => {
    try {
        const ids = (req.query.ids as string[])
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id))
        
        if (ids.length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, "No valid IDs provided")
        }

        const doc = await MuscleGroupModel.deleteMany({
            _id: { $in: ids },
        })
        if (!doc) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, "One of the muscle group not found")
        }

        const response: ApiResponse<object> = { success: true, data: {}, message: "Sucessfully deleted muscle groups" };
        res.json(response);
    } catch (err) {
        next(err);
    }
})

export { router as muscleGroupRouter };