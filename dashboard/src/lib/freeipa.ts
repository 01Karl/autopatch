import { getFreeIPAFileConfig } from '@/lib/config';

export type FreeIPAConfig = {
  base_url: string;
  username_suffix: string;
  verify_tls: number;
};

export function getFreeIPAConfig() {
  const cfg = getFreeIPAFileConfig();
  return {
    base_url: cfg.baseUrl || '',
    username_suffix: cfg.usernameSuffix || '',
    verify_tls: cfg.verifyTls === false ? 0 : 1,
  } as FreeIPAConfig;
}

export async function verifyFreeIPALogin(username: string, password: string) {
  const config = getFreeIPAConfig();
  if (!config?.base_url) {
    return { ok: false, error: 'FreeIPA URL är inte konfigurerad ännu.' };
  }

  const normalizedBaseUrl = config.base_url.replace(/\/$/, '');
  const fullUsername = config.username_suffix ? `${username}${config.username_suffix}` : username;

  const response = await fetch(`${normalizedBaseUrl}/ipa/session/login_password`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'text/plain',
      referer: `${normalizedBaseUrl}/ipa`,
    },
    body: new URLSearchParams({ user: fullUsername, password }).toString(),
    redirect: 'manual',
  });

  const setCookie = response.headers.get('set-cookie') || '';
  const hasSessionCookie = setCookie.includes('ipa_session');

  if (!response.ok && response.status !== 302) {
    return { ok: false, error: `FreeIPA svarade med HTTP ${response.status}.` };
  }

  if (!hasSessionCookie) {
    return { ok: false, error: 'Felaktigt användarnamn eller lösenord.' };
  }

  return { ok: true, fullUsername, config };
}
