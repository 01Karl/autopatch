import db from '@/lib/db';
import { decodeSession, getSessionCookieName } from '@/lib/auth';
import { getFreeIPAConfigPath, getPlaybookRoutines } from '@/lib/config';
import { getFreeIPAConfig } from '@/lib/freeipa';
import { cookies } from 'next/headers';
import { mergeInventories } from '@/lib/inventory';
import { FiMonitor, FiRefreshCw, FiServer } from 'react-icons/fi';
import ManagerSidebarNav from '@/app/_components/layout/ManagerSidebarNav';
import { AppButton, AppButtonLink } from '@/app/_components/ui/AppButton';
import { buildPatchRoutineYaml } from '@/app/_lib/playbook-routine';

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

type ServiceAccountRow = {
  id: number;
  name: string;
  purpose: string;
  username: string;
  created_at: string;
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
const OVERVIEW_VIEW_KEYS = ['overview', 'get-started', 'playbooks', 'machines', 'history', 'update-reports'] as const;

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
  routineTemplate?: string;
};



export default function HomePage({ searchParams }: { searchParams?: DashboardSearchParams }) {
  const linuxDistributions = ['Ubuntu', 'Debian', 'RHEL', 'Rocky Linux', 'SUSE Linux Enterprise', 'AlmaLinux'] as const;
  const unixDistributions = ['AIX', 'Solaris'] as const;
  const bsdDistributions = ['FreeBSD 13', 'FreeBSD 14'] as const;

  const selectedEnv = ENV_OPTIONS.includes(searchParams?.env as (typeof ENV_OPTIONS)[number])
    ? (searchParams?.env as (typeof ENV_OPTIONS)[number])
    : 'prod';
  const selectedBasePath = searchParams?.basePath || DEFAULT_BASE_PATH;
  const activeView = OVERVIEW_VIEW_KEYS.includes((searchParams?.view || '') as (typeof OVERVIEW_VIEW_KEYS)[number])
    ? (searchParams?.view as (typeof OVERVIEW_VIEW_KEYS)[number])
    : 'overview';
  const selectedResourceType = searchParams?.resourceType || 'all';
  const selectedDistribution = searchParams?.distribution || 'all';
  const selectedPlatform = searchParams?.platform || 'all';
  const selectedCluster = searchParams?.cluster || 'all';

  const runs = db.prepare('SELECT * FROM runs ORDER BY id DESC LIMIT 50').all() as RunRow[];
  const schedules = db.prepare('SELECT id,name,env,day_of_week,time_hhmm,enabled FROM schedules ORDER BY id DESC').all() as ScheduleRow[];
  const freeipaConfig = getFreeIPAConfig();
  const playbookRoutines = getPlaybookRoutines();
  const serviceAccounts = db.prepare('SELECT id, name, purpose, username, created_at FROM service_accounts ORDER BY id DESC').all() as ServiceAccountRow[];
  const sessionToken = cookies().get(getSessionCookieName())?.value;
  const session = decodeSession(sessionToken);
  const latestRun = runs[0];
  const envRuns = selectedEnv === 'all' ? runs : runs.filter((run) => run.env === selectedEnv);
  const latestEnvRun = envRuns[0];
  const { merged: inventory, inventoryByEnv } = mergeInventories(selectedEnv, selectedBasePath, INVENTORY_ENVS);

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

  const linuxCount = machineRows.filter((row) => row.platform === 'Linux').length;
  const unixCount = machineRows.filter((row) => row.platform === 'Unix').length;
  const freebsdCount = machineRows.filter((row) => row.platform === 'FreeBSD').length;
  const withAssessmentCount = machineRows.filter((row) => row.periodicAssessment === 'Yes').length;
  const automationCoverage = machineRows.length ? Math.round((withAssessmentCount / machineRows.length) * 100) : 0;
  const managedBySchedules = machineRows.filter((row) => row.associatedSchedules !== '-').length;

  const routineTemplate = searchParams?.routineTemplate || playbookRoutines[0]?.key || 'linux-standard';
  const routineName = searchParams?.routineName || 'Patch Linux servers (EL & Debian)';
  const routineHosts = searchParams?.routineHosts || (selectedCluster !== 'all' ? selectedCluster : 'all');
  const routineSerial = Number.isFinite(Number(searchParams?.routineSerial)) ? Math.min(Math.max(Number(searchParams?.routineSerial), 1), 20) : 1;
  const elSecurityOnly = searchParams?.elSecurityOnly === '1';
  const generatedPlaybook = buildPatchRoutineYaml({ routineTemplate, routineName, routineHosts, routineSerial, elSecurityOnly });

  const csvHeader = 'id,started_at,env,status,ok_count,failed_count,skipped_count,total_targets,success_pct';
  const csvRows = runs.map((run) => [run.id, run.started_at, run.env, run.status, run.ok_count, run.failed_count, run.skipped_count, run.total_targets, run.success_pct].join(','));
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent([csvHeader, ...csvRows].join('\n'))}`;

  const successShare = totals.targets ? (totals.ok / totals.targets) * 100 : 0;
  const failedShare = totals.targets ? (totals.failed / totals.targets) * 100 : 0;
  const donutStyle = { background: `conic-gradient(#2563eb 0 ${successShare}%, #dc2626 ${successShare}% ${successShare + failedShare}%, #d6d3d1 ${successShare + failedShare}% 100%)` };

  return (
    <main className="azure-shell">
      <header className="top-header">
        <div className="brand">Overseer Infrastructure Manager</div>
        <input className="header-search" placeholder="Search resources, services and docs" />
        <div className="header-user">
          <span>{session?.username || 'Okänd användare'}</span>
          <form action="/api/auth/logout" method="post" className="inline">
            <AppButton className="ml-3" type="submit">Logga ut</AppButton>
          </form>
        </div>
      </header>

      <section className="shell-page-intro">
        <div className="shell-page-breadcrumbs">
          <a href="/">Home</a>
          <span>›</span>
          <span>Overseer Infrastructure Manager</span>
        </div>
        <h1 className="shell-page-title">Overseer Infrastructure Manager</h1>
        <p className="shell-page-subtitle">Översikt för Linux, Unix och FreeBSD med driftläge, automation och operativa signaler.</p>
      </section>

      <div className="shell-layout">
        <ManagerSidebarNav activeView={activeView} selectedEnv={selectedEnv} selectedBasePath={selectedBasePath} />

        <section className="main-pane">
          <p className="pane-context-text">Operations workflow · Följ fleet-hälsa, automation och plattformsstatus från en samlad översikt.</p>
          <section className="command-bar">
            <div className="command-left">
              <AppButton type="button"><FiRefreshCw /> Refresh</AppButton>
              <AppButton type="button">Inventory sync</AppButton>
              <AppButton type="button">Run compliance scan</AppButton>
            </div>
            <div className="command-right">
              <AppButtonLink href={csvHref} download="autopatch-runs.csv">Export to CSV</AppButtonLink>
              {latestRun?.report_xlsx && <AppButtonLink href={`/${latestRun.report_xlsx}`}>Export Excel</AppButtonLink>}
            </div>
          </section>

          <section className="content-area space-y-5">
            <section className="table-card">
              <div className="table-head flex flex-wrap items-center gap-2">
                <h2>Environment overview</h2>
                <span className="chip">Environment: {selectedEnv.toUpperCase()}</span>
                <span className="chip">Inventory: {inventory.inventory_path}</span>
                <span className="chip">Source: {inventory.source ?? 'ansible'}</span>
              </div>
              <div className="p-4 text-sm text-slate-500 space-y-2">
                <p>Läser från {selectedBasePath}/{selectedEnv}/inventory via Python-integration.</p>
                {inventory.error && <p className="text-rose-700">Inventory-fel: {inventory.error}</p>}
                {inventoryByEnv.some((item) => item.source === 'fixture') && <p className="text-amber-700">Visar fejkdata från JSON-fixtures för snabb UI-test.</p>}
              </div>
            </section>

            {activeView === 'overview' && (
              <>
                <div className="kpi-grid">
                  <article className="kpi-card"><p className="kpi-title">Managed nodes</p><p className="kpi-value">{inventory.server_count}</p></article>
                  <article className="kpi-card"><p className="kpi-title">Linux / Unix / FreeBSD</p><p className="kpi-value">{linuxCount} / {unixCount} / {freebsdCount}</p></article>
                  <article className="kpi-card"><p className="kpi-title">Automation coverage</p><p className="kpi-value text-emerald-700">{automationCoverage}%</p></article>
                  <article className="kpi-card"><p className="kpi-title">Queued or running jobs</p><p className="kpi-value text-amber-700">{pendingRuns}</p></article>
                  <article className="kpi-card"><p className="kpi-title">Failed workflows</p><p className="kpi-value text-rose-700">{failedRuns}</p></article>
                </div>

                <section className="panel-grid">
                  <article className="panel-card">
                    <div className="panel-head"><h2>Fleet health</h2></div>
                    <div className="status-layout">
                      <div className="donut-wrap"><div className="donut" style={donutStyle}><div className="donut-inner"><strong>{inventory.server_count}</strong><span>Machines</span></div></div></div>
                      <div className="stat-list">
                        <p><span>Healthy recent runs</span><strong>{completedRuns}</strong></p>
                        <p><span>Queued/running</span><strong>{pendingRuns}</strong></p>
                        <p><span>Failed</span><strong>{failedRuns}</strong></p>
                        <p><span>Compliance rate</span><strong>{pct(totals.ok, totals.targets)}%</strong></p>
                      </div>
                    </div>
                  </article>

                  <article className="panel-card">
                    <div className="panel-head"><h2>Run execution summary</h2><span className="chip">Last 30 days</span></div>
                    <div className="stat-list">
                      <p><span>Total workflow runs</span><strong>{envRuns.length}</strong></p>
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
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">FreeIPA integration</h2>
                    <span className="text-xs text-slate-500">API-stöd för central inloggning och service-konton</span>
                  </div>
                  <p className="text-xs text-slate-500">Konfiguration läses från fil: <code>{getFreeIPAConfigPath()}</code></p>

                  <form action="/api/freeipa/config" method="post" className="grid gap-3 md:grid-cols-3">
                    <label className="text-xs text-slate-500">FreeIPA base URL
                      <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" name="baseUrl" defaultValue={freeipaConfig?.base_url || ''} placeholder="https://ipa.example.com" required />
                    </label>
                    <label className="text-xs text-slate-500">Username suffix
                      <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" name="usernameSuffix" defaultValue={freeipaConfig?.username_suffix || ''} placeholder="@EXAMPLE.COM" />
                    </label>
                    <label className="text-xs text-slate-500">TLS verification
                      <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm" name="verifyTls" defaultValue={String(freeipaConfig?.verify_tls ?? 1)}>
                        <option value="1">Strict</option>
                        <option value="0">Disabled (test only)</option>
                      </select>
                    </label>
                    <div className="md:col-span-3">
                      <AppButton variant="primary" type="submit">Spara FreeIPA inställningar</AppButton>
                    </div>
                  </form>

                  <form action="/api/freeipa/service-accounts" method="post" className="grid gap-3 md:grid-cols-4">
                    <label className="text-xs text-slate-500">Namn
                      <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" name="name" placeholder="ansible-git-bot" required />
                    </label>
                    <label className="text-xs text-slate-500">Syfte
                      <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" name="purpose" placeholder="Modifiera playbooks och pusha git" required />
                    </label>
                    <label className="text-xs text-slate-500">Username
                      <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" name="username" placeholder="svc_ansible_git" required />
                    </label>
                    <label className="text-xs text-slate-500">Secret
                      <input className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" type="password" name="secret" required />
                    </label>
                    <div className="md:col-span-4">
                      <AppButton variant="primary" type="submit">Lägg till service-konto</AppButton>
                    </div>
                  </form>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr><th>Namn</th><th>Syfte</th><th>Username</th><th>Skapad</th></tr></thead>
                      <tbody>
                        {serviceAccounts.map((account) => (
                          <tr key={account.id}>
                            <td>{account.name}</td>
                            <td>{account.purpose}</td>
                            <td>{account.username}</td>
                            <td>{account.created_at}</td>
                          </tr>
                        ))}
                        {serviceAccounts.length === 0 && <tr><td colSpan={4} className="text-slate-500">Inga service-konton registrerade ännu.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>


              </section>
            )}

            {activeView === 'playbooks' && (
              <section className="space-y-4">
                <section className="table-card p-6 space-y-3">
                  <h2 className="text-lg font-semibold">Bygg playbooks för patchning</h2>
                  <p className="text-sm text-slate-600">Skapa patch-playbooks för enskilda Linux-servrar, host-grupper eller kluster och generera ett playbook-utkast direkt i gränssnittet.</p>
                  <ul className="text-xs text-slate-500 list-disc pl-5">
                    {playbookRoutines.map((routine) => (
                      <li key={routine.key}><strong>{routine.label}:</strong> {routine.description}</li>
                    ))}
                  </ul>
                </section>

                <section className="table-card p-6 space-y-4">
                  <h2 className="text-lg font-semibold">Playbook builder (Ansible)</h2>
                  <form method="get" className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <input type="hidden" name="view" value={activeView} />
                    <input type="hidden" name="env" value={selectedEnv} />
                    <input type="hidden" name="basePath" value={selectedBasePath} />
                    <label className="text-xs text-slate-500">Template
                      <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm" name="routineTemplate" defaultValue={routineTemplate}>
                        {playbookRoutines.map((routine) => (
                          <option key={routine.key} value={routine.key}>{routine.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-slate-500">Playbook name
                      <input className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm" name="routineName" defaultValue={routineName} />
                    </label>
                    <label className="text-xs text-slate-500">Target hosts / group / cluster
                      <input className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm" name="routineHosts" defaultValue={routineHosts} />
                    </label>
                    <label className="text-xs text-slate-500">Serial batches
                      <input className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm" name="routineSerial" type="number" min={1} max={20} defaultValue={routineSerial} />
                    </label>
                    <label className="text-xs text-slate-500 flex items-end gap-2 pb-2">
                      <input type="checkbox" name="elSecurityOnly" value="1" defaultChecked={elSecurityOnly} />
                      <span>EL security-only</span>
                    </label>
                    <div className="md:col-span-2 lg:col-span-4 flex gap-2">
                      <AppButton variant="primary" type="submit">Generate playbook</AppButton>
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
                  <div className="flex gap-2"><AppButton variant="primary" type="button">Install now</AppButton><AppButton type="button">Cancel</AppButton></div>
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
                      <AppButton variant="primary" type="submit">Apply filters</AppButton>
                      <AppButtonLink href={`/?env=${selectedEnv}&view=${activeView}&basePath=${selectedBasePath}`}>Reset filters</AppButtonLink>
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
