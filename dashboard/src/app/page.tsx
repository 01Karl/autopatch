import Link from 'next/link';
import { FiActivity, FiDatabase, FiFolder, FiShield } from 'react-icons/fi';

const portalCards = [
  {
    title: 'Repository Management',
    description: 'Nuvarande Foreman-liknande vy för patchar, maskiner, körhistorik och playbook-automation.',
    href: '/repository',
    cta: 'Öppna Repository Management',
    icon: FiFolder,
    status: 'Aktiv',
  },
  {
    title: 'Compliance Center',
    description: 'Samlad ingång till policies, SCAP-innehåll, rapporter och tailoring files.',
    href: '/compliance',
    cta: 'Öppna Compliance',
    icon: FiShield,
    status: 'Aktiv',
  },
  {
    title: 'Databases',
    description: 'Planerad huvudsida för databasresurser, backup-status och uppgraderingsfönster.',
    href: '#',
    cta: 'Kommer snart',
    icon: FiDatabase,
    status: 'Planerad',
  },
  {
    title: 'App Services',
    description: 'Planerad huvudsida för app-tjänster, deployment slots och runtime-konfiguration.',
    href: '#',
    cta: 'Kommer snart',
    icon: FiActivity,
    status: 'Planerad',
  },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f3f2f1]">
      <header className="top-header">
        <div className="brand">Overseer Portal</div>
        <input className="header-search" placeholder="Search resources, services and docs" />
        <div className="header-user">Azure-style Workspace</div>
      </header>

      <section className="border-b border-slate-300 bg-white px-6 py-8">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Home</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Overseer Portal</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Ny startsida med separata huvudytor. Repository Management ligger nu under egen route och Compliance har fått en dedikerad huvudsida.
        </p>
      </section>

      <section className="px-6 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {portalCards.map((card) => {
            const Icon = card.icon;
            const isActive = card.href !== '#';

            return (
              <article key={card.title} className="rounded-md border border-slate-300 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-red-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {card.status}
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{card.description}</p>
                {isActive ? (
                  <Link href={card.href} className="mt-4 inline-flex rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800">
                    {card.cta}
                  </Link>
                ) : (
                  <span className="mt-4 inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-500">{card.cta}</span>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
