import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Ansible · Roles & Variables"
      subtitle="Hantera roller och variabler i separata scope för miljöer."
      workflowText="Roles & Variables workflow · Versionera roller och variabler med tydlig ansvarsfördelning."
      activeView="configure-roles-variables"
      selectedEnv={selectedEnv}
      breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Configure' },
    { label: 'Ansible', href: '/repository/configure/ansible' },
    { label: 'Roles & Variables' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Ansible · Roles & Variables</h2></div>
        <div className="p-4 text-sm text-slate-600">Den här sidan är nu separat enligt nya navigationsstrukturen.</div>
      </section>
    </ManagerShellPage>
  );
}
