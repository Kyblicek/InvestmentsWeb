import type { APIRoute } from 'astro';
import { z } from 'zod';
import pkg from '@prisma/client';
import { handleApi, json } from '../../../server/api';
import { getSessionTokenForCsrf, requireAdmin } from '../../../server/auth';
import { verifyCsrfToken } from '../../../server/csrf';
import { db } from '../../../server/db';

const { PostStatus } = pkg;

const updateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  scheduledFor: z.string().optional(),
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

  const existing = await db.post.findUnique({ where: { id } });
  if (!existing) {
    return json({ error: 'Not found' }, { status: 404 });
  }

  let scheduledFor: Date | undefined;
  if (parsed.scheduledFor) {
    const candidate = new Date(parsed.scheduledFor);
    if (!Number.isNaN(candidate.getTime()) && candidate.getTime() > Date.now()) {
      scheduledFor = candidate;
    }
  }

  const data: Parameters<typeof db.post.update>[0]['data'] = {
    title: parsed.title,
    content: parsed.content,
    scheduledFor: scheduledFor ?? null,
  };

  if (scheduledFor) {
    if (existing.status !== PostStatus.PUBLISHED) {
      data.status = PostStatus.SCHEDULED;
      data.publishedAt = null;
    }
  } else if (existing.status === PostStatus.SCHEDULED) {
    data.status = PostStatus.DRAFT;
  }

  const post = await db.post.update({
    where: { id },
    data,
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
      scheduledFor: formData.get('scheduledFor')?.toString(),
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
    scheduledFor: formData.get('scheduledFor')?.toString(),
    csrfToken: formData.get('csrfToken'),
  });

  return updateWithPayload(context, parsed, false);
});

export const DELETE: APIRoute = handleApi(async (context) => {
  await requireAdmin(context.request);

  const contentType = context.request.headers.get('content-type') ?? '';
  const sessionToken = getSessionTokenForCsrf(context.cookies);

  let csrfToken: string | undefined;
  if (contentType.includes('application/json')) {
    const body = await context.request.json();
    csrfToken = body?.csrfToken;
  } else {
    const formData = await context.request.formData();
    csrfToken = formData.get('csrfToken')?.toString();
  }

  if (!verifyCsrfToken(sessionToken, csrfToken)) {
    return json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const id = context.params.id;
  if (!id) {
    return json({ error: 'Missing ID' }, { status: 400 });
  }

  const post = await db.post.update({
    where: { id },
    data: {
      status: PostStatus.DELETED,
      scheduledFor: null,
      publishedAt: null,
      linkedinUrl: null,
    },
  });

  if (contentType.includes('application/json')) {
    return json({ post });
  }

  return new Response(null, {
    status: 204,
  });
});
