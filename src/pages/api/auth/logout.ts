import type { APIRoute } from 'astro';
import { handleApi, noContent } from '../../../../server/api';
import { logout } from '../../../../server/auth';

export const POST: APIRoute = handleApi(async (context) => {
  await logout(context.cookies);
  return noContent();
});
