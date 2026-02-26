import Link from 'next/link';
import type { ReactNode } from 'react';

type ManagerShellPageProps = {
  title: string;
  subtitle: string;
  workflowText: string;
  selectedEnv: string;
  selectedBasePath?: string;
  activeView: string;
  breadcrumbs: { label: string; href?: string }[];
  children?: ReactNode;
};

export default function ManagerShellPage({
  title,
  subtitle,
  workflowText,
  breadcrumbs,
  children,
}: ManagerShellPageProps) {
  const domainRoot = breadcrumbs.find((crumb) => crumb.href && crumb.href !== '/')?.href;

  return (
    <>
      <section className="shell-page-intro">
        <div className="shell-page-breadcrumbs">
          {breadcrumbs.map((crumb, idx) => (
            <span key={`${crumb.label}-${idx}`} className="inline-flex items-center gap-2">
              {idx > 0 && <span>›</span>}
              {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
            </span>
          ))}
        </div>
        <h1 className="shell-page-title">{title}</h1>
        <p className="shell-page-subtitle">{subtitle}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {domainRoot && (
            <Link href={domainRoot} className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100">
              Back to domain overview
            </Link>
          )}
          <Link href="/" className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100">
            Back to dashboard
          </Link>
        </div>
      </section>

      <p className="pane-context-text">{workflowText}</p>
      <section className="content-area">{children}</section>
    </>
  );
}
