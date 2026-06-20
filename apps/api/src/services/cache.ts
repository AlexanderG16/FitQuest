import { getRedis } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedis();
      if (!client) return null;
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      logger.warn({ err, key }, 'Cache get failed');
      return null;
    }
  },

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const client = getRedis();
      if (!client) return;
      const serialized = JSON.stringify(value);
      await client.set(key, serialized, 'EX', ttl ?? env.CACHE_TTL);
    } catch (err) {
      logger.warn({ err, key }, 'Cache set failed');
    }
  },

  async del(...keys: string[]): Promise<void> {
    try {
      const client = getRedis();
      if (!client || keys.length === 0) return;
      await client.del(...keys);
    } catch (err) {
      logger.warn({ err, keys }, 'Cache delete failed');
    }
  },

  async flush(pattern: string): Promise<void> {
    try {
      const client = getRedis();
      if (!client) return;
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (err) {
      logger.warn({ err, pattern }, 'Cache flush failed');
    }
  },
};
