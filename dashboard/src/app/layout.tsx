import type { Metadata } from 'next';
import './globals.css';
import { startScheduler } from '@/lib/scheduler';
import { DocumentTitle } from '@/app/_components/layout/DocumentTitle';

startScheduler();

export const metadata: Metadata = {
  title: {
    default: 'Overseer | Index',
    template: 'Overseer | %s',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className="bg-slate-100 text-slate-900">
        <DocumentTitle />
        {children}
      </body>
    </html>
  );
}
