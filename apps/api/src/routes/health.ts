import { Router, type Router as RouterType } from 'express';
import mongoose from 'mongoose';
import type { HealthCheckResponse } from '@repo/shared';

const router: RouterType = Router();

const startTime = Date.now();

router.get('/', (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;

  const response: HealthCheckResponse & { services: Record<string, string> } = {
    status: mongoOk ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env['npm_package_version'] ?? '0.0.0',
    services: {
      mongodb: mongoOk ? 'connected' : 'disconnected',
    },
  };

  res.status(mongoOk ? 200 : 503).json(response);
});

export { router as healthRouter };
