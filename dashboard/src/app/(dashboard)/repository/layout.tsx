import type { Metadata } from 'next';
import { DashboardDomainProvider } from '@/app/_components/layout/dashboard-domain-context';

export const metadata: Metadata = {
  title: 'Repository Manager',
};

export default function RepositoryLayout({ children }: { children: React.ReactNode }) {
  return <DashboardDomainProvider domain="repository">{children}</DashboardDomainProvider>;
}
