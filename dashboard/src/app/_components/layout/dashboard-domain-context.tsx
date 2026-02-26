'use client';

import { createContext, useContext } from 'react';
import type { DomainKey } from '@/app/_components/navigation/domain-navigation';

const DashboardDomainContext = createContext<DomainKey>('dashboard');

export function DashboardDomainProvider({ domain, children }: { domain: DomainKey; children: React.ReactNode }) {
  return <DashboardDomainContext.Provider value={domain}>{children}</DashboardDomainContext.Provider>;
}

export function useDashboardDomain() {
  return useContext(DashboardDomainContext);
}
