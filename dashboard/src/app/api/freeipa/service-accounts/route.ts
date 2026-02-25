import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const form = await req.formData();
  const name = String(form.get('name') || '').trim();
  const purpose = String(form.get('purpose') || '').trim();
  const username = String(form.get('username') || '').trim();
  const secret = String(form.get('secret') || '');

  if (!name || !purpose || !username || !secret) {
    return NextResponse.redirect(new URL('/?view=get-started&error=missing_service_account_fields', req.url));
  }

  try {
    db.prepare('INSERT INTO service_accounts (name, purpose, username, secret) VALUES (?, ?, ?, ?)').run(name, purpose, username, secret);
  } catch {
    return NextResponse.redirect(new URL('/?view=get-started&error=duplicate_service_account', req.url));
  }

  return NextResponse.redirect(new URL('/?view=get-started', req.url));
}
