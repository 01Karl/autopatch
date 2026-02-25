import { getFreeIPAConfigPath } from '@/lib/config';
import { NextResponse } from 'next/server';
import fs from 'node:fs';

export async function POST(req: Request) {
  const form = await req.formData();

  const payload = {
    baseUrl: String(form.get('baseUrl') || '').trim(),
    usernameSuffix: String(form.get('usernameSuffix') || '').trim(),
    verifyTls: form.get('verifyTls') === '1',
  };

  fs.writeFileSync(getFreeIPAConfigPath(), JSON.stringify(payload, null, 2));
  return NextResponse.redirect(new URL('/?view=get-started', req.url));
}
