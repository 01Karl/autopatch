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
  day_of_week: string;
  time_hhmm: string;
  enabled: number;
};

const ENV_OPTIONS = ['prod', 'qa', 'dev'] as const;
const DEFAULT_BASE_PATH = 'environments';
const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: '◈' },
  { key: 'get-started', label: 'Get started', icon: '✦' },
  { key: 'machines', label: 'Machines', icon: '🖥' },
  { key: 'history', label: 'History', icon: '🕘' },
  { key: 'update-reports', label: 'Update reports', icon: '📊' },
] as const;

function pct(ok: number, total: number) {
  return total ? ((ok / total) * 100).toFixed(1) : '0.0';
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

function weekdayLabel(day: string) {
  const map: Record<string, string> = { mon: 'Måndag', tue: 'Tisdag', wed: 'Onsdag', thu: 'Torsdag', fri: 'Fredag', sat: 'Lördag', sun: 'Söndag' };
  return map[day] ?? day;
}

function machineStatusText(status: string) {
  if (status.toLowerCase().includes('fail')) return 'Unsupported';
  if (status.toLowerCase().includes('running') || status.toLowerCase().includes('pending')) return 'Pending updates';
  return 'No pending updates';
}

type DashboardSearchParams = { env?: string; view?: string; basePath?: string; resourceType?: string; distribution?: string; platform?: string };

export default function HomePage({ searchParams }: { searchParams?: DashboardSearchParams }) {
  const linuxDistributions = ['Ubuntu', 'Debian', 'RHEL', 'Rocky Linux', 'SUSE Linux Enterprise', 'AlmaLinux'] as const;
  const unixDistributions = ['AIX', 'Solaris'] as const;
  const bsdDistributions = ['FreeBSD 13', 'FreeBSD 14'] as const;

  const selectedEnv = ENV_OPTIONS.includes(searchParams?.env as (typeof ENV_OPTIONS)[number])
    ? (searchParams?.env as (typeof ENV_OPTIONS)[number])
    : 'prod';
  const selectedBasePath = searchParams?.basePath || DEFAULT_BASE_PATH;
  const activeView = NAV_ITEMS.some((item) => item.key === searchParams?.view) ? searchParams?.view || 'overview' : 'overview';
  const selectedResourceType = searchParams?.resourceType || 'all';
  const selectedDistribution = searchParams?.distribution || 'all';
  const selectedPlatform = searchParams?.platform || 'all';

  const runs = db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT 50').all() as RunRow[];
  const schedules = db.prepare('SELECT id,name,env,day_of_week,time_hhmm,enabled FROM schedules ORDER BY id DESC').all() as ScheduleRow[];
  const latestRun = runs[0];
  const envRuns = runs.filter((run) => run.env === selectedEnv);
  const latestEnvRun = envRuns[0];
  const inventory = loadInventorySummary(selectedEnv, selectedBasePath);

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

  const pendingRuns = envRuns.filter((run) => run.status === 'queued' || run.status === 'running').length;
  const completedRuns = envRuns.filter((run) => run.status === 'completed' || run.status === 'OK').length;
  const failedRuns = envRuns.filter((run) => run.status === 'failed' || run.status === 'FAILED').length;
  const envSchedules = schedules.filter((schedule) => schedule.env === selectedEnv);

  const machineRows = inventory.servers.map((server, idx) => {
    const platform = idx % 9 === 0 ? 'FreeBSD' : idx % 7 === 0 ? 'Unix' : 'Linux';
    const distribution =
      platform === 'FreeBSD'
        ? bsdDistributions[idx % bsdDistributions.length]
        : platform === 'Unix'
          ? unixDistributions[idx % unixDistributions.length]
          : linuxDistributions[idx % linuxDistributions.length];

    return {
      name: server.hostname,
      updateStatus: machineStatusText(statusLabel(latestEnvRun?.status ?? 'pending')),
      platform,
      distribution,
      resourceType: server.cluster === 'standalone' ? 'Bare metal server' : 'Virtual machine',
      patchOrchestration: server.cluster === 'standalone' ? 'Native package manager' : 'Agent managed rollout',
      periodicAssessment: idx % 2 === 0 ? 'Yes' : 'No',
      associatedSchedules: envSchedules[0]?.name ?? '-',
      powerState: idx % 4 === 0 ? 'VM running' : 'VM deallocated',
    };
  });

  const resourceTypeOptions = ['all', ...new Set(machineRows.map((row) => row.resourceType))];
  const distributionOptions = ['all', ...new Set(machineRows.map((row) => row.distribution))];
  const platformOptions = ['all', ...new Set(machineRows.map((row) => row.platform))];

  const filteredMachineRows = machineRows.filter((row) => {
    const platformMatch = selectedPlatform === 'all' || row.platform === selectedPlatform;
    const distributionMatch = selectedDistribution === 'all' || row.distribution === selectedDistribution;
    const resourceTypeMatch = selectedResourceType === 'all' || row.resourceType === selectedResourceType;
    return platformMatch && distributionMatch && resourceTypeMatch;
  });

  const csvHeader = 'id,started_at,env,status,ok_count,failed_count,skipped_count,total_targets,success_pct';
  const csvRows = runs.map((run) => [run.id, run.started_at, run.env, run.status, run.ok_count, run.failed_count, run.skipped_count, run.total_targets, run.success_pct].join(','));
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent([csvHeader, ...csvRows].join('\n'))}`;

  const successShare = totals.targets ? (totals.ok / totals.targets) * 100 : 0;
  const failedShare = totals.targets ? (totals.failed / totals.targets) * 100 : 0;
  const donutStyle = { background: `conic-gradient(#2563eb 0 ${successShare}%, #dc2626 ${successShare}% ${successShare + failedShare}%, #d6d3d1 ${successShare + failedShare}% 100%)` };

  return (
    <main className="azure-shell">
      <header className="top-header">
        <div className="brand">OpenPatch Console</div>
        <input className="header-search" placeholder="Search resources, services and docs" />
        <div className="header-user">Connie Wilson · CONTOSO</div>
      </header>

      <div className="shell-layout">
        <aside className="side-nav">
          <input className="side-search" placeholder="Search" />
          <p className="side-title">Navigation</p>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={`/?env=${selectedEnv}&view=${item.key}&basePath=${selectedBasePath}`}
              className={`side-link ${activeView === item.key ? 'active' : ''}`}
            >
              <span className="side-icon">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}

        </aside>

        <section className="main-pane">
          <section className="command-bar">
            <div className="command-left">
              <button className="ghost-btn" type="button">↻ Refresh</button>
              <button className="ghost-btn" type="button">Check for updates</button>
              <button className="ghost-btn" type="button">One-time update</button>
            </div>
            <div className="command-right">
              <a className="ghost-btn" href={csvHref} download="autopatch-runs.csv">Export to CSV</a>
              {latestRun?.report_xlsx && <a className="ghost-btn" href={`/${latestRun.report_xlsx}`}>Export Excel</a>}
            </div>
          </section>

          <section className="tabs-row">
            <span className="tab active">OpenPatch Update Manager</span>
            <span className="tab">Environment: {selectedEnv.toUpperCase()}</span>
            <span className="tab">Inventory: {inventory.inventory_path}</span>
            <span className="tab">Source: {inventory.source ?? 'ansible'}</span>
          </section>

          <section className="content-area space-y-5">
            <div>
              <h1 className="text-3xl font-semibold">OpenPatch Update Manager</h1>
              <p className="mt-1 text-sm text-slate-500">Läser från {selectedBasePath}/{selectedEnv}/inventory via Python-integration.</p>
              {inventory.error && <p className="mt-2 text-sm text-rose-700">Inventory-fel: {inventory.error}</p>}
              {inventory.source === 'fixture' && <p className="mt-2 text-sm text-amber-700">Visar fejkdata från JSON-fixtures för snabb UI-test.</p>}
            </div>

            {activeView === 'overview' && (
              <>
                <div className="kpi-grid">
                  <article className="kpi-card"><p className="kpi-title">Total machines</p><p className="kpi-value">{inventory.server_count}</p></article>
                  <article className="kpi-card"><p className="kpi-title">No updates data</p><p className="kpi-value">{Math.max(inventory.server_count - totals.targets, 0)}</p></article>
                  <article className="kpi-card"><p className="kpi-title">No pending updates</p><p className="kpi-value text-emerald-700">{totals.ok}</p></article>
                  <article className="kpi-card"><p className="kpi-title">Pending updates</p><p className="kpi-value text-amber-700">{pendingRuns}</p></article>
                  <article className="kpi-card"><p className="kpi-title">Unsupported</p><p className="kpi-value text-rose-700">{failedRuns}</p></article>
                </div>

                <section className="panel-grid">
                  <article className="panel-card">
                    <div className="panel-head"><h2>Update status of machines</h2></div>
                    <div className="status-layout">
                      <div className="donut-wrap"><div className="donut" style={donutStyle}><div className="donut-inner"><strong>{inventory.server_count}</strong><span>Machines</span></div></div></div>
                      <div className="stat-list">
                        <p><span>Pending updates</span><strong>{pendingRuns}</strong></p>
                        <p><span>No pending updates</span><strong>{completedRuns}</strong></p>
                        <p><span>Unsupported</span><strong>{failedRuns}</strong></p>
                        <p><span>Compliance rate</span><strong>{pct(totals.ok, totals.targets)}%</strong></p>
                      </div>
                    </div>
                  </article>

                  <article className="panel-card">
                    <div className="panel-head"><h2>Patch installation status</h2><span className="chip">Last 30 days</span></div>
                    <div className="stat-list">
                      <p><span>Total installation runs</span><strong>{envRuns.length}</strong></p>
                      <p><span>Completed</span><strong>{completedRuns}</strong></p>
                      <p><span>Failed</span><strong>{failedRuns}</strong></p>
                      <p><span>In progress</span><strong>{pendingRuns}</strong></p>
                    </div>
                  </article>
                </section>
              </>
            )}

            {activeView === 'get-started' && (
              <section className="table-card p-6 space-y-3">
                <h2 className="text-lg font-semibold">Get started</h2>
                <p className="text-sm text-slate-600">1) Gå till Machines och välj Environment + filter. 2) Kontrollera inventory-sökväg. 3) Starta patch-run eller skapa schema.</p>
                <p className="text-sm text-slate-600">När du klickar Machines visas en komplett maskinlista med patch-status, plattform, distribution, resurstyp och associerade scheman.</p>
              </section>
            )}

            {activeView === 'machines' && (
              <>
                <section className="info-banner">
                  <div>
                    <p className="font-semibold text-slate-800">Install updates now for {inventory.server_count} selected machine(s)</p>
                    <p className="text-xs text-slate-600">There may be newer updates available to choose from. We strongly recommend you assess now prior to installing updates.</p>
                  </div>
                  <div className="flex gap-2"><button className="primary-btn" type="button">Install now</button><button className="ghost-btn" type="button">Cancel</button></div>
                </section>

                <div className="kpi-grid kpi-grid-machines">
                  <article className="kpi-card"><p className="kpi-title">Total machines</p><p className="kpi-value">{inventory.server_count}</p></article>
                  <article className="kpi-card"><p className="kpi-title">No updates data</p><p className="kpi-value">{Math.max(inventory.server_count - totals.targets, 0)}</p></article>
                  <article className="kpi-card"><p className="kpi-title">No pending updates</p><p className="kpi-value text-emerald-700">{totals.ok}</p></article>
                  <article className="kpi-card"><p className="kpi-title">Pending updates</p><p className="kpi-value text-amber-700">{pendingRuns}</p></article>
                  <article className="kpi-card"><p className="kpi-title">Pending reboot</p><p className="kpi-value text-amber-700">{totals.skipped}</p></article>
                  <article className="kpi-card"><p className="kpi-title">Unsupported</p><p className="kpi-value text-rose-700">{failedRuns}</p></article>
                </div>

                <section className="table-card">
                  <div className="table-head"><h2>Machines</h2><span className="chip">Showing {filteredMachineRows.length} rows</span></div>
                  <form className="p-4 border-b border-slate-200 grid gap-3 md:grid-cols-2 lg:grid-cols-4" method="get">
                    <input type="hidden" name="view" value={activeView} />
                    <input type="hidden" name="basePath" value={selectedBasePath} />

                    <label className="text-xs text-slate-500">Environment
                      <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm" name="env" defaultValue={selectedEnv}>
                        {ENV_OPTIONS.map((env) => (
                          <option key={env} value={env}>{env.toUpperCase()}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-slate-500">Platform
                      <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm" name="platform" defaultValue={selectedPlatform}>
                        {platformOptions.map((option) => (
                          <option key={option} value={option}>{option === 'all' ? 'All platforms' : option}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-slate-500">Distribution
                      <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm" name="distribution" defaultValue={selectedDistribution}>
                        {distributionOptions.map((option) => (
                          <option key={option} value={option}>{option === 'all' ? 'All distributions' : option}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-slate-500">Resource type
                      <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm" name="resourceType" defaultValue={selectedResourceType}>
                        {resourceTypeOptions.map((option) => (
                          <option key={option} value={option}>{option === 'all' ? 'All resource types' : option}</option>
                        ))}
                      </select>
                    </label>
                    <div className="md:col-span-2 lg:col-span-4 flex gap-2">
                      <button className="primary-btn" type="submit">Apply filters</button>
                      <a className="ghost-btn" href={`/?env=${selectedEnv}&view=${activeView}&basePath=${selectedBasePath}`}>Reset filters</a>
                    </div>
                  </form>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th>Name</th><th>Update status</th><th>Platform</th><th>Distribution</th><th>Resource type</th><th>Patch orchestration</th><th>Periodic assessment</th><th>Associated schedules</th><th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMachineRows.map((row) => (
                          <tr key={row.name}>
                            <td><a className="link" href={`/machines/${encodeURIComponent(row.name)}?env=${selectedEnv}&basePath=${selectedBasePath}`}>{row.name}</a></td><td>{row.updateStatus}</td><td>{row.platform}</td><td>{row.distribution}</td><td>{row.resourceType}</td><td>{row.patchOrchestration}</td><td>{row.periodicAssessment}</td><td>{row.associatedSchedules}</td><td>{row.powerState}</td>
                          </tr>
                        ))}
                        {filteredMachineRows.length === 0 && <tr><td colSpan={9} className="text-slate-500">No machines found with selected filters.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {activeView === 'history' && (
              <section className="table-card">
                <div className="table-head"><h2>Update run history</h2></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr><th>ID</th><th>Start</th><th>Env</th><th>Status</th><th>Success</th><th>Reports</th></tr></thead>
                    <tbody>
                      {envRuns.map((run) => (
                        <tr key={run.id}>
                          <td>#{run.id}</td><td>{run.started_at}</td><td>{run.env}</td><td>{statusLabel(run.status)}</td><td>{run.success_pct}%</td>
                          <td className="space-x-2">{run.report_json && <a className="link" href={`/${run.report_json}`}>JSON</a>}{run.report_xlsx && <a className="link" href={`/${run.report_xlsx}`}>XLSX</a>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeView === 'update-reports' && (
              <section className="panel-grid">
                <article className="table-card">
                  <div className="table-head"><h2>Cluster summary</h2></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr><th>Cluster</th><th>Nodes</th><th>Env</th></tr></thead>
                      <tbody>
                        {inventory.clusters.map((cluster) => (
                          <tr key={cluster.name}><td>{cluster.name}</td><td>{cluster.nodes}</td><td>{selectedEnv}</td></tr>
                        ))}
                        {inventory.clusters.length === 0 && <tr><td colSpan={3} className="text-slate-500">No cluster groups found (*_cluster).</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="table-card p-4 space-y-2">
                  <h2 className="text-sm font-semibold">Schedules in {selectedEnv.toUpperCase()}</h2>
                  {envSchedules.map((s) => (
                    <p className="text-sm" key={s.id}>{s.name} · {weekdayLabel(s.day_of_week)} {s.time_hhmm} · {s.enabled ? 'Enabled' : 'Disabled'}</p>
                  ))}
                  {envSchedules.length === 0 && <p className="text-sm text-slate-500">No schedules configured yet.</p>}
                </article>
              </section>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
