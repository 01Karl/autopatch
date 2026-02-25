import { loadInventorySummary } from '@/lib/inventory';
import { FiActivity, FiArrowLeft, FiBox, FiCheckCircle, FiClock, FiCpu, FiDatabase, FiHardDrive, FiLock, FiRefreshCw, FiSettings, FiShield, FiSliders, FiTool, FiUser } from 'react-icons/fi';

const ENV_OPTIONS = ['prod', 'qa', 'dev'] as const;
const DEFAULT_BASE_PATH = 'environments';

type MachineTab = 'properties' | 'capabilities' | 'recommendations' | 'tutorials';
type ContentTab = 'packages' | 'errata' | 'module-streams' | 'repository-sets';

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
  searchParams?: { env?: string; basePath?: string; tab?: string; content?: string };
};

const updates = [
  { name: 'Kernel security rollup', classification: 'Critical', severity: 'Critical', kb: 'LSA-2026-001', reboot: 'Requires reboot', published: '2026-01-18 03:10' },
  { name: 'OpenSSL package refresh', classification: 'Security', severity: 'Important', kb: 'LSA-2026-017', reboot: 'No reboot', published: '2026-01-20 11:30' },
  { name: 'Container runtime update', classification: 'Security', severity: 'Moderate', kb: 'LSA-2026-028', reboot: 'No reboot', published: '2026-02-02 07:50' }
];

const errata = [
  { id: 'RLSA-2026:0018', type: 'Security', severity: 'Important', installable: 'Yes', synopsis: 'Kernel security update', published: '2026-01-18' },
  { id: 'RLSA-2026:0022', type: 'Security', severity: 'Moderate', installable: 'Yes', synopsis: 'OpenSSL vulnerability fix', published: '2026-01-20' },
  { id: 'RLEA-2026:0004', type: 'Bugfix', severity: 'Low', installable: 'Yes', synopsis: 'Container runtime stability update', published: '2026-02-02' }
];

const moduleStreams = [
  { name: 'nodejs:20', status: 'Enabled', repoSet: 'rhel-9-appstream-rpms', profile: 'common', packages: 13 },
  { name: 'postgresql:16', status: 'Enabled', repoSet: 'rhel-9-appstream-rpms', profile: 'server', packages: 8 },
  { name: 'nginx:1.24', status: 'Available', repoSet: 'rhel-9-appstream-rpms', profile: 'minimal', packages: 5 }
];

const repositorySets = [
  { name: 'rhel-9-baseos-rpms', state: 'Enabled', source: 'Satellite', contentType: 'RPM', lastSync: '2026-02-21 23:40' },
  { name: 'rhel-9-appstream-rpms', state: 'Enabled', source: 'Satellite', contentType: 'RPM + Module', lastSync: '2026-02-21 23:40' },
  { name: 'epel-9', state: 'Disabled', source: 'External mirror', contentType: 'RPM', lastSync: '2026-01-30 05:12' }
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
  const activeTab: MachineTab = searchParams?.tab === 'properties' || searchParams?.tab === 'recommendations' || searchParams?.tab === 'tutorials' ? searchParams.tab : 'capabilities';
  const contentTab: ContentTab =
    searchParams?.content === 'errata' ||
    searchParams?.content === 'module-streams' ||
    searchParams?.content === 'repository-sets'
      ? searchParams.content
      : 'packages';

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

  const machineBaseHref = `/machines/${encodeURIComponent(machineName)}?env=${selectedEnv}&basePath=${selectedBasePath}`;
  const propertiesBaseHref = `${machineBaseHref}&tab=properties`;
  const capabilitiesBaseHref = `${machineBaseHref}&tab=capabilities`;
  const recommendationsBaseHref = `${machineBaseHref}&tab=recommendations`;
  const tutorialsBaseHref = `${machineBaseHref}&tab=tutorials`;

  const contentTabs: { id: ContentTab; label: string }[] = [
    { id: 'packages', label: 'Packages' },
    { id: 'errata', label: 'Errata' },
    { id: 'module-streams', label: 'Module streams' },
    { id: 'repository-sets', label: 'Repository sets' }
  ];

  const essentials = [
    { label: 'Computer name', value: machineName },
    { label: 'FQDN', value: server?.fqdn || `${machineName}.${selectedEnv}.local` },
    { label: 'Operating system', value: distribution },
    { label: 'Operating system version', value: platform === 'Linux' ? 'Kernel 5.15 LTS' : 'Kernel N/A' },
    { label: 'Manufacturer', value: resourceType === 'Virtual machine' ? 'VMware, Inc.' : 'Dell Technologies' },
    { label: 'Model', value: resourceType === 'Virtual machine' ? 'VMware Virtual Platform' : 'PowerEdge R760' }
  ];

  const capabilityCards = [
    { title: 'Updates', description: 'Customize updates and periodic patching for this machine.', state: 'Periodic assessment enabled' },
    { title: 'Logs', description: 'Collect and inspect machine logs for troubleshooting.', state: 'Configured' },
    { title: 'Insights', description: 'Enable monitoring insights for health and performance.', state: 'Connected' },
    { title: 'Security', description: 'Monitor vulnerabilities and hardening recommendations.', state: 'Monitored' },
    { title: 'Policies', description: 'Apply policy controls and compliance baselines.', state: 'Assigned' }
  ];

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

            <section className="machine-card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Essentials</h2>
                <a className="link text-sm" href="#">JSON View</a>
              </div>
              <div className="grid gap-x-16 gap-y-3 md:grid-cols-2">
                {essentials.map((item) => (
                  <div key={item.label} className="flex items-start gap-3 text-sm">
                    <span className="min-w-[190px] text-slate-600">{item.label}</span>
                    <span className="text-slate-400">:</span>
                    <strong className="font-medium text-slate-900">{item.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="machine-tab-strip">
              <a className={`machine-tab ${activeTab === 'properties' ? 'active' : ''}`} href={propertiesBaseHref}>Properties</a>
              <a className={`machine-tab ${activeTab === 'capabilities' ? 'active' : ''}`} href={capabilitiesBaseHref}>Capabilities</a>
              <a className={`machine-tab ${activeTab === 'recommendations' ? 'active' : ''}`} href={recommendationsBaseHref}>Recommendations</a>
              <a className={`machine-tab ${activeTab === 'tutorials' ? 'active' : ''}`} href={tutorialsBaseHref}>Tutorials</a>
            </section>

            {activeTab === 'properties' && (
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

                <section className="machine-content-tabs">
                  {contentTabs.map((tabItem) => (
                    <a
                      key={tabItem.id}
                      className={`machine-content-tab ${contentTab === tabItem.id ? 'active' : ''}`}
                      href={`${propertiesBaseHref}&content=${tabItem.id}`}
                    >
                      {tabItem.label}
                    </a>
                  ))}
                </section>

                {contentTab === 'packages' && (
                  <>
                    <div className="machine-filter-row">
                      <span className="machine-filter-chip">Search by update name, KB ID...</span>
                      <span className="machine-filter-chip">Classification : All</span>
                      <span className="machine-filter-chip">Severity (MSRC) : All</span>
                      <span className="machine-filter-chip">Reboot required : All</span>
                      <a className="ml-auto link" href="#">Open query</a>
                    </div>

                    <p className="text-sm text-slate-600">Showing {updates.length} of {updates.length} packages</p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th>Package ↕</th>
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
                  </>
                )}

                {contentTab === 'errata' && (
                  <>
                    <div className="machine-filter-row">
                      <span className="machine-filter-chip">Search errata ID...</span>
                      <span className="machine-filter-chip">Type : All</span>
                      <span className="machine-filter-chip">Severity : All</span>
                      <span className="machine-filter-chip">Installable : Yes</span>
                    </div>
                    <p className="text-sm text-slate-600">Showing {errata.length} of {errata.length} errata</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th>Errata ↕</th>
                            <th>Type ↕</th>
                            <th>Severity ↕</th>
                            <th>Installable ↕</th>
                            <th>Synopsis ↕</th>
                            <th>Published date ↕</th>
                          </tr>
                        </thead>
                        <tbody>
                          {errata.map((entry) => (
                            <tr key={entry.id}>
                              <td>{entry.id}</td>
                              <td>{entry.type}</td>
                              <td>{entry.severity}</td>
                              <td>{entry.installable}</td>
                              <td>{entry.synopsis}</td>
                              <td>{entry.published}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {contentTab === 'module-streams' && (
                  <>
                    <div className="machine-filter-row">
                      <span className="machine-filter-chip">Search module stream...</span>
                      <span className="machine-filter-chip">Status : All</span>
                      <span className="machine-filter-chip">Repository set : All</span>
                    </div>
                    <p className="text-sm text-slate-600">Showing {moduleStreams.length} of {moduleStreams.length} module streams</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th>Module stream ↕</th>
                            <th>Status ↕</th>
                            <th>Repository set ↕</th>
                            <th>Profile ↕</th>
                            <th>Packages ↕</th>
                          </tr>
                        </thead>
                        <tbody>
                          {moduleStreams.map((stream) => (
                            <tr key={stream.name}>
                              <td>{stream.name}</td>
                              <td>{stream.status}</td>
                              <td>{stream.repoSet}</td>
                              <td>{stream.profile}</td>
                              <td>{stream.packages}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {contentTab === 'repository-sets' && (
                  <>
                    <div className="machine-filter-row">
                      <span className="machine-filter-chip">Search repository set...</span>
                      <span className="machine-filter-chip">State : All</span>
                      <span className="machine-filter-chip">Source : All</span>
                    </div>
                    <p className="text-sm text-slate-600">Showing {repositorySets.length} of {repositorySets.length} repository sets</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th>Repository set ↕</th>
                            <th>State ↕</th>
                            <th>Source ↕</th>
                            <th>Content type ↕</th>
                            <th>Last sync ↕</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repositorySets.map((repo) => (
                            <tr key={repo.name}>
                              <td>{repo.name}</td>
                              <td>{repo.state}</td>
                              <td>{repo.source}</td>
                              <td>{repo.contentType}</td>
                              <td>{repo.lastSync}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
            )}
            {activeTab === 'capabilities' && (
              <section className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {capabilityCards.map((card) => (
                    <article key={card.title} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-2xl font-semibold text-slate-800">{card.title}</h3>
                      <p className="mt-3 text-base text-slate-600">{card.description}</p>
                      <p className="mt-6 text-sm text-slate-700">● {card.state}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'recommendations' && (
              <section className="machine-card">
                <div className="machine-section">
                  <h2>Recommendations</h2>
                  <p className="text-sm text-slate-500">Rekommenderade uppdateringar och historik för {machineName}.</p>
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

            {activeTab === 'tutorials' && (
              <section className="machine-card space-y-4">
                <div className="machine-section">
                  <h2>Tutorials</h2>
                  <p className="text-sm text-slate-500">Guider för patchning, schemaläggning och felsökning på individuell maskin.</p>
                </div>

                <ul className="text-sm text-slate-700 list-disc pl-5 space-y-2">
                  <li>Planera och köra en patchrunda för en singelserver.</li>
                  <li>Bygg en playbook för ett kluster med rolling updates.</li>
                  <li>Verifiera resultat via logs, insights och policy-status.</li>
                </ul>

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
