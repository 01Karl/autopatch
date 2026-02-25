import { FiCpu, FiMapPin, FiRefreshCw, FiShield, FiUsers } from 'react-icons/fi';
import { getMockMachines, MachineEnv } from '@/lib/machines';
import ManagerSidebarNav from '@/app/_components/layout/ManagerSidebarNav';
import LinkTabs from '@/app/_components/ui/LinkTabs';
import { AppButton, AppButtonLink, AppLabelButton } from '@/app/_components/ui/AppButton';
import ColumnVisibilityDrawer, { COLUMN_OPTIONS, type ColumnKey } from './_components/ColumnVisibilityDrawer';

type SearchParams = {
  env?: 'all' | MachineEnv;
  criticality?: string;
  compliance?: string;
  cols?: string | string[];
  view?: 'list' | 'grid';
};

type ViewMode = 'list' | 'grid';

const ENV_OPTIONS: Array<'all' | MachineEnv> = ['all', 'prod', 'qa', 'dev'];

function getComplianceStyle(compliance: string): string {
  if (compliance === 'Non-compliant') return 'text-rose-600';
  if (compliance === 'At risk') return 'text-amber-500';
  if (compliance === 'Compliant') return 'text-emerald-600';
  return 'text-slate-600';
}

function getSelectedColumns(cols?: string | string[]): ColumnKey[] {
  const allColumns = COLUMN_OPTIONS.map((col) => col.key);
  if (!cols) return allColumns;

  const values = Array.isArray(cols)
    ? cols
    : cols
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

  const validColumns = values.filter((value): value is ColumnKey =>
    allColumns.includes(value as ColumnKey)
  );

  return validColumns.length > 0 ? validColumns : allColumns;
}

function getViewMode(view?: string): ViewMode {
  return view === 'grid' ? 'grid' : 'list';
}

export default function MachinesPage({ searchParams }: { searchParams?: SearchParams }) {
  const selectedEnv = ENV_OPTIONS.includes(searchParams?.env as 'all' | MachineEnv) ? (searchParams?.env as 'all' | MachineEnv) : 'prod';
  const selectedCriticality = searchParams?.criticality || 'all';
  const selectedCompliance = searchParams?.compliance || 'all';
  const selectedColumns = getSelectedColumns(searchParams?.cols);
  const selectedColumnSet = new Set(selectedColumns);
  const selectedView = getViewMode(searchParams?.view);

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

  const baseParams = new URLSearchParams({
    env: selectedEnv,
    criticality: selectedCriticality,
    compliance: selectedCompliance
  });
  selectedColumns.forEach((column) => baseParams.append('cols', column));

  const listParams = new URLSearchParams(baseParams);
  listParams.set('view', 'list');
  const gridParams = new URLSearchParams(baseParams);
  gridParams.set('view', 'grid');

  const pageSectionLabel = 'Machines';
  const pageTitle = `Overseer - ${pageSectionLabel}`;
  const pageSubtitle = 'En samlad översikt av maskiner, filter och kolumnval för ett mjukare och tydligare arbetsflöde.';
  const pageWorkflowText = 'Standard workflow · Granska maskinmetadata, justera vyer och borra vidare till detaljer på ett lugnt och konsekvent sätt.';

  return (
    <main className="azure-shell">
      <input id="column-drawer-toggle" type="checkbox" className="peer sr-only" />

      <header className="top-header">
        <div className="brand">Overseer Console</div>
        <input className="header-search" placeholder="Search resources, services and docs" />
        <div className="header-user">Overseer · {pageSectionLabel}</div>
      </header>

      <section className="shell-page-intro">
        <div className="shell-page-breadcrumbs">
          <a href="/">Home</a>
          <span>›</span>
          <span>{pageSectionLabel}</span>
        </div>
        <h1 className="shell-page-title">{pageTitle}</h1>
        <p className="shell-page-subtitle">{pageSubtitle}</p>
      </section>

      <div className="shell-layout">
        <ManagerSidebarNav activeView="machines-all" selectedEnv={selectedEnv} selectedBasePath="environments" />

        <section className="main-pane">
          <p className="pane-context-text">{pageWorkflowText}</p>
          <section className="command-bar">
            <div className="command-left">
              <AppButton type="button"><FiRefreshCw /> Refresh</AppButton>
              <AppButtonLink href={`/?env=${selectedEnv}&view=overview&basePath=environments`}>Back to overview</AppButtonLink>
              <AppLabelButton htmlFor="column-drawer-toggle" className="cursor-pointer">Edit columns</AppLabelButton>
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
              <div className="table-head flex items-center justify-between gap-3">
                <h2>Machine inventory</h2>
                <LinkTabs
                  activeKey={selectedView}
                  containerClassName="inline-flex items-center rounded-md border border-slate-300 bg-white p-1"
                  baseTabClassName="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600"
                  activeTabClassName="bg-slate-800 text-white"
                  tabs={[
                    { key: 'list', label: 'List', href: `/machines?${listParams.toString()}` },
                    { key: 'grid', label: 'Grid', href: `/machines?${gridParams.toString()}` },
                  ]}
                />
              </div>

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
                <div className="flex flex-wrap gap-2 items-end">
                  <AppButton variant="primary" type="submit">Apply</AppButton>
                  <AppButtonLink href={`/machines?env=${selectedEnv}`}>Reset</AppButtonLink>
                  <AppLabelButton htmlFor="column-drawer-toggle" className="cursor-pointer">Edit columns</AppLabelButton>
                </div>
                {selectedColumns.map((column) => (
                  <input key={column} type="hidden" name="cols" value={column} />
                ))}
                <input type="hidden" name="view" value={selectedView} />
              </form>

              {selectedView === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {selectedColumnSet.has('hostname') && <th>Hostname</th>}
                        {selectedColumnSet.has('env') && <th>Env</th>}
                        {selectedColumnSet.has('cluster') && <th>Cluster</th>}
                        {selectedColumnSet.has('uuid') && <th>UUID</th>}
                        {selectedColumnSet.has('role') && <th>Role</th>}
                        {selectedColumnSet.has('owner') && <th>Owner</th>}
                        {selectedColumnSet.has('location') && <th>Location</th>}
                        {selectedColumnSet.has('criticality') && <th>Criticality</th>}
                        {selectedColumnSet.has('compliance') && <th>Compliance</th>}
                        {selectedColumnSet.has('osVersion') && <th>OS</th>}
                        {selectedColumnSet.has('patchWindow') && <th>Patch window</th>}
                        {selectedColumnSet.has('lastSeen') && <th>Last seen</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((machine) => (
                        <tr key={`${machine.env}-${machine.hostname}`}>
                          {selectedColumnSet.has('hostname') && <td><a className="link font-medium" href={`/machines/${encodeURIComponent(machine.hostname)}/overview?env=${machine.env}&basePath=environments`}>{machine.hostname}</a></td>}
                          {selectedColumnSet.has('env') && <td>{machine.env.toUpperCase()}</td>}
                          {selectedColumnSet.has('cluster') && <td>{machine.cluster}</td>}
                          {selectedColumnSet.has('uuid') && <td className="font-mono text-xs text-slate-600">{machine.metadata.uuid}</td>}
                          {selectedColumnSet.has('role') && <td><span className="inline-flex items-center gap-1"><FiCpu /> {machine.metadata.role}</span></td>}
                          {selectedColumnSet.has('owner') && <td><span className="inline-flex items-center gap-1"><FiUsers /> {machine.metadata.owner}</span></td>}
                          {selectedColumnSet.has('location') && <td><span className="inline-flex items-center gap-1"><FiMapPin /> {machine.metadata.location}</span></td>}
                          {selectedColumnSet.has('criticality') && <td>{machine.metadata.criticality}</td>}
                          {selectedColumnSet.has('compliance') && <td><span className={`inline-flex items-center gap-1 ${getComplianceStyle(machine.metadata.compliance)}`}><FiShield /> {machine.metadata.compliance}</span></td>}
                          {selectedColumnSet.has('osVersion') && <td>{machine.metadata.osVersion}</td>}
                          {selectedColumnSet.has('patchWindow') && <td>{machine.metadata.patchWindow}</td>}
                          {selectedColumnSet.has('lastSeen') && <td>{machine.metadata.lastSeen}</td>}
                        </tr>
                      ))}
                      {filtered.length === 0 && <tr><td colSpan={selectedColumns.length} className="text-slate-500">No machines found for selected filters.</td></tr>}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((machine) => (
                    <article key={`${machine.env}-${machine.hostname}`} className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
                      <a className="link text-base font-semibold" href={`/machines/${encodeURIComponent(machine.hostname)}/overview?env=${machine.env}&basePath=environments`}>{machine.hostname}</a>
                      <dl className="mt-3 space-y-1">
                        {selectedColumnSet.has('env') && <div className="flex justify-between gap-2"><dt className="text-slate-500">Env</dt><dd>{machine.env.toUpperCase()}</dd></div>}
                        {selectedColumnSet.has('cluster') && <div className="flex justify-between gap-2"><dt className="text-slate-500">Cluster</dt><dd>{machine.cluster}</dd></div>}
                        {selectedColumnSet.has('uuid') && <div className="flex justify-between gap-2"><dt className="text-slate-500">UUID</dt><dd className="font-mono text-xs text-slate-600">{machine.metadata.uuid}</dd></div>}
                        {selectedColumnSet.has('role') && <div className="flex justify-between gap-2"><dt className="text-slate-500">Role</dt><dd>{machine.metadata.role}</dd></div>}
                        {selectedColumnSet.has('owner') && <div className="flex justify-between gap-2"><dt className="text-slate-500">Owner</dt><dd>{machine.metadata.owner}</dd></div>}
                        {selectedColumnSet.has('location') && <div className="flex justify-between gap-2"><dt className="text-slate-500">Location</dt><dd>{machine.metadata.location}</dd></div>}
                        {selectedColumnSet.has('criticality') && <div className="flex justify-between gap-2"><dt className="text-slate-500">Criticality</dt><dd>{machine.metadata.criticality}</dd></div>}
                        {selectedColumnSet.has('compliance') && <div className="flex justify-between gap-2"><dt className="text-slate-500">Compliance</dt><dd className={getComplianceStyle(machine.metadata.compliance)}>{machine.metadata.compliance}</dd></div>}
                        {selectedColumnSet.has('osVersion') && <div className="flex justify-between gap-2"><dt className="text-slate-500">OS</dt><dd>{machine.metadata.osVersion}</dd></div>}
                        {selectedColumnSet.has('patchWindow') && <div className="flex justify-between gap-2"><dt className="text-slate-500">Patch window</dt><dd>{machine.metadata.patchWindow}</dd></div>}
                        {selectedColumnSet.has('lastSeen') && <div className="flex justify-between gap-2"><dt className="text-slate-500">Last seen</dt><dd>{machine.metadata.lastSeen}</dd></div>}
                      </dl>
                    </article>
                  ))}
                  {filtered.length === 0 && <p className="text-slate-500">No machines found for selected filters.</p>}
                </div>
              )}
            </section>
          </section>
        </section>
      </div>

      <ColumnVisibilityDrawer
        selectedEnv={selectedEnv}
        selectedCriticality={selectedCriticality}
        selectedCompliance={selectedCompliance}
        selectedView={selectedView}
        selectedColumnSet={selectedColumnSet}
      />

    </main>
  );
}
