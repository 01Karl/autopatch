import { ReactNode } from 'react';
import { FiActivity, FiArrowLeft, FiBox, FiCheckCircle, FiClock, FiCpu, FiDatabase, FiFileText, FiHardDrive, FiKey, FiLock, FiRefreshCw, FiSettings, FiShield, FiSliders, FiTool, FiUser } from 'react-icons/fi';
import { ContentTab, MachineSection } from '../_lib/machine-data';

type Props = {
  activeSection: MachineSection;
  machineBasePath: string;
  machineQuery: string;
  machineName: string;
  selectedEnv: string;
  selectedBasePath: string;
  resourceType: string;
  platform: string;
  distribution: string;
  contentTab?: ContentTab;
  children: ReactNode;
};

const updatesTabs: { id: ContentTab; label: string }[] = [
  { id: 'packages', label: 'Packages' },
  { id: 'errata', label: 'Errata' },
  { id: 'module-streams', label: 'Module streams' },
  { id: 'repository-sets', label: 'Repository sets' }
];

const sectionTitles: Record<MachineSection, string> = {
  overview: 'Overview',
  updates: 'Updates',
  security: 'Security',
  'repository-trust': 'Repository trust',
  logs: 'Logs',
  'advisor-recommendations': 'Advisor recommendations',
  extensions: 'Extensions',
  'continuous-delivery': 'Continuous delivery',
  configuration: 'Configuration',
  identity: 'Identity',
  properties: 'Properties',
  locks: 'Locks'
};

export default function MachineShell({
  activeSection,
  machineBasePath,
  machineQuery,
  machineName,
  selectedEnv,
  selectedBasePath,
  resourceType,
  platform,
  distribution,
  contentTab,
  children
}: Props) {
  const machineMenuGroups: { heading: string; items: { key: MachineSection; label: string; icon: typeof FiActivity }[] }[] = [
    {
      heading: 'Machine menu',
      items: [
        { key: 'overview', label: 'Overview', icon: FiActivity },
        { key: 'updates', label: 'Updates', icon: FiSettings },
        { key: 'security', label: 'Security', icon: FiShield },
        { key: 'repository-trust', label: 'Repository trust', icon: FiKey },
        { key: 'logs', label: 'Logs', icon: FiFileText }
      ]
    },
    {
      heading: 'Automation & governance',
      items: [
        { key: 'advisor-recommendations', label: 'Advisor recommendations', icon: FiCheckCircle },
        { key: 'extensions', label: 'Extensions', icon: FiBox },
        { key: 'continuous-delivery', label: 'Continuous delivery', icon: FiRefreshCw },
        { key: 'configuration', label: 'Configuration', icon: FiSliders }
      ]
    },
    {
      heading: 'Metadata',
      items: [
        { key: 'properties', label: 'Properties', icon: FiCpu },
        { key: 'identity', label: 'Identity', icon: FiUser },
        { key: 'locks', label: 'Locks', icon: FiLock }
      ]
    }
  ];

  const operationItems = [
    { label: 'Bastion', icon: FiTool },
    { label: 'Auto-shutdown', icon: FiClock },
    { label: 'Backup', icon: FiDatabase },
    { label: 'Disaster recovery', icon: FiHardDrive },
    { label: 'Updates', icon: FiSettings, active: true },
    { label: 'Inventory', icon: FiBox },
    { label: 'Change tracking', icon: FiRefreshCw }
  ];

  return (
    <main className="azure-shell">
      <header className="top-header">
        <div className="brand">Overseer Console</div>
        <input className="header-search" placeholder="Search machines, updates and docs" />
        <div className="header-user">Connie Wilson · CONTOSO</div>
      </header>

      <section className="shell-page-intro">
        <div className="shell-page-breadcrumbs">
          <a href="/">Home</a>
          <span>›</span>
          <a href={`/machines?env=${selectedEnv}`}>Machines</a>
          <span>›</span>
          <span>{machineName}</span>
        </div>
        <h1 className="shell-page-title">Overseer Machine Manager</h1>
        <p className="shell-page-subtitle">Machine details and operational views for {machineName}.</p>
      </section>

      <div className="shell-layout">
        <aside className="side-nav machine-side-nav">
          <a className="side-link" href={`/machines?env=${selectedEnv}`}>
            <span className="side-icon"><FiArrowLeft /></span>
            <span>Back to Machines</span>
          </a>

          {machineMenuGroups.map((group) => (
            <section className="machine-nav-group" key={group.heading}>
              <p className="side-title mt-4">{group.heading}</p>
              {group.items.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <a className={`side-link ${activeSection === item.key ? 'active' : ''}`} key={item.label} href={`${machineBasePath}/${item.key}?${machineQuery}`}>
                    <span className="side-icon"><ItemIcon /></span>
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </section>
          ))}

          <section className="machine-nav-group">
            <p className="side-title mt-4">Operations</p>
            {operationItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <a className={`side-link ${item.active ? 'active' : ''}`} key={item.label} href="#">
                  <span className="side-icon"><ItemIcon /></span>
                  <span>{item.label}</span>
                </a>
              );
            })}
          </section>
        </aside>

        <section className="main-pane">
          <section className="machine-content-area">
            <section className="machine-title-row">
              <div>
                <h1 className="machine-title">⚙ {machineName} | {sectionTitles[activeSection]}</h1>
                <p className="machine-subtitle">{resourceType} · {platform} / {distribution} · {selectedEnv.toUpperCase()} · {selectedBasePath}</p>
              </div>
              <button className="machine-close-btn" type="button">×</button>
            </section>

            {activeSection === 'updates' && (
              <>
                <p className="pane-context-text">Update content views · switch between package-, errata- och repositoryfokuserade vyer.</p>
                <section className="machine-actions-row">
                  {updatesTabs.map((tab) => (
                    <a
                      key={tab.id}
                      className={`machine-action ${contentTab === tab.id ? 'active' : ''}`}
                      href={`${machineBasePath}/updates?${machineQuery}&content=${tab.id}`}
                    >
                      {tab.label}
                    </a>
                  ))}
                </section>
              </>
            )}

            {activeSection === 'logs' && (
              <>
                <p className="pane-context-text">Log analysis workflow · välj loggfil, filtrera signaler och sortera fynd för snabb triagering.</p>
                <section className="machine-actions-row">
                  <button className="machine-action" type="button">Refresh logs</button>
                  <button className="machine-action" type="button">Open journal query</button>
                  <button className="machine-action" type="button">Export snapshot</button>
                  <button className="machine-action" type="button">Create alert rule</button>
                </section>
              </>
            )}

            {activeSection !== 'updates' && activeSection !== 'logs' && (
              <p className="pane-context-text">Machine workflow for {sectionTitles[activeSection].toLowerCase()}.</p>
            )}

            {children}
          </section>
        </section>
      </div>
    </main>
  );
}
