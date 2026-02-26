import { Client } from 'ldapts';
import { getFreeIpaConfig } from '@/lib/config/auth';

type LdapAuthResult =
  | { ok: true; user: { username: string; displayName: string; groups: string[] } }
  | { ok: false; error: 'INVALID_CREDENTIALS' | 'AUTH_UNAVAILABLE' };

function escapeLDAPValue(input: string): string {
  return input
    .replace(/\\/g, '\\5c')
    .replace(/\*/g, '\\2a')
    .replace(/\(/g, '\\28')
    .replace(/\)/g, '\\29')
    .replace(/\0/g, '\\00');
}

function buildUserFilter(username: string, userSearchFilter: string): string {
  const safeUsername = escapeLDAPValue(username);
  return userSearchFilter.replace('{{username}}', safeUsername);
}

function getLdapUrl(host: string, port: number, useTls: boolean) {
  const scheme = useTls ? 'ldaps' : 'ldap';
  return `${scheme}://${host}:${port}`;
}

function normalizeDisplayName(
  attrs: Record<string, unknown>,
  fallbackUsername: string,
): string {
  const displayName = attrs.displayName;
  const cn = attrs.cn;
  const first = Array.isArray(displayName) ? displayName[0] : displayName;
  const second = Array.isArray(cn) ? cn[0] : cn;
  return String(first || second || fallbackUsername);
}

function normalizeGroups(attrs: Record<string, unknown>): string[] {
  const groups = attrs.memberOf;
  if (Array.isArray(groups)) {
    return groups.map((item) => String(item));
  }
  if (typeof groups === 'string' && groups.length > 0) {
    return [groups];
  }
  return [];
}

export async function authenticateWithLdap(username: string, password: string): Promise<LdapAuthResult> {
  const trimmedUsername = username.trim();
  if (!trimmedUsername || !password) {
    return { ok: false, error: 'INVALID_CREDENTIALS' };
  }

  let freeIpaConfig: ReturnType<typeof getFreeIpaConfig>;
  try {
    freeIpaConfig = getFreeIpaConfig();
  } catch (error) {
    console.error('LDAP configuration error:', error);
    return { ok: false, error: 'AUTH_UNAVAILABLE' };
  }

  const client = new Client({
    url: getLdapUrl(freeIpaConfig.host, freeIpaConfig.port, freeIpaConfig.useTls),
    timeout: freeIpaConfig.timeoutMs,
    connectTimeout: freeIpaConfig.timeoutMs,
    tlsOptions: freeIpaConfig.useTls ? { rejectUnauthorized: true } : undefined,
  });

  try {
    await client.bind(freeIpaConfig.bindDn, freeIpaConfig.bindPassword);

    const { searchEntries } = await client.search(freeIpaConfig.userSearchBase || freeIpaConfig.baseDn, {
      scope: 'sub',
      filter: buildUserFilter(trimmedUsername, freeIpaConfig.userSearchFilter),
      sizeLimit: 2,
      attributes: ['dn', 'cn', 'displayName', 'memberOf'],
    });

    if (searchEntries.length !== 1) {
      return { ok: false, error: 'INVALID_CREDENTIALS' };
    }

    const userEntry = searchEntries[0] as Record<string, unknown> & { dn?: string };
    const userDn = String(userEntry.dn || '');
    if (!userDn) {
      return { ok: false, error: 'INVALID_CREDENTIALS' };
    }

    await client.bind(userDn, password);

    return {
      ok: true,
      user: {
        username: trimmedUsername,
        displayName: normalizeDisplayName(userEntry, trimmedUsername),
        groups: normalizeGroups(userEntry),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    const name = typeof error === 'object' && error && 'name' in error ? String((error as { name?: unknown }).name).toLowerCase() : '';
    if (name.includes('invalidcredential') || message.includes('invalid credentials') || message.includes('invalidcredential')) {
      return { ok: false, error: 'INVALID_CREDENTIALS' };
    }

    console.error('LDAP authentication error:', error);
    return { ok: false, error: 'AUTH_UNAVAILABLE' };
  } finally {
    await client.unbind().catch(() => undefined);
  }
}
