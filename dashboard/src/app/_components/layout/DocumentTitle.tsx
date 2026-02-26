'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const ROOT_TITLE = 'Overseer | Index';

const SEGMENT_TITLE_OVERRIDES: Record<string, string> = {
  repository: 'Repository Manager',
  machines: 'Machines',
  configuration: 'Configuration',
  provisioning: 'Provisioning',
  compliance: 'Compliance',
  content: 'Content',
  configure: 'Configure',
  login: 'Login',
};

function toTitleCase(value: string): string {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return ROOT_TITLE;
  }

  const lastSegment = decodeURIComponent(segments[segments.length - 1]);
  const pageTitle = SEGMENT_TITLE_OVERRIDES[lastSegment] ?? toTitleCase(lastSegment);

  return `Overseer | ${pageTitle}`;
}

export function DocumentTitle() {
  const pathname = usePathname();

  useEffect(() => {
    document.title = buildPageTitle(pathname);
  }, [pathname]);

  return null;
}
