import { authenticateWithLdap } from '@/lib/auth/ldap';
import { createSessionToken, getSessionCookieName, getSessionMaxAge } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

function normalizeRedirectTarget(raw: string): string {
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  return raw;
}

export async function POST(req: Request) {
  const form = await req.formData();
  const username = String(form.get('username') || '').trim();
  const password = String(form.get('password') || '');
  const redirectTo = normalizeRedirectTarget(String(form.get('redirectTo') || '/machines'));

  if (!username || !password) {
    return NextResponse.redirect(new URL('/login?error=Please%20enter%20username%20and%20password.', req.url));
  }

  const result = await authenticateWithLdap(username, password);
  if (!result.ok) {
    const errorMessage =
      result.error === 'INVALID_CREDENTIALS'
        ? 'Invalid username or password.'
        : 'Unable to sign in right now. Please try again.';

    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMessage)}`, req.url));
  }

  const response = NextResponse.redirect(new URL(redirectTo, req.url));
  response.cookies.set({
    name: getSessionCookieName(),
    value: createSessionToken(result.user),
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: getSessionMaxAge(),
    path: '/',
  });

  return response;
}
