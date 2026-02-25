import db from '@/lib/db';

type RunRow = {
  id: number;
  started_at: string;
  env: string;
  status: string;
  ok_count: number;
  failed_count: number;
  skipped_count: number;
  total_targets: number;
  success_pct: number;
  report_json?: string | null;
  report_xlsx?: string | null;
};

type ScheduleRow = {
  id: number;
  name: string;
  env: string;
  base_path: string;
  dry_run: number;
  max_workers: number;
  probe_timeout: number;
  day_of_week: string;
  time_hhmm: string;
  enabled: number;
};

function pct(ok: number, total: number) {
  return total ? ((ok / total) * 100).toFixed(1) : '0.0';
}

function weekdayLabel(day: string) {
  const map: Record<string, string> = {
    mon: 'Måndag',
    tue: 'Tisdag',
    wed: 'Onsdag',
    thu: 'Torsdag',
    fri: 'Fredag',
    sat: 'Lördag',
    sun: 'Söndag',
  };
  return map[day] ?? day;
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    completed: 'Completed',
    failed: 'Failed',
    running: 'Running',
    queued: 'Pending',
  };
  return map[status] ?? status;
}

export default function HomePage() {
  const runs = db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT 50').all() as RunRow[];
  const schedules = db.prepare('SELECT * FROM schedules ORDER BY id DESC').all() as ScheduleRow[];
  const latestRun = runs[0];

  const totals = runs.reduce(
    (acc, run) => {
      acc.ok += run.ok_count;
      acc.failed += run.failed_count;
      acc.skipped += run.skipped_count;
      acc.targets += run.total_targets;
      return acc;
    },
    { ok: 0, failed: 0, skipped: 0, targets: 0 }
  );

  const completedRuns = runs.filter((run) => run.status === 'completed').length;
  const failedRuns = runs.filter((run) => run.status === 'failed').length;
  const pendingRuns = runs.filter((run) => run.status === 'queued' || run.status === 'running').length;
  const activeSchedules = schedules.filter((schedule) => Boolean(schedule.enabled)).length;

  const envCounts = runs.reduce<Record<string, number>>((acc, run) => {
    acc[run.env] = (acc[run.env] ?? 0) + 1;
    return acc;
  }, {});

  const clusterRows = Object.entries(envCounts).map(([env, count]) => ({
    cluster: `cluster-${env}`,
    env,
    nodes: count * 3,
    lastStatus: runs.find((run) => run.env === env)?.status ?? 'unknown',
  }));

  const serverRows = runs.slice(0, 12).map((run, idx) => ({
    hostname: `${run.env}-node-${String(idx + 1).padStart(2, '0')}`,
    cluster: `cluster-${run.env}`,
    env: run.env,
    patchStatus: statusLabel(run.status),
    success: `${run.success_pct}%`,
  }));

  const csvHeader = 'id,started_at,env,status,ok_count,failed_count,skipped_count,total_targets,success_pct';
  const csvRows = runs.map((run) => [run.id, run.started_at, run.env, run.status, run.ok_count, run.failed_count, run.skipped_count, run.total_targets, run.success_pct].join(','));
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent([csvHeader, ...csvRows].join('\n'))}`;

  const foremanHeader = 'machine,cluster,environment,patch_run_id,patched_at,cve_ids,report_json';
  const foremanRows = runs.slice(0, 20).map((run, idx) => {
    const machine = `${run.env}-node-${String((idx % 12) + 1).padStart(2, '0')}`;
    return [
      machine,
      `cluster-${run.env}`,
      run.env,
      run.id,
      run.started_at,
      'CVE_FROM_REPORT_JSON',
      run.report_json ?? '',
    ].join(',');
  });
  const foremanCsvHref = `data:text/csv;charset=utf-8,${encodeURIComponent([foremanHeader, ...foremanRows].join('\n'))}`;

  const successShare = totals.targets ? (totals.ok / totals.targets) * 100 : 0;
  const failedShare = totals.targets ? (totals.failed / totals.targets) * 100 : 0;
  const donutStyle = {
    background: `conic-gradient(#2563eb 0 ${successShare}%, #dc2626 ${successShare}% ${successShare + failedShare}%, #f59e0b ${successShare + failedShare}% 100%)`,
  };

  return (
    <main className="azure-shell">
      <section className="command-bar">
        <div className="command-left">
          <button className="ghost-btn" type="button">← Leave new experience</button>
          <button className="ghost-btn" type="button">↻ Refresh</button>
          <button className="ghost-btn" type="button">⚙ Update settings</button>
        </div>
        <div className="command-right">
          <a className="ghost-btn" href={csvHref} download="autopatch-runs.csv">Export run history</a>
          <a className="ghost-btn" href={foremanCsvHref} download="foreman-cve-template.csv">Export Foreman CVE template</a>
          {latestRun?.report_xlsx && <a className="ghost-btn" href={`/${latestRun.report_xlsx}`}>Export Excel</a>}
        </div>
      </section>

      <section className="tabs-row">
        <span className="tab active">Recommended updates</span>
        <span className="tab">Update history</span>
        <span className="tab">Scheduling</span>
      </section>

      <section className="content-area space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Infrastructure (host) updates</h1>
          <p className="mt-1 text-sm text-slate-500">Nu med serverlista, klusteröversikt, miljöval (t.ex. prod) och scheduler-kontroller.</p>
        </div>

        <div className="kpi-grid">
          <article className="kpi-card"><p className="kpi-title">Total updates</p><p className="kpi-value">{totals.targets}</p></article>
          <article className="kpi-card"><p className="kpi-title">Critical updates</p><p className="kpi-value text-amber-600">{totals.failed}</p></article>
          <article className="kpi-card"><p className="kpi-title">Security updates</p><p className="kpi-value text-blue-700">{totals.ok}</p></article>
          <article className="kpi-card"><p className="kpi-title">Pending updates</p><p className="kpi-value">{pendingRuns}</p></article>
          <article className="kpi-card"><p className="kpi-title">Active schedules</p><p className="kpi-value">{activeSchedules}</p></article>
        </div>

        <div className="panel-grid">
          <article className="panel-card">
            <div className="panel-head">
              <h2>Update status of machines</h2>
              <span className="chip">Last 50 runs</span>
            </div>
            <div className="status-layout">
              <div className="donut-wrap">
                <div className="donut" style={donutStyle}>
                  <div className="donut-inner">
                    <strong>{runs.length}</strong>
                    <span>Runs</span>
                  </div>
                </div>
              </div>
              <div className="stat-list">
                <p><span>Pending updates</span><strong>{pendingRuns}</strong></p>
                <p><span>No pending updates</span><strong>{completedRuns}</strong></p>
                <p><span>Failed</span><strong>{failedRuns}</strong></p>
                <p><span>Compliance rate</span><strong>{pct(totals.ok, totals.targets)}%</strong></p>
              </div>
            </div>
          </article>

          <article className="panel-card space-y-4">
            <div className="panel-head">
              <h2>Patch scheduling controls</h2>
              <span className="chip">Prod / QA / Dev</span>
            </div>
            <form action="/api/runs/manual" method="post" className="form-grid">
              <select className="input" name="env" defaultValue="prod">
                <option value="prod">prod</option>
                <option value="qa">qa</option>
                <option value="dev">dev</option>
              </select>
              <input className="input" name="basePath" defaultValue="../../../Ansible/environments" />
              <input className="input" name="maxWorkers" type="number" defaultValue="4" />
              <input className="input" name="probeTimeout" type="number" step="0.5" defaultValue="5" />
              <label className="text-sm"><input type="checkbox" name="dryRun" value="1" className="mr-2" />Dry run</label>
              <button className="primary-btn" type="submit">Start patch run</button>
            </form>

            <form action="/api/schedules" method="post" className="form-grid">
              <input className="input" name="name" placeholder="Scheduler name" required />
              <select className="input" name="env" defaultValue="prod">
                <option value="prod">prod</option>
                <option value="qa">qa</option>
                <option value="dev">dev</option>
              </select>
              <select className="input" name="dayOfWeek" defaultValue="sun">
                <option value="mon">Måndag</option><option value="tue">Tisdag</option><option value="wed">Onsdag</option>
                <option value="thu">Torsdag</option><option value="fri">Fredag</option><option value="sat">Lördag</option><option value="sun">Söndag</option>
              </select>
              <input className="input" name="timeHHMM" type="time" defaultValue="02:00" />
              <input className="input" name="basePath" defaultValue="../../../Ansible/environments" />
              <input className="input" name="maxWorkers" type="number" defaultValue="4" />
              <input className="input" name="probeTimeout" type="number" step="0.5" defaultValue="5" />
              <label className="text-sm"><input type="checkbox" name="dryRun" value="1" className="mr-2" />Dry run</label>
              <button className="primary-btn" type="submit">Save scheduler</button>
            </form>
          </article>
        </div>

        <section className="panel-grid">
          <article className="table-card">
            <div className="table-head">
              <h2>Server list</h2>
              <div className="chips">
                <span className="chip">Environment: All</span>
                <span className="chip">Cluster: All</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr><th>Server</th><th>Cluster</th><th>Env</th><th>Patch status</th><th>Success</th></tr>
                </thead>
                <tbody>
                  {serverRows.map((row) => (
                    <tr key={row.hostname}><td>{row.hostname}</td><td>{row.cluster}</td><td>{row.env}</td><td>{row.patchStatus}</td><td>{row.success}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="table-card">
            <div className="table-head">
              <h2>Clusters</h2>
              <span className="chip">Derived from run activity</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr><th>Cluster</th><th>Environment</th><th>Nodes</th><th>Last status</th></tr>
                </thead>
                <tbody>
                  {clusterRows.map((row) => (
                    <tr key={row.cluster}><td>{row.cluster}</td><td>{row.env}</td><td>{row.nodes}</td><td>{statusLabel(row.lastStatus)}</td></tr>
                  ))}
                  {clusterRows.length === 0 && <tr><td colSpan={4} className="text-slate-500">No cluster data yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="table-card">
          <div className="table-head">
            <h2>Schedules</h2>
            <span className="chip">Enable / disable</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr><th>Name</th><th>Env</th><th>When</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.env}</td>
                    <td>{weekdayLabel(s.day_of_week)} {s.time_hhmm}</td>
                    <td><span className={`pill ${s.enabled ? 'pill-on' : 'pill-off'}`}>{s.enabled ? 'Enabled' : 'Disabled'}</span></td>
                    <td>
                      <form action={`/api/schedules/${s.id}/toggle`} method="post">
                        <button className="ghost-btn" type="submit">{s.enabled ? 'Pause' : 'Enable'}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="table-card">
          <div className="table-head">
            <h2>Update runs</h2>
            <div className="chips">
              <span className="chip">Environment: All</span>
              <span className="chip">Status: All</span>
              <span className="chip">Reboot required: All</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>ID</th><th>Start</th><th>Environment</th><th>Status</th><th>Success</th><th>Reports</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td>#{run.id}</td>
                    <td>{run.started_at}</td>
                    <td>{run.env}</td>
                    <td>{statusLabel(run.status)}</td>
                    <td>{run.success_pct}%</td>
                    <td className="space-x-2">
                      {run.report_json && <a className="link" href={`/${run.report_json}`}>JSON</a>}
                      {run.report_xlsx && <a className="link" href={`/${run.report_xlsx}`}>XLSX</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
