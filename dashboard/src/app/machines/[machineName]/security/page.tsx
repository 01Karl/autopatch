import MachineShell from '../_components/MachineShell';
import { errata, getMachineContext, MachinePageSearchParams, policyChecks, securityFindings } from '../_lib/machine-data';

type Props = {
  params: { machineName: string };
  searchParams?: MachinePageSearchParams;
};

export default function MachineSecurityPage({ params, searchParams }: Props) {
  const context = getMachineContext(params.machineName, searchParams);

  return (
    <MachineShell activeSection="security" {...context}>
      {!context.server && <p className="text-sm text-rose-700">Machine not found in inventory for selected environment.</p>}

      <section className="machine-card space-y-4">
        <div className="machine-section">
          <h2>Security posture</h2>
          <p className="text-sm text-slate-500">CVE exposure, compliance drift och rekommenderade säkerhetsåtgärder för {context.machineName}.</p>
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
    </MachineShell>
  );
}
