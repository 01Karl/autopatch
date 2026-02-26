import { cookies } from 'next/headers';
import { readSessionToken, getSessionCookieName, type SessionUser } from '@/lib/auth/session';

export function getServerSession(): SessionUser | null {
  const token = cookies().get(getSessionCookieName())?.value;
  return readSessionToken(token);
}
