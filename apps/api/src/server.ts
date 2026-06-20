import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';

async function start() {
  await connectDatabase();

  // Redis is optional — don't block startup
  connectRedis().catch(() => {
    logger.warn('Redis not available — running without cache');
  });

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`API server running on http://localhost:${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });

  async function gracefulShutdown(signal: string) {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
      await disconnectDatabase();
      await disconnectRedis();
      logger.info('Server closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  }

  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception');
    process.exit(1);
  });
}

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
