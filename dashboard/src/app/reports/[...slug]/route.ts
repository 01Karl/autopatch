import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: { slug: string[] } }) {
  const repoRoot = path.resolve(process.cwd(), '..');
  const filePath = path.join(repoRoot, 'reports', ...params.slug);
  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const data = fs.readFileSync(filePath);
  const ext = path.extname(filePath);
  const type = ext === '.json' ? 'application/json' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  return new NextResponse(data, {
    headers: {
      'content-type': type,
      'content-disposition': `inline; filename="${path.basename(filePath)}"`
    }
  });
}
