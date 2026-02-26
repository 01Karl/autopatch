import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Machines · Host collections"
      subtitle="Överblick av host collections för gruppering och målning."
      workflowText="Collections workflow · Strukturera hosts i collections för enklare drift."
      activeView="machines-host-collections"
      selectedEnv={selectedEnv}
      breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Machines', href: '/machines?env=prod' },
    { label: 'Host collections' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Machines · Host collections</h2></div>
        <div className="p-4 text-sm text-slate-600">Den här sidan är nu separat enligt nya navigationsstrukturen.</div>
      </section>
    </ManagerShellPage>
  );
}
