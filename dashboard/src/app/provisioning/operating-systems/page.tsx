import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Provisioning · Operating Systems"
      subtitle="Hantera operativsystem för provisioning-katalogen."
      workflowText="Provisioning workflow · Koppla operativsystem till kompatibla provisioning-spår."
      activeView="provisioning-operating-systems"
      selectedEnv={selectedEnv}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Provisioning' },
        { label: 'Operating Systems' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Provisioning · Operating Systems</h2></div>
        <div className="p-4 text-sm text-slate-600">Separat sida för provisioning av operativsystem.</div>
      </section>
    </ManagerShellPage>
  );
}
