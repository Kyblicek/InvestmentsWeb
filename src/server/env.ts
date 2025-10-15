import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  WEBHOOK_SECRET: z.string().min(1, 'WEBHOOK_SECRET is required'),
  MAKE_WEBHOOK_URL: z.string().url().optional(),
  PUBLIC_SITE_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  MAKE_WEBHOOK_URL: process.env.MAKE_WEBHOOK_URL,
  PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
});

if (!parsed.success) {
  console.error('❌ Invalid environment variables', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. Check your environment variables.');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
