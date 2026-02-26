import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Machines · Register machine"
      subtitle="Registrera nya hosts till inventory och koppla metadata."
      workflowText="Registration workflow · Lägg till host, välj miljö och koppla till rätt collections."
      activeView="machines-register"
      selectedEnv={selectedEnv}
      breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Machines', href: '/machines?env=prod' },
    { label: 'Register machine' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Machines · Register machine</h2></div>
        <div className="p-4 text-sm text-slate-600">Den här sidan är nu separat enligt nya navigationsstrukturen.</div>
      </section>
    </ManagerShellPage>
  );
}
