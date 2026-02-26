'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DomainNavigation, NavItem } from '@/app/_components/navigation/domain-navigation';

type SidebarProps = {
  navigation: DomainNavigation;
};

function NavLink({ item, pathname, nested = false }: { item: NavItem; pathname: string; nested?: boolean }) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <div className={nested ? 'pl-6' : ''}>
      <Link href={item.href} className={`side-link ${active ? 'active' : ''}`}>
        <span>{item.label}</span>
      </Link>
      {item.children?.map((child) => (
        <NavLink key={child.href} item={child} pathname={pathname} nested />
      ))}
    </div>
  );
}

export default function Sidebar({ navigation }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="side-nav">
      <p className="side-title">{navigation.label}</p>
      {navigation.navItems.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} />
      ))}
      {navigation.key !== 'dashboard' && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <Link href={navigation.basePath} className="side-link">
            <span>Back to {navigation.label} overview</span>
          </Link>
          <Link href="/" className="side-link">
            <span>Back to dashboard</span>
          </Link>
        </div>
      )}
    </aside>
  );
}
