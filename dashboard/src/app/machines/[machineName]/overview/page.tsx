import MachineShell from '../_components/MachineShell';
import { getMachineContext, MachinePageSearchParams } from '../_lib/machine-data';

type Props = {
  params: { machineName: string };
  searchParams?: MachinePageSearchParams;
};

export default function MachineOverviewPage({ params, searchParams }: Props) {
  const context = getMachineContext(params.machineName, searchParams);

  const essentials = [
    { label: 'Computer name', value: context.machineName },
    { label: 'FQDN', value: context.server?.fqdn || `${context.machineName}.${context.selectedEnv}.local` },
    { label: 'Operating system', value: context.distribution },
    { label: 'Operating system version', value: context.platform === 'Linux' ? 'Kernel 5.15 LTS' : 'Kernel N/A' },
    { label: 'Manufacturer', value: context.resourceType === 'Virtual machine' ? 'VMware, Inc.' : 'Dell Technologies' },
    { label: 'Model', value: context.resourceType === 'Virtual machine' ? 'VMware Virtual Platform' : 'PowerEdge R760' }
  ];

  const kpiCards = [
    { label: 'Uptime', value: '46 days', detail: 'Last reboot 2026-01-07 02:13' },
    { label: 'Patch posture', value: '92%', detail: '18/19 policy checks satisfied' },
    { label: 'Open incidents', value: '2', detail: '1 high, 1 medium priority' },
    { label: 'Maintenance window', value: 'Sunday 02:00', detail: 'Duration 2h · CET' }
  ];

  const overviewDetails = [
    {
      title: 'System properties',
      items: [
        { label: 'Host UUID', value: `srv-${Math.max(context.serverIndex, 0).toString().padStart(4, '0')}` },
        { label: 'Hardware type', value: context.resourceType },
        { label: 'Cluster', value: context.server?.cluster || 'standalone' }
      ]
    },
    {
      title: 'Operating system',
      items: [
        { label: 'Distribution', value: context.distribution },
        { label: 'Platform', value: context.platform },
        { label: 'Kernel', value: context.platform === 'Linux' ? '5.15.0-106' : 'N/A' }
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
      title: 'Networking interfaces',
      items: [
        { label: 'Primary NIC', value: 'ens160 · Connected' },
        { label: 'IPv4', value: context.server?.ip || '10.0.0.10' },
        { label: 'DNS domain', value: `${context.selectedEnv}.local` }
      ]
    }
  ];

  const healthRows = [
    { check: 'Compliance baseline', status: 'Passed', updated: '2h ago', note: 'Linux hardened level 2' },
    { check: 'Security vulnerabilities', status: 'Warning', updated: '45m ago', note: '3 applicable CVEs pending errata' },
    { check: 'Repository trust', status: 'Passed', updated: '1h ago', note: 'All required GPG keys valid' },
    { check: 'Service heartbeat', status: 'Passed', updated: '2m ago', note: 'Agent and telemetry healthy' }
  ];

  const operationFeed = [
    { action: 'Inventory sync', actor: 'Autopatch Agent', result: 'Completed', time: '2026-02-22 15:10' },
    { action: 'Refresh package metadata', actor: 'Scheduler', result: 'Completed', time: '2026-02-22 14:45' },
    { action: 'Run compliance scan', actor: 'Security orchestrator', result: 'Completed', time: '2026-02-22 14:30' },
    { action: 'Remediate critical errata', actor: 'Patch routine', result: 'Queued', time: '2026-02-22 16:00' }
  ];

  const lifecycleMilestones = [
    { name: 'Provisioned', date: '2025-11-14', state: 'Done' },
    { name: 'Joined baseline policy', date: '2025-11-15', state: 'Done' },
    { name: 'Last major upgrade', date: '2025-12-04', state: 'Done' },
    { name: 'Next patch cycle', date: '2026-03-01', state: 'Planned' },
    { name: 'Warranty review', date: '2026-08-30', state: 'Planned' }
  ];

  return (
    <MachineShell activeSection="overview" {...context}>
      {!context.server && <p className="text-sm text-rose-700">Machine not found in inventory for selected environment.</p>}

      {context.overviewTab === 'summary' && (
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

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <article key={card.label} className="machine-card space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500">{card.detail}</p>
              </article>
            ))}
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

      {context.overviewTab === 'health' && (
        <section className="machine-card space-y-4">
          <div className="machine-section">
            <h2>Health checks</h2>
            <p className="text-sm text-slate-500">Samlad hälsostatus från compliance, säkerhet och anslutning.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Check</th>
                  <th>Status</th>
                  <th>Last updated</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {healthRows.map((row) => (
                  <tr key={row.check}>
                    <td>{row.check}</td>
                    <td>
                      <span className={row.status === 'Warning' ? 'text-amber-700' : 'text-emerald-700'}>{row.status}</span>
                    </td>
                    <td>{row.updated}</td>
                    <td>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {context.overviewTab === 'operations' && (
        <section className="machine-card space-y-4">
          <div className="machine-section">
            <h2>Operation feed</h2>
            <p className="text-sm text-slate-500">Senaste aktiviteterna för inventory, scanning och patch automation.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Result</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {operationFeed.map((entry) => (
                  <tr key={`${entry.action}-${entry.time}`}>
                    <td>{entry.action}</td>
                    <td>{entry.actor}</td>
                    <td>{entry.result}</td>
                    <td>{entry.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {context.overviewTab === 'lifecycle' && (
        <section className="machine-card space-y-4">
          <div className="machine-section">
            <h2>Lifecycle timeline</h2>
            <p className="text-sm text-slate-500">Översikt över maskinens historik och kommande planerade milstolpar.</p>
          </div>
          <div className="space-y-3">
            {lifecycleMilestones.map((milestone) => (
              <article key={milestone.name} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{milestone.name}</p>
                  <p className="text-xs text-slate-500">{milestone.date}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${milestone.state === 'Done' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                  {milestone.state}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
    </MachineShell>
  );
}
