const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const payload = JSON.parse(process.argv[2]);
const { runDbId, options } = payload;

const repoRoot = path.resolve(process.cwd(), '..');
const reportsDir = path.join(repoRoot, 'reports');
const db = new Database(path.join(reportsDir, 'autopatch_web.db'));

const nowIso = () => new Date().toISOString();

function latestReport(env, ext) {
  const files = fs
    .readdirSync(reportsDir)
    .filter((name) => name.startsWith(`autopatch_${env}_`) && name.endsWith(`.${ext}`))
    .map((name) => ({ name, mtime: fs.statSync(path.join(reportsDir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return files[0]?.name ?? null;
}

function summarizePayload(data) {
  const standalone = data?.standalone?.items ?? [];
  const clusters = data?.clusters?.summary ?? [];
  const statuses = [
    ...standalone.map((s) => s?.patch?.status ?? 'SKIPPED'),
    ...clusters.map((c) => c?.status ?? 'SKIPPED')
  ];

  const ok = statuses.filter((s) => s === 'OK').length;
  const failed = statuses.filter((s) => s === 'FAILED').length;
  const skipped = statuses.filter((s) => s === 'SKIPPED').length;
  const total = statuses.length;

  return { ok, failed, skipped, total, successPct: total ? Number(((ok / total) * 100).toFixed(1)) : 0 };
}

const args = [
  path.join(repoRoot, 'main.py'),
  '--env',
  options.env,
  '--base-path',
  options.basePath,
  '--max-workers',
  String(options.maxWorkers),
  '--probe-timeout',
  String(options.probeTimeout),
  '--no-color'
];
if (options.dryRun) args.push('--dry-run');

const proc = spawn('python3', args, { cwd: repoRoot });
let out = '';
let err = '';
proc.stdout.on('data', (d) => (out += String(d)));
proc.stderr.on('data', (d) => (err += String(d)));

proc.on('close', (code) => {
  const jsonFile = latestReport(options.env, 'json');
  const xlsxFile = latestReport(options.env, 'xlsx');

  let status = code === 0 ? 'OK' : 'FAILED';
  let runId = null;
  let ok = 0;
  let failed = 0;
  let skipped = 0;
  let total = 0;
  let successPct = 0;

  if (jsonFile) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(reportsDir, jsonFile), 'utf-8'));
      runId = data?.run_id ?? null;
      const metrics = summarizePayload(data);
      ok = metrics.ok;
      failed = metrics.failed;
      skipped = metrics.skipped;
      total = metrics.total;
      successPct = metrics.successPct;
      if (failed > 0) status = 'FAILED';
    } catch (e) {
      status = 'FAILED';
      err += `\nKunde inte läsa rapport: ${String(e)}`;
    }
  }

  db.prepare(
    `UPDATE runs SET run_id=?, finished_at=?, status=?, total_targets=?, ok_count=?, failed_count=?, skipped_count=?, success_pct=?, report_json=?, report_xlsx=?, message=? WHERE id=?`
  ).run(
    runId,
    nowIso(),
    status,
    total,
    ok,
    failed,
    skipped,
    successPct,
    jsonFile ? `reports/${jsonFile}` : null,
    xlsxFile ? `reports/${xlsxFile}` : null,
    `${out}\n${err}`.slice(-4000),
    runDbId
  );

  db.close();
});
