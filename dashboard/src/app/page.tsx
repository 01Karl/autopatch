import db from '@/lib/db';

function pct(ok: number, total: number) {
  return total ? ((ok / total) * 100).toFixed(1) : '0.0';
}

export default function HomePage() {
  const runs = db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT 30').all() as any[];
  const schedules = db.prepare('SELECT * FROM schedules ORDER BY id DESC').all() as any[];

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

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Autopatch Dashboard</h1>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-slate-500">Success %</p><p className="text-2xl font-semibold">{pct(totals.ok, totals.targets)}%</p></div>
        <div className="card"><p className="text-sm text-slate-500">OK</p><p className="text-2xl font-semibold">{totals.ok}</p></div>
        <div className="card"><p className="text-sm text-slate-500">FAILED</p><p className="text-2xl font-semibold">{totals.failed}</p></div>
        <div className="card"><p className="text-sm text-slate-500">SKIPPED</p><p className="text-2xl font-semibold">{totals.skipped}</p></div>
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
                    <td className="py-2">{s.name}</td><td>{s.day_of_week} {s.time_hhmm}</td><td>{s.enabled ? 'Aktiv' : 'Pausad'}</td>
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
