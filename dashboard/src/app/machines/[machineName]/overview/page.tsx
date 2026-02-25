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
      title: 'Provisioning',
      items: [
        { label: 'Provisioned by', value: 'Autopatch Provisioner' },
        { label: 'Provisioned date', value: '2025-11-14' },
        { label: 'Lifecycle', value: context.selectedEnv === 'prod' ? 'Production' : 'Non-production' }
      ]
    },
    {
      title: 'BIOS',
      items: [
        { label: 'Vendor', value: context.resourceType === 'Virtual machine' ? 'Phoenix Technologies' : 'Dell Inc.' },
        { label: 'Version', value: context.resourceType === 'Virtual machine' ? '6.00' : '2.18.2' },
        { label: 'Boot mode', value: 'UEFI' }
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
      title: 'Operating system',
      items: [
        { label: 'Distribution', value: context.distribution },
        { label: 'Platform', value: context.platform },
        { label: 'Kernel', value: context.platform === 'Linux' ? '5.15.0-106' : 'N/A' }
      ]
    },
    {
      title: 'HW properties',
      items: [
        { label: 'vCPU / CPU', value: context.server?.cluster === 'standalone' ? '32 cores' : '8 vCPU' },
        { label: 'Memory', value: context.server?.cluster === 'standalone' ? '128 GB' : '32 GB' },
        { label: 'Storage', value: context.server?.cluster === 'standalone' ? '3.8 TB NVMe' : '450 GB SSD' }
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

  return (
    <MachineShell activeSection="overview" {...context}>
      {!context.server && <p className="text-sm text-rose-700">Machine not found in inventory for selected environment.</p>}

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
    </MachineShell>
  );
}
