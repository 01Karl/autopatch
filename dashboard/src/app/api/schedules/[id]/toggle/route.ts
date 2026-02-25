import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const current = db.prepare('SELECT enabled FROM schedules WHERE id=?').get(params.id) as any;
  if (current) {
    db.prepare('UPDATE schedules SET enabled=? WHERE id=?').run(current.enabled ? 0 : 1, params.id);
  }
  return NextResponse.redirect(new URL('/', req.url));
}
