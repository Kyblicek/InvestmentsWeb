import type { APIRoute } from 'astro';
import { z } from 'zod';
import { handleApi, json } from '../../../server/api';
import { AuthError, login } from '../../../server/auth';
import { TokenBucket } from '../../../server/rateLimiter';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const limiter = new TokenBucket(5, 60_000, 1);

export const POST: APIRoute = handleApi(async (context) => {
  const clientAddress = context.clientAddress ?? 'unknown';
  if (!limiter.consume(clientAddress)) {
    const contentType = context.request.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/prihlaseni?error=rate-limit',
        },
      });
    }
    return json({ error: 'Too many login attempts, please try again later.' }, { status: 429 });
  }

  const contentType = context.request.headers.get('content-type') ?? '';

  let credentials: z.infer<typeof bodySchema>;
  if (contentType.includes('application/json')) {
    const body = await context.request.json();
    credentials = bodySchema.parse(body);
  } else {
    const formData = await context.request.formData();
    credentials = bodySchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });
  }

  try {
    const { user, csrfToken } = await login(credentials.email, credentials.password, context.cookies);

    if (contentType.includes('application/json')) {
      return json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        csrfToken,
      });
    }

    return new Response(null, {
      status: 303,
      headers: {
        Location: '/admin',
      },
    });
  } catch (error) {
    if (error instanceof AuthError && !contentType.includes('application/json')) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/prihlaseni?error=wrong',
        },
      });
    }
    throw error;
  }
});
