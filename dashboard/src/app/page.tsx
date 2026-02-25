import db from '@/lib/db';
import { loadInventorySummary } from '@/lib/inventory';

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

const ENV_OPTIONS = ['prod', 'qa', 'dev'] as const;
const DEFAULT_BASE_PATH = 'environments';

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
    OK: 'Completed',
    FAILED: 'Failed',
  };
  return map[status] ?? status;
}

function statusTone(status: string) {
  if (status.toLowerCase().includes('fail')) return 'text-rose-700';
  if (status.toLowerCase().includes('running') || status.toLowerCase().includes('pending')) return 'text-amber-700';
  return 'text-emerald-700';
}

export default function HomePage({
  searchParams,
}: {
  searchParams?: { env?: string; view?: string; basePath?: string };
}) {
  const selectedEnv = ENV_OPTIONS.includes(searchParams?.env as (typeof ENV_OPTIONS)[number])
    ? (searchParams?.env as (typeof ENV_OPTIONS)[number])
    : 'prod';
  const activeView = searchParams?.view ?? 'overview';
  const selectedBasePath = searchParams?.basePath || DEFAULT_BASE_PATH;

  const runs = db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT 50').all() as RunRow[];
  const schedules = db.prepare('SELECT * FROM schedules ORDER BY id DESC').all() as ScheduleRow[];
  const latestRun = runs[0];
  const envRuns = runs.filter((run) => run.env === selectedEnv);
  const latestEnvRun = envRuns[0];

  const totals = envRuns.reduce(
    (acc, run) => {
      acc.ok += run.ok_count;
      acc.failed += run.failed_count;
      acc.skipped += run.skipped_count;
      acc.targets += run.total_targets;
      return acc;
    },
    { ok: 0, failed: 0, skipped: 0, targets: 0 }
  );

  const completedRuns = envRuns.filter((run) => run.status === 'completed' || run.status === 'OK').length;
  const failedRuns = envRuns.filter((run) => run.status === 'failed' || run.status === 'FAILED').length;
  const pendingRuns = envRuns.filter((run) => run.status === 'queued' || run.status === 'running').length;
  const activeSchedules = schedules.filter((schedule) => Boolean(schedule.enabled) && schedule.env === selectedEnv).length;

  const inventory = loadInventorySummary(selectedEnv, selectedBasePath);

  const clusterRows = inventory.clusters.map((cluster) => ({
    cluster: cluster.name,
    env: selectedEnv,
    nodes: cluster.nodes,
    lastStatus: latestEnvRun?.status ?? 'unknown',
  }));

  const serverRows = inventory.servers.map((server) => ({
    hostname: server.hostname,
    cluster: server.cluster,
    env: server.env,
    patchStatus: statusLabel(latestEnvRun?.status ?? 'Pending'),
    success: `${latestEnvRun?.success_pct ?? 0}%`,
  }));

  const csvHeader = 'id,started_at,env,status,ok_count,failed_count,skipped_count,total_targets,success_pct';
  const csvRows = runs.map((run) => [run.id, run.started_at, run.env, run.status, run.ok_count, run.failed_count, run.skipped_count, run.total_targets, run.success_pct].join(','));
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent([csvHeader, ...csvRows].join('\n'))}`;

  const foremanHeader = 'machine,cluster,environment,patch_run_id,patched_at,cve_ids,report_json';
  const foremanRows = serverRows.slice(0, 50).map((server) => {
    return [
      server.hostname,
      server.cluster,
      server.env,
      latestEnvRun?.id ?? '',
      latestEnvRun?.started_at ?? '',
      'CVE_FROM_REPORT_JSON',
      latestEnvRun?.report_json ?? '',
    ].join(',');
  });
  const foremanCsvHref = `data:text/csv;charset=utf-8,${encodeURIComponent([foremanHeader, ...foremanRows].join('\n'))}`;

  const successShare = totals.targets ? (totals.ok / totals.targets) * 100 : 0;
  const failedShare = totals.targets ? (totals.failed / totals.targets) * 100 : 0;
  const donutStyle = {
    background: `conic-gradient(#16a34a 0 ${successShare}%, #dc2626 ${successShare}% ${successShare + failedShare}%, #f59e0b ${successShare + failedShare}% 100%)`,
  };

  return (
    <main className="azure-shell">
      <header className="top-header">
        <div className="brand">AutoPatch Portal</div>
        <input className="header-search" placeholder="Search resources, servers or clusters" />
        <div className="header-user">Connie Wilson · CONTOSO</div>
      </header>

      <div className="shell-layout">
        <aside className="side-nav">
          <p className="side-title">Navigation</p>
          <a href={`/?env=${selectedEnv}&view=overview&basePath=${selectedBasePath}`} className={`side-link ${activeView === 'overview' ? 'active' : ''}`}>Overview</a>
          <a href={`/?env=${selectedEnv}&view=inventory&basePath=${selectedBasePath}`} className={`side-link ${activeView === 'inventory' ? 'active' : ''}`}>Inventory</a>
          <a href={`/?env=${selectedEnv}&view=schedules&basePath=${selectedBasePath}`} className={`side-link ${activeView === 'schedules' ? 'active' : ''}`}>Scheduling</a>
          <a href={`/?env=${selectedEnv}&view=runs&basePath=${selectedBasePath}`} className={`side-link ${activeView === 'runs' ? 'active' : ''}`}>Run history</a>

          <p className="side-title mt-6">Miljöer</p>
          {ENV_OPTIONS.map((env) => (
            <a key={env} href={`/?env=${env}&view=${activeView}&basePath=${selectedBasePath}`} className={`side-link ${selectedEnv === env ? 'active' : ''}`}>
              {env.toUpperCase()}
            </a>
          ))}
        </aside>

        <section className="main-pane">
          <section className="command-bar">
            <div className="command-left">
              <button className="ghost-btn" type="button">↻ Refresh</button>
              <a className="ghost-btn" href={`/?env=${selectedEnv}&view=${activeView}&basePath=${selectedBasePath}`}>Sync view</a>
            </div>
            <div className="command-right">
              <a className="ghost-btn" href={csvHref} download="autopatch-runs.csv">Export run history</a>
              <a className="ghost-btn" href={foremanCsvHref} download="foreman-cve-template.csv">Export Foreman CVE template</a>
              {latestRun?.report_xlsx && <a className="ghost-btn" href={`/${latestRun.report_xlsx}`}>Export Excel</a>}
            </div>
          </section>

          <section className="tabs-row">
            <span className="tab active">Environment: {selectedEnv.toUpperCase()}</span>
            <span className="tab">Inventory: {inventory.inventory_path}</span>
            <span className="tab">Servers: {inventory.server_count}</span>
          </section>

          <section className="content-area space-y-5">
            <div>
              <h1 className="text-2xl font-semibold">Infrastructure (host) updates</h1>
              <p className="mt-1 text-sm text-slate-500">
                Läser inventory från <code>{selectedBasePath}/{selectedEnv}/inventory</code> via Python-scriptet och visar servrar + kluster.
              </p>
              {inventory.error && <p className="mt-2 text-sm text-rose-700">Inventory-fel: {inventory.error}</p>}
            </div>

            {(activeView === 'overview' || activeView === 'inventory') && (
              <div className="kpi-grid">
                <article className="kpi-card"><p className="kpi-title">Total targets</p><p className="kpi-value">{totals.targets}</p></article>
                <article className="kpi-card"><p className="kpi-title">Failed updates</p><p className="kpi-value text-amber-600">{totals.failed}</p></article>
                <article className="kpi-card"><p className="kpi-title">Successful updates</p><p className="kpi-value text-blue-700">{totals.ok}</p></article>
                <article className="kpi-card"><p className="kpi-title">Pending runs</p><p className="kpi-value">{pendingRuns}</p></article>
                <article className="kpi-card"><p className="kpi-title">Active schedules</p><p className="kpi-value">{activeSchedules}</p></article>
              </div>
            )}

            {(activeView === 'overview' || activeView === 'inventory') && (
              <div className="panel-grid">
                <article className="panel-card">
                  <div className="panel-head">
                    <h2>Update status</h2>
                    <span className="chip">Latest env run</span>
                  </div>
                  <div className="status-layout">
                    <div className="donut-wrap">
                      <div className="donut" style={donutStyle}>
                        <div className="donut-inner">
                          <strong>{envRuns.length}</strong>
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
                    <select className="input" name="env" defaultValue={selectedEnv}>
                      {ENV_OPTIONS.map((env) => <option key={env} value={env}>{env}</option>)}
                    </select>
                    <input className="input" name="basePath" defaultValue={selectedBasePath} />
                    <input className="input" name="maxWorkers" type="number" defaultValue="4" />
                    <input className="input" name="probeTimeout" type="number" step="0.5" defaultValue="5" />
                    <label className="text-sm"><input type="checkbox" name="dryRun" value="1" className="mr-2" />Dry run</label>
                    <button className="primary-btn" type="submit">Start patch run</button>
                  </form>

                  <form action="/api/schedules" method="post" className="form-grid">
                    <input className="input" name="name" placeholder="Scheduler name" required />
                    <select className="input" name="env" defaultValue={selectedEnv}>
                      {ENV_OPTIONS.map((env) => <option key={env} value={env}>{env}</option>)}
                    </select>
                    <select className="input" name="dayOfWeek" defaultValue="sun">
                      <option value="mon">Måndag</option><option value="tue">Tisdag</option><option value="wed">Onsdag</option>
                      <option value="thu">Torsdag</option><option value="fri">Fredag</option><option value="sat">Lördag</option><option value="sun">Söndag</option>
                    </select>
                    <input className="input" name="timeHHMM" type="time" defaultValue="02:00" />
                    <input className="input" name="basePath" defaultValue={selectedBasePath} />
                    <input className="input" name="maxWorkers" type="number" defaultValue="4" />
                    <input className="input" name="probeTimeout" type="number" step="0.5" defaultValue="5" />
                    <label className="text-sm"><input type="checkbox" name="dryRun" value="1" className="mr-2" />Dry run</label>
                    <button className="primary-btn" type="submit">Save scheduler</button>
                  </form>
                </article>
              </div>
            )}

            {(activeView === 'overview' || activeView === 'inventory') && (
              <section className="panel-grid">
                <article className="table-card">
                  <div className="table-head">
                    <h2>Server list</h2>
                    <div className="chips">
                      <span className="chip">Environment: {selectedEnv}</span>
                      <span className="chip">From inventory</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr><th>Server</th><th>Cluster</th><th>Env</th><th>Patch status</th><th>Success</th></tr>
                      </thead>
                      <tbody>
                        {serverRows.map((row) => (
                          <tr key={row.hostname}><td>{row.hostname}</td><td>{row.cluster}</td><td>{row.env}</td><td className={statusTone(row.patchStatus)}>{row.patchStatus}</td><td>{row.success}</td></tr>
                        ))}
                        {serverRows.length === 0 && <tr><td colSpan={5} className="text-slate-500">No inventory data found for {selectedEnv}.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="table-card">
                  <div className="table-head">
                    <h2>Clusters</h2>
                    <span className="chip">Derived from inventory groups (*_cluster)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr><th>Cluster</th><th>Environment</th><th>Nodes</th><th>Last status</th></tr>
                      </thead>
                      <tbody>
                        {clusterRows.map((row) => (
                          <tr key={row.cluster}><td>{row.cluster}</td><td>{row.env}</td><td>{row.nodes}</td><td className={statusTone(row.lastStatus)}>{statusLabel(row.lastStatus)}</td></tr>
                        ))}
                        {clusterRows.length === 0 && <tr><td colSpan={4} className="text-slate-500">No cluster data yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </article>
              </section>
            )}

            {(activeView === 'overview' || activeView === 'schedules') && (
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
                      {schedules.filter((s) => s.env === selectedEnv).map((s) => (
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
            )}

            {(activeView === 'overview' || activeView === 'runs') && (
              <section className="table-card">
                <div className="table-head">
                  <h2>Update runs</h2>
                  <div className="chips">
                    <span className="chip">Environment: {selectedEnv}</span>
                    <span className="chip">Status: All</span>
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
                      {runs.filter((run) => run.env === selectedEnv).map((run) => (
                        <tr key={run.id}>
                          <td>#{run.id}</td>
                          <td>{run.started_at}</td>
                          <td>{run.env}</td>
                          <td className={statusTone(run.status)}>{statusLabel(run.status)}</td>
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
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
