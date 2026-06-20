import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redis: Redis | null = null;
let available = false;

export function isRedisAvailable(): boolean {
  return available;
}

export function getRedis(): Redis | null {
  if (!available) return null;
  return redis;
}

export async function connectRedis(): Promise<void> {
  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 3000,
      retryStrategy(times: number) {
        if (times > 2) return null;
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      available = true;
      logger.info('Redis connected');
    });

    redis.on('error', () => {
      available = false;
    });

    redis.on('close', () => {
      available = false;
    });

    await redis.connect();
    available = true;
  } catch {
    available = false;
    redis = null;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    try { await redis.quit(); } catch { /* ignore */ }
    redis = null;
    available = false;
  }
}
