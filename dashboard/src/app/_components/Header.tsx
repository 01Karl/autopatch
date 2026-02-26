'use client';

import Link from 'next/link';
import type { BreadcrumbItem } from '@/app/_components/navigation/domain-navigation';

type HeaderProps = {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  user?: string;
};

export default function Header({ title, breadcrumbs = [], user }: HeaderProps) {
  return (
    <header className="top-header border-b border-slate-200 bg-white">
      <div className="brand">Overseer Infrastructure Manager</div>
      <div className="min-w-0 flex-1 px-4">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="shell-page-breadcrumbs mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <span key={`${crumb.label}-${idx}`} className="inline-flex items-center gap-2">
                {idx > 0 && <span>›</span>}
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <p className="truncate text-sm font-semibold text-slate-700">{title}</p>
      </div>
      <div className="header-user flex items-center gap-3">
        <span className="truncate">{user ?? 'Not signed in'}</span>
        {user && (
          <form action="/api/auth/logout" method="post" className="inline">
            <button type="submit" className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100">
              Logout
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
