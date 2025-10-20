import type { APIRoute } from 'astro';
import { z } from 'zod';
import { handleApi, json } from '../../../server/api';
import { requestPasswordReset } from '../../../server/auth';
import { TokenBucket } from '../../../server/rateLimiter';
import { logger } from '../../../server/logger';
import { isProduction } from '../../../server/env';

const bodySchema = z.object({
  email: z.string().email(),
});

const limiter = new TokenBucket(3, 60 * 60 * 1000, 1); // 3 per hour

export const POST: APIRoute = handleApi(async (context) => {
  const clientAddress = context.clientAddress ?? 'unknown';
  if (!limiter.consume(clientAddress)) {
    return json({ error: 'Příliš mnoho požadavků, zkuste to prosím později.' }, { status: 429 });
  }

  const contentType = context.request.headers.get('content-type') ?? '';
  const accept = context.request.headers.get('accept') ?? '';

  let payload: z.infer<typeof bodySchema>;
  if (contentType.includes('application/json')) {
    const body = await context.request.json();
    payload = bodySchema.parse(body);
  } else {
    const formData = await context.request.formData();
    payload = bodySchema.parse({
      email: formData.get('email'),
    });
  }

  const { token, expiresAt } = await requestPasswordReset(payload.email);

  if (token && !isProduction) {
    logger.info('Password reset token generated', { email: payload.email, token });
  }

  if (contentType.includes('application/json') || accept.includes('application/json')) {
    return json({
      success: true,
      message: 'Pokud účet existuje, odeslali jsme další instrukce.',
      resetToken: token,
      expiresAt,
    });
  }

  const url = new URL('/prihlaseni/reset', context.url);
  url.searchParams.set('sent', '1');
  if (token && !isProduction) {
    url.searchParams.set('token', token);
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: url.toString(),
    },
  });
});
