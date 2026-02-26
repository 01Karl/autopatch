import Link from 'next/link';
import { FiActivity, FiDatabase, FiFolder, FiGrid, FiHome, FiMonitor, FiShield } from 'react-icons/fi';

const primaryNav = [
  { label: 'Home', href: '/', icon: FiHome, active: true },
  { label: 'Repository Management', href: '/repository', icon: FiFolder },
  { label: 'Compliance Center', href: '/compliance', icon: FiShield },
  { label: 'Machines', href: '/machines', icon: FiMonitor },
] as const;

const plannedNav = [
  { label: 'Databases', icon: FiDatabase },
  { label: 'App Services', icon: FiActivity },
  { label: 'All resources', icon: FiGrid },
] as const;

export default function PortalSidebarNav() {
  return (
    <aside className="side-nav">
      <input className="side-search" placeholder="Search portal navigation" />

      <section className="side-section">
        <p className="side-title">Workspace</p>
        {primaryNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href} className={`side-link ${item.active ? 'active' : ''}`}>
              <span className="side-icon"><Icon /></span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </section>

      <section className="side-section">
        <p className="side-title">Planned modules</p>
        {plannedNav.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="side-link opacity-70">
              <span className="side-icon"><Icon /></span>
              <span>{item.label}</span>
            </div>
          );
        })}
      </section>
    </aside>
  );
}
