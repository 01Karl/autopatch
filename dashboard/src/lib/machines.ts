import prodInventory from '@/mock-data/inventory/prod.json';
import qaInventory from '@/mock-data/inventory/qa.json';
import devInventory from '@/mock-data/inventory/dev.json';
import machineMetadata from '@/mock-data/machines/metadata.json';

export type MachineEnv = 'prod' | 'qa' | 'dev';

export type MachineMetadata = {
  role: string;
  owner: string;
  location: string;
  criticality: string;
  patchWindow: string;
  lastSeen: string;
  osVersion: string;
  compliance: string;
  maintenanceGroup: string;
};

export type MachineListItem = {
  hostname: string;
  cluster: string;
  env: MachineEnv;
  metadata: MachineMetadata;
};

const envMap = {
  prod: prodInventory,
  qa: qaInventory,
  dev: devInventory
} as const;

const defaultMetadata: MachineMetadata = {
  role: 'infra',
  owner: 'Platform',
  location: 'Stockholm-1',
  criticality: 'medium',
  patchWindow: 'Sun 02:00',
  lastSeen: '2026-02-25 02:00',
  osVersion: 'RHEL 9.4',
  compliance: 'Compliant',
  maintenanceGroup: 'standalone'
};

export function getMockMachines(env: 'all' | MachineEnv): MachineListItem[] {
  const envs: MachineEnv[] = env === 'all' ? ['prod', 'qa', 'dev'] : [env];

  return envs.flatMap((selectedEnv) =>
    envMap[selectedEnv].servers.map((server) => ({
      hostname: server.hostname,
      cluster: server.cluster,
      env: selectedEnv,
      metadata: machineMetadata[server.hostname as keyof typeof machineMetadata] || {
        ...defaultMetadata,
        maintenanceGroup: server.cluster || defaultMetadata.maintenanceGroup
      }
    }))
  );
}
