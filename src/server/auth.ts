import { createHash, randomBytes } from 'node:crypto';
import type { AstroCookies } from 'astro';
import bcrypt from 'bcryptjs';
import { parse as parseCookie } from 'cookie';
import { db } from './db';
import { env, isProduction } from './env';
import { generateCsrfToken } from './csrf';

export const SESSION_COOKIE_NAME = 'rr_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

const hashSessionToken = (token: string) =>
  createHash('sha256').update(`${token}.${env.SESSION_SECRET}`).digest('hex');

const getExpirationDate = () => new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

const setSessionCookie = (cookies: AstroCookies, token: string) => {
  cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
};

const clearSessionCookie = (cookies: AstroCookies) => {
  cookies.delete(SESSION_COOKIE_NAME, {
    path: '/',
  });
};

const getRawSessionTokenFromCookies = (cookies: AstroCookies) => cookies.get(SESSION_COOKIE_NAME)?.value;

const getRawSessionTokenFromRequest = (req: Request) => {
  const header = req.headers.get('cookie');
  if (!header) {
    return undefined;
  }
  const parsed = parseCookie(header);
  return parsed[SESSION_COOKIE_NAME];
};

const findSessionByToken = async (rawToken: string) =>
  db.session.findUnique({
    where: {
      token: hashSessionToken(rawToken),
    },
    include: {
      user: true,
    },
  });

const deleteSessionByToken = async (rawToken: string) => {
  try {
    await db.session.delete({
      where: { token: hashSessionToken(rawToken) },
    });
  } catch (error) {
    // session might already be removed, ignore silently
  }
};

export async function login(email: string, password: string, cookies: AstroCookies) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    throw new AuthError('Invalid credentials');
  }

  const passwordOk = await bcrypt.compare(password, user.password);
  if (!passwordOk) {
    throw new AuthError('Invalid credentials');
  }

  const rawToken = randomBytes(32).toString('hex');
  const expiresAt = getExpirationDate();

  await db.session.create({
    data: {
      userId: user.id,
      token: hashSessionToken(rawToken),
      expiresAt,
    },
  });

  setSessionCookie(cookies, rawToken);

  return {
    user,
    csrfToken: generateCsrfToken(rawToken),
  };
}

export async function logout(cookies: AstroCookies) {
  const token = getRawSessionTokenFromCookies(cookies);
  if (token) {
    await deleteSessionByToken(token);
  }
  clearSessionCookie(cookies);
}

const validateSession = async (rawToken: string | undefined) => {
  if (!rawToken) {
    return null;
  }

  const session = await findSessionByToken(rawToken);
  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await deleteSessionByToken(rawToken);
    return null;
  }

  return session;
};

export async function getUserFromCookies(cookies: AstroCookies) {
  const token = getRawSessionTokenFromCookies(cookies);
  const session = await validateSession(token);
  return session?.user ?? null;
}

export async function getUserFromRequest(req: Request) {
  const token = getRawSessionTokenFromRequest(req);
  const session = await validateSession(token);
  return session?.user ?? null;
}

export async function requireAdmin(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    throw new AuthError('Unauthorized', 401);
  }
  if (user.role !== 'ADMIN') {
    throw new AuthError('Forbidden', 403);
  }
  return user;
}

export function getSessionTokenForCsrf(cookies: AstroCookies) {
  return getRawSessionTokenFromCookies(cookies);
}
