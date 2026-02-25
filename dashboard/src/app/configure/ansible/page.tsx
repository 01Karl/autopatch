import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Configure · Ansible"
      subtitle="Central vy för Ansible-relaterad konfiguration."
      workflowText="Ansible workflow · Samla roller, variabler och automation på ett ställe."
      activeView="configure-ansible"
      selectedEnv={selectedEnv}
      breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Configure' },
    { label: 'Ansible' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Configure · Ansible</h2></div>
        <div className="p-4 text-sm text-slate-600">Den här sidan är nu separat enligt nya navigationsstrukturen.</div>
      </section>
    </ManagerShellPage>
  );
}
