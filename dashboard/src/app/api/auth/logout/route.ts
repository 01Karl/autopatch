import { getSessionCookieName } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL('/login', req.url));
  response.cookies.set({
    name: getSessionCookieName(),
    value: '',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return response;
}
