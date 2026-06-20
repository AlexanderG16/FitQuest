import { Router, type Router as RouterType } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import type { ApiResponse, User, PaginatedResponse } from '@repo/shared';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@repo/shared';
import { validate } from '../middleware/validate.js';
import { clampPageSize } from '@repo/shared';
import { AppError } from '../middleware/error-handler.js';
import { HTTP_STATUS } from '@repo/shared';
import { UserModel } from '../models/user.model.js';
import { cache } from '../services/cache.js';

const router: RouterType = Router();

function toUser(doc: { toJSON: () => Record<string, unknown> }): User {
  const json = doc.toJSON();
  const createdAt = json['createdAt'];
  const updatedAt = json['updatedAt'];
  return {
    id: json['id'] as string,
    email: json['email'] as string,
    name: json['name'] as string,
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
    updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : String(updatedAt),
  };
}

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(100).optional(),
});

// List users
router.get('/', async (req, res, next) => {
  try {
    const page = Number(req.query['page']) || 1;
    const pageSize = Number(req.query['pageSize']) || DEFAULT_PAGE_SIZE;
    const clampedSize = clampPageSize(pageSize, MAX_PAGE_SIZE);
    const total = await UserModel.countDocuments();
    const skip = (page - 1) * clampedSize;
    const docs = await UserModel.find().sort({ createdAt: -1 }).skip(skip).limit(clampedSize);
    const items = docs.map(toUser);

    const data: PaginatedResponse<User> = {
      items,
      total,
      page,
      pageSize: clampedSize,
      totalPages: Math.ceil(total / clampedSize),
    };

    const response: ApiResponse<PaginatedResponse<User>> = { success: true, data };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Get user by ID (cached in Redis if available)
router.get('/:id', async (req, res, next) => {
  try {
    const id = String(req.params['id']);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid user ID');
    }

    // Try cache first
    const cached = await cache.get<User>(`user:${id}`);
    if (cached) {
      res.json({ success: true, data: cached, _cached: true } as ApiResponse<User> & { _cached: boolean });
      return;
    }

    const doc = await UserModel.findById(id);
    if (!doc) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    const user = toUser(doc);

    // Cache for future reads
    await cache.set(`user:${id}`, user);

    const response: ApiResponse<User> = { success: true, data: user };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Create user
router.post('/', validate({ body: createUserSchema }), async (req, res, next) => {
  try {
    const { email, name } = req.body as z.infer<typeof createUserSchema>;

    const existing = await UserModel.findOne({ email });
    if (existing) {
      throw new AppError(HTTP_STATUS.CONFLICT, 'Email already in use');
    }

    const doc = await UserModel.create({ email, name });
    const user = toUser(doc);

    const response: ApiResponse<User> = { success: true, data: user };
    res.status(HTTP_STATUS.CREATED).json(response);
  } catch (err) {
    next(err);
  }
});

// Update user
router.patch('/:id', validate({ body: updateUserSchema }), async (req, res, next) => {
  try {
    const id = String(req.params['id']);
    const updates = req.body as z.infer<typeof updateUserSchema>;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid user ID');
    }

    if (updates.email) {
      const existing = await UserModel.findOne({
        email: updates.email,
        _id: { $ne: new mongoose.Types.ObjectId(id) },
      });
      if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, 'Email already in use');
      }
    }

    const doc = await UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    if (!doc) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    const user = toUser(doc);

    // Invalidate cache
    await cache.del(`user:${id}`);

    const response: ApiResponse<User> = { success: true, data: user };
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Delete user
router.delete('/:id', async (req, res, next) => {
  try {
    const id = String(req.params['id']);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid user ID');
    }

    const doc = await UserModel.findByIdAndDelete(id);
    if (!doc) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    // Invalidate cache
    await cache.del(`user:${id}`);

    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
});

export { router as usersRouter };
