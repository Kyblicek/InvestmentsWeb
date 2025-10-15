import type { APIRoute } from 'astro';
import { ZodError } from 'zod';
import { AuthError } from './auth';
import { logger } from './logger';

export const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

export const noContent = (init: ResponseInit = {}) =>
  new Response(null, {
    status: init.status ?? 204,
    headers: init.headers,
  });

export const handleApi =
  (handler: APIRoute): APIRoute =>
  async (context) => {
    try {
      return await handler(context);
    } catch (error) {
      if (error instanceof AuthError) {
        logger.warn('Auth error', { error: error.message, status: error.status });
        return json({ error: error.message }, { status: error.status });
      }

      if (error instanceof ZodError) {
        logger.warn('Validation error', { issues: error.issues });
        return json({ error: 'Validation failed', issues: error.issues }, { status: 400 });
      }

      logger.error('Unhandled API error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
