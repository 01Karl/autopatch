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

export const gpgKeyStatus = [
  { keyId: '199E2F91FD431D51', source: 'RHEL 9 BaseOS', fingerprint: '567E 347A D004 4ADE 55BA 8A5F 199E 2F91 FD43 1D51', expires: '2029-06-01', trust: 'Trusted' },
  { keyId: '350D275DCD4F8A9A', source: 'RHEL 9 AppStream', fingerprint: 'B442 69D0 4F2A 6FD2 D600 82B0 350D 275D CD4F 8A9A', expires: '2029-06-01', trust: 'Trusted' },
  { keyId: 'A8A447DCE8562897', source: 'EPEL 9', fingerprint: 'FF8A D134 4597 106E CE81 D35A A8A4 47DC E856 2897', expires: '2027-12-15', trust: 'Pending rotation' }
];

export type LinuxLogCategory = 'system' | 'security' | 'services' | 'network' | 'access';

export const linuxLogCategories = logsData.linuxLogCategories;

export const linuxLogFiles = logsData.linuxLogFiles;

export const logInsights = logsData.logInsights;

export const gpgKeyStatus = [
  { keyId: '199E2F91FD431D51', source: 'RHEL 9 BaseOS', fingerprint: '567E 347A D004 4ADE 55BA 8A5F 199E 2F91 FD43 1D51', expires: '2029-06-01', trust: 'Trusted' },
  { keyId: '350D275DCD4F8A9A', source: 'RHEL 9 AppStream', fingerprint: 'B442 69D0 4F2A 6FD2 D600 82B0 350D 275D CD4F 8A9A', expires: '2029-06-01', trust: 'Trusted' },
  { keyId: 'A8A447DCE8562897', source: 'EPEL 9', fingerprint: 'FF8A D134 4597 106E CE81 D35A A8A4 47DC E856 2897', expires: '2027-12-15', trust: 'Pending rotation' }
];

export type LinuxLogCategory = 'system' | 'security' | 'services' | 'network' | 'access';

export const linuxLogCategories: { key: LinuxLogCategory; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'security', label: 'Security' },
  { key: 'services', label: 'Services' },
  { key: 'network', label: 'Network' },
  { key: 'access', label: 'Access' }
];

export const linuxLogFiles = [
  {
    id: 'boot-log',
    name: 'boot.log',
    category: 'system',
    service: 'systemd',
    distroPath: '/var/log/boot.log',
    fallbackPath: 'journalctl -b',
    size: '2.4 MB',
    lastUpdated: '2026-02-24 06:02',
    highlights: ['FAILED', 'timeout', 'dependency failed'],
    lines: [
      'Feb 24 06:00:01 boot systemd[1]: Starting Apply Kernel Variables...',
      'Feb 24 06:00:02 boot systemd[1]: Started Apply Kernel Variables.',
      'Feb 24 06:00:04 boot systemd[1]: Starting Network Time Synchronization...',
      'Feb 24 06:00:14 boot chronyd[812]: Source 10.10.10.20 online',
      'Feb 24 06:00:17 boot systemd[1]: Dependency failed for Docker Application Container Engine.',
      'Feb 24 06:00:17 boot systemd[1]: docker.service: Job docker.service/start failed with result "dependency".',
      'Feb 24 06:00:22 boot systemd[1]: Reached target Multi-User System.'
    ]
  },
  {
    id: 'secure-log',
    name: 'secure / auth.log',
    category: 'security',
    service: 'sshd/pam/sudo',
    distroPath: '/var/log/secure (RHEL) or /var/log/auth.log (Debian/Ubuntu)',
    fallbackPath: 'journalctl -u sshd -u sudo',
    size: '1.1 MB',
    lastUpdated: '2026-02-24 23:14',
    highlights: ['Failed password', 'invalid user', 'sudo', 'authentication failure'],
    lines: [
      'Feb 24 22:58:07 app01 sshd[14022]: Failed password for invalid user backup from 192.168.10.45 port 44822 ssh2',
      'Feb 24 22:58:11 app01 sshd[14022]: Connection closed by authenticating user root 192.168.10.45 port 44822 [preauth]',
      'Feb 24 23:01:39 app01 sudo: opsuser : TTY=pts/2 ; PWD=/home/opsuser ; USER=root ; COMMAND=/usr/bin/dnf updateinfo list',
      'Feb 24 23:03:04 app01 sudo: pam_unix(sudo:auth): authentication failure; logname=opsuser uid=1001 euid=0 tty=/dev/pts/2 ruser=opsuser rhost= user=opsuser',
      'Feb 24 23:03:08 app01 sudo: opsuser : 2 incorrect password attempts ; TTY=pts/2 ; PWD=/home/opsuser ; USER=root ; COMMAND=/usr/bin/systemctl restart httpd'
    ]
  },
  {
    id: 'chrony-log',
    name: 'chrony.log',
    category: 'network',
    service: 'chronyd',
    distroPath: '/var/log/chrony/chronyd.log',
    fallbackPath: 'journalctl -u chronyd',
    size: '384 KB',
    lastUpdated: '2026-02-24 21:10',
    highlights: ['clock skew', 'unreachable', 'offset'],
    lines: [
      '2026-02-24T21:00:03Z chronyd[812]: Selected source 10.10.10.20',
      '2026-02-24T21:00:19Z chronyd[812]: System clock wrong by -0.000189 seconds',
      '2026-02-24T21:05:19Z chronyd[812]: Source 10.10.10.21 unreachable',
      '2026-02-24T21:06:02Z chronyd[812]: Selected source 10.10.10.20',
      '2026-02-24T21:10:19Z chronyd[812]: Residual freq 0.002 ppm, skew 0.010 ppm'
    ]
  },
  {
    id: 'httpd-log',
    name: 'httpd error_log',
    category: 'services',
    service: 'httpd',
    distroPath: '/var/log/httpd/error_log',
    fallbackPath: 'journalctl -u httpd',
    size: '942 KB',
    lastUpdated: '2026-02-24 23:02',
    highlights: ['AH01630', 'segmentation fault', 'error'],
    lines: [
      '[Tue Feb 24 22:51:01.933881 2026] [mpm_event:notice] [pid 1010:tid 140341268202752] AH00489: Apache/2.4.57 configured -- resuming normal operations',
      '[Tue Feb 24 22:58:44.212007 2026] [authz_core:error] [pid 1120:tid 140341150766848] [client 192.168.10.45:51320] AH01630: client denied by server configuration: /var/www/html/private',
      '[Tue Feb 24 23:01:15.801234 2026] [proxy_fcgi:error] [pid 1111:tid 140341130786560] (70007)The timeout specified has expired: [client 192.168.10.90:41422] AH01075: Error dispatching request to :',
      '[Tue Feb 24 23:02:12.550291 2026] [core:notice] [pid 1010:tid 140341268202752] AH00094: Command line: "/usr/sbin/httpd -D FOREGROUND"'
    ]
  },
  {
    id: 'cups-log',
    name: 'cups/error_log',
    category: 'services',
    service: 'cupsd',
    distroPath: '/var/log/cups/error_log',
    fallbackPath: 'journalctl -u cups',
    size: '122 KB',
    lastUpdated: '2026-02-24 15:47',
    highlights: ['Unable to open', 'stopped', 'retrying'],
    lines: [
      'E [24/Feb/2026:15:40:02 +0000] [Job 287] Unable to open print file "/var/spool/cups/d000287-001": Permission denied',
      'W [24/Feb/2026:15:40:03 +0000] CreateProfile failed: org.freedesktop.ColorManager.AlreadyExists',
      'I [24/Feb/2026:15:41:12 +0000] [Job 287] Job stopped due to filter errors; please consult the error_log file for details.',
      'I [24/Feb/2026:15:47:41 +0000] Scheduler shutting down normally.'
    ]
  },
  {
    id: 'lastlog-view',
    name: 'lastlog',
    category: 'access',
    service: 'login',
    distroPath: '/var/log/lastlog',
    fallbackPath: 'lastlog command output',
    size: 'binary index',
    lastUpdated: '2026-02-24 23:03',
    highlights: ['Never logged in', 'remote', 'pts'],
    lines: [
      'Username         Port     From             Latest',
      'root             pts/0    10.20.30.15      Tue Feb 24 23:03:11 +0000 2026',
      'opsuser          pts/2    10.20.30.87      Tue Feb 24 22:59:52 +0000 2026',
      'backup           **Never logged in**',
      'svc-httpd        pts/1    10.20.30.92      Tue Feb 24 20:13:40 +0000 2026'
    ]
  }
] as const;

export const logInsights = [
  { source: 'secure/auth.log', signal: 'Failed or invalid ssh authentication attempts', level: 'Warning', count: 14, latest: '2026-02-24 23:14' },
  { source: 'journalctl -b', signal: 'Boot dependency failure for docker.service', level: 'Warning', count: 1, latest: '2026-02-24 06:00' },
  { source: 'httpd error_log', signal: 'Application timeouts and denied path access', level: 'Warning', count: 3, latest: '2026-02-24 23:02' },
  { source: 'dnf', signal: 'Unsigned repository metadata blocked', level: 'Critical', count: 1, latest: '2026-02-23 09:17' }
];

export const advisorHighlights = [
  'Enable automatic CVE triage for critical vulnerabilities.',
  'Move one-time updates into controlled weekly maintenance.',
  'Attach this machine to the hardened Linux baseline policy.'
];
