import type { APIRoute } from 'astro';
import { PostStatus } from '@prisma/client';
import { z } from 'zod';
import { handleApi, json } from '../../../../server/api';
import { getSessionTokenForCsrf, requireAdmin } from '../../../../server/auth';
import { verifyCsrfToken } from '../../../../server/csrf';
import { db } from '../../../../server/db';
import { publishPost } from '../../../../server/posts';

const formSchema = z.object({
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
  publish: z
    .union([z.string(), z.boolean(), z.undefined()])
    .transform((value) => value === 'on' || value === 'true' || value === true),
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

  let parsed: z.infer<typeof formSchema>;
  if (contentType.includes('application/json')) {
    const body = await context.request.json();
    parsed = formSchema.parse(body);
  } else {
    const formData = await context.request.formData();
    parsed = formSchema.parse({
      title: formData.get('title'),
      content: formData.get('content'),
      imageUrl: formData.get('imageUrl'),
      publish: formData.get('publish')?.toString(),
      csrfToken: formData.get('csrfToken'),
    });
  }

  if (!verifyCsrfToken(sessionToken, parsed.csrfToken)) {
    return json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const post = await db.post.create({
    data: {
      title: parsed.title,
      content: parsed.content,
      imageUrl: parsed.imageUrl,
      status: PostStatus.DRAFT,
      publishedAt: null,
    },
  });

  if (parsed.publish) {
    await publishPost(post.id);
  }

  if (contentType.includes('application/json')) {
    return json({ postId: post.id }, { status: 201 });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: '/admin/posts',
    },
  });
});
