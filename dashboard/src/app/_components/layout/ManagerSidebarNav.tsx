'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { IconType } from 'react-icons';
import { FiChevronDown, FiCpu, FiFileText, FiHardDrive, FiHome, FiKey, FiLayers, FiMapPin, FiMonitor, FiPackage, FiPlayCircle, FiRefreshCw, FiSettings, FiShield, FiSliders, FiTool, FiUsers } from 'react-icons/fi';

export type ManagerNavKey =
  | 'overview'
  | 'get-started'
  | 'playbooks'
  | 'machines'
  | 'machines-all'
  | 'machines-register'
  | 'machines-host-collections'
  | 'compliance'
  | 'compliance-policies'
  | 'compliance-scap-contents'
  | 'compliance-reports'
  | 'compliance-tailoring-files'
  | 'provisioning'
  | 'provisioning-architectures'
  | 'provisioning-hardware-models'
  | 'provisioning-installation-media'
  | 'provisioning-operating-systems'
  | 'configure-playbooks'
  | 'configure-ansible'
  | 'configure-roles-variables'
  | 'configuration'
  | 'configuration-locations'
  | 'configuration-organizations'
  | 'configuration-settings'
  | 'content'
  | 'content-products'
  | 'content-product-credentials'
  | 'content-synchronization'
  | 'content-lifecycle'
  | 'content-lifecycle-environments'
  | 'content-content-views'
  | 'content-activation-keys'
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


const SIDEBAR_OPEN_GROUPS_STORAGE_KEY = 'manager-sidebar-open-groups';

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
        key: 'compliance',
        label: 'Compliance',
        icon: FiShield,
        children: [
          { key: 'compliance-policies', label: 'Policies', href: (env) => `/compliance/policies?env=${env}` },
          { key: 'compliance-scap-contents', label: 'SCAP Contents', href: (env) => `/compliance/scap-contents?env=${env}` },
          { key: 'compliance-reports', label: 'Reports', href: (env) => `/compliance/reports?env=${env}` },
          { key: 'compliance-tailoring-files', label: 'Tailoring Files', href: (env) => `/compliance/tailoring-files?env=${env}` },
        ],
      },
      {
        key: 'provisioning',
        label: 'Provisioning',
        icon: FiHardDrive,
        children: [
          { key: 'provisioning-architectures', label: 'Architectures', href: (env) => `/provisioning/architectures?env=${env}` },
          { key: 'provisioning-hardware-models', label: 'Hardware Models', href: (env) => `/provisioning/hardware-models?env=${env}` },
          { key: 'provisioning-installation-media', label: 'Installation Media', href: (env) => `/provisioning/installation-media?env=${env}` },
          { key: 'provisioning-operating-systems', label: 'Operating Systems', href: (env) => `/provisioning/operating-systems?env=${env}` },
        ],
      },
    ],
  },
  {
    title: 'Configuration',
    items: [
      {
        key: 'configuration',
        label: 'Configuration',
        icon: FiSettings,
        children: [
          { key: 'configuration-locations', label: 'Locations', href: (env) => `/configuration/locations?env=${env}` },
          { key: 'configuration-organizations', label: 'Organizations', href: (env) => `/configuration/organizations?env=${env}` },
          { key: 'configuration-settings', label: 'Settings', href: (env) => `/configuration/settings?env=${env}` },
        ],
      },
    ],
  },
  {
    title: 'Content',
    items: [
      { key: 'content-products', label: 'Products', icon: FiPackage, href: (env) => `/content/products?env=${env}` },
      { key: 'content-product-credentials', label: 'Product Credentials', icon: FiKey, href: (env) => `/content/product-credentials?env=${env}` },
      { key: 'content-synchronization', label: 'Synchronization', icon: FiRefreshCw, href: (env) => `/content/synchronization?env=${env}` },
      {
        key: 'content-lifecycle',
        label: 'Lifecycle',
        icon: FiLayers,
        children: [
          { key: 'content-lifecycle-environments', label: 'Lifecycle environments', href: (env) => `/content/lifecycle/environments?env=${env}` },
          { key: 'content-content-views', label: 'Content views', href: (env) => `/content/lifecycle/content-views?env=${env}` },
          { key: 'content-activation-keys', label: 'Activation Keys', href: (env) => `/content/lifecycle/activation-keys?env=${env}` },
        ],
      },
    ],
  },
];

export function isValidManagerNavKey(view?: string): view is ManagerNavKey {
  return OVERVIEW_VIEWS.includes((view as ManagerNavKey) ?? 'overview');
}

export default function ManagerSidebarNav({ activeView, selectedEnv, selectedBasePath }: ManagerSidebarNavProps) {
  const parentKeyForActiveView = useMemo(() => (
    NAV_SECTIONS
      .flatMap((section) => section.items)
      .find((item) => item.children?.some((child) => child.key === activeView))?.key
  ), [activeView]);

  const [openGroups, setOpenGroups] = useState<Partial<Record<ManagerNavKey, boolean>>>({
    ...(parentKeyForActiveView ? { [parentKeyForActiveView]: true } : {}),
  });

  useEffect(() => {
    const storedGroups = window.localStorage.getItem(SIDEBAR_OPEN_GROUPS_STORAGE_KEY);

    if (!storedGroups) {
      return;
    }

    try {
      const parsedGroups = JSON.parse(storedGroups) as Partial<Record<ManagerNavKey, boolean>>;
      setOpenGroups((prev) => ({ ...parsedGroups, ...prev }));
    } catch {
      // Ignore invalid localStorage content and use defaults.
    }
  }, []);

  useEffect(() => {
    if (!parentKeyForActiveView) {
      return;
    }

    setOpenGroups((prev) => ({ ...prev, [parentKeyForActiveView]: true }));
  }, [parentKeyForActiveView]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_OPEN_GROUPS_STORAGE_KEY, JSON.stringify(openGroups));
  }, [openGroups]);

  const toggleGroup = (key: ManagerNavKey) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="side-nav">
      <input className="side-search" placeholder="Search" />
      {NAV_SECTIONS.map((section) => (
        <section className="side-section" key={section.title}>
          <p className="side-title">{section.title}</p>
          {section.items.map((item) => {
            const NavIcon = item.icon;
            const isParentActive = item.children?.some((child) => child.key === activeView);
            const isOpen = Boolean(openGroups[item.key]);

            return (
              <div className="side-group" key={item.key}>
                {item.children ? (
                  <button type="button" className={`side-link w-full text-left ${isParentActive ? 'active' : ''}`} onClick={() => toggleGroup(item.key)}>
                    <span className="side-icon"><NavIcon /></span>
                    <span>{item.label}</span>
                    <FiChevronDown className={`ml-auto h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <Link href={item.href ? item.href(selectedEnv, selectedBasePath) : '#'} className={`side-link ${activeView === item.key ? 'active' : ''}`}>
                    <span className="side-icon"><NavIcon /></span>
                    <span>{item.label}</span>
                  </Link>
                )}

                {item.children && isOpen && (
                  <div className="side-submenu">
                    {item.children.map((child) => (
                      <Link key={child.key} href={child.href(selectedEnv, selectedBasePath)} className={`side-sublink ${activeView === child.key ? 'active' : ''}`}>
                        {child.key === 'machines-host-collections' && <FiPackage className="h-3.5 w-3.5" />}
                        {child.key === 'machines-register' && <FiFileText className="h-3.5 w-3.5" />}
                        {child.key === 'machines-all' && <FiMonitor className="h-3.5 w-3.5" />}
                        {child.key.startsWith('compliance-') && <FiSliders className="h-3.5 w-3.5" />}
                        {child.key === 'configure-roles-variables' && <FiLayers className="h-3.5 w-3.5" />}
                        {child.key.startsWith('provisioning-') && <FiCpu className="h-3.5 w-3.5" />}
                        {child.key === 'configuration-locations' && <FiMapPin className="h-3.5 w-3.5" />}
                        {child.key === 'configuration-organizations' && <FiUsers className="h-3.5 w-3.5" />}
                        {child.key === 'configuration-settings' && <FiSettings className="h-3.5 w-3.5" />}
                        {child.key === 'content-lifecycle-environments' && <FiLayers className="h-3.5 w-3.5" />}
                        {child.key === 'content-content-views' && <FiFileText className="h-3.5 w-3.5" />}
                        {child.key === 'content-activation-keys' && <FiKey className="h-3.5 w-3.5" />}
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
