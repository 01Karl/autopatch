import MachineShell from '../_components/MachineShell';
import { getMachineContext, gpgKeyStatus, MachinePageSearchParams, repositorySets } from '../_lib/machine-data';

type Props = {
  params: { machineName: string };
  searchParams?: MachinePageSearchParams;
};

export default function MachineRepositoryTrustPage({ params, searchParams }: Props) {
  const context = getMachineContext(params.machineName, searchParams);

  return (
    <MachineShell activeSection="repository-trust" {...context}>
      <section className="machine-card space-y-4">
        <div className="machine-section">
          <h2>Repository trust & signing</h2>
          <p className="text-sm text-slate-500">Håll koll på GPG-nycklar, signeringspolicy och osignerat innehåll för {context.machineName}.</p>
        </div>

        <div className="machine-summary-grid">
          <article className="machine-summary-card"><p>Configured keys</p><strong>{gpgKeyStatus.length}</strong></article>
          <article className="machine-summary-card"><p>Trusted keys</p><strong className="text-emerald-700">{gpgKeyStatus.filter((item) => item.trust === 'Trusted').length}</strong></article>
          <article className="machine-summary-card"><p>Rotation needed</p><strong className="text-amber-700">{gpgKeyStatus.filter((item) => item.trust !== 'Trusted').length}</strong></article>
          <article className="machine-summary-card"><p>Enabled repositories</p><strong>{repositorySets.filter((item) => item.state === 'Enabled').length}</strong></article>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Signing policy</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>gpgcheck=1 enforced for DNF/YUM.</li>
              <li>repo_gpgcheck required for production repositories.</li>
              <li>Unsigned metadata is blocked and logged.</li>
            </ul>
          </article>
          <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Recommended actions</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Rotate EPEL key before expiration.</li>
              <li>Pin key sources to internal mirror where possible.</li>
              <li>Alert on unknown key import attempts.</li>
            </ul>
          </article>
        </section>

        <div className="overflow-x-auto">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Installed GPG keys</h3>
          <table className="w-full text-sm">
            <thead>
              <tr><th>Key ID</th><th>Source</th><th>Fingerprint</th><th>Expires</th><th>Trust status</th></tr>
            </thead>
            <tbody>
              {gpgKeyStatus.map((key) => (
                <tr key={key.keyId}>
                  <td>{key.keyId}</td><td>{key.source}</td><td>{key.fingerprint}</td><td>{key.expires}</td><td>{key.trust}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </MachineShell>
  );
}
