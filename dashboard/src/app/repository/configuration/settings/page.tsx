import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Configuration · Settings"
      subtitle="Hantera globala inställningar för plattformen."
      workflowText="Configuration workflow · Justera Settings för miljön."
      activeView="configuration-settings"
      selectedEnv={selectedEnv}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Configuration' },
        { label: 'Settings' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Configuration · Settings</h2></div>
        <div className="p-4 text-sm text-slate-600">Separat sida för settings.</div>
      </section>
    </ManagerShellPage>
  );
}
