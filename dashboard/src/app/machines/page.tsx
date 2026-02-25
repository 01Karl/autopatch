import { FiArrowLeft, FiCpu, FiMapPin, FiShield, FiUsers } from 'react-icons/fi';
import { getMockMachines, MachineEnv } from '@/lib/machines';

type SearchParams = {
  env?: 'all' | MachineEnv;
  criticality?: string;
  compliance?: string;
};

const ENV_OPTIONS: Array<'all' | MachineEnv> = ['all', 'prod', 'qa', 'dev'];

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
        <input className="header-search" placeholder="Search machines, owners or roles" />
        <div className="header-user">Machine inventory</div>
      </header>

      <section className="shell-page-intro">
        <div className="shell-page-breadcrumbs">
          <a href="/">Home</a>
          <span>›</span>
          <span>Machines</span>
        </div>
        <h1 className="shell-page-title">Machines</h1>
        <p className="shell-page-subtitle">All machine objects are loaded from mock-data, including per-host metadata.</p>
      </section>

      <section className="main-pane max-w-[1400px] mx-auto">
        <section className="machine-actions-row mb-4">
          <a className="machine-action" href="/"><FiArrowLeft /> Back to dashboard</a>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-4">
          <article className="machine-summary-card"><p>Total machines</p><strong>{filtered.length}</strong></article>
          <article className="machine-summary-card"><p>Criticality: critical</p><strong className="text-rose-700">{criticalCount}</strong></article>
          <article className="machine-summary-card"><p>Compliant hosts</p><strong className="text-emerald-700">{compliantCount}</strong></article>
          <article className="machine-summary-card"><p>Selected environment</p><strong>{selectedEnv.toUpperCase()}</strong></article>
        </section>

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
    </main>
  );
}
