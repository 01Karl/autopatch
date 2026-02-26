import crypto from 'node:crypto';
import { getSessionConfig } from '@/lib/config/auth';

const SESSION_COOKIE_NAME = 'autopatch_session';
const ALGO = 'aes-256-gcm';

type SessionPayload = {
  username: string;
  displayName: string;
  groups: string[];
  expiresAt: number;
};

export type SessionUser = {
  username: string;
  displayName: string;
  groups: string[];
};

function getSessionKey(): Buffer {
  return crypto.createHash('sha256').update(getSessionConfig().secret).digest();
}

function toBase64Url(input: Buffer): string {
  return input.toString('base64url');
}

function fromBase64Url(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

export function createSessionToken(user: SessionUser): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getSessionKey(), iv);
  const payload: SessionPayload = {
    ...user,
    expiresAt: Date.now() + getSessionConfig().maxAgeSeconds * 1000,
  };

  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${toBase64Url(iv)}.${toBase64Url(ciphertext)}.${toBase64Url(tag)}`;
}

export function readSessionToken(token?: string): SessionUser | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const [ivPart, ciphertextPart, tagPart] = parts;
    const decipher = crypto.createDecipheriv(ALGO, getSessionKey(), fromBase64Url(ivPart));
    decipher.setAuthTag(fromBase64Url(tagPart));

    const plaintext = Buffer.concat([
      decipher.update(fromBase64Url(ciphertextPart)),
      decipher.final(),
    ]);

    const parsed = JSON.parse(plaintext.toString('utf8')) as SessionPayload;
    if (!parsed.username || !parsed.displayName || !Array.isArray(parsed.groups)) {
      return null;
    }

    if (!Number.isFinite(parsed.expiresAt) || parsed.expiresAt < Date.now()) {
      return null;
    }

    return {
      username: parsed.username,
      displayName: parsed.displayName,
      groups: parsed.groups,
    };
  } catch {
    return null;
  }
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getSessionMaxAge(): number {
  return getSessionConfig().maxAgeSeconds;
}

