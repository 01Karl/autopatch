import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Provisioning · Architectures"
      subtitle="Hantera arkitekturer för provisioning och installationer."
      workflowText="Provisioning workflow · Definiera giltiga arkitekturer för host-provisionering."
      activeView="provisioning-architectures"
      selectedEnv={selectedEnv}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Provisioning' },
        { label: 'Architectures' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Provisioning · Architectures</h2></div>
        <div className="p-4 text-sm text-slate-600">Separat sida för provisioning-arkitekturer.</div>
      </section>
    </ManagerShellPage>
  );
}
