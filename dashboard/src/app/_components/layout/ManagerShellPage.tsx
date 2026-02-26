import type { ReactNode } from 'react';
import ManagerSidebarNav, { ManagerNavKey } from '@/app/_components/layout/ManagerSidebarNav';

type ManagerShellPageProps = {
  title: string;
  subtitle: string;
  workflowText: string;
  selectedEnv: string;
  selectedBasePath?: string;
  activeView: ManagerNavKey;
  breadcrumbs: { label: string; href?: string }[];
  children?: ReactNode;
};

export default function ManagerShellPage({
  title,
  subtitle,
  workflowText,
  selectedEnv,
  selectedBasePath = 'environments',
  activeView,
  breadcrumbs,
  children,
}: ManagerShellPageProps) {
  return (
    <main className="azure-shell">
      <header className="top-header">
        <div className="brand">Overseer | {title}</div>
        <input className="header-search" placeholder="Search resources, services and docs" />
        <div className="header-user">Overseer · {title}</div>
      </header>

      <section className="shell-page-intro">
        <div className="shell-page-breadcrumbs">
          {breadcrumbs.map((crumb, idx) => (
            <span key={`${crumb.label}-${idx}`} className="inline-flex items-center gap-2">
              {idx > 0 && <span>›</span>}
              {crumb.href ? <a href={crumb.href}>{crumb.label}</a> : <span>{crumb.label}</span>}
            </span>
          ))}
        </div>
        <h1 className="shell-page-title">{title}</h1>
        <p className="shell-page-subtitle">{subtitle}</p>
      </section>

      <div className="shell-layout">
        <ManagerSidebarNav activeView={activeView} selectedEnv={selectedEnv} selectedBasePath={selectedBasePath} />

        <section className="main-pane">
          <p className="pane-context-text">{workflowText}</p>
          <section className="content-area">{children}</section>
        </section>
      </div>
    </main>
  );
}
