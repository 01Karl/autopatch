import MachineShell from '../_components/MachineShell';
import { ContentTab, errata, getMachineContext, MachinePageSearchParams, moduleStreams, repositorySets, updates } from '../_lib/machine-data';

type Props = {
  params: { machineName: string };
  searchParams?: MachinePageSearchParams;
};

const contentTabs: { id: ContentTab; label: string }[] = [
  { id: 'packages', label: 'Packages' },
  { id: 'errata', label: 'Errata' },
  { id: 'module-streams', label: 'Module streams' },
  { id: 'repository-sets', label: 'Repository sets' }
];

export default function MachineUpdatesPage({ params, searchParams }: Props) {
  const context = getMachineContext(params.machineName, searchParams);
  const criticalCount = updates.filter((u) => u.classification === 'Critical').length;
  const securityCount = updates.filter((u) => u.classification === 'Security').length;
  const otherCount = updates.filter((u) => u.classification === 'Other').length;

  return (
    <MachineShell activeSection="updates" {...context}>
      {!context.server && <p className="text-sm text-rose-700">Machine not found in inventory for selected environment.</p>}

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
              className={`machine-content-tab ${context.contentTab === tabItem.id ? 'active' : ''}`}
              href={`${context.machineBasePath}/updates?${context.machineQuery}&content=${tabItem.id}`}
            >
              {tabItem.label}
            </a>
          ))}
        </section>

        {context.contentTab === 'packages' && (
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
