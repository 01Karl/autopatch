import { redirect } from 'next/navigation';
import DashboardShell from '@/app/_components/layout/DashboardShell';
import { DashboardDomainProvider } from '@/app/_components/layout/dashboard-domain-context';
import { getServerSession } from '@/lib/auth/server-session';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = getServerSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardDomainProvider domain="dashboard">
      <DashboardShell user={session.username}>{children}</DashboardShell>
    </DashboardDomainProvider>
  );
}
