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

function loadFixtureSummary(repoRoot: string, env: string, originalError?: string): InventorySummary {
  const fixturePath = path.join(repoRoot, 'dashboard', 'src', 'mock-data', 'inventory', `${env}.json`);
  if (!fs.existsSync(fixturePath)) {
    return {
      env,
      inventory_path: `environments/${env}/inventory`,
      server_count: 0,
      cluster_count: 0,
      servers: [],
      clusters: [],
      source: 'fixture',
      error: originalError ?? `No fixture inventory found at ${fixturePath}`
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
      env,
      inventory_path: `environments/${env}/inventory`,
      server_count: 0,
      cluster_count: 0,
      servers: [],
      clusters: [],
      source: 'fixture',
      error: `Invalid fixture JSON for ${env}: ${String(error)}`
    };
  }
}

export function loadInventorySummary(env: string, basePath: string): InventorySummary {
  const repoRoot = path.resolve(process.cwd(), '..');
  const scriptPath = path.join(repoRoot, 'inventory_summary.py');
  const proc = spawnSync('python3', [scriptPath, '--env', env, '--base-path', basePath], {
    cwd: repoRoot,
    encoding: 'utf-8'
  });

  if (proc.status !== 0) {
    const err = (proc.stderr || proc.stdout || 'Unknown inventory error').trim();
    return loadFixtureSummary(repoRoot, env, err);
  }

  try {
    return {
      ...(JSON.parse(proc.stdout) as InventorySummary),
      source: 'ansible'
    };
  } catch (error) {
    return loadFixtureSummary(repoRoot, env, `Invalid JSON from inventory_summary.py: ${String(error)}`);
  }
}
