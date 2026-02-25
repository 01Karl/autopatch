import { enqueueAutopatch } from '@/lib/autopatch';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const form = await req.formData();
  enqueueAutopatch({
    env: String(form.get('env') || 'qa'),
    basePath: String(form.get('basePath') || '../../../Ansible/environments'),
    dryRun: form.get('dryRun') === '1',
    maxWorkers: Number(form.get('maxWorkers') || 2),
    probeTimeout: Number(form.get('probeTimeout') || 5)
  });

  return NextResponse.redirect(new URL('/', req.url));
}
