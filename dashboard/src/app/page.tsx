import db from '@/lib/db';
import { loadInventorySummary, type InventorySummary } from '@/lib/inventory';
import type { IconType } from 'react-icons';
import { FiBarChart2, FiClock, FiHome, FiMonitor, FiPlayCircle, FiRefreshCw, FiServer } from 'react-icons/fi';

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

type NavKey = 'overview' | 'get-started' | 'machines' | 'history' | 'update-reports';

type NavItem = {
  key: NavKey;
  label: string;
  icon: IconType;
};

type MachineRow = {
  name: string;
  env: string;
  cluster: string;
  updateStatus: string;
  platform: string;
  distribution: string;
  resourceType: string;
  patchOrchestration: string;
  periodicAssessment: string;
  associatedSchedules: string;
  powerState: string;
};

const INVENTORY_ENVS = ['prod', 'qa', 'dev'] as const;
const ENV_OPTIONS = ['all', ...INVENTORY_ENVS] as const;
const DEFAULT_BASE_PATH = 'environments';
const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: FiHome },
  { key: 'get-started', label: 'Get started', icon: FiPlayCircle },
  { key: 'machines', label: 'Machines', icon: FiMonitor },
  { key: 'history', label: 'History', icon: FiClock },
  { key: 'update-reports', label: 'Update reports', icon: FiBarChart2 },
];

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

type DashboardSearchParams = {
  env?: string;
  view?: string;
  basePath?: string;
  resourceType?: string;
  distribution?: string;
  platform?: string;
  cluster?: string;
  routineName?: string;
  routineHosts?: string;
  routineSerial?: string;
  elSecurityOnly?: string;
};

function mergeInventories(env: string, basePath: string) {
  const inventoryEnvs = env === 'all' ? INVENTORY_ENVS : [env as (typeof INVENTORY_ENVS)[number]];
  const inventoryByEnv = inventoryEnvs.map((inventoryEnv) => loadInventorySummary(inventoryEnv, basePath));

  const merged: InventorySummary = {
    env,
    inventory_path:
      env === 'all'
        ? `${basePath}/{${INVENTORY_ENVS.join(',')}}/inventory`
        : inventoryByEnv[0]?.inventory_path ?? `${basePath}/${env}/inventory`,
    server_count: inventoryByEnv.reduce((sum, item) => sum + item.server_count, 0),
    cluster_count: inventoryByEnv.reduce((sum, item) => sum + item.cluster_count, 0),
    servers: inventoryByEnv.flatMap((item) => item.servers.map((server) => ({ ...server, env: server.env || item.env }))),
    clusters: inventoryByEnv.flatMap((item) => item.clusters),
    source: inventoryByEnv.every((item) => item.source === 'fixture')
      ? 'fixture'
      : inventoryByEnv.every((item) => item.source === 'ansible')
        ? 'ansible'
        : undefined,
    error: inventoryByEnv.map((item) => item.error).filter(Boolean).join(' | ') || undefined,
  };

  return { merged, inventoryByEnv };
}

function buildPatchRoutineYaml({
  routineName,
  routineHosts,
  routineSerial,
  elSecurityOnly,
}: {
  routineName: string;
  routineHosts: string;
  routineSerial: number;
  elSecurityOnly: boolean;
}) {
  return `---
- name: ${routineName}
  hosts: ${routineHosts}
  gather_facts: false
  become: true
  serial: ${routineSerial}

  vars:
    el_security_only: ${elSecurityOnly ? 'true' : 'false'}
    el_exclude: []
    lock_timeout: 120
    reboot_timeout: 900

  pre_tasks:
    - name: Gather minimal facts (works in --check)
      ansible.builtin.setup:
        gather_subset: [min]
        filter: [ansible_os_family]
      become: false
      check_mode: no
      ignore_errors: yes

    - name: Normalize OS family
      ansible.builtin.set_fact:
        os_family: "{{ ansible_facts.os_family | default(ansible_os_family | default('')) }}"

  tasks:
    - name: Update packages (EL)
      ansible.builtin.dnf:
        name: "*"
        state: latest
        update_cache: true
        security: "{{ el_security_only }}"
        exclude: "{{ el_exclude }}"
        lock_timeout: "{{ lock_timeout }}"
      when: os_family == "RedHat"
      register: el_update
      retries: 3
      delay: 10
      until: el_update is succeeded

    - name: Update packages (Debian/Ubuntu)
      ansible.builtin.apt:
        update_cache: true
        upgrade: dist
        lock_timeout: "{{ lock_timeout }}"
      when: os_family == "Debian"
      register: deb_update
      retries: 3
      delay: 10
      until: deb_update is succeeded

    - name: Reboot if needed (Debian/Ubuntu)
      ansible.builtin.reboot:
        reboot_timeout: "{{ reboot_timeout }}"
      when:
        - os_family == "Debian"
        - not (ansible_check_mode | default(false))`;
}

export default function HomePage({ searchParams }: { searchParams?: DashboardSearchParams }) {
  const linuxDistributions = ['Ubuntu', 'Debian', 'RHEL', 'Rocky Linux', 'SUSE Linux Enterprise', 'AlmaLinux'] as const;
  const unixDistributions = ['AIX', 'Solaris'] as const;
  const bsdDistributions = ['FreeBSD 13', 'FreeBSD 14'] as const;

  const selectedEnv = ENV_OPTIONS.includes(searchParams?.env as (typeof ENV_OPTIONS)[number])
    ? (searchParams?.env as (typeof ENV_OPTIONS)[number])
    : 'prod';
  const selectedBasePath = searchParams?.basePath || DEFAULT_BASE_PATH;
  const activeView = NAV_ITEMS.some((item) => item.key === searchParams?.view) ? (searchParams?.view as NavKey) : 'overview';
  const selectedResourceType = searchParams?.resourceType || 'all';
  const selectedDistribution = searchParams?.distribution || 'all';
  const selectedPlatform = searchParams?.platform || 'all';
  const selectedCluster = searchParams?.cluster || 'all';

  const runs = db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT 50').all() as RunRow[];
  const schedules = db.prepare('SELECT id,name,env,day_of_week,time_hhmm,enabled FROM schedules ORDER BY id DESC').all() as ScheduleRow[];
  const latestRun = runs[0];
  const envRuns = selectedEnv === 'all' ? runs : runs.filter((run) => run.env === selectedEnv);
  const latestEnvRun = envRuns[0];
  const { merged: inventory, inventoryByEnv } = mergeInventories(selectedEnv, selectedBasePath);

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
  const envSchedules = selectedEnv === 'all' ? schedules : schedules.filter((schedule) => schedule.env === selectedEnv);

  const machineRows: MachineRow[] = inventory.servers.map((server, idx) => {
    const platform = idx % 9 === 0 ? 'FreeBSD' : idx % 7 === 0 ? 'Unix' : 'Linux';
    const distribution =
      platform === 'FreeBSD'
        ? bsdDistributions[idx % bsdDistributions.length]
        : platform === 'Unix'
          ? unixDistributions[idx % unixDistributions.length]
          : linuxDistributions[idx % linuxDistributions.length];

    const scheduleForEnv = schedules.find((schedule) => schedule.env === server.env)?.name ?? '-';

    return {
      name: server.hostname,
      env: server.env,
      cluster: server.cluster || 'standalone',
      updateStatus: machineStatusText(statusLabel(latestEnvRun?.status ?? 'pending')),
      platform,
      distribution,
      resourceType: server.cluster === 'standalone' ? 'Bare metal server' : 'Virtual machine',
      patchOrchestration: server.cluster === 'standalone' ? 'Native package manager' : 'Agent managed rollout',
      periodicAssessment: idx % 2 === 0 ? 'Yes' : 'No',
      associatedSchedules: scheduleForEnv,
      powerState: idx % 4 === 0 ? 'VM running' : 'VM deallocated',
    };
  });

  const resourceTypeOptions = ['all', ...new Set(machineRows.map((row) => row.resourceType))];
  const distributionOptions = ['all', ...new Set(machineRows.map((row) => row.distribution))];
  const platformOptions = ['all', ...new Set(machineRows.map((row) => row.platform))];
  const clusterOptions = ['all', ...new Set(machineRows.map((row) => row.cluster))];

  const filteredMachineRows = machineRows.filter((row) => {
    const platformMatch = selectedPlatform === 'all' || row.platform === selectedPlatform;
    const distributionMatch = selectedDistribution === 'all' || row.distribution === selectedDistribution;
    const resourceTypeMatch = selectedResourceType === 'all' || row.resourceType === selectedResourceType;
    const clusterMatch = selectedCluster === 'all' || row.cluster === selectedCluster;
    return platformMatch && distributionMatch && resourceTypeMatch && clusterMatch;
  });

  const routineName = searchParams?.routineName || 'Patch Linux servers (EL & Debian)';
  const routineHosts = searchParams?.routineHosts || (selectedCluster !== 'all' ? selectedCluster : 'all');
  const routineSerial = Number.isFinite(Number(searchParams?.routineSerial)) ? Math.min(Math.max(Number(searchParams?.routineSerial), 1), 20) : 1;
  const elSecurityOnly = searchParams?.elSecurityOnly === '1';
  const generatedPlaybook = buildPatchRoutineYaml({ routineName, routineHosts, routineSerial, elSecurityOnly });

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
          {NAV_ITEMS.map((item) => {
            const NavIcon = item.icon;
            return (
              <a
                key={item.key}
                href={`/?env=${selectedEnv}&view=${item.key}&basePath=${selectedBasePath}`}
                className={`side-link ${activeView === item.key ? 'active' : ''}`}
              >
                <span className="side-icon"><NavIcon /></span>
                <span>{item.label}</span>
              </a>
            );
          })}
        </aside>

        <section className="main-pane">
          <section className="command-bar">
            <div className="command-left">
              <button className="ghost-btn" type="button"><FiRefreshCw /> Refresh</button>
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
              {inventoryByEnv.some((item) => item.source === 'fixture') && <p className="mt-2 text-sm text-amber-700">Visar fejkdata från JSON-fixtures för snabb UI-test.</p>}
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
              <section className="space-y-4">
                <section className="table-card p-6 space-y-3">
                  <h2 className="text-lg font-semibold">Get started</h2>
                  <p className="text-sm text-slate-600">1) Gå till Machines och välj Environment + filter. 2) Kontrollera inventory-sökväg. 3) Starta patch-run eller skapa schema.</p>
                  <p className="text-sm text-slate-600">När du klickar Machines visas en komplett maskinlista med patch-status, plattform, distribution, kluster, resurstyp och associerade scheman.</p>
                </section>

                <section className="table-card p-6 space-y-4">
                  <h2 className="text-lg font-semibold">Bygg patchrutin (Ansible Playbook)</h2>
                  <p className="text-sm text-slate-600">Skapa en patchrutin utifrån inventory/cluster och generera ett playbook-utkast som du kan klistra in i repo eller pipeline.</p>

                  <form method="get" className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <input type="hidden" name="view" value={activeView} />
                    <input type="hidden" name="env" value={selectedEnv} />
                    <input type="hidden" name="basePath" value={selectedBasePath} />
                    <label className="text-xs text-slate-500">Routine name
                      <input className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm" name="routineName" defaultValue={routineName} />
                    </label>
                    <label className="text-xs text-slate-500">Hosts / group
                      <input className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm" name="routineHosts" defaultValue={routineHosts} />
                    </label>
                    <label className="text-xs text-slate-500">Serial
                      <input className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm" name="routineSerial" type="number" min={1} max={20} defaultValue={routineSerial} />
                    </label>
                    <label className="text-xs text-slate-500 flex items-end gap-2 pb-2">
                      <input type="checkbox" name="elSecurityOnly" value="1" defaultChecked={elSecurityOnly} />
                      <span>EL security-only</span>
                    </label>
                    <div className="md:col-span-2 lg:col-span-4 flex gap-2">
                      <button className="primary-btn" type="submit">Generate playbook</button>
                    </div>
                  </form>

                  <pre className="ansible-code-block">{generatedPlaybook}</pre>
                </section>
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
                  <form className="p-4 border-b border-slate-200 grid gap-3 md:grid-cols-2 xl:grid-cols-5" method="get">
                    <input type="hidden" name="view" value={activeView} />
                    <input type="hidden" name="basePath" value={selectedBasePath} />

                    <label className="text-xs text-slate-500">Environment
                      <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm" name="env" defaultValue={selectedEnv}>
                        {ENV_OPTIONS.map((env) => (
                          <option key={env} value={env}>{env === 'all' ? 'All environments' : env.toUpperCase()}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-slate-500">Cluster
                      <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm" name="cluster" defaultValue={selectedCluster}>
                        {clusterOptions.map((option) => (
                          <option key={option} value={option}>{option === 'all' ? 'All clusters' : option}</option>
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
                    <div className="md:col-span-2 xl:col-span-5 flex gap-2">
                      <button className="primary-btn" type="submit">Apply filters</button>
                      <a className="ghost-btn" href={`/?env=${selectedEnv}&view=${activeView}&basePath=${selectedBasePath}`}>Reset filters</a>
                    </div>
                  </form>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th>Name</th><th>Cluster</th><th>Update status</th><th>Platform</th><th>Distribution</th><th>Resource type</th><th>Patch orchestration</th><th>Periodic assessment</th><th>Associated schedules</th><th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMachineRows.map((row) => {
                          const NameIcon = row.resourceType === 'Virtual machine' ? FiMonitor : FiServer;
                          return (
                            <tr key={`${row.env}-${row.name}`}>
                              <td>
                                <span className="machine-name-cell">
                                  <NameIcon className="machine-name-icon" />
                                  <a className="link" href={`/machines/${encodeURIComponent(row.name)}?env=${row.env}&basePath=${selectedBasePath}`}>{row.name}</a>
                                  {selectedEnv === 'all' && <span className="machine-env-chip">{row.env.toUpperCase()}</span>}
                                </span>
                              </td>
                              <td>{row.cluster}</td>
                              <td>{row.updateStatus}</td><td>{row.platform}</td><td>{row.distribution}</td><td>{row.resourceType}</td><td>{row.patchOrchestration}</td><td>{row.periodicAssessment}</td><td>{row.associatedSchedules}</td><td>{row.powerState}</td>
                            </tr>
                          );
                        })}
                        {filteredMachineRows.length === 0 && <tr><td colSpan={10} className="text-slate-500">No machines found with selected filters.</td></tr>}
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
                        {inventoryByEnv.flatMap((envInventory) =>
                          envInventory.clusters.map((cluster) => (
                            <tr key={`${envInventory.env}-${cluster.name}`}><td>{cluster.name}</td><td>{cluster.nodes}</td><td>{envInventory.env}</td></tr>
                          ))
                        )}
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
