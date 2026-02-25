import { loadInventorySummary } from '@/lib/inventory';
import { FiActivity, FiArrowLeft, FiBox, FiCheckCircle, FiClock, FiCpu, FiDatabase, FiHardDrive, FiLock, FiRefreshCw, FiSettings, FiShield, FiSliders, FiTool, FiUser } from 'react-icons/fi';

const ENV_OPTIONS = ['prod', 'qa', 'dev'] as const;
const DEFAULT_BASE_PATH = 'environments';

type MachineSection = 'overview' | 'updates' | 'security' | 'advisor-recommendations' | 'extensions' | 'continuous-delivery' | 'configuration' | 'identity' | 'properties' | 'locks';
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
  searchParams?: { env?: string; basePath?: string; section?: string; tab?: string; content?: string };
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


export default function MachinePage({ params, searchParams }: MachinePageProps) {
  const selectedEnv = ENV_OPTIONS.includes(searchParams?.env as (typeof ENV_OPTIONS)[number])
    ? (searchParams?.env as (typeof ENV_OPTIONS)[number])
    : 'prod';
  const selectedBasePath = searchParams?.basePath || DEFAULT_BASE_PATH;
  const activeSection: MachineSection =
    searchParams?.section === 'updates' ||
    searchParams?.section === 'security' ||
    searchParams?.section === 'advisor-recommendations' ||
    searchParams?.section === 'extensions' ||
    searchParams?.section === 'continuous-delivery' ||
    searchParams?.section === 'configuration' ||
    searchParams?.section === 'identity' ||
    searchParams?.section === 'properties' ||
    searchParams?.section === 'locks'
      ? searchParams.section
      : 'overview';

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

  const criticalCount = updates.filter((u) => u.classification === 'Critical').length;
  const securityCount = updates.filter((u) => u.classification === 'Security').length;
  const otherCount = updates.filter((u) => u.classification === 'Other').length;

  const machineBaseHref = `/machines/${encodeURIComponent(machineName)}?env=${selectedEnv}&basePath=${selectedBasePath}`;
  const updatesBaseHref = `${machineBaseHref}&section=updates`;

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

  const overviewDetails = [
    {
      title: 'System properties',
      items: [
        { label: 'Host UUID', value: `srv-${Math.max(serverIndex, 0).toString().padStart(4, '0')}` },
        { label: 'Hardware type', value: resourceType },
        { label: 'Cluster', value: server?.cluster || 'standalone' }
      ]
    },
    {
      title: 'Provisioning',
      items: [
        { label: 'Provisioned by', value: 'Autopatch Provisioner' },
        { label: 'Provisioned date', value: '2025-11-14' },
        { label: 'Lifecycle', value: selectedEnv === 'prod' ? 'Production' : 'Non-production' }
      ]
    },
    {
      title: 'BIOS',
      items: [
        { label: 'Vendor', value: resourceType === 'Virtual machine' ? 'Phoenix Technologies' : 'Dell Inc.' },
        { label: 'Version', value: resourceType === 'Virtual machine' ? '6.00' : '2.18.2' },
        { label: 'Boot mode', value: 'UEFI' }
      ]
    },
    {
      title: 'Registration details',
      items: [
        { label: 'Subscription status', value: 'Registered' },
        { label: 'Registered to', value: 'Overseer Satellite' },
        { label: 'Last check-in', value: '2026-02-22 15:12:24' }
      ]
    },
    {
      title: 'Operating system',
      items: [
        { label: 'Distribution', value: distribution },
        { label: 'Platform', value: platform },
        { label: 'Kernel', value: platform === 'Linux' ? '5.15.0-106' : 'N/A' }
      ]
    },
    {
      title: 'HW properties',
      items: [
        { label: 'vCPU / CPU', value: server?.cluster === 'standalone' ? '32 cores' : '8 vCPU' },
        { label: 'Memory', value: server?.cluster === 'standalone' ? '128 GB' : '32 GB' },
        { label: 'Storage', value: server?.cluster === 'standalone' ? '3.8 TB NVMe' : '450 GB SSD' }
      ]
    },
    {
      title: 'Networking interfaces',
      items: [
        { label: 'Primary NIC', value: 'ens160 · Connected' },
        { label: 'IPv4', value: server?.ip || '10.0.0.10' },
        { label: 'DNS domain', value: `${selectedEnv}.local` }
      ]
    }
  ];


  const securityFindings = [
    { cve: 'CVE-2026-1123', package: 'openssl', severity: 'High', status: 'Open', action: 'Patch with LSA-2026-017' },
    { cve: 'CVE-2026-1301', package: 'kernel', severity: 'Critical', status: 'Mitigated in staging', action: 'Promote tested kernel rollout' },
    { cve: 'CVE-2026-1440', package: 'containerd', severity: 'Medium', status: 'Open', action: 'Schedule during maintenance window' }
  ];

  const policyChecks = [
    { policy: 'Critical patches within 7 days', status: 'At risk', details: '1 patch is older than SLA' },
    { policy: 'No unsupported repositories', status: 'Compliant', details: 'Only approved repositories active' },
    { policy: 'Reboot after kernel update', status: 'Compliant', details: 'Last kernel reboot completed' }
  ];

  const advisorHighlights = [
    'Enable automatic CVE triage for critical vulnerabilities.',
    'Move one-time updates into controlled weekly maintenance.',
    'Attach this machine to the hardened Linux baseline policy.'
  ];

  const machineMenuItems: { key: MachineSection; label: string; icon: typeof FiActivity }[] = [
    { key: 'overview', label: 'Overview', icon: FiActivity },
    { key: 'updates', label: 'Updates', icon: FiSettings },
    { key: 'security', label: 'Security', icon: FiShield },
    { key: 'advisor-recommendations', label: 'Advisor recommendations', icon: FiCheckCircle },
    { key: 'extensions', label: 'Extensions', icon: FiBox },
    { key: 'continuous-delivery', label: 'Continuous delivery', icon: FiRefreshCw },
    { key: 'configuration', label: 'Configuration', icon: FiSliders },
    { key: 'identity', label: 'Identity', icon: FiUser },
    { key: 'properties', label: 'Properties', icon: FiCpu },
    { key: 'locks', label: 'Locks', icon: FiLock }
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
        <div className="brand">Overseer Console</div>
        <input className="header-search" placeholder="Search machines, updates and docs" />
        <div className="header-user">Connie Wilson · CONTOSO</div>
      </header>

      <section className="shell-page-intro">
        <div className="shell-page-breadcrumbs">
          <a href="/">Home</a>
          <span>›</span>
          <a href={`/?env=${selectedEnv}&view=machines&basePath=${selectedBasePath}`}>Machines</a>
          <span>›</span>
          <span>{machineName}</span>
        </div>
        <h1 className="shell-page-title">Overseer Update Manager</h1>
        <p className="shell-page-subtitle">Machine details and update operations for {machineName}.</p>
      </section>

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
                <a className={`side-link ${activeSection === item.key ? 'active' : ''}`} key={item.label} href={`${machineBaseHref}&section=${item.key}`}>
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
            <section className="machine-title-row">
              <div>
                <h1 className="machine-title">⚙ {machineName} | Updates</h1>
                <p className="machine-subtitle">{resourceType} · {platform} / {distribution} · {selectedEnv.toUpperCase()}</p>
              </div>
              <button className="machine-close-btn" type="button">×</button>
            </section>

            <p className="pane-context-text">Machine workflow · Use refresh, update checks, one-time update and scheduling actions from the command row below.</p>

            <section className="machine-actions-row">
              <button className="machine-action">Leave new experience</button>
              <button className="machine-action">Refresh</button>
              <button className="machine-action">Check for updates</button>
              <button className="machine-action">One-time update</button>
              <button className="machine-action">Scheduled updates</button>
              <button className="machine-action">Update settings</button>
              <button className="machine-action">Overseer Update Manager</button>
            </section>

            <section className="machine-announcement">
              <p>Manage VM updates at scale with the new Overseer update orchestration flow. <a className="link" href={`/?env=${selectedEnv}&view=machines&basePath=${selectedBasePath}`}>Learn more</a></p>
            </section>

            {!server && <p className="text-sm text-rose-700">Machine not found in inventory for selected environment.</p>}

            {activeSection === 'overview' && (
              <>
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

                <section className="machine-card space-y-5">
                  <div className="machine-section">
                    <h2>Details</h2>
                    <p className="text-sm text-slate-500">Detaljerad systeminformation för maskinen, uppdelad per område.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {overviewDetails.map((detailGroup) => (
                      <article key={detailGroup.title} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-sm font-semibold text-slate-800">{detailGroup.title}</h3>
                        <div className="mt-3 space-y-2">
                          {detailGroup.items.map((item) => (
                            <div key={item.label} className="flex items-start justify-between gap-3 text-sm">
                              <span className="text-slate-600">{item.label}</span>
                              <strong className="text-right font-medium text-slate-900">{item.value}</strong>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </>
            )}

            {activeSection === 'updates' && (
              <section className="machine-card">
                <div className="machine-section">
                  <h2>Updates</h2>
                  <div className="machine-pill-row">
                    <span>Total updates ⓘ</span>
                    <strong>{updates.length}</strong>
                    <span className="machine-divider">|</span>
                    <span>Critical updates ⓘ</span>
                    <strong className="text-amber-700">⚠ {criticalCount}</strong>
                    <span className="machine-divider">|</span>
                    <span>Security updates ⓘ</span>
                    <strong className="text-amber-700">⚠ {securityCount}</strong>
                    <span className="machine-divider">|</span>
                    <span>Other updates ⓘ</span>
                    <strong>● {otherCount}</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-500">Last assessed: 2026-02-22 15:12:24</p>

                <section className="machine-content-tabs">
                  {contentTabs.map((tabItem) => (
                    <a
                      key={tabItem.id}
                      className={`machine-content-tab ${contentTab === tabItem.id ? 'active' : ''}`}
                      href={`${updatesBaseHref}&content=${tabItem.id}`}
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

            {activeSection === 'security' && (
              <section className="machine-card space-y-4">
                <div className="machine-section">
                  <h2>Security posture</h2>
                  <p className="text-sm text-slate-500">CVE exposure, compliance drift och rekommenderade säkerhetsåtgärder för {machineName}.</p>
                </div>

                <div className="machine-summary-grid">
                  <article className="machine-summary-card"><p>Open CVEs</p><strong className="text-rose-700">{securityFindings.filter((item) => item.status === 'Open').length}</strong></article>
                  <article className="machine-summary-card"><p>Critical CVEs</p><strong className="text-amber-700">{securityFindings.filter((item) => item.severity === 'Critical').length}</strong></article>
                  <article className="machine-summary-card"><p>Errata available</p><strong>{errata.length}</strong></article>
                  <article className="machine-summary-card"><p>Policy drift</p><strong>{policyChecks.filter((item) => item.status !== 'Compliant').length}</strong></article>
                </div>

                <section className="grid gap-4 md:grid-cols-2">
                  <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-800">Hardening status</h3>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      <li>SELinux: Enforcing</li>
                      <li>SSH root login: Disabled</li>
                      <li>CIS baseline: 92% compliant</li>
                    </ul>
                  </article>
                  <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-800">Recommended actions</h3>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      <li>Patch open critical CVEs within 48h.</li>
                      <li>Pin unsupported repositories to approved mirrors.</li>
                      <li>Schedule post-kernel reboot verification.</li>
                    </ul>
                  </article>
                </section>

                <div className="overflow-x-auto">
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">CVE findings</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr><th>CVE</th><th>Package</th><th>Severity</th><th>Status</th><th>Recommended action</th></tr>
                    </thead>
                    <tbody>
                      {securityFindings.map((finding) => (
                        <tr key={finding.cve}>
                          <td>{finding.cve}</td><td>{finding.package}</td><td>{finding.severity}</td><td>{finding.status}</td><td>{finding.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto">
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">Policy compliance</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr><th>Policy</th><th>Status</th><th>Details</th></tr>
                    </thead>
                    <tbody>
                      {policyChecks.map((policy) => (
                        <tr key={policy.policy}><td>{policy.policy}</td><td>{policy.status}</td><td>{policy.details}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeSection === 'advisor-recommendations' && (
              <section className="machine-card space-y-4">
                <div className="machine-section">
                  <h2>Advisor recommendations</h2>
                  <p className="text-sm text-slate-500">Actionable guidance tailored to this machine.</p>
                </div>
                <ul className="text-sm text-slate-700 list-disc pl-5 space-y-2">
                  {advisorHighlights.map((item) => (<li key={item}>{item}</li>))}
                </ul>
              </section>
            )}

            {activeSection !== 'overview' && activeSection !== 'updates' && activeSection !== 'security' && activeSection !== 'advisor-recommendations' && (
              <section className="machine-card">
                <div className="machine-section">
                  <h2>{machineMenuItems.find((item) => item.key === activeSection)?.label}</h2>
                  <p className="text-sm text-slate-500">This section is prepared for future operational data integration.</p>
                </div>
              </section>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
