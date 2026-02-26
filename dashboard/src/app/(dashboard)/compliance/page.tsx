import Link from 'next/link';
import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

const complianceModules = [
  {
    title: 'Policies',
    description: 'Definiera regler och koppla dem till hostgrupper och miljöer.',
    href: '/compliance/policies',
  },
  {
    title: 'SCAP Contents',
    description: 'Hantera scanner-profiler, benchmark-definitioner och versionsspårning.',
    href: '/compliance/scap-contents',
  },
  {
    title: 'Reports',
    description: 'Följ upp resultat, avvikelser och trend över tid.',
    href: '/compliance/reports',
  },
  {
    title: 'Tailoring Files',
    description: 'Skapa undantag och miljöanpassningar av compliance-profiler.',
    href: '/compliance/tailoring-files',
  },
] as const;

export default function ComplianceHome({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Compliance"
      subtitle="Huvudsida för compliance-området med genvägar till alla undersektioner."
      workflowText="Compliance workspace · Öppna policies, SCAP, rapporter eller tailoring från en samlad vy."
      activeView="compliance"
      selectedEnv={selectedEnv}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Compliance' },
      ]}
    >
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {complianceModules.map((module) => (
          <article key={module.title} className="panel-card">
            <h2 className="text-base font-semibold text-slate-900">{module.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{module.description}</p>
            <Link href={`${module.href}?env=${selectedEnv}`} className="mt-4 inline-flex rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800">
              Open {module.title}
            </Link>
          </article>
        ))}
      </section>
    </ManagerShellPage>
  );
}
