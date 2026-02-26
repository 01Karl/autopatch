import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Configure · Playbooks"
      subtitle="Hantera playbook-katalog, rutiner och körningsmallar."
      workflowText="Configure workflow · Granska och underhåll playbooks för standardiserad drift."
      activeView="configure-playbooks"
      selectedEnv={selectedEnv}
      breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Configure' },
    { label: 'Playbooks' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Configure · Playbooks</h2></div>
        <div className="p-4 text-sm text-slate-600">Den här sidan är nu separat enligt nya navigationsstrukturen.</div>
      </section>
    </ManagerShellPage>
  );
}
