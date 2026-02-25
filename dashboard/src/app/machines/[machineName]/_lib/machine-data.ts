import { loadInventorySummary } from '@/lib/inventory';
import logsData from '@/mock-data/machines/logs.json';
import securityData from '@/mock-data/machines/security.json';

export const ENV_OPTIONS = ['prod', 'qa', 'dev'] as const;
export const DEFAULT_BASE_PATH = 'environments';

export type MachineSection =
  | 'overview'
  | 'updates'
  | 'security'
  | 'repository-trust'
  | 'logs'
  | 'advisor-recommendations'
  | 'extensions'
  | 'continuous-delivery'
  | 'configuration'
  | 'identity'
  | 'properties'
  | 'locks';

export type ContentTab = 'packages' | 'errata' | 'module-streams' | 'repository-sets';

export type MachinePageSearchParams = {
  env?: string;
  basePath?: string;
  content?: string;
};

export function getPlatformAndDistribution(index: number) {
  const linuxDistributions = ['Ubuntu', 'Debian', 'RHEL', 'Rocky Linux', 'SUSE Linux Enterprise', 'AlmaLinux'] as const;
  const unixDistributions = ['AIX', 'Solaris'] as const;
  const bsdDistributions = ['FreeBSD 13', 'FreeBSD 14'] as const;

  const platform = index % 9 === 0 ? 'FreeBSD' : index % 7 === 0 ? 'Unix' : 'Linux';
  const distribution =
    platform === 'FreeBSD'
      ? bsdDistributions[index % bsdDistributions.length]
      : platform === 'Unix'
        ? unixDistributions[index % unixDistributions.length]
        : linuxDistributions[index % linuxDistributions.length];

  return { platform, distribution };
}

export function getMachineContext(machineNameParam: string, searchParams?: MachinePageSearchParams) {
  const selectedEnv = ENV_OPTIONS.includes(searchParams?.env as (typeof ENV_OPTIONS)[number])
    ? (searchParams?.env as (typeof ENV_OPTIONS)[number])
    : 'prod';
  const selectedBasePath = searchParams?.basePath || DEFAULT_BASE_PATH;
  const contentTab: ContentTab =
    searchParams?.content === 'errata' ||
    searchParams?.content === 'module-streams' ||
    searchParams?.content === 'repository-sets'
      ? searchParams.content
      : 'packages';

  const inventory = loadInventorySummary(selectedEnv, selectedBasePath);
  const machineName = decodeURIComponent(machineNameParam);
  const serverIndex = inventory.servers.findIndex((s) => s.hostname === machineName);
  const server = serverIndex >= 0 ? inventory.servers[serverIndex] : undefined;
  const { platform, distribution } = getPlatformAndDistribution(Math.max(serverIndex, 0));
  const resourceType = server?.cluster === 'standalone' ? 'Bare metal server' : 'Virtual machine';

  const machineBasePath = `/machines/${encodeURIComponent(machineName)}`;
  const machineQuery = `env=${selectedEnv}&basePath=${selectedBasePath}`;

  return {
    selectedEnv,
    selectedBasePath,
    contentTab,
    inventory,
    machineName,
    serverIndex,
    server,
    platform,
    distribution,
    resourceType,
    machineBasePath,
    machineQuery
  };
}

export const updates = [
  { name: 'Kernel security rollup', classification: 'Critical', severity: 'Critical', kb: 'LSA-2026-001', reboot: 'Requires reboot', published: '2026-01-18 03:10' },
  { name: 'OpenSSL package refresh', classification: 'Security', severity: 'Important', kb: 'LSA-2026-017', reboot: 'No reboot', published: '2026-01-20 11:30' },
  { name: 'Container runtime update', classification: 'Security', severity: 'Moderate', kb: 'LSA-2026-028', reboot: 'No reboot', published: '2026-02-02 07:50' }
];

export const errata = securityData.errata;

export const moduleStreams = [
  { name: 'nodejs:20', status: 'Enabled', repoSet: 'rhel-9-appstream-rpms', profile: 'common', packages: 13 },
  { name: 'postgresql:16', status: 'Enabled', repoSet: 'rhel-9-appstream-rpms', profile: 'server', packages: 8 },
  { name: 'nginx:1.24', status: 'Available', repoSet: 'rhel-9-appstream-rpms', profile: 'minimal', packages: 5 }
];

export const repositorySets = [
  { name: 'rhel-9-baseos-rpms', state: 'Enabled', source: 'Satellite', contentType: 'RPM', lastSync: '2026-02-21 23:40' },
  { name: 'rhel-9-appstream-rpms', state: 'Enabled', source: 'Satellite', contentType: 'RPM + Module', lastSync: '2026-02-21 23:40' },
  { name: 'epel-9', state: 'Disabled', source: 'External mirror', contentType: 'RPM', lastSync: '2026-01-30 05:12' }
];

export const securityFindings = securityData.securityFindings;

export const policyChecks = securityData.policyChecks;

export const gpgKeyStatus = securityData.gpgKeyStatus;

export type LinuxLogCategory = 'system' | 'security' | 'services' | 'network' | 'access';

export const linuxLogCategories = logsData.linuxLogCategories;

export const linuxLogFiles = logsData.linuxLogFiles;

export const logInsights = logsData.logInsights;

export const advisorHighlights = [
  'Enable automatic CVE triage for critical vulnerabilities.',
  'Move one-time updates into controlled weekly maintenance.',
  'Attach this machine to the hardened Linux baseline policy.'
];
