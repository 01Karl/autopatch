'use client';

import { usePathname } from 'next/navigation';
import Header from '@/app/_components/Header';
import Sidebar from '@/app/_components/Sidebar';
import { DOMAIN_NAVIGATION, getNavigationForPath } from '@/app/_components/navigation/domain-navigation';
import { useDashboardDomain } from '@/app/_components/layout/dashboard-domain-context';

type DashboardShellProps = {
  children: React.ReactNode;
  user?: string;
};

export default function DashboardShell({ children, user }: DashboardShellProps) {
  const pathname = usePathname();
  const activeDomain = useDashboardDomain();
  const { title, breadcrumbs } = getNavigationForPath(pathname);
  const domain = DOMAIN_NAVIGATION[activeDomain];

  return (
    <main className="azure-shell min-h-screen">
      <Header title={title} breadcrumbs={breadcrumbs} user={user} />
      <div className="shell-layout">
        <Sidebar navigation={domain} />
        <section className="main-pane">
          <section className="content-area">{children}</section>
        </section>
      </div>
    </main>
  );
}
