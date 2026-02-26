import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Content · Synchronization"
      subtitle="Hantera synkronisering av content från upstream-källor."
      workflowText="Content workflow · Övervaka och konfigurera synchronization."
      activeView="content-synchronization"
      selectedEnv={selectedEnv}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Content' },
        { label: 'Synchronization' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Content · Synchronization</h2></div>
        <div className="p-4 text-sm text-slate-600">Separat sida för synchronization.</div>
      </section>
    </ManagerShellPage>
  );
}
