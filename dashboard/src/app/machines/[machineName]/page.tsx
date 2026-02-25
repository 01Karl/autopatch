import { loadInventorySummary } from '@/lib/inventory';

const ENV_OPTIONS = ['prod', 'qa', 'dev'] as const;
const DEFAULT_BASE_PATH = 'environments';

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

type MachinePageProps = {
  params: { machineName: string };
  searchParams?: { env?: string; basePath?: string };
};

const updates = [
  { name: 'Kernel security rollup', classification: 'Critical', severity: 'Critical', kb: 'LSA-2026-001', reboot: 'Requires reboot', published: '2026-01-18 03:10' },
  { name: 'OpenSSL package refresh', classification: 'Security', severity: 'Important', kb: 'LSA-2026-017', reboot: 'No reboot', published: '2026-01-20 11:30' },
  { name: 'Container runtime update', classification: 'Security', severity: 'Moderate', kb: 'LSA-2026-028', reboot: 'No reboot', published: '2026-02-02 07:50' }
];

export default function MachinePage({ params, searchParams }: MachinePageProps) {
  const selectedEnv = ENV_OPTIONS.includes(searchParams?.env as (typeof ENV_OPTIONS)[number])
    ? (searchParams?.env as (typeof ENV_OPTIONS)[number])
    : 'prod';
  const selectedBasePath = searchParams?.basePath || DEFAULT_BASE_PATH;

  const inventory = loadInventorySummary(selectedEnv, selectedBasePath);
  const machineName = decodeURIComponent(params.machineName);
  const serverIndex = inventory.servers.findIndex((s) => s.hostname === machineName);
  const server = serverIndex >= 0 ? inventory.servers[serverIndex] : undefined;
  const { platform, distribution } = getPlatformAndDistribution(Math.max(serverIndex, 0));

  const resourceType = server?.cluster === 'standalone' ? 'Bare metal server' : 'Virtual machine';
  const patchOrchestration = server?.cluster === 'standalone' ? 'Native package manager' : 'Agent managed rollout';
  const periodicAssessment = serverIndex % 2 === 0 ? 'Enabled' : 'Disabled';

  const criticalCount = updates.filter((u) => u.classification === 'Critical').length;
  const securityCount = updates.filter((u) => u.classification === 'Security').length;
  const otherCount = updates.filter((u) => u.classification === 'Other').length;

  return (
    <main className="azure-shell">
      <header className="top-header">
        <div className="brand">OpenPatch Console</div>
        <input className="header-search" placeholder="Search machines, updates and docs" />
        <div className="header-user">Connie Wilson · CONTOSO</div>
      </header>

      <div className="shell-layout">
        <aside className="side-nav">
          <a className="side-link" href={`/?env=${selectedEnv}&view=machines&basePath=${selectedBasePath}`}>
            <span className="side-icon">←</span>
            <span>Back to Machines</span>
          </a>
          <p className="side-title mt-4">Machine menu</p>
          {['Overview', 'Security', 'Advisor recommendations', 'Extensions', 'Continuous delivery', 'Configuration', 'Identity', 'Properties', 'Locks'].map((item) => (
            <span className="side-link" key={item}>{item}</span>
          ))}

          <p className="side-title mt-4">Operations</p>
          {['Bastion', 'Auto-shutdown', 'Backup', 'Disaster recovery', 'Updates', 'Inventory', 'Change tracking'].map((item) => (
            <span className={`side-link ${item === 'Updates' ? 'active' : ''}`} key={item}>{item}</span>
          ))}
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
              <span className="machine-tab active">Recommended updates</span>
              <span className="machine-tab">Update history</span>
              <span className="machine-tab">Scheduling</span>
            </section>

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
          </section>
        </section>
      </div>
    </main>
  );
}
