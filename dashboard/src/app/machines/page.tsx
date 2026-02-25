import type { IconType } from 'react-icons';
import { FiBarChart2, FiClock, FiCpu, FiHome, FiMapPin, FiMonitor, FiPlayCircle, FiRefreshCw, FiServer, FiShield, FiUsers } from 'react-icons/fi';
import { getMockMachines, MachineEnv } from '@/lib/machines';

type SearchParams = {
  env?: 'all' | MachineEnv;
  criticality?: string;
  compliance?: string;
};

type NavKey = 'overview' | 'get-started' | 'playbooks' | 'machines' | 'history' | 'update-reports';

type NavItem = {
  key: NavKey;
  label: string;
  icon: IconType;
};

type NavSection = {
  title: string;
  keys: NavKey[];
};

const ENV_OPTIONS: Array<'all' | MachineEnv> = ['all', 'prod', 'qa', 'dev'];

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: FiHome },
  { key: 'get-started', label: 'Get started', icon: FiPlayCircle },
  { key: 'playbooks', label: 'Playbooks', icon: FiServer },
  { key: 'machines', label: 'Machines', icon: FiMonitor },
  { key: 'history', label: 'History', icon: FiClock },
  { key: 'update-reports', label: 'Update reports', icon: FiBarChart2 }
];

const NAV_SECTIONS: NavSection[] = [
  { title: 'Manager', keys: ['overview', 'get-started', 'playbooks'] },
  { title: 'Machines', keys: ['machines', 'history'] },
  { title: 'Reports', keys: ['update-reports'] }
];

export default function MachinesPage({ searchParams }: { searchParams?: SearchParams }) {
  const selectedEnv = ENV_OPTIONS.includes(searchParams?.env as 'all' | MachineEnv) ? (searchParams?.env as 'all' | MachineEnv) : 'prod';
  const selectedCriticality = searchParams?.criticality || 'all';
  const selectedCompliance = searchParams?.compliance || 'all';

  const machines = getMockMachines(selectedEnv);
  const filtered = machines.filter((machine) => {
    const criticalityMatch = selectedCriticality === 'all' || machine.metadata.criticality === selectedCriticality;
    const complianceMatch = selectedCompliance === 'all' || machine.metadata.compliance === selectedCompliance;
    return criticalityMatch && complianceMatch;
  });

  const criticalCount = filtered.filter((m) => m.metadata.criticality === 'critical').length;
  const compliantCount = filtered.filter((m) => m.metadata.compliance === 'Compliant').length;

  const criticalityOptions = ['all', ...new Set(machines.map((m) => m.metadata.criticality))];
  const complianceOptions = ['all', ...new Set(machines.map((m) => m.metadata.compliance))];

  return (
    <main className="azure-shell">
      <header className="top-header">
        <div className="brand">Overseer Console</div>
        <input className="header-search" placeholder="Search resources, services and docs" />
        <div className="header-user">Machine inventory</div>
      </header>

      <section className="shell-page-intro">
        <div className="shell-page-breadcrumbs">
          <a href="/">Home</a>
          <span>›</span>
          <span>Machines</span>
        </div>
        <h1 className="shell-page-title">Overseer Update Manager</h1>
        <p className="shell-page-subtitle">Machine inventory from mock-data with per-host metadata.</p>
      </section>

      <div className="shell-layout">
        <aside className="side-nav">
          <input className="side-search" placeholder="Search" />
          {NAV_SECTIONS.map((section) => (
            <section className="side-section" key={section.title}>
              <p className="side-title">{section.title}</p>
              {section.keys.map((key) => {
                const item = NAV_ITEMS.find((navItem) => navItem.key === key);
                if (!item) return null;
                const NavIcon = item.icon;
                const itemHref = item.key === 'machines'
                  ? `/machines?env=${selectedEnv}`
                  : `/?env=${selectedEnv}&view=${item.key}&basePath=environments`;
                return (
                  <a
                    key={item.key}
                    href={itemHref}
                    className={`side-link ${item.key === 'machines' ? 'active' : ''}`}
                  >
                    <span className="side-icon"><NavIcon /></span>
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </section>
          ))}
        </aside>

        <section className="main-pane">
          <p className="pane-context-text">Standard workflow · Review machine metadata and drill into individual machine pages.</p>
          <section className="command-bar">
            <div className="command-left">
              <button className="ghost-btn" type="button"><FiRefreshCw /> Refresh</button>
              <a className="ghost-btn" href={`/?env=${selectedEnv}&view=overview&basePath=environments`}>Back to overview</a>
            </div>
          </section>

          <section className="content-area space-y-5">
            <div className="kpi-grid">
              <article className="kpi-card"><p className="kpi-title">Total machines</p><p className="kpi-value">{filtered.length}</p></article>
              <article className="kpi-card"><p className="kpi-title">Critical machines</p><p className="kpi-value text-rose-700">{criticalCount}</p></article>
              <article className="kpi-card"><p className="kpi-title">Compliant</p><p className="kpi-value text-emerald-700">{compliantCount}</p></article>
              <article className="kpi-card"><p className="kpi-title">Environment</p><p className="kpi-value">{selectedEnv.toUpperCase()}</p></article>
            </div>

            <section className="table-card">
              <div className="table-head"><h2>Machine inventory</h2></div>

              <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 p-4 border-b border-slate-200" method="get">
                <label className="text-xs text-slate-500">Environment
                  <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm" name="env" defaultValue={selectedEnv}>
                    {ENV_OPTIONS.map((env) => (<option key={env} value={env}>{env === 'all' ? 'All environments' : env.toUpperCase()}</option>))}
                  </select>
                </label>
                <label className="text-xs text-slate-500">Criticality
                  <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm" name="criticality" defaultValue={selectedCriticality}>
                    {criticalityOptions.map((value) => (<option key={value} value={value}>{value === 'all' ? 'All levels' : value}</option>))}
                  </select>
                </label>
                <label className="text-xs text-slate-500">Compliance
                  <select className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm" name="compliance" defaultValue={selectedCompliance}>
                    {complianceOptions.map((value) => (<option key={value} value={value}>{value === 'all' ? 'All states' : value}</option>))}
                  </select>
                </label>
                <div className="flex gap-2 items-end">
                  <button className="primary-btn" type="submit">Apply</button>
                  <a className="ghost-btn" href={`/machines?env=${selectedEnv}`}>Reset</a>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th>Hostname</th><th>Env</th><th>Cluster</th><th>Role</th><th>Owner</th><th>Location</th><th>Criticality</th><th>Compliance</th><th>OS</th><th>Patch window</th><th>Last seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((machine) => (
                      <tr key={`${machine.env}-${machine.hostname}`}>
                        <td>
                          <a className="link font-medium" href={`/machines/${encodeURIComponent(machine.hostname)}/overview?env=${machine.env}&basePath=environments`}>{machine.hostname}</a>
                        </td>
                        <td>{machine.env.toUpperCase()}</td>
                        <td>{machine.cluster}</td>
                        <td><span className="inline-flex items-center gap-1"><FiCpu /> {machine.metadata.role}</span></td>
                        <td><span className="inline-flex items-center gap-1"><FiUsers /> {machine.metadata.owner}</span></td>
                        <td><span className="inline-flex items-center gap-1"><FiMapPin /> {machine.metadata.location}</span></td>
                        <td>{machine.metadata.criticality}</td>
                        <td><span className="inline-flex items-center gap-1"><FiShield /> {machine.metadata.compliance}</span></td>
                        <td>{machine.metadata.osVersion}</td>
                        <td>{machine.metadata.patchWindow}</td>
                        <td>{machine.metadata.lastSeen}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && <tr><td colSpan={11} className="text-slate-500">No machines found for selected filters.</td></tr>}
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
