import Link from 'next/link';

type LinkTabItem = {
  key: string;
  label: string;
  href: string;
};

type LinkTabsProps = {
  tabs: LinkTabItem[];
  activeKey: string;
  containerClassName?: string;
  baseTabClassName?: string;
  activeTabClassName?: string;
};

export default function LinkTabs({
  tabs,
  activeKey,
  containerClassName = 'tabs-row',
  baseTabClassName = 'tab',
  activeTabClassName = 'active',
}: LinkTabsProps) {
  return (
    <section className={containerClassName}>
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`${baseTabClassName} ${activeKey === tab.key ? activeTabClassName : ''}`.trim()}
        >
          {tab.label}
        </Link>
      ))}
    </section>
  );
}
