import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Compliance · SCAP Contents"
      subtitle="Hantera SCAP content-paket och versioner."
      workflowText="SCAP workflow · Publicera och uppdatera SCAP-innehåll för scanning."
      activeView="compliance-scap-contents"
      selectedEnv={selectedEnv}
      breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Compliance' },
    { label: 'SCAP Contents' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Compliance · SCAP Contents</h2></div>
        <div className="p-4 text-sm text-slate-600">Den här sidan är nu separat enligt nya navigationsstrukturen.</div>
      </section>
    </ManagerShellPage>
  );
}
