import { encodeSession, getSessionCookieName, getSessionMaxAge } from '@/lib/auth';
import { verifyFreeIPALogin } from '@/lib/freeipa';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const form = await req.formData();
  const username = String(form.get('username') || '').trim();
  const password = String(form.get('password') || '');
  const redirectTo = String(form.get('redirectTo') || '/');

  if (!username || !password) {
    return NextResponse.redirect(new URL('/login?error=missing_credentials', req.url));
  }

  const result = await verifyFreeIPALogin(username, password);
  if (!result.ok) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(result.error)}`, req.url));
  }

  const response = NextResponse.redirect(new URL(redirectTo, req.url));
  response.cookies.set({
    name: getSessionCookieName(),
    value: encodeSession(result.fullUsername),
    httpOnly: true,
    sameSite: 'lax',
    maxAge: getSessionMaxAge(),
    path: '/',
  });

  return response;
}
