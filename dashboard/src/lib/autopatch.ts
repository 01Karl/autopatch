import { spawn } from 'node:child_process';
import path from 'node:path';
import db from './db';

type RunOptions = {
  env: string;
  basePath: string;
  dryRun: boolean;
  maxWorkers: number;
  probeTimeout: number;
};

const nowIso = () => new Date().toISOString();

export function enqueueAutopatch(options: RunOptions) {
  const stmt = db.prepare(
    `INSERT INTO runs (env, dry_run, started_at, status, message) VALUES (?, ?, ?, 'RUNNING', ?)`
  );
  const result = stmt.run(options.env, options.dryRun ? 1 : 0, nowIso(), 'Autopatch startad');
  const runDbId = Number(result.lastInsertRowid);

  const workerPath = path.resolve(process.cwd(), 'src/lib/worker.js');
  const child = spawn(process.execPath, [workerPath, JSON.stringify({ runDbId, options })], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  return runDbId;
}
