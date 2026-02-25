import Link from 'next/link';
import type { IconType } from 'react-icons';
import { FiBarChart2, FiClock, FiHome, FiMonitor, FiPlayCircle, FiServer } from 'react-icons/fi';

export type ManagerNavKey = 'overview' | 'get-started' | 'playbooks' | 'machines' | 'history' | 'update-reports';

type NavItem = {
  key: ManagerNavKey;
  label: string;
  icon: IconType;
};

type NavSection = {
  title: string;
  keys: ManagerNavKey[];
};

type ManagerSidebarNavProps = {
  activeView: ManagerNavKey;
  selectedEnv: string;
  selectedBasePath: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: FiHome },
  { key: 'get-started', label: 'Get started', icon: FiPlayCircle },
  { key: 'playbooks', label: 'Playbooks', icon: FiServer },
  { key: 'machines', label: 'Machines', icon: FiMonitor },
  { key: 'history', label: 'History', icon: FiClock },
  { key: 'update-reports', label: 'Update reports', icon: FiBarChart2 },
];

const NAV_SECTIONS: NavSection[] = [
  { title: 'Manager', keys: ['overview', 'get-started', 'playbooks'] },
  { title: 'Machines', keys: ['machines', 'history'] },
  { title: 'Reports', keys: ['update-reports'] },
];

export function isValidManagerNavKey(view?: string): view is ManagerNavKey {
  return NAV_ITEMS.some((item) => item.key === view);
}

export default function ManagerSidebarNav({ activeView, selectedEnv, selectedBasePath }: ManagerSidebarNavProps) {
  return (
    <aside className="side-nav">
      <input className="side-search" placeholder="Search" />
      {NAV_SECTIONS.map((section) => (
        <section className="side-section" key={section.title}>
          <p className="side-title">{section.title}</p>
          {section.keys.map((key) => {
            const item = NAV_ITEMS.find((navItem) => navItem.key === key);
            if (!item) return null;
            const NavIcon = item.icon;
            const itemHref =
              item.key === 'machines'
                ? `/machines?env=${selectedEnv}`
                : `/?env=${selectedEnv}&view=${item.key}&basePath=${selectedBasePath}`;

            return (
              <Link key={item.key} href={itemHref} className={`side-link ${activeView === item.key ? 'active' : ''}`}>
                <span className="side-icon">
                  <NavIcon />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </section>
      ))}
    </aside>
  );
}
