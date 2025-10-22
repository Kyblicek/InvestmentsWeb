import type { MiddlewareHandler } from 'astro';
import { getSessionTokenForCsrf, getUserFromRequest } from './server/auth';
import { generateCsrfToken } from './server/csrf';
import { releaseDueScheduledPosts } from './server/posts';

let lastScheduleCheck = 0;

export const onRequest: MiddlewareHandler = async (context, next) => {
  const user = await getUserFromRequest(context.request);
  context.locals.user = user;

  const sessionToken = getSessionTokenForCsrf(context.cookies);
  if (sessionToken) {
    context.locals.csrfToken = generateCsrfToken(sessionToken);
  } else {
    context.locals.csrfToken = undefined;
  }

  if (context.url.pathname.startsWith('/admin')) {
    if (!user) {
      return context.redirect('/prihlaseni');
    }
    if (user.role !== 'ADMIN') {
      return new Response('Forbidden', { status: 403 });
    }
  }

  const now = Date.now();
  if (now - lastScheduleCheck > 60_000) {
    lastScheduleCheck = now;
    await releaseDueScheduledPosts().catch(() => {
      // ignored; logging handled in releaseDueScheduledPosts
    });
  }

  return next();
};
