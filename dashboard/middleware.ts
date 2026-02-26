import { readSessionToken, getSessionCookieName } from '@/lib/auth/session';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/machines', '/repository', '/compliance'];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const token = req.cookies.get(getSessionCookieName())?.value;
  const session = readSessionToken(token);

  if (session) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('redirectTo', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: PROTECTED_PREFIXES.map((prefix) => `${prefix}/:path*`),
};
