import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const form = await req.formData();
  db.prepare(
    `INSERT INTO schedules (name, env, base_path, dry_run, max_workers, probe_timeout, day_of_week, time_hhmm, enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
  ).run(
    String(form.get('name') || 'schema'),
    String(form.get('env') || 'qa'),
    String(form.get('basePath') || '../../../Ansible/environments'),
    form.get('dryRun') === '1' ? 1 : 0,
    Number(form.get('maxWorkers') || 2),
    Number(form.get('probeTimeout') || 5),
    String(form.get('dayOfWeek') || 'sun'),
    String(form.get('timeHHMM') || '02:00')
  );

  return NextResponse.redirect(new URL('/', req.url));
}
