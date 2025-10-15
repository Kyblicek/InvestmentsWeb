import type { APIRoute } from 'astro';
import { z } from 'zod';
import { handleApi, json } from '../../../../../server/api';
import { db } from '../../../../../server/db';
import { env } from '../../../../../server/env';
import { logger } from '../../../../../server/logger';

const payloadSchema = z.object({
  linkedinUrl: z.string().url(),
});

export const POST: APIRoute = handleApi(async (context) => {
  const webhookToken = context.request.headers.get('x-webhook-token');
  if (!webhookToken || webhookToken !== env.WEBHOOK_SECRET) {
    logger.warn('Invalid webhook token');
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = context.params.id;
  if (!id) {
    return json({ error: 'Missing ID' }, { status: 400 });
  }

  const body = await context.request.json();
  const { linkedinUrl } = payloadSchema.parse(body);

  const post = await db.post.update({
    where: { id },
    data: {
      linkedinUrl,
    },
  });

  logger.info('LinkedIn URL updated from webhook', { postId: id });

  return json({ post });
});
