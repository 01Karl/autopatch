import Link from 'next/link';
import type { IconType } from 'react-icons';
import { FiChevronDown, FiFileText, FiHome, FiLayers, FiMonitor, FiPackage, FiPlayCircle, FiShield, FiSliders, FiTool } from 'react-icons/fi';

export type ManagerNavKey =
  | 'overview'
  | 'get-started'
  | 'playbooks'
  | 'machines'
  | 'machines-all'
  | 'machines-register'
  | 'machines-host-collections'
  | 'compliance-policies'
  | 'compliance-scap-contents'
  | 'compliance-reports'
  | 'compliance-tailoring-files'
  | 'configure-playbooks'
  | 'configure-ansible'
  | 'configure-roles-variables'
  | 'history'
  | 'update-reports';

type NavChildItem = {
  key: ManagerNavKey;
  label: string;
  href: (env: string, basePath: string) => string;
};

type NavItem = {
  key: ManagerNavKey;
  label: string;
  icon: IconType;
  href?: (env: string, basePath: string) => string;
  children?: NavChildItem[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type ManagerSidebarNavProps = {
  activeView: ManagerNavKey;
  selectedEnv: string;
  selectedBasePath: string;
};

const OVERVIEW_VIEWS: ManagerNavKey[] = ['overview', 'get-started', 'playbooks', 'machines', 'history', 'update-reports'];

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Manager',
    items: [
      { key: 'overview', label: 'Overview', icon: FiHome, href: (env, basePath) => `/?env=${env}&view=overview&basePath=${basePath}` },
      { key: 'get-started', label: 'Get started', icon: FiPlayCircle, href: (env, basePath) => `/?env=${env}&view=get-started&basePath=${basePath}` },
    ],
  },
  {
    title: 'Configure',
    items: [
      { key: 'configure-playbooks', label: 'Playbooks', icon: FiTool, href: (env) => `/configure/playbooks?env=${env}` },
      {
        key: 'configure-ansible',
        label: 'Ansible',
        icon: FiLayers,
        href: (env) => `/configure/ansible?env=${env}`,
        children: [
          { key: 'configure-roles-variables', label: 'Roles & Variables', href: (env) => `/configure/ansible/roles-variables?env=${env}` },
        ],
      },
    ],
  },
  {
    title: 'Machines',
    items: [
      {
        key: 'machines',
        label: 'Machines',
        icon: FiMonitor,
        children: [
          { key: 'machines-all', label: 'All Machines', href: (env) => `/machines?env=${env}` },
          { key: 'machines-register', label: 'Register machine', href: (env) => `/machines/register?env=${env}` },
          { key: 'machines-host-collections', label: 'Host collections', href: (env) => `/machines/host-collections?env=${env}` },
        ],
      },
      {
        key: 'compliance-policies',
        label: 'Compliance',
        icon: FiShield,
        children: [
          { key: 'compliance-policies', label: 'Policies', href: (env) => `/compliance/policies?env=${env}` },
          { key: 'compliance-scap-contents', label: 'SCAP Contents', href: (env) => `/compliance/scap-contents?env=${env}` },
          { key: 'compliance-reports', label: 'Reports', href: (env) => `/compliance/reports?env=${env}` },
          { key: 'compliance-tailoring-files', label: 'Tailoring Files', href: (env) => `/compliance/tailoring-files?env=${env}` },
        ],
      },
    ],
  },
];

export function isValidManagerNavKey(view?: string): view is ManagerNavKey {
  return OVERVIEW_VIEWS.includes((view as ManagerNavKey) ?? 'overview');
}

export default function ManagerSidebarNav({ activeView, selectedEnv, selectedBasePath }: ManagerSidebarNavProps) {
  return (
    <aside className="side-nav">
      <input className="side-search" placeholder="Search" />
      {NAV_SECTIONS.map((section) => (
        <section className="side-section" key={section.title}>
          <p className="side-title">{section.title}</p>
          {section.items.map((item) => {
            const NavIcon = item.icon;
            const isParentActive = item.children?.some((child) => child.key === activeView);

            return (
              <div className="side-group" key={item.key}>
                {item.href ? (
                  <Link href={item.href(selectedEnv, selectedBasePath)} className={`side-link ${activeView === item.key ? 'active' : ''}`}>
                    <span className="side-icon"><NavIcon /></span>
                    <span>{item.label}</span>
                    {item.children && <FiChevronDown className="ml-auto h-4 w-4 text-slate-400" />}
                  </Link>
                ) : (
                  <div className={`side-link ${isParentActive ? 'active' : ''}`}>
                    <span className="side-icon"><NavIcon /></span>
                    <span>{item.label}</span>
                    {item.children && <FiChevronDown className="ml-auto h-4 w-4 text-slate-400" />}
                  </div>
                )}

                {item.children && (
                  <div className="side-submenu">
                    {item.children.map((child) => (
                      <Link
                        key={child.key}
                        href={child.href(selectedEnv, selectedBasePath)}
                        className={`side-sublink ${activeView === child.key ? 'active' : ''}`}
                      >
                        {child.key === 'machines-host-collections' && <FiPackage className="h-3.5 w-3.5" />}
                        {child.key === 'machines-register' && <FiFileText className="h-3.5 w-3.5" />}
                        {child.key === 'machines-all' && <FiMonitor className="h-3.5 w-3.5" />}
                        {child.key.startsWith('compliance-') && <FiSliders className="h-3.5 w-3.5" />}
                        {child.key === 'configure-roles-variables' && <FiLayers className="h-3.5 w-3.5" />}
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </aside>
  );
}
