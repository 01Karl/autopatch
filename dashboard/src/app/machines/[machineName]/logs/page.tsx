import MachineShell from '../_components/MachineShell';
import { getMachineContext, logInsights, MachinePageSearchParams } from '../_lib/machine-data';

type Props = {
  params: { machineName: string };
  searchParams?: MachinePageSearchParams;
};

export default function MachineLogsPage({ params, searchParams }: Props) {
  const context = getMachineContext(params.machineName, searchParams);

  return (
    <MachineShell activeSection="logs" {...context}>
      <section className="machine-card space-y-4">
        <div className="machine-section">
          <h2>Linux logs & signals</h2>
          <p className="text-sm text-slate-500">Samlad vy för journald, auditd, kernel och pakethändelser kopplade till drift och säkerhet.</p>
        </div>

        <div className="machine-summary-grid">
          <article className="machine-summary-card"><p>Total signals (24h)</p><strong>{logInsights.reduce((sum, item) => sum + item.count, 0)}</strong></article>
          <article className="machine-summary-card"><p>Critical events</p><strong className="text-rose-700">{logInsights.filter((item) => item.level === 'Critical').length}</strong></article>
          <article className="machine-summary-card"><p>Warning events</p><strong className="text-amber-700">{logInsights.filter((item) => item.level === 'Warning').length}</strong></article>
          <article className="machine-summary-card"><p>Info events</p><strong>{logInsights.filter((item) => item.level === 'Info').length}</strong></article>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Collection</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>journald forwarding to centralized syslog is enabled.</li>
              <li>auditd watches sudoers, sshd_config and /etc/yum.repos.d.</li>
              <li>Kernel ring buffer snapshots retained 7 days.</li>
            </ul>
          </article>
          <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Suggested follow-up</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Create SIEM alert on repeated ssh failures from same source.</li>
              <li>Review SELinux deny context and tune policy where needed.</li>
              <li>Investigate blocked unsigned metadata source.</li>
            </ul>
          </article>
        </section>

        <div className="overflow-x-auto">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Recent log signals</h3>
          <table className="w-full text-sm">
            <thead>
              <tr><th>Source</th><th>Signal</th><th>Level</th><th>Count</th><th>Latest occurrence</th></tr>
            </thead>
            <tbody>
              {logInsights.map((entry) => (
                <tr key={`${entry.source}-${entry.signal}`}>
                  <td>{entry.source}</td><td>{entry.signal}</td><td>{entry.level}</td><td>{entry.count}</td><td>{entry.latest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </MachineShell>
  );
}
