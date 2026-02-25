import { loadInventorySummary } from '@/lib/inventory';

export const ENV_OPTIONS = ['prod', 'qa', 'dev'] as const;
export const DEFAULT_BASE_PATH = 'environments';

export type MachineSection =
  | 'overview'
  | 'updates'
  | 'security'
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

export const errata = [
  { id: 'RLSA-2026:0018', type: 'Security', severity: 'Important', installable: 'Yes', synopsis: 'Kernel security update', published: '2026-01-18' },
  { id: 'RLSA-2026:0022', type: 'Security', severity: 'Moderate', installable: 'Yes', synopsis: 'OpenSSL vulnerability fix', published: '2026-01-20' },
  { id: 'RLEA-2026:0004', type: 'Bugfix', severity: 'Low', installable: 'Yes', synopsis: 'Container runtime stability update', published: '2026-02-02' }
];

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

export const securityFindings = [
  { cve: 'CVE-2026-1123', package: 'openssl', severity: 'High', status: 'Open', action: 'Patch with LSA-2026-017' },
  { cve: 'CVE-2026-1301', package: 'kernel', severity: 'Critical', status: 'Mitigated in staging', action: 'Promote tested kernel rollout' },
  { cve: 'CVE-2026-1440', package: 'containerd', severity: 'Medium', status: 'Open', action: 'Schedule during maintenance window' }
];

export const policyChecks = [
  { policy: 'Critical patches within 7 days', status: 'At risk', details: '1 patch is older than SLA' },
  { policy: 'No unsupported repositories', status: 'Compliant', details: 'Only approved repositories active' },
  { policy: 'Reboot after kernel update', status: 'Compliant', details: 'Last kernel reboot completed' }
];

export const advisorHighlights = [
  'Enable automatic CVE triage for critical vulnerabilities.',
  'Move one-time updates into controlled weekly maintenance.',
  'Attach this machine to the hardened Linux baseline policy.'
];
