import type { APIRoute } from 'astro';
import { z } from 'zod';
import { PostStatus } from '@prisma/client';
import { handleApi, json } from '../../../server/api';
import { getSessionTokenForCsrf, requireAdmin } from '../../../server/auth';
import { verifyCsrfToken } from '../../../server/csrf';
import { db } from '../../../server/db';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  scheduledFor: z.string().optional(),
  csrfToken: z.string().min(1, 'Missing CSRF token'),
});

export const GET: APIRoute = handleApi(async (context) => {
  await requireAdmin(context.request);

  const posts = await db.post.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return json({ posts });
});

export const POST: APIRoute = handleApi(async (context) => {
  await requireAdmin(context.request);

  const sessionToken = getSessionTokenForCsrf(context.cookies);
  const contentType = context.request.headers.get('content-type') ?? '';
  const wantsJson = context.request.headers.get('accept')?.includes('application/json') ?? false;

  let parsed: z.infer<typeof formSchema>;
  if (contentType.includes('application/json')) {
    const body = await context.request.json();
    parsed = formSchema.parse(body);
  } else {
    const formData = await context.request.formData();
    parsed = formSchema.parse({
      title: formData.get('title'),
      content: formData.get('content'),
      scheduledFor: formData.get('scheduledFor')?.toString(),
      csrfToken: formData.get('csrfToken'),
    });
  }

  if (!verifyCsrfToken(sessionToken, parsed.csrfToken)) {
    return json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  let scheduledFor: Date | undefined;
  if (parsed.scheduledFor) {
    const candidate = new Date(parsed.scheduledFor);
    if (!Number.isNaN(candidate.getTime()) && candidate.getTime() > Date.now()) {
      scheduledFor = candidate;
    }
  }

  const data = {
    title: parsed.title,
    content: parsed.content,
    status: scheduledFor ? PostStatus.SCHEDULED : PostStatus.DRAFT,
    scheduledFor: scheduledFor ?? null,
  } satisfies Parameters<typeof db.post.create>[0]['data'];

  const post = await db.post.create({
    data,
  });

  if (contentType.includes('application/json') || wantsJson) {
    return json({ postId: post.id }, { status: 201 });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: '/admin/posts',
    },
  });
});
