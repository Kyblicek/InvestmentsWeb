import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from './env';

const CSRF_SALT = 'csrf-token-v1';

export function generateCsrfToken(sessionToken: string) {
  const hmac = createHmac('sha256', env.SESSION_SECRET);
  hmac.update(CSRF_SALT);
  hmac.update(sessionToken);
  return hmac.digest('base64url');
}

export function verifyCsrfToken(sessionToken: string | undefined, csrfToken: string | null | undefined) {
  if (!sessionToken || !csrfToken) {
    return false;
  }

  const expected = generateCsrfToken(sessionToken);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(csrfToken));
  } catch {
    return false;
  }
}
