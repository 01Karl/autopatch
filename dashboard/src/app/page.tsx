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
    mon: 'Mån',
    tue: 'Tis',
    wed: 'Ons',
    thu: 'Tor',
    fri: 'Fre',
    sat: 'Lör',
    sun: 'Sön',
  };
  return map[day] ?? day;
}

export default function HomePage() {
  const runs = db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT 30').all() as RunRow[];
  const schedules = db.prepare('SELECT * FROM schedules ORDER BY id DESC').all() as ScheduleRow[];

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
  const activeSchedules = schedules.filter((schedule) => Boolean(schedule.enabled)).length;
  const latestRun = runs[0];

  const recentRuns = [...runs].reverse();
  const exportRows = runs.map((run) => ({
    id: run.id,
    started_at: run.started_at,
    env: run.env,
    status: run.status,
    ok_count: run.ok_count,
    failed_count: run.failed_count,
    skipped_count: run.skipped_count,
    total_targets: run.total_targets,
    success_pct: run.success_pct,
  }));
  const csv = [
    Object.keys(exportRows[0] ?? { id: '', started_at: '', env: '', status: '', ok_count: '', failed_count: '', skipped_count: '', total_targets: '', success_pct: '' }).join(','),
    ...exportRows.map((row) => Object.values(row).join(',')),
  ].join('\n');
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <header className="hero-card">
        <div>
          <p className="text-sm font-medium text-blue-700">Operations center</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Autopatch Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Modern överblick av patch-status, scheman och rapporter på ett ställe.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn" href={csvHref} download="autopatch-runs.csv">Exportera historik (CSV)</a>
          {latestRun?.report_xlsx && (
            <a className="btn btn-secondary" href={`/${latestRun.report_xlsx}`}>Ladda ner senaste Excel</a>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <div className="card stat-card"><p className="stat-label">Success %</p><p className="stat-value">{pct(totals.ok, totals.targets)}%</p></div>
        <div className="card stat-card"><p className="stat-label">Totalt targets</p><p className="stat-value">{totals.targets}</p></div>
        <div className="card stat-card"><p className="stat-label">OK</p><p className="stat-value">{totals.ok}</p></div>
        <div className="card stat-card"><p className="stat-label">Failed</p><p className="stat-value">{totals.failed}</p></div>
        <div className="card stat-card"><p className="stat-label">Körningar (30)</p><p className="stat-value">{runs.length}</p><p className="stat-sub">Klara: {completedRuns} • Misslyckade: {failedRuns}</p></div>
        <div className="card stat-card"><p className="stat-label">Aktiva scheman</p><p className="stat-value">{activeSchedules}</p><p className="stat-sub">Totalt: {schedules.length}</p></div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="font-semibold">Resultattrend (senaste 30 körningar)</h2>
          <div className="space-y-2">
            {recentRuns.length === 0 && <p className="text-sm text-slate-500">Ingen körhistorik än.</p>}
            {recentRuns.map((run) => {
              const value = Math.max(0, Math.min(100, Number(run.success_pct) || 0));
              return (
                <div key={run.id}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>#{run.id} • {run.env}</span>
                    <span>{value.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${value}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold">Fördelning targets</h2>
          <div className="grid gap-3">
            {[
              { label: 'OK', value: totals.ok, color: 'bg-emerald-500' },
              { label: 'Failed', value: totals.failed, color: 'bg-rose-500' },
              { label: 'Skipped', value: totals.skipped, color: 'bg-amber-500' },
            ].map((item) => {
              const share = totals.targets ? (item.value / totals.targets) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="text-slate-500">{item.value} ({share.toFixed(1)}%)</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-200">
                    <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${share}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <h2 className="font-semibold">Kör autopatch manuellt</h2>
          <form action="/api/runs/manual" method="post" className="grid gap-2">
            <input className="input" name="env" placeholder="env" defaultValue="qa" />
            <input className="input" name="basePath" placeholder="base path" defaultValue="../../../Ansible/environments" />
            <label className="text-sm"><input type="checkbox" name="dryRun" value="1" className="mr-2" />Dry-run</label>
            <input className="input" name="maxWorkers" type="number" defaultValue="2" />
            <input className="input" name="probeTimeout" type="number" step="0.5" defaultValue="5" />
            <button className="btn" type="submit">Starta körning</button>
          </form>

          <h2 className="font-semibold pt-2">Boka patch-fönster</h2>
          <form action="/api/schedules" method="post" className="grid gap-2">
            <input className="input" name="name" placeholder="Namn" required />
            <input className="input" name="env" defaultValue="qa" />
            <input className="input" name="basePath" defaultValue="../../../Ansible/environments" />
            <label className="text-sm"><input type="checkbox" name="dryRun" value="1" className="mr-2" />Dry-run</label>
            <input className="input" name="maxWorkers" type="number" defaultValue="2" />
            <input className="input" name="probeTimeout" type="number" step="0.5" defaultValue="5" />
            <select className="input" name="dayOfWeek" defaultValue="sun">
              <option value="mon">Måndag</option><option value="tue">Tisdag</option><option value="wed">Onsdag</option>
              <option value="thu">Torsdag</option><option value="fri">Fredag</option><option value="sat">Lördag</option><option value="sun">Söndag</option>
            </select>
            <input className="input" name="timeHHMM" type="time" defaultValue="02:00" />
            <button className="btn" type="submit">Spara schema</button>
          </form>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">Scheman</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th>Namn</th><th>När</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-b">
                    <td className="py-2">{s.name}</td><td>{weekdayLabel(s.day_of_week)} {s.time_hhmm}</td><td>{s.enabled ? 'Aktiv' : 'Pausad'}</td>
                    <td>
                      <form action={`/api/schedules/${s.id}/toggle`} method="post">
                        <button className="btn" type="submit">{s.enabled ? 'Pausa' : 'Aktivera'}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-semibold pt-2">Körhistorik</h2>
          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th>Start</th><th>Env</th><th>Status</th><th>Success%</th><th>Rapport</th></tr></thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2">{r.started_at}</td>
                    <td>{r.env}</td>
                    <td>{r.status}</td>
                    <td>{r.success_pct}</td>
                    <td className="space-x-2">
                      {r.report_json && <a className="text-blue-700 underline" href={`/${r.report_json}`}>json</a>}
                      {r.report_xlsx && <a className="text-blue-700 underline" href={`/${r.report_xlsx}`}>xlsx</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
