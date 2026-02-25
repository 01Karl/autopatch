import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Compliance · Policies"
      subtitle="Hantera och tilldela compliance policies per miljö."
      workflowText="Compliance workflow · Definiera policies och tillämpa dem mot hostgrupper."
      activeView="compliance-policies"
      selectedEnv={selectedEnv}
      breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Compliance' },
    { label: 'Policies' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Compliance · Policies</h2></div>
        <div className="p-4 text-sm text-slate-600">Den här sidan är nu separat enligt nya navigationsstrukturen.</div>
      </section>
    </ManagerShellPage>
  );
}
