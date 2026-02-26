import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Provisioning · Installation Media"
      subtitle="Hantera installationsmedia för provisioning."
      workflowText="Provisioning workflow · Publicera och underhåll installationsmedia centralt."
      activeView="provisioning-installation-media"
      selectedEnv={selectedEnv}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Provisioning' },
        { label: 'Installation Media' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Provisioning · Installation Media</h2></div>
        <div className="p-4 text-sm text-slate-600">Separat sida för provisioning av installationsmedia.</div>
      </section>
    </ManagerShellPage>
  );
}
