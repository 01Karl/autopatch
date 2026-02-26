import fs from 'node:fs';
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
  source?: 'fixture';
  error?: string;
};

function emptySummary(env: string, basePath: string, message: string): InventorySummary {
  return {
    env,
    inventory_path: `${basePath}/${env}/inventory`,
    server_count: 0,
    cluster_count: 0,
    servers: [],
    clusters: [],
    source: 'fixture',
    error: message,
  };
}

export function loadInventorySummary(env: string, basePath: string): InventorySummary {
  const fixturePath = path.join(process.cwd(), 'src', 'mock-data', 'inventory', `${env}.json`);

  if (!fs.existsSync(fixturePath)) {
    return emptySummary(env, basePath, `No fixture inventory found at ${fixturePath}`);
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(fixturePath, 'utf-8')) as InventorySummary;
    return {
      ...parsed,
      env,
      inventory_path: parsed.inventory_path || `${basePath}/${env}/inventory`,
      source: 'fixture',
    };
  } catch (error) {
    return emptySummary(env, basePath, `Invalid fixture JSON for ${env}: ${String(error)}`);
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
    source: 'fixture',
    error: inventoryByEnv.map((item) => item.error).filter(Boolean).join(' | ') || undefined,
  };

  return { merged, inventoryByEnv };
}
