import type { Post } from '@prisma/client';
import { PostStatus } from '@prisma/client';
import { db } from './db';
import { env } from './env';
import { logger } from './logger';

const canonicalBase = (env.PUBLIC_SITE_URL ?? 'https://www.rrinvestments.eu').replace(/\/$/, '');

const triggerMakeWebhook = async (post: Post) => {
  if (!env.MAKE_WEBHOOK_URL) {
    return;
  }

  try {
    await fetch(env.MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: post.id,
        title: post.title,
        content: post.content,
        imageUrl: post.imageUrl,
        canonicalUrl: `${canonicalBase}/posts/${post.id}`,
      }),
    });
    logger.info('Triggered Make webhook', { postId: post.id });
  } catch (error) {
    logger.error('Failed to call Make webhook', {
      postId: post.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const publishPost = async (postId: string) => {
  const existing = await db.post.findUnique({ where: { id: postId } });
  if (!existing) {
    throw new Error('Post not found');
  }

  if (existing.status === PostStatus.PUBLISHED && existing.publishedAt) {
    return existing;
  }

  const post = await db.post.update({
    where: { id: postId },
    data: {
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  await triggerMakeWebhook(post);
  return post;
};
