import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Configuration · Locations"
      subtitle="Hantera locations för organisationens resurser."
      workflowText="Configuration workflow · Definiera och strukturera locations."
      activeView="configuration-locations"
      selectedEnv={selectedEnv}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Configuration' },
        { label: 'Locations' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Configuration · Locations</h2></div>
        <div className="p-4 text-sm text-slate-600">Separat sida för locations.</div>
      </section>
    </ManagerShellPage>
  );
}
