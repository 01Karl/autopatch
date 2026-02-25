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
  error?: string;
};

export function loadInventorySummary(env: string, basePath: string): InventorySummary {
  const repoRoot = path.resolve(process.cwd(), '..');
  const scriptPath = path.join(repoRoot, 'inventory_summary.py');
  const proc = spawnSync('python3', [scriptPath, '--env', env, '--base-path', basePath], {
    cwd: repoRoot,
    encoding: 'utf-8'
  });

  if (proc.status !== 0) {
    return {
      env,
      inventory_path: `${basePath}/${env}/inventory`,
      server_count: 0,
      cluster_count: 0,
      servers: [],
      clusters: [],
      error: (proc.stderr || proc.stdout || 'Unknown inventory error').trim()
    };
  }

  try {
    return JSON.parse(proc.stdout) as InventorySummary;
  } catch (error) {
    return {
      env,
      inventory_path: `${basePath}/${env}/inventory`,
      server_count: 0,
      cluster_count: 0,
      servers: [],
      clusters: [],
      error: `Invalid JSON from inventory_summary.py: ${String(error)}`
    };
  }
}
