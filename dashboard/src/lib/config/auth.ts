const REQUIRED_ENV_KEYS = [
  'FREEIPA_HOST',
  'FREEIPA_PORT',
  'FREEIPA_BASE_DN',
  'FREEIPA_BIND_DN',
  'FREEIPA_BIND_PASSWORD',
  'FREEIPA_USER_SEARCH_BASE',
  'FREEIPA_USER_SEARCH_FILTER',
  'FREEIPA_USE_TLS',
  'AUTOPATCH_SESSION_SECRET',
] as const;

function requireEnv(name: (typeof REQUIRED_ENV_KEYS)[number]): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it in dashboard/.env.local (or your deployed runtime environment), then restart the Next.js server.`,
    );
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
