import ManagerShellPage from '@/app/_components/layout/ManagerShellPage';

export default function Page({ searchParams }: { searchParams?: { env?: string } }) {
  const selectedEnv = searchParams?.env || 'prod';

  return (
    <ManagerShellPage
      title="Content · Products"
      subtitle="Hantera produktkatalog och innehållsprodukter."
      workflowText="Content workflow · Underhåll products för contenthantering."
      activeView="content-products"
      selectedEnv={selectedEnv}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Content' },
        { label: 'Products' },
      ]}
    >
      <section className="table-card">
        <div className="table-head"><h2>Content · Products</h2></div>
        <div className="p-4 text-sm text-slate-600">Separat sida för products.</div>
      </section>
    </ManagerShellPage>
  );
}
