import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Repository Manager',
};

export default function RepositoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
