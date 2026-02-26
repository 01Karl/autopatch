import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Configuration · Organizations"
      subtitle="Hantera organisationsstruktur och ansvarsfördelning."
      workflowText="Configuration workflow · Underhåll organizations i plattformen."
      activeView="configuration-organizations"
      selectedEnv={selectedEnv}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Configuration' },
        { label: 'Organizations' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Configuration · Organizations</h2></div>
        <div className="p-4 text-sm text-slate-600">Separat sida för organizations.</div>
      </section>
    </ManagerShellPage>
  );
}
