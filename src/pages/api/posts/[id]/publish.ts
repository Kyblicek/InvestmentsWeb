import type { APIRoute } from 'astro';
import { z } from 'zod';
import { handleApi, json } from '../../../../server/api';
import { getSessionTokenForCsrf, requireAdmin } from '../../../../server/auth';
import { verifyCsrfToken } from '../../../../server/csrf';
import { publishPost } from '../../../../server/posts';

const publishSchema = z.object({
  csrfToken: z.string().min(1, 'Missing CSRF token'),
});

export const POST: APIRoute = handleApi(async (context) => {
  await requireAdmin(context.request);

  const id = context.params.id;
  if (!id) {
    return json({ error: 'Missing ID' }, { status: 400 });
  }

  const contentType = context.request.headers.get('content-type') ?? '';
  const wantsJson = context.request.headers.get('accept')?.includes('application/json') ?? false;
  const sessionToken = getSessionTokenForCsrf(context.cookies);

  let parsed: z.infer<typeof publishSchema>;
  if (contentType.includes('application/json')) {
    const body = await context.request.json();
    parsed = publishSchema.parse(body);
  } else {
    const formData = await context.request.formData();
    parsed = publishSchema.parse({
      csrfToken: formData.get('csrfToken'),
    });
  }

  if (!verifyCsrfToken(sessionToken, parsed.csrfToken)) {
    return json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const post = await publishPost(id);

  if (contentType.includes('application/json') || wantsJson) {
    return json({ post });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: `/admin/posts/${id}`,
    },
  });
});
