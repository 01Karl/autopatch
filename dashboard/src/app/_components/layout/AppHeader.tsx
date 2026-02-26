import type { ReactNode } from 'react';

type AppHeaderProps = {
  brand: string;
  title: string;
  rightContent?: ReactNode;
};

export default function AppHeader({ brand, title, rightContent }: AppHeaderProps) {
  return (
    <header className="top-header">
      <div className="brand">{brand}</div>
      <input className="header-search" placeholder="Search resources, services and docs" />
      <div className="header-user">{rightContent ?? title}</div>
    </header>
  );
}
