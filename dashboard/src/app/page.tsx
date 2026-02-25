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

  const csvHeader = 'id,started_at,env,status,ok_count,failed_count,skipped_count,total_targets,success_pct';
  const csvRows = runs.map((run) => [run.id, run.started_at, run.env, run.status, run.ok_count, run.failed_count, run.skipped_count, run.total_targets, run.success_pct].join(','));
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent([csvHeader, ...csvRows].join('\n'))}`;

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
          <a className="ghost-btn" href={csvHref} download="autopatch-runs.csv">Export CSV</a>
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
          <p className="mt-1 text-sm text-slate-500">Patch-översikt för miljöer, körningar och schemaorkestrering.</p>
        </div>

        <div className="kpi-grid">
          <article className="kpi-card"><p className="kpi-title">Total updates</p><p className="kpi-value">{totals.targets}</p></article>
          <article className="kpi-card"><p className="kpi-title">Critical updates</p><p className="kpi-value text-amber-600">{totals.failed}</p></article>
          <article className="kpi-card"><p className="kpi-title">Security updates</p><p className="kpi-value text-blue-700">{totals.ok}</p></article>
          <article className="kpi-card"><p className="kpi-title">Other updates</p><p className="kpi-value">{totals.skipped}</p></article>
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

          <article className="panel-card">
            <div className="panel-head">
              <h2>Patch orchestration</h2>
              <span className="chip">Schedules</span>
            </div>
            <div className="space-y-3">
              {schedules.slice(0, 6).map((schedule) => (
                <div className="schedule-row" key={schedule.id}>
                  <div>
                    <p className="font-medium">{schedule.name}</p>
                    <p className="text-xs text-slate-500">{weekdayLabel(schedule.day_of_week)} {schedule.time_hhmm}</p>
                  </div>
                  <span className={`pill ${schedule.enabled ? 'pill-on' : 'pill-off'}`}>{schedule.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              ))}
              {schedules.length === 0 && <p className="text-sm text-slate-500">Inga scheman skapade ännu.</p>}
            </div>
          </article>
        </div>

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
                  <th>ID</th>
                  <th>Start</th>
                  <th>Environment</th>
                  <th>Status</th>
                  <th>Success</th>
                  <th>Reports</th>
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
