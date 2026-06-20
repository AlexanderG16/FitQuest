import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/request-logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.js';
import { usersRouter } from './routes/users.js';
import { testRouter } from './routes/test.js';
import { API_VERSION } from '@repo/shared';

export function createApp(): express.Express {
  const app = express();

  // Security
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  // Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging
  app.use(requestLogger);

  // Routes
  const apiPrefix = `/api/${API_VERSION}`;
  app.use(`${apiPrefix}/health`, healthRouter);
  app.use(`${apiPrefix}/users`, usersRouter);
  app.use(`${apiPrefix}/test`, testRouter);

  // Error handling — must be last
  app.use(errorHandler);

  return app;
}
