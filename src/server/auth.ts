import { createHash, randomBytes } from 'node:crypto';
import type { AstroCookies } from 'astro';
import bcrypt from 'bcryptjs';
import { parse as parseCookie } from 'cookie';
import { db } from './db';
import { env, isProduction, isEmailConfigured } from './env';
import { generateCsrfToken } from './csrf';
import { sendEmail } from './email';

export const SESSION_COOKIE_NAME = 'rr_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

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

const hashResetToken = (token: string) =>
  createHash('sha256').update(`reset.${token}.${env.SESSION_SECRET}`).digest('hex');

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

export async function requestPasswordReset(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return { success: true };
  }

  await db.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      used: false,
    },
    data: {
      used: true,
    },
  });

  const rawToken = randomBytes(32).toString('hex');
  const hashed = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token: hashed,
      expiresAt,
    },
  });

  if (isEmailConfigured) {
    const baseUrl = env.PUBLIC_SITE_URL ?? 'http://localhost:4321';
    const resetUrl = new URL('/prihlaseni/nove-heslo', baseUrl);
    resetUrl.searchParams.set('token', rawToken);

    const textBody = [
      'Dobrý den,',
      '',
      'Obdrželi jsme požadavek na obnovení hesla do administrace webu René Rypar.',
      'Pokud jste o obnovu žádali, otevřete následující odkaz a nastavte si nové heslo (platí 60 minut):',
      resetUrl.toString(),
      '',
      'Pokud jste o obnovu nepožádali, tento e-mail ignorujte.',
      '',
      'S pozdravem,',
      'RR Invest Web',
    ].join('\n');

    const htmlBody = `
      <p>Dobrý den,</p>
      <p>Obdrželi jsme požadavek na obnovení hesla do administrace webu René Rypar.</p>
      <p>
        Pokud jste o obnovu žádali, klikněte na následující odkaz (platí 60 minut):<br />
        <a href="${resetUrl.toString()}">${resetUrl.toString()}</a>
      </p>
      <p>Pokud jste o obnovu nepožádali, tento e-mail ignorujte.</p>
      <p>S pozdravem,<br />RR Invest Web</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Obnova hesla | René Rypar',
      text: textBody,
      html: htmlBody,
    });
  }

  return { success: true, token: rawToken, expiresAt };
}

export async function resetPassword(token: string, newPassword: string) {
  const hashed = hashResetToken(token);

  const record = await db.passwordResetToken.findUnique({
    where: {
      token: hashed,
    },
    include: {
      user: true,
    },
  });

  if (!record || record.used || record.expiresAt.getTime() < Date.now()) {
    throw new AuthError('Invalid or expired token', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: {
        password: passwordHash,
      },
    }),
    db.passwordResetToken.update({
      where: { id: record.id },
      data: {
        used: true,
      },
    }),
  ]);

  return { success: true };
}
