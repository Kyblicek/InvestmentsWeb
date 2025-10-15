import type { APIRoute } from 'astro';
import { z } from 'zod';
import { handleApi, json } from '../../../../server/api';
import { getSessionTokenForCsrf, requireAdmin } from '../../../../server/auth';
import { verifyCsrfToken } from '../../../../server/csrf';
import { db } from '../../../../server/db';

const updateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  imageUrl: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (!value) return undefined;
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    })
    .refine((value) => !value || /^https?:\/\//i.test(value), {
      message: 'Image URL must be absolute',
    }),
  csrfToken: z.string().min(1, 'Missing CSRF token'),
});

const updateWithPayload = async (
  context: Parameters<APIRoute>[0],
  parsed: z.infer<typeof updateSchema>,
  respondWithJson: boolean
) => {
  const sessionToken = getSessionTokenForCsrf(context.cookies);
  if (!verifyCsrfToken(sessionToken, parsed.csrfToken)) {
    return json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const id = context.params.id;
  if (!id) {
    return json({ error: 'Missing ID' }, { status: 400 });
  }

  const post = await db.post.update({
    where: { id },
    data: {
      title: parsed.title,
      content: parsed.content,
      imageUrl: parsed.imageUrl,
    },
  });

  if (respondWithJson) {
    return json({ post }, { status: 200 });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/admin/posts/${id}`,
    },
  });
};

export const PATCH: APIRoute = handleApi(async (context) => {
  await requireAdmin(context.request);

  const contentType = context.request.headers.get('content-type') ?? '';

  let parsed: z.infer<typeof updateSchema>;
  if (contentType.includes('application/json')) {
    const body = await context.request.json();
    parsed = updateSchema.parse(body);
  } else {
    const formData = await context.request.formData();
    parsed = updateSchema.parse({
      title: formData.get('title'),
      content: formData.get('content'),
      imageUrl: formData.get('imageUrl'),
      csrfToken: formData.get('csrfToken'),
    });
  }

  return updateWithPayload(context, parsed, contentType.includes('application/json'));
});

export const POST: APIRoute = handleApi(async (context) => {
  await requireAdmin(context.request);

  const formData = await context.request.formData();
  const methodOverride = formData.get('_method')?.toString().toUpperCase();

  if (methodOverride !== 'PATCH') {
    return json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  const parsed = updateSchema.parse({
    title: formData.get('title'),
    content: formData.get('content'),
    imageUrl: formData.get('imageUrl'),
    csrfToken: formData.get('csrfToken'),
  });

  return updateWithPayload(context, parsed, false);
});
