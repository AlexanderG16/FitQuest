import { Router, type Router as RouterType } from 'express';
import mongoose from 'mongoose';
import type { ApiResponse } from '@repo/shared';

const router: RouterType = Router();

// Echo back whatever is sent
router.post('/echo', (req, res) => {
  const response: ApiResponse<{ headers: Record<string, string | string[] | undefined>; body: unknown; timestamp: string }> = {
    success: true,
    data: {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString(),
    },
  };
  res.json(response);
});

// Simulated delay endpoint
router.get('/delay/:ms', (req, res) => {
  const ms = Math.min(Number(req.params['ms']) || 1000, 5000);
  setTimeout(() => {
    const response: ApiResponse<{ delayMs: number }> = {
      success: true,
      data: { delayMs: ms },
    };
    res.json(response);
  }, ms);
});

// Simulated error
router.get('/error/:code', (req, res) => {
  const code = Number(req.params['code']) || 500;
  res.status(code).json({
    success: false,
    error: `Simulated ${code} error`,
    statusCode: code,
  });
});

// Server & services info
router.get('/info', (_req, res) => {
  const response: ApiResponse<{
    nodeVersion: string;
    platform: string;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    env: string;
    mongodb: { status: string; host: string };
  }> = {
    success: true,
    data: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      env: process.env['NODE_ENV'] ?? 'development',
      mongodb: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        host: mongoose.connection.host ?? 'unknown',
      },
    },
  };
  res.json(response);
});

export { router as testRouter };
