import type { Metadata } from 'next';
import { DashboardDomainProvider } from '@/app/_components/layout/dashboard-domain-context';

export const metadata: Metadata = {
  title: 'Compliance',
};

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  return <DashboardDomainProvider domain="compliance">{children}</DashboardDomainProvider>;
}
