import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Content · Content views"
      subtitle="Hantera content views för versionering och publicering."
      workflowText="Content lifecycle workflow · Administrera content views."
      activeView="content-content-views"
      selectedEnv={selectedEnv}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Content' },
        { label: 'Lifecycle' },
        { label: 'Content views' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Content · Content views</h2></div>
        <div className="p-4 text-sm text-slate-600">Separat sida för content views.</div>
      </section>
    </ManagerShellPage>
  );
}
