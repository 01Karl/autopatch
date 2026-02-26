import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Compliance · Reports"
      subtitle="Rapporter för efterlevnad och avvikelser."
      workflowText="Reports workflow · Följ efterlevnadstrender och exportera underlag."
      activeView="compliance-reports"
      selectedEnv={selectedEnv}
      breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Compliance' },
    { label: 'Reports' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Compliance · Reports</h2></div>
        <div className="p-4 text-sm text-slate-600">Den här sidan är nu separat enligt nya navigationsstrukturen.</div>
      </section>
    </ManagerShellPage>
  );
}
