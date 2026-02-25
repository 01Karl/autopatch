import MachineShell from '../../_components/MachineShell';
import { getMachineContext, getPackageBySlug, MachinePageSearchParams, PackageTab } from '../../_lib/machine-data';

type Props = {
  params: { machineName: string; packageSlug: string };
  searchParams?: MachinePageSearchParams;
};

const packageTabs: { key: PackageTab; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'files', label: 'Files' },
  { key: 'dependencies', label: 'Dependencies' },
  { key: 'repositories', label: 'Repositories' }
];

export default function MachinePackagePage({ params, searchParams }: Props) {
  const context = getMachineContext(params.machineName, searchParams);
  const packageSlug = decodeURIComponent(params.packageSlug);
  const packageItem = getPackageBySlug(packageSlug);

  if (!packageItem) {
    return (
      <MachineShell activeSection="updates" {...context} contentTab="packages">
        <section className="machine-card">
          <h2 className="text-lg font-semibold text-rose-700">Package not found</h2>
          <p className="text-sm text-slate-500">No package with slug <code>{packageSlug}</code> was found in mock data.</p>
        </section>
      </MachineShell>
    );
  }

  return (
    <MachineShell activeSection="updates" {...context} contentTab="packages">
      <section className="machine-card space-y-4">
        <div className="machine-section">
          <h2>{packageItem.name}</h2>
          <p className="text-sm text-slate-500">Package information for {packageItem.name} on {context.machineName}.</p>
        </div>

        <section className="machine-content-tabs">
          {packageTabs.map((tab) => (
            <a
              key={tab.key}
              className={`machine-content-tab ${context.packageTab === tab.key ? 'active' : ''}`}
              href={`${context.machineBasePath}/packages/${encodeURIComponent(packageItem.slug)}?${context.machineQuery}&content=packages&packageTab=${tab.key}`}
            >
              {tab.label}
            </a>
          ))}
        </section>

        {context.packageTab === 'details' && (
          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">Package information</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li><strong>Installed on:</strong> {packageItem.installedOn} host(s)</li>
                <li><strong>Applicable to:</strong> {packageItem.applicableTo}</li>
                <li><strong>Upgradable for:</strong> {packageItem.upgradableFor}</li>
                <li><strong>Description:</strong> {packageItem.description}</li>
              </ul>
            </article>

            <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">Summary</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li><strong>Summary:</strong> {packageItem.summary}</li>
                <li><strong>Group:</strong> {packageItem.group}</li>
                <li><strong>License:</strong> {packageItem.license}</li>
                <li><strong>Url:</strong> <a className="link" href={packageItem.url}>{packageItem.url}</a></li>
                <li><strong>Modular:</strong> {packageItem.modular}</li>
              </ul>
            </article>

            <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">Files information</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li><strong>Size:</strong> {packageItem.fileInformation.size}</li>
                <li><strong>Filename:</strong> {packageItem.fileInformation.filename}</li>
                <li><strong>Checksum:</strong> {packageItem.fileInformation.checksum}</li>
                <li><strong>Checksum type:</strong> {packageItem.fileInformation.checksumType}</li>
              </ul>
            </article>

            <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-800">Build information</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li><strong>Source RPM:</strong> {packageItem.buildInformation.sourceRpm}</li>
                <li><strong>Build host:</strong> {packageItem.buildInformation.buildHost}</li>
                <li><strong>Build time:</strong> {packageItem.buildInformation.buildTime}</li>
              </ul>
            </article>
          </section>
        )}

        {context.packageTab === 'files' && (
          <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Files</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {packageItem.files.map((file) => (
                <li key={file}><code>{file}</code></li>
              ))}
            </ul>
          </section>
        )}

        {context.packageTab === 'dependencies' && (
          <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Dependencies</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {packageItem.dependencies.map((dep) => (
                <li key={dep}>{dep}</li>
              ))}
            </ul>
          </section>
        )}

        {context.packageTab === 'repositories' && (
          <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Repositories</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {packageItem.repositories.map((repo) => (
                <li key={repo}>{repo}</li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </MachineShell>
  );
}
