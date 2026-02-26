import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Content · Activation Keys"
      subtitle="Hantera Activation Keys för systemregistrering och rättigheter."
      workflowText="Content lifecycle workflow · Underhåll Activation Keys."
      activeView="content-activation-keys"
      selectedEnv={selectedEnv}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Content' },
        { label: 'Lifecycle' },
        { label: 'Activation Keys' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Content · Activation Keys</h2></div>
        <div className="p-4 text-sm text-slate-600">Separat sida för activation keys.</div>
      </section>
    </ManagerShellPage>
  );
}
