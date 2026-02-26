import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardShell from '@/app/_components/layout/DashboardShell';
import { DashboardDomainProvider } from '@/app/_components/layout/dashboard-domain-context';
import { decodeSession, getSessionCookieName } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(getSessionCookieName())?.value;
  const session = decodeSession(token);

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardDomainProvider domain="dashboard">
      <DashboardShell user={session.username}>{children}</DashboardShell>
    </DashboardDomainProvider>
  );
}
