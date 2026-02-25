import crypto from 'node:crypto';

const SESSION_COOKIE = 'autopatch_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 10;

function getSessionSecret() {
  return process.env.AUTOPATCH_SESSION_SECRET || 'autopatch-dev-secret-change-me';
}

function sign(payload: string) {
  return crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

export function encodeSession(username: string) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ username, expiresAt }), 'utf8').toString('base64url');
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function decodeSession(token?: string) {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;

  const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { username: string; expiresAt: number };
  if (!parsed?.username || !parsed?.expiresAt || parsed.expiresAt < Date.now()) return null;
  return parsed;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getSessionMaxAge() {
  return SESSION_MAX_AGE_SECONDS;
}
