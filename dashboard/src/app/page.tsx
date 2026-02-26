import Link from 'next/link';
import { FiArrowRight, FiBookOpen, FiDatabase, FiFolder, FiGrid, FiLayers, FiMonitor, FiShield, FiTrendingUp } from 'react-icons/fi';
import PortalSidebarNav from '@/app/_components/layout/PortalSidebarNav';

const serviceLinks = [
  { label: 'Repository Management', href: '/repository', icon: FiFolder },
  { label: 'Compliance Center', href: '/repository/compliance', icon: FiShield },
  { label: 'Machines', href: '/machines', icon: FiMonitor },
  { label: 'Databases', href: '#', icon: FiDatabase, planned: true },
  { label: 'App Services', href: '#', icon: FiLayers, planned: true },
  { label: 'More services', href: '#', icon: FiArrowRight, planned: true },
] as const;

const navigateLinks = [
  { label: 'Repository workspaces', href: '/repository', icon: FiFolder },
  { label: 'Resource groups', href: '#', icon: FiGrid, planned: true },
  { label: 'All resources', href: '#', icon: FiLayers, planned: true },
  { label: 'Compliance dashboard', href: '/repository/compliance', icon: FiShield },
] as const;

const toolLinks = [
  {
    label: 'Knowledge base',
    description: 'Lär dig mer om patchning, automation och driftflöden.',
    href: '#',
    icon: FiBookOpen,
    planned: true,
  },
  {
    label: 'Operations Monitor',
    description: 'Övervaka körningar och infrastrukturstatus i realtid.',
    href: '/repository?view=history',
    icon: FiTrendingUp,
  },
  {
    label: 'Security Center',
    description: 'Samla policies, avvikelser och skyddsstatus per miljö.',
    href: '/repository/compliance',
    icon: FiShield,
  },
] as const;

export default function HomePage() {
  return (
    <main className="azure-shell">
      <header className="top-header">
        <div className="brand">Overseer Infrastructure Manager</div>
        <input className="header-search" placeholder="Search resources, services and docs" />
        <div className="header-user">Infrastructure workspace</div>
      </header>

      <section className="shell-page-intro">
        <div className="shell-page-breadcrumbs">
          <a href="/">Home</a>
          <span>›</span>
          <span>Overseer Infrastructure Manager</span>
        </div>
        <h1 className="shell-page-title">Overseer Infrastructure Manager</h1>
        <p className="shell-page-subtitle">Portalstart med snabbgenvägar till tjänster, navigation och operativa verktyg.</p>
      </section>

      <div className="shell-layout">
        <PortalSidebarNav />

        <section className="main-pane">
          <p className="pane-context-text">Portal workspace · Förenklad startsida inspirerad av Azure Portal men i Overseer-stil.</p>

          <section className="content-area space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Overseer services</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {serviceLinks.map((service) => {
                  const Icon = service.icon;
                  const planned = Boolean('planned' in service && service.planned);

                  const classes = `rounded-md border px-3 py-3 text-left transition ${planned ? 'border-slate-300 bg-slate-50 text-slate-500' : 'border-red-200 bg-white text-slate-700 hover:border-red-400 hover:bg-red-50'}`;

                  const body = (
                    <>
                      <Icon className="h-5 w-5" />
                      <span className="mt-2 block text-sm font-medium">{service.label}</span>
                    </>
                  );

                  return planned ? (
                    <div key={service.label} className={classes}>{body}</div>
                  ) : (
                    <Link key={service.label} href={service.href} className={classes}>{body}</Link>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Navigate</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {navigateLinks.map((item) => {
                  const Icon = item.icon;
                  const planned = Boolean('planned' in item && item.planned);

                  return planned ? (
                    <div key={item.label} className="rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-slate-500">
                      <Icon className="h-5 w-5" />
                      <span className="mt-2 block text-sm font-medium">{item.label}</span>
                    </div>
                  ) : (
                    <Link key={item.label} href={item.href} className="rounded-md border border-red-200 bg-white px-3 py-3 text-slate-700 hover:border-red-400 hover:bg-red-50">
                      <Icon className="h-5 w-5" />
                      <span className="mt-2 block text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Tools</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
                {toolLinks.map((tool) => {
                  const Icon = tool.icon;
                  const planned = Boolean('planned' in tool && tool.planned);

                  return planned ? (
                    <article key={tool.label} className="panel-card opacity-80">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-500"><Icon className="h-4 w-4" /></div>
                      <h3 className="mt-3 font-semibold text-slate-700">{tool.label}</h3>
                      <p className="mt-1 text-sm text-slate-500">{tool.description}</p>
                    </article>
                  ) : (
                    <Link key={tool.label} href={tool.href} className="panel-card block border-red-200 hover:border-red-400 hover:bg-red-50/40">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-700"><Icon className="h-4 w-4" /></div>
                      <h3 className="mt-3 font-semibold text-slate-900">{tool.label}</h3>
                      <p className="mt-1 text-sm text-slate-600">{tool.description}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}
