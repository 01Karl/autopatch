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

  const updates = [
    { name: 'Kernel security rollup', classification: 'Security', severity: 'Critical', kb: 'LSA-2026-001', reboot: 'Requires reboot', published: '2026-01-18 03:10' },
    { name: 'OpenSSL package refresh', classification: 'Critical', severity: 'Important', kb: 'LSA-2026-017', reboot: 'No reboot', published: '2026-01-20 11:30' },
    { name: 'Container runtime update', classification: 'Other', severity: 'Moderate', kb: 'LSA-2026-028', reboot: 'No reboot', published: '2026-02-02 07:50' }
  ];

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
          {['Overview', 'Security', 'Extensions', 'Configuration', 'Identity', 'Properties'].map((item) => (
            <span className="side-link" key={item}>{item}</span>
          ))}

          <p className="side-title mt-4">Operations</p>
          {['Bastion', 'Backup', 'Disaster recovery', 'Updates', 'Inventory', 'Change tracking'].map((item) => (
            <span className={`side-link ${item === 'Updates' ? 'active' : ''}`} key={item}>{item}</span>
          ))}
        </aside>

        <section className="main-pane">
          <section className="command-bar">
            <div className="command-left text-sm text-slate-500">Home / OpenPatch Update Manager / {machineName}</div>
            <div className="command-right">
              <button className="ghost-btn" type="button">Refresh</button>
              <button className="ghost-btn" type="button">Check for updates</button>
              <button className="ghost-btn" type="button">One-time update</button>
              <button className="ghost-btn" type="button">Scheduled updates</button>
              <button className="ghost-btn" type="button">Update settings</button>
            </div>
          </section>

          <section className="content-area space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold">{machineName} | Updates</h1>
                <p className="text-sm text-slate-500">{resourceType} · {platform} / {distribution} · {selectedEnv.toUpperCase()}</p>
              </div>
              <span className="chip">OpenPatch managed updates view</span>
            </div>

            {!server && <p className="text-sm text-rose-700">Machine not found in inventory for selected environment.</p>}

            <section className="info-banner">
              <p className="text-sm text-slate-700">Manage machine updates at scale with OpenPatch policy-driven rollout.</p>
              <a className="link" href={`/?env=${selectedEnv}&view=machines&basePath=${selectedBasePath}`}>Return to machine list</a>
            </section>

            <section className="tabs-row rounded-md border border-slate-200">
              <span className="tab active">Recommended updates</span>
              <span className="tab">Update history</span>
              <span className="tab">Scheduling</span>
            </section>

            <section className="table-card p-4 space-y-4">
              <div>
                <h2 className="text-sm font-semibold">Infrastructure (host) updates</h2>
                <p className="text-sm text-slate-500 mt-1">Maintenance timeline: <strong className="text-slate-700">No upcoming updates</strong></p>
              </div>

              <div>
                <h2 className="text-sm font-semibold">Operating system (guest) updates</h2>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span>Periodic assessment: <strong className="text-emerald-700">{periodicAssessment}</strong></span>
                  <span>Patch orchestration: <strong className="text-slate-800">{patchOrchestration}</strong></span>
                  <span>Platform: <strong className="text-slate-800">{platform}</strong></span>
                  <span>Distribution: <strong className="text-slate-800">{distribution}</strong></span>
                  <span>Hotpatch: <strong className="text-slate-800">Disabled</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <article className="kpi-card"><p className="kpi-title">Total updates</p><p className="kpi-value">{updates.length}</p></article>
                <article className="kpi-card"><p className="kpi-title">Critical updates</p><p className="kpi-value text-amber-700">{criticalCount}</p></article>
                <article className="kpi-card"><p className="kpi-title">Security updates</p><p className="kpi-value text-amber-700">{securityCount}</p></article>
                <article className="kpi-card"><p className="kpi-title">Other updates</p><p className="kpi-value">{otherCount}</p></article>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="chip">Search by update name / KB</span>
                <span className="chip">Classification: All</span>
                <span className="chip">Severity (MSRC): All</span>
                <span className="chip">Reboot required: All</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th>Update name</th><th>Classification</th><th>Severity</th><th>KB IDs</th><th>Reboot required</th><th>Published date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {updates.map((update) => (
                      <tr key={update.kb}>
                        <td>{update.name}</td><td>{update.classification}</td><td>{update.severity}</td><td>{update.kb}</td><td>{update.reboot}</td><td>{update.published}</td>
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
