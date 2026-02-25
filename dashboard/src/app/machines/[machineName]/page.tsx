import db from '@/lib/db';
import { loadInventorySummary } from '@/lib/inventory';
import { FiActivity, FiArrowLeft, FiBox, FiCheckCircle, FiClock, FiCpu, FiDatabase, FiHardDrive, FiLock, FiRefreshCw, FiSettings, FiShield, FiSliders, FiTool, FiUser, FiXCircle } from 'react-icons/fi';

const ENV_OPTIONS = ['prod', 'qa', 'dev'] as const;
const DEFAULT_BASE_PATH = 'environments';

type MachineTab = 'recommended' | 'history' | 'scheduling';

type ScheduleRow = {
  id: number;
  name: string;
  env: string;
  day_of_week: string;
  time_hhmm: string;
  enabled: number;
};

function getPlatformAndDistribution(index: number) {
  const linuxDistributions = ['Ubuntu', 'Debian', 'RHEL', 'Rocky Linux', 'SUSE Linux Enterprise', 'AlmaLinux'] as const;
  const unixDistributions = ['AIX', 'Solaris'] as const;
  const bsdDistributions = ['FreeBSD 13', 'FreeBSD 14'] as const;

  const platform = index % 9 === 0 ? 'FreeBSD' : index % 7 === 0 ? 'Unix' : 'Linux';
  const distribution =
    platform === 'FreeBSD'
      ? bsdDistributions[index % bsdDistributions.length]
      : platform === 'Unix'
        ? unixDistributions[index % unixDistributions.length]
        : linuxDistributions[index % linuxDistributions.length];

  return { platform, distribution };
}

function weekdayLabel(day: string) {
  const map: Record<string, string> = { mon: 'Måndag', tue: 'Tisdag', wed: 'Onsdag', thu: 'Torsdag', fri: 'Fredag', sat: 'Lördag', sun: 'Söndag' };
  return map[day] ?? day;
}

type MachinePageProps = {
  params: { machineName: string };
  searchParams?: { env?: string; basePath?: string; tab?: string };
};

const updates = [
  { name: 'Kernel security rollup', classification: 'Critical', severity: 'Critical', kb: 'LSA-2026-001', reboot: 'Requires reboot', published: '2026-01-18 03:10' },
  { name: 'OpenSSL package refresh', classification: 'Security', severity: 'Important', kb: 'LSA-2026-017', reboot: 'No reboot', published: '2026-01-20 11:30' },
  { name: 'Container runtime update', classification: 'Security', severity: 'Moderate', kb: 'LSA-2026-028', reboot: 'No reboot', published: '2026-02-02 07:50' }
];

const updateHistory = [
  { id: 'run-4812', started: '2026-02-21 02:00', result: 'Completed', installed: 5, failed: 0, reboot: 'No', initiatedBy: 'Nightly schedule' },
  { id: 'run-4799', started: '2026-02-14 02:00', result: 'Completed', installed: 4, failed: 0, reboot: 'Yes', initiatedBy: 'Nightly schedule' },
  { id: 'run-4768', started: '2026-02-07 02:00', result: 'Partially completed', installed: 3, failed: 1, reboot: 'No', initiatedBy: 'Manual' }
];

export default function MachinePage({ params, searchParams }: MachinePageProps) {
  const selectedEnv = ENV_OPTIONS.includes(searchParams?.env as (typeof ENV_OPTIONS)[number])
    ? (searchParams?.env as (typeof ENV_OPTIONS)[number])
    : 'prod';
  const selectedBasePath = searchParams?.basePath || DEFAULT_BASE_PATH;
  const activeTab: MachineTab = searchParams?.tab === 'history' || searchParams?.tab === 'scheduling' ? searchParams.tab : 'recommended';

  const inventory = loadInventorySummary(selectedEnv, selectedBasePath);
  const machineName = decodeURIComponent(params.machineName);
  const serverIndex = inventory.servers.findIndex((s) => s.hostname === machineName);
  const server = serverIndex >= 0 ? inventory.servers[serverIndex] : undefined;
  const { platform, distribution } = getPlatformAndDistribution(Math.max(serverIndex, 0));

  const schedules = db.prepare('SELECT id,name,env,day_of_week,time_hhmm,enabled FROM schedules WHERE env = ? ORDER BY id DESC').all(selectedEnv) as ScheduleRow[];

  const resourceType = server?.cluster === 'standalone' ? 'Bare metal server' : 'Virtual machine';
  const patchOrchestration = server?.cluster === 'standalone' ? 'Native package manager' : 'Agent managed rollout';
  const periodicAssessment = serverIndex % 2 === 0 ? 'Enabled' : 'Disabled';

  const criticalCount = updates.filter((u) => u.classification === 'Critical').length;
  const securityCount = updates.filter((u) => u.classification === 'Security').length;
  const otherCount = updates.filter((u) => u.classification === 'Other').length;

  const machineBaseHref = `/machines/${encodeURIComponent(machineName)}?env=${selectedEnv}&basePath=${selectedBasePath}`;

  const machineMenuItems = [
    { label: 'Overview', icon: FiActivity },
    { label: 'Security', icon: FiShield },
    { label: 'Advisor recommendations', icon: FiCheckCircle },
    { label: 'Extensions', icon: FiBox },
    { label: 'Continuous delivery', icon: FiRefreshCw },
    { label: 'Configuration', icon: FiSliders },
    { label: 'Identity', icon: FiUser },
    { label: 'Properties', icon: FiCpu },
    { label: 'Locks', icon: FiLock }
  ];

  const operationItems = [
    { label: 'Bastion', icon: FiTool },
    { label: 'Auto-shutdown', icon: FiClock },
    { label: 'Backup', icon: FiDatabase },
    { label: 'Disaster recovery', icon: FiHardDrive },
    { label: 'Updates', icon: FiSettings, active: true },
    { label: 'Inventory', icon: FiBox },
    { label: 'Change tracking', icon: FiRefreshCw }
  ];

  return (
    <main className="azure-shell">
      <header className="top-header">
        <div className="brand">OpenPatch Console</div>
        <input className="header-search" placeholder="Search machines, updates and docs" />
        <div className="header-user">Connie Wilson · CONTOSO</div>
      </header>

      <div className="shell-layout">
        <aside className="side-nav machine-side-nav">
          <a className="side-link" href={`/?env=${selectedEnv}&view=machines&basePath=${selectedBasePath}`}>
            <span className="side-icon"><FiArrowLeft /></span>
            <span>Back to Machines</span>
          </a>

          <section className="machine-nav-group">
            <p className="side-title mt-4">Machine menu</p>
            {machineMenuItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <a className="side-link" key={item.label} href="#">
                  <span className="side-icon"><ItemIcon /></span>
                  <span>{item.label}</span>
                </a>
              );
            })}
          </section>

          <section className="machine-nav-group">
            <p className="side-title mt-4">Operations</p>
            {operationItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <a className={`side-link ${item.active ? 'active' : ''}`} key={item.label} href="#">
                  <span className="side-icon"><ItemIcon /></span>
                  <span>{item.label}</span>
                </a>
              );
            })}
          </section>
        </aside>

        <section className="main-pane">
          <section className="machine-content-area">
            <div className="machine-breadcrumbs">
              <a href="/">Home</a>
              <span>›</span>
              <a href={`/?env=${selectedEnv}&view=machines&basePath=${selectedBasePath}`}>OpenPatch Update Manager</a>
              <span>›</span>
              <span>{machineName}</span>
            </div>

            <section className="machine-title-row">
              <div>
                <h1 className="machine-title">⚙ {machineName} | Updates</h1>
                <p className="machine-subtitle">{resourceType} · {platform} / {distribution} · {selectedEnv.toUpperCase()}</p>
              </div>
              <button className="machine-close-btn" type="button">×</button>
            </section>

            <section className="machine-actions-row">
              <button className="machine-action">Leave new experience</button>
              <button className="machine-action">Refresh</button>
              <button className="machine-action">Check for updates</button>
              <button className="machine-action">One-time update</button>
              <button className="machine-action">Scheduled updates</button>
              <button className="machine-action">Update settings</button>
              <button className="machine-action">OpenPatch Update Manager</button>
            </section>

            <section className="machine-announcement">
              <p>Manage VM updates at scale with the new OpenPatch update orchestration flow. <a className="link" href={`/?env=${selectedEnv}&view=machines&basePath=${selectedBasePath}`}>Learn more</a></p>
            </section>

            {!server && <p className="text-sm text-rose-700">Machine not found in inventory for selected environment.</p>}

            <section className="machine-tab-strip">
              <a className={`machine-tab ${activeTab === 'recommended' ? 'active' : ''}`} href={`${machineBaseHref}&tab=recommended`}>Recommended updates</a>
              <a className={`machine-tab ${activeTab === 'history' ? 'active' : ''}`} href={`${machineBaseHref}&tab=history`}>Update history</a>
              <a className={`machine-tab ${activeTab === 'scheduling' ? 'active' : ''}`} href={`${machineBaseHref}&tab=scheduling`}>Scheduling</a>
            </section>

            {activeTab === 'recommended' && (
              <section className="machine-card">
                <div className="machine-section">
                  <h2>Infrastructure (host) updates</h2>
                  <div className="machine-kv-inline">
                    <span>Maintenance timeline ⓘ</span>
                    <strong>No upcoming updates</strong>
                  </div>
                </div>

                <div className="machine-section">
                  <h2>Operating system (guest) updates</h2>
                  <div className="machine-pill-row">
                    <span>Periodic assessment ⓘ</span>
                    <span className="machine-state-ok">● {periodicAssessment}</span>
                    <span className="machine-divider">|</span>
                    <span>Patch orchestration ⓘ</span>
                    <strong>{patchOrchestration}</strong>
                    <span className="machine-divider">|</span>
                    <span>Distribution ⓘ</span>
                    <strong>{distribution}</strong>
                    <span className="machine-divider">|</span>
                    <span>Platform</span>
                    <strong>{platform}</strong>
                  </div>
                  <div className="machine-pill-row mt-2">
                    <span>Hotpatch ⓘ</span>
                    <span className="machine-state-off">● Disabled</span>
                  </div>
                </div>

                <div className="machine-summary-grid">
                  <article className="machine-summary-card">
                    <p>Total updates ⓘ</p>
                    <strong>{updates.length}</strong>
                  </article>
                  <article className="machine-summary-card">
                    <p>Critical updates ⓘ</p>
                    <strong className="text-amber-700">⚠ {criticalCount}</strong>
                  </article>
                  <article className="machine-summary-card">
                    <p>Security updates ⓘ</p>
                    <strong className="text-amber-700">⚠ {securityCount}</strong>
                  </article>
                  <article className="machine-summary-card">
                    <p>Other updates ⓘ</p>
                    <strong>● {otherCount}</strong>
                  </article>
                </div>

                <p className="text-xs text-slate-500">Last assessed: 2026-02-22 15:12:24</p>

                <div className="machine-filter-row">
                  <span className="machine-filter-chip">Search by update name, KB ID...</span>
                  <span className="machine-filter-chip">Classification : All</span>
                  <span className="machine-filter-chip">Severity (MSRC) : All</span>
                  <span className="machine-filter-chip">Reboot required : All</span>
                  <a className="ml-auto link" href="#">Open query</a>
                </div>

                <p className="text-sm text-slate-600">Showing {updates.length} of {updates.length} results</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th>Update name ↕</th>
                        <th>Classification ↕</th>
                        <th>Severity (MSRC) ↕</th>
                        <th>KB IDs ↕</th>
                        <th>Reboot required ↕</th>
                        <th>Published date ↕</th>
                      </tr>
                    </thead>
                    <tbody>
                      {updates.map((update) => (
                        <tr key={update.kb}>
                          <td>{update.name}</td>
                          <td>{update.classification}</td>
                          <td>{update.severity}</td>
                          <td>{update.kb}</td>
                          <td>{update.reboot}</td>
                          <td>{update.published}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'history' && (
              <section className="machine-card">
                <div className="machine-section">
                  <h2>Update history</h2>
                  <p className="text-sm text-slate-500">Historik för senaste körningar på {machineName}.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th>Run ID</th>
                        <th>Started</th>
                        <th>Result</th>
                        <th>Installed</th>
                        <th>Failed</th>
                        <th>Reboot required</th>
                        <th>Initiated by</th>
                      </tr>
                    </thead>
                    <tbody>
                      {updateHistory.map((entry) => (
                        <tr key={entry.id}>
                          <td>{entry.id}</td>
                          <td>{entry.started}</td>
                          <td>{entry.result}</td>
                          <td>{entry.installed}</td>
                          <td>{entry.failed}</td>
                          <td>{entry.reboot}</td>
                          <td>{entry.initiatedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'scheduling' && (
              <section className="machine-card space-y-4">
                <div className="machine-section">
                  <h2>Scheduling</h2>
                  <p className="text-sm text-slate-500">Aktiva scheman för miljö {selectedEnv.toUpperCase()} som kan tillämpas på {machineName}.</p>
                </div>

                <div className="machine-schedule-list">
                  {schedules.length > 0 ? (
                    schedules.map((schedule) => (
                      <article className="machine-schedule-item" key={schedule.id}>
                        <div>
                          <p className="font-semibold text-slate-800">{schedule.name}</p>
                          <p className="text-xs text-slate-500">{weekdayLabel(schedule.day_of_week)} · {schedule.time_hhmm}</p>
                        </div>
                        <span className={schedule.enabled ? 'machine-state-ok' : 'machine-state-off'}>
                          {schedule.enabled ? <FiCheckCircle className="inline mr-1" /> : <FiXCircle className="inline mr-1" />}
                          {schedule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No schedules configured for this environment.</p>
                  )}
                </div>

                <section className="machine-announcement">
                  <p>You can manage schedules from the main dashboard. <a className="link" href={`/?env=${selectedEnv}&view=update-reports&basePath=${selectedBasePath}`}>Go to Update reports</a></p>
                </section>
              </section>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
