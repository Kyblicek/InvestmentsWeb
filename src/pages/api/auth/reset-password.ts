import type { APIRoute } from 'astro';
import { z } from 'zod';
import { handleApi, json } from '../../../server/api';
import { resetPassword } from '../../../server/auth';

const bodySchema = z.object({
  token: z.string().min(1, 'Chybí reset token'),
  password: z.string().min(8, 'Heslo musí mít alespoň 8 znaků'),
});

export const POST: APIRoute = handleApi(async (context) => {
  const contentType = context.request.headers.get('content-type') ?? '';
  const accept = context.request.headers.get('accept') ?? '';

  let payload: z.infer<typeof bodySchema>;
  if (contentType.includes('application/json')) {
    const body = await context.request.json();
    payload = bodySchema.parse(body);
  } else {
    const formData = await context.request.formData();
    payload = bodySchema.parse({
      token: formData.get('token'),
      password: formData.get('password'),
    });
  }

  await resetPassword(payload.token, payload.password);

  if (contentType.includes('application/json') || accept.includes('application/json')) {
    return json({ success: true });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: '/prihlaseni?reset=ok',
    },
  });
});
