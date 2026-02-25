import { getSessionCookieName } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL('/login', req.url));
  response.cookies.set({
    name: getSessionCookieName(),
    value: '',
    maxAge: 0,
    path: '/',
  });
  return response;
}
