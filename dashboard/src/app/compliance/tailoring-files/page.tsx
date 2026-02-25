import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Compliance · Tailoring Files"
      subtitle="Hantera tailoring-profiler för anpassad policy."
      workflowText="Tailoring workflow · Justera profiler för miljöspecifika krav."
      activeView="compliance-tailoring-files"
      selectedEnv={selectedEnv}
      breadcrumbs={[
    { label: 'Home', href: '/' },
    { label: 'Compliance' },
    { label: 'Tailoring Files' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Compliance · Tailoring Files</h2></div>
        <div className="p-4 text-sm text-slate-600">Den här sidan är nu separat enligt nya navigationsstrukturen.</div>
      </section>
    </ManagerShellPage>
  );
}
