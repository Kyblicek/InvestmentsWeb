import { z } from 'zod';

const emailValidator = z.string().email();

const emailLike = z
  .string()
  .min(1)
  .refine((value) => {
    const trimmed = value.trim();
    if (trimmed.includes('<') && trimmed.includes('>')) {
      const match = trimmed.match(/<([^>]+)>/);
      const address = match?.[1]?.trim();
      if (!address) {
        return false;
      }
      return emailValidator.safeParse(address).success;
    }
    return emailValidator.safeParse(trimmed).success;
  }, {
    message: 'Value must be a valid email like user@example.com or "Name <user@example.com>"',
  });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  WEBHOOK_SECRET: z.string().min(1, 'WEBHOOK_SECRET is required'),
  MAKE_WEBHOOK_URL: z.string().url().optional(),
  PUBLIC_SITE_URL: z.string().url().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : undefined))
    .refine((value) => !value || Number.isInteger(value), {
      message: 'SMTP_PORT must be an integer',
    }),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: emailLike.optional(),
  SMTP_TEST_RECIPIENT: z.string().email().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  MAKE_WEBHOOK_URL: process.env.MAKE_WEBHOOK_URL,
  PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM,
  SMTP_TEST_RECIPIENT: process.env.SMTP_TEST_RECIPIENT,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
});

if (!parsed.success) {
  console.error('❌ Invalid environment variables', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. Check your environment variables.');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isEmailConfigured =
  Boolean(env.SMTP_HOST && env.SMTP_PORT && env.EMAIL_FROM) &&
  Boolean(env.SMTP_PASSWORD ? env.SMTP_USER : true);
