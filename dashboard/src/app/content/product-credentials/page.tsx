import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Content · Product Credentials"
      subtitle="Hantera autentiseringsuppgifter för externa produktkällor."
      workflowText="Content workflow · Administrera Product Credentials."
      activeView="content-product-credentials"
      selectedEnv={selectedEnv}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Content' },
        { label: 'Product Credentials' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Content · Product Credentials</h2></div>
        <div className="p-4 text-sm text-slate-600">Separat sida för product credentials.</div>
      </section>
    </ManagerShellPage>
  );
}
