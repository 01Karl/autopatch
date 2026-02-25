import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const form = await req.formData();

  db.prepare(
    `UPDATE freeipa_config
     SET base_url = ?, username_suffix = ?, verify_tls = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = 1`
  ).run(
    String(form.get('baseUrl') || '').trim(),
    String(form.get('usernameSuffix') || '').trim(),
    form.get('verifyTls') === '1' ? 1 : 0
  );

  return NextResponse.redirect(new URL('/?view=get-started', req.url));
}
