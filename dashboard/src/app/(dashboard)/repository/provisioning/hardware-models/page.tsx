import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Provisioning · Hardware Models"
      subtitle="Hantera hårdvarumodeller för provisioning-profiler."
      workflowText="Provisioning workflow · Mappa hårdvarumodeller till rätt installationsflöden."
      activeView="provisioning-hardware-models"
      selectedEnv={selectedEnv}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Provisioning' },
        { label: 'Hardware Models' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Provisioning · Hardware Models</h2></div>
        <div className="p-4 text-sm text-slate-600">Separat sida för provisioning av hardware models.</div>
      </section>
    </ManagerShellPage>
  );
}
