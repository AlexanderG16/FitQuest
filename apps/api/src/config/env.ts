import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/monorepo'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CACHE_TTL: z.coerce.number().default(60),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    throw new Error(`Invalid environment variables: ${JSON.stringify(formatted)}`);
  }

  return result.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
