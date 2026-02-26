import type { Metadata } from 'next';
import { DashboardDomainProvider } from '@/app/_components/layout/dashboard-domain-context';

export const metadata: Metadata = {
  title: 'Machines',
};

export default function MachinesLayout({ children }: { children: React.ReactNode }) {
  return <DashboardDomainProvider domain="machines">{children}</DashboardDomainProvider>;
}
