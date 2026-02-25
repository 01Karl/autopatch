import { ReactNode } from 'react';
import { FiActivity, FiArrowLeft, FiBox, FiCheckCircle, FiClock, FiCpu, FiDatabase, FiHardDrive, FiLock, FiRefreshCw, FiSettings, FiShield, FiSliders, FiTool, FiUser } from 'react-icons/fi';
import { MachineSection } from '../_lib/machine-data';

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
  children: ReactNode;
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
  children
}: Props) {
  const machineMenuItems: { key: MachineSection; label: string; icon: typeof FiActivity }[] = [
    { key: 'overview', label: 'Overview', icon: FiActivity },
    { key: 'updates', label: 'Updates', icon: FiSettings },
    { key: 'security', label: 'Security', icon: FiShield },
    { key: 'advisor-recommendations', label: 'Advisor recommendations', icon: FiCheckCircle },
    { key: 'extensions', label: 'Extensions', icon: FiBox },
    { key: 'continuous-delivery', label: 'Continuous delivery', icon: FiRefreshCw },
    { key: 'configuration', label: 'Configuration', icon: FiSliders },
    { key: 'identity', label: 'Identity', icon: FiUser },
    { key: 'properties', label: 'Properties', icon: FiCpu },
    { key: 'locks', label: 'Locks', icon: FiLock }
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
          <a href={`/?env=${selectedEnv}&view=machines&basePath=${selectedBasePath}`}>Machines</a>
          <span>›</span>
          <span>{machineName}</span>
        </div>
        <h1 className="shell-page-title">Overseer Update Manager</h1>
        <p className="shell-page-subtitle">Machine details and update operations for {machineName}.</p>
      </section>

      <div className="shell-layout">
        <aside className="side-nav machine-side-nav">
          <a className="side-link" href={`/?env=${selectedEnv}&view=machines&basePath=${selectedBasePath}`}>
            <span className="side-icon"><FiArrowLeft /></span>
            <span>Back to Machines</span>
          </a>

          <section className="machine-nav-group">
            <p className="side-title mt-4">Machine menu</p>
            {machineMenuItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <a className={`side-link ${activeSection === item.key ? 'active' : ''}`} key={item.label} href={`${machineBasePath}/${item.key}?${machineQuery}`}>
                  <span className="side-icon"><ItemIcon /></span>
                  <span>{item.label}</span>
                </a>
              );
            })}
          </section>

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
                <h1 className="machine-title">⚙ {machineName} | Updates</h1>
                <p className="machine-subtitle">{resourceType} · {platform} / {distribution} · {selectedEnv.toUpperCase()}</p>
              </div>
              <button className="machine-close-btn" type="button">×</button>
            </section>

            <p className="pane-context-text">Machine workflow · Use refresh, update checks, one-time update and scheduling actions from the command row below.</p>

            <section className="machine-actions-row">
              <button className="machine-action">Leave new experience</button>
              <button className="machine-action">Refresh</button>
              <button className="machine-action">Check for updates</button>
              <button className="machine-action">One-time update</button>
              <button className="machine-action">Scheduled updates</button>
              <button className="machine-action">Update settings</button>
              <button className="machine-action">Overseer Update Manager</button>
            </section>

            <section className="machine-announcement">
              <p>Manage VM updates at scale with the new Overseer update orchestration flow. <a className="link" href={`/?env=${selectedEnv}&view=machines&basePath=${selectedBasePath}`}>Learn more</a></p>
            </section>

            {children}
          </section>
        </section>
      </div>
    </main>
  );
}
