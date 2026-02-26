export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

export type DomainKey = 'dashboard' | 'machines' | 'repository' | 'compliance';

export type DomainNavigation = {
  key: DomainKey;
  label: string;
  basePath: string;
  homeTitle: string;
  navItems: NavItem[];
};

const DASHBOARD_NAVIGATION: DomainNavigation = {
  key: 'dashboard',
  label: 'Dashboard',
  basePath: '/',
  homeTitle: 'Overseer Infrastructure Manager',
  navItems: [
    { label: 'Dashboard Overview', href: '/' },
    { label: 'Machines', href: '/machines' },
    { label: 'Repository', href: '/repository' },
    { label: 'Compliance', href: '/compliance' },
  ],
};

const MACHINES_NAVIGATION: DomainNavigation = {
  key: 'machines',
  label: 'Machines',
  basePath: '/machines',
  homeTitle: 'Machines',
  navItems: [
    { label: 'Overview', href: '/machines' },
    { label: 'Register', href: '/machines/register' },
    { label: 'Host Collections', href: '/machines/host-collections' },
  ],
};

const REPOSITORY_NAVIGATION: DomainNavigation = {
  key: 'repository',
  label: 'Repository',
  basePath: '/repository',
  homeTitle: 'Repository Manager',
  navItems: [
    {
      label: 'Configuration',
      href: '/repository/configuration',
      children: [
        { label: 'Locations', href: '/repository/configuration/locations' },
        { label: 'Organizations', href: '/repository/configuration/organizations' },
        { label: 'Settings', href: '/repository/configuration/settings' },
      ],
    },
    {
      label: 'Content',
      href: '/repository/content',
      children: [
        { label: 'Lifecycle', href: '/repository/content/lifecycle/environments' },
        { label: 'Products', href: '/repository/content/products' },
        { label: 'Product Credentials', href: '/repository/content/product-credentials' },
        { label: 'Synchronization', href: '/repository/content/synchronization' },
      ],
    },
    {
      label: 'Provisioning',
      href: '/repository/provisioning',
      children: [
        { label: 'Architectures', href: '/repository/provisioning/architectures' },
        { label: 'Hardware Models', href: '/repository/provisioning/hardware-models' },
        { label: 'Installation Media', href: '/repository/provisioning/installation-media' },
        { label: 'Operating Systems', href: '/repository/provisioning/operating-systems' },
      ],
    },
    {
      label: 'Configure',
      href: '/repository/configure',
      children: [
        { label: 'Playbooks', href: '/repository/configure/playbooks' },
        { label: 'Ansible', href: '/repository/configure/ansible' },
        { label: 'Roles & Variables', href: '/repository/configure/ansible/roles-variables' },
      ],
    },
  ],
};

const COMPLIANCE_NAVIGATION: DomainNavigation = {
  key: 'compliance',
  label: 'Compliance',
  basePath: '/compliance',
  homeTitle: 'Compliance',
  navItems: [
    { label: 'Policies', href: '/compliance/policies' },
    { label: 'Reports', href: '/compliance/reports' },
    { label: 'SCAP contents', href: '/compliance/scap-contents' },
    { label: 'Tailoring files', href: '/compliance/tailoring-files' },
  ],
};

export const DOMAIN_NAVIGATION: Record<DomainKey, DomainNavigation> = {
  dashboard: DASHBOARD_NAVIGATION,
  machines: MACHINES_NAVIGATION,
  repository: REPOSITORY_NAVIGATION,
  compliance: COMPLIANCE_NAVIGATION,
};

function inferDomain(pathname: string): DomainKey {
  if (pathname.startsWith('/machines')) return 'machines';
  if (pathname.startsWith('/repository')) return 'repository';
  if (pathname.startsWith('/compliance')) return 'compliance';
  return 'dashboard';
}

function flattenItems(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenItems(item.children) : [])]);
}

function titleFromPath(pathname: string, domain: DomainNavigation): string {
  if (pathname === domain.basePath) {
    return domain.homeTitle;
  }

  const allItems = flattenItems(domain.navItems);
  const matched = allItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  if (matched) {
    return matched.label;
  }

  const tailSegment = pathname.split('/').filter(Boolean).pop();
  if (!tailSegment) return domain.homeTitle;
  return tailSegment
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function getNavigationForPath(pathname: string): { domain: DomainNavigation; title: string; breadcrumbs: BreadcrumbItem[] } {
  const domain = DOMAIN_NAVIGATION[inferDomain(pathname)];
  const title = titleFromPath(pathname, domain);

  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Dashboard', href: '/' }];
  if (domain.key !== 'dashboard') {
    breadcrumbs.push({ label: domain.label, href: domain.basePath });
    if (pathname !== domain.basePath) {
      breadcrumbs.push({ label: title });
    }
  } else {
    breadcrumbs[0] = { label: 'Dashboard' };
  }

  return { domain, title, breadcrumbs };
}
