const ENV = {
  FREEIPA_HOST: process.env.FREEIPA_HOST,
  FREEIPA_PORT: process.env.FREEIPA_PORT,
  FREEIPA_BASE_DN: process.env.FREEIPA_BASE_DN,
  FREEIPA_BIND_DN: process.env.FREEIPA_BIND_DN,
  FREEIPA_BIND_PASSWORD: process.env.FREEIPA_BIND_PASSWORD,
  FREEIPA_USER_SEARCH_BASE: process.env.FREEIPA_USER_SEARCH_BASE,
  FREEIPA_USER_SEARCH_FILTER: process.env.FREEIPA_USER_SEARCH_FILTER,
  FREEIPA_USE_TLS: process.env.FREEIPA_USE_TLS,
  AUTOPATCH_SESSION_SECRET: process.env.AUTOPATCH_SESSION_SECRET,
};

function requireEnv(name: keyof typeof ENV): string {
  const value = ENV[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePort(raw: string): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error('FREEIPA_PORT must be a valid TCP port between 1 and 65535.');
  }
  return parsed;
}

function parseBoolean(raw: string, envName: string): boolean {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`${envName} must be either "true" or "false".`);
}

type FreeIpaConfig = {
  host: string;
  port: number;
  baseDn: string;
  bindDn: string;
  bindPassword: string;
  userSearchBase: string;
  userSearchFilter: string;
  useTls: boolean;
  timeoutMs: number;
};

type SessionConfig = {
  secret: string;
  maxAgeSeconds: number;
};

export type AuthConfig = {
  freeipa: FreeIpaConfig;
  session: SessionConfig;
};

let freeipaConfigCache: FreeIpaConfig | null = null;
let sessionConfigCache: SessionConfig | null = null;

export function getFreeIpaConfig(): FreeIpaConfig {
  if (freeipaConfigCache) {
    return freeipaConfigCache;
  }

  const host = requireEnv('FREEIPA_HOST');
  if (host.includes('://') || host.includes('/')) {
    throw new Error('FREEIPA_HOST must only contain the LDAP host (no protocol or path).');
  }

  const userSearchFilter = requireEnv('FREEIPA_USER_SEARCH_FILTER');
  if (!userSearchFilter.includes('{{username}}')) {
    throw new Error('FREEIPA_USER_SEARCH_FILTER must include the placeholder {{username}}.');
  }

  freeipaConfigCache = {
    host,
    port: parsePort(requireEnv('FREEIPA_PORT')),
    baseDn: requireEnv('FREEIPA_BASE_DN'),
    bindDn: requireEnv('FREEIPA_BIND_DN'),
    bindPassword: requireEnv('FREEIPA_BIND_PASSWORD'),
    userSearchBase: requireEnv('FREEIPA_USER_SEARCH_BASE'),
    userSearchFilter,
    useTls: parseBoolean(requireEnv('FREEIPA_USE_TLS'), 'FREEIPA_USE_TLS'),
    timeoutMs: 8000,
  };

  return freeipaConfigCache;
}

export function getSessionConfig(): SessionConfig {
  if (sessionConfigCache) {
    return sessionConfigCache;
  }

  sessionConfigCache = {
    secret: requireEnv('AUTOPATCH_SESSION_SECRET'),
    maxAgeSeconds: 60 * 60 * 10,
  };

  return sessionConfigCache;
}

export function getAuthConfig(): AuthConfig {
  return {
    freeipa: getFreeIpaConfig(),
    session: getSessionConfig(),
  };
}
