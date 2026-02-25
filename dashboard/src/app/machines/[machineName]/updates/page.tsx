import MachineShell from '../_components/MachineShell';
import { contentPackages, errata, getMachineContext, MachinePageSearchParams, moduleStreams, repositorySets } from '../_lib/machine-data';
import PackagesTable from './_components/PackagesTable';

type Props = {
  params: { machineName: string };
  searchParams?: MachinePageSearchParams;
};

export default function MachineUpdatesPage({ params, searchParams }: Props) {
  const context = getMachineContext(params.machineName, searchParams);
  const upgradableCount = contentPackages.filter((pkg) => pkg.status !== 'Up-to-date').length;
  const upToDateCount = contentPackages.filter((pkg) => pkg.status === 'Up-to-date').length;

  return (
    <MachineShell activeSection="updates" {...context}>
      {!context.server && <p className="text-sm text-rose-700">Machine not found in inventory for selected environment.</p>}

      <section className="machine-card">
        <div className="machine-section">
          <h2>Content</h2>
          <div className="machine-pill-row">
            <span>Total packages ⓘ</span>
            <strong>{contentPackages.length}</strong>
            <span className="machine-divider">|</span>
            <span>Upgradable ⓘ</span>
            <strong className="text-amber-700">⚠ {upgradableCount}</strong>
            <span className="machine-divider">|</span>
            <span>Up-to-date ⓘ</span>
            <strong className="text-emerald-700">✓ {upToDateCount}</strong>
          </div>
        </div>

        <p className="text-xs text-slate-500">Last assessed: 2026-02-22 15:12:24</p>

        {context.contentTab === 'packages' && (
          <PackagesTable packages={contentPackages} machineBasePath={context.machineBasePath} machineQuery={context.machineQuery} />
        )}

        {context.contentTab === 'errata' && (
          <>
            <div className="machine-filter-row">
              <span className="machine-filter-chip">Search errata ID...</span>
              <span className="machine-filter-chip">Type : All</span>
              <span className="machine-filter-chip">Severity : All</span>
              <span className="machine-filter-chip">Installable : Applicable</span>
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
                    <th>CVEs ↕</th>
                    <th>Packages ↕</th>
                    <th>Synopsis ↕</th>
                    <th>Published / Updated ↕</th>
                  </tr>
                </thead>
                <tbody>
                  {errata.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.id}</td>
                      <td>{entry.type}</td>
                      <td>{entry.severity}</td>
                      <td>{entry.installable}</td>
                      <td>{entry.cves.length > 0 ? entry.cves.join(', ') : '—'}</td>
                      <td>{entry.packages}</td>
                      <td>{entry.synopsis}</td>
                      <td>{entry.published} / {entry.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {context.contentTab === 'module-streams' && (
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

        {context.contentTab === 'repository-sets' && (
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
    </MachineShell>
  );
}
