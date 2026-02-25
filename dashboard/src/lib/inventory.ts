import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export type InventoryServer = {
  hostname: string;
  cluster: string;
  env: string;
};

export type InventoryCluster = {
  name: string;
  nodes: number;
  hosts: string[];
};

export type InventorySummary = {
  env: string;
  inventory_path: string;
  server_count: number;
  cluster_count: number;
  servers: InventoryServer[];
  clusters: InventoryCluster[];
  source?: 'ansible' | 'fixture';
  error?: string;
};

type MockMode = 'force_fixture' | 'force_ansible' | 'auto';

function resolveMockMode(): MockMode {
  const raw = process.env.USE_MOCK_INVENTORY;
  if (!raw) return 'auto';

  const normalized = raw.trim().toLowerCase();
  if (normalized === 'true') return 'force_fixture';
  if (normalized === 'false') return 'force_ansible';
  return 'auto';
}

function emptySummary(env: string, message: string): InventorySummary {
  return {
    env,
    inventory_path: `environments/${env}/inventory`,
    server_count: 0,
    cluster_count: 0,
    servers: [],
    clusters: [],
    error: message
  };
}

function loadFixtureSummary(repoRoot: string, env: string, originalError?: string): InventorySummary {
  const fixturePath = path.join(repoRoot, 'dashboard', 'src', 'mock-data', 'inventory', `${env}.json`);
  if (!fs.existsSync(fixturePath)) {
    return {
      ...emptySummary(env, originalError ?? `No fixture inventory found at ${fixturePath}`),
      source: 'fixture'
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(fixturePath, 'utf-8')) as InventorySummary;
    return {
      ...parsed,
      env,
      source: 'fixture',
      error: originalError ? `${originalError} (using fixture data)` : undefined
    };
  } catch (error) {
    return {
      ...emptySummary(env, `Invalid fixture JSON for ${env}: ${String(error)}`),
      source: 'fixture'
    };
  }
}

export function loadInventorySummary(env: string, basePath: string): InventorySummary {
  const repoRoot = path.resolve(process.cwd(), '..');
  const mode = resolveMockMode();

  if (mode === 'force_fixture') {
    return loadFixtureSummary(repoRoot, env);
  }

  const scriptPath = path.join(repoRoot, 'inventory_summary.py');
  const proc = spawnSync('python3', [scriptPath, '--env', env, '--base-path', basePath], {
    cwd: repoRoot,
    encoding: 'utf-8'
  });

  if (proc.status !== 0) {
    const err = (proc.stderr || proc.stdout || 'Unknown inventory error').trim();
    if (mode === 'force_ansible') {
      return {
        ...emptySummary(env, `${err} (USE_MOCK_INVENTORY=false, fixture fallback disabled)`),
        source: 'ansible'
      };
    }
    return loadFixtureSummary(repoRoot, env, err);
  }

  try {
    return {
      ...(JSON.parse(proc.stdout) as InventorySummary),
      source: 'ansible'
    };
  } catch (error) {
    const parseError = `Invalid JSON from inventory_summary.py: ${String(error)}`;
    if (mode === 'force_ansible') {
      return {
        ...emptySummary(env, `${parseError} (USE_MOCK_INVENTORY=false, fixture fallback disabled)`),
        source: 'ansible'
      };
    }
    return loadFixtureSummary(repoRoot, env, parseError);
  }
}

export function mergeInventories(env: string, basePath: string, envOptions: readonly string[]) {
  const inventoryEnvs = env === 'all' ? envOptions : [env];
  const inventoryByEnv = inventoryEnvs.map((inventoryEnv) => loadInventorySummary(inventoryEnv, basePath));

  const merged: InventorySummary = {
    env,
    inventory_path:
      env === 'all'
        ? `${basePath}/{${envOptions.join(',')}}/inventory`
        : inventoryByEnv[0]?.inventory_path ?? `${basePath}/${env}/inventory`,
    server_count: inventoryByEnv.reduce((sum, item) => sum + item.server_count, 0),
    cluster_count: inventoryByEnv.reduce((sum, item) => sum + item.cluster_count, 0),
    servers: inventoryByEnv.flatMap((item) => item.servers.map((server) => ({ ...server, env: server.env || item.env }))),
    clusters: inventoryByEnv.flatMap((item) => item.clusters),
    source: inventoryByEnv.every((item) => item.source === 'fixture')
      ? 'fixture'
      : inventoryByEnv.every((item) => item.source === 'ansible')
        ? 'ansible'
        : undefined,
    error: inventoryByEnv.map((item) => item.error).filter(Boolean).join(' | ') || undefined
  };

  return { merged, inventoryByEnv };
}
