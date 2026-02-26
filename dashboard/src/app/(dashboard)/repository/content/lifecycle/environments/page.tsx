import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Content · Lifecycle environments"
      subtitle="Hantera lifecycle environments för contentpromotions."
      workflowText="Content lifecycle workflow · Definiera lifecycle environments."
      activeView="content-lifecycle-environments"
      selectedEnv={selectedEnv}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Content' },
        { label: 'Lifecycle' },
        { label: 'Lifecycle environments' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Content · Lifecycle environments</h2></div>
        <div className="p-4 text-sm text-slate-600">Separat sida för lifecycle environments.</div>
      </section>
    </ManagerShellPage>
  );
}
