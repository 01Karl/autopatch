import { getFreeIPAConfigPath } from '@/lib/config';
import { getFreeIPAConfig } from '@/lib/freeipa';

type LoginPageParams = {
  error?: string;
  redirectTo?: string;
};

export default function LoginPage({ searchParams }: { searchParams?: LoginPageParams }) {
  const cfg = getFreeIPAConfig();
  const redirectTo = searchParams?.redirectTo || '/';

  return (
    <main className="min-h-screen bg-rose-950 flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-xl border border-rose-800 bg-rose-900/90 p-6 shadow-xl shadow-rose-950/50 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-rose-50">Logga in via FreeIPA</h1>
          <p className="text-sm text-rose-200">Säker inloggning till Overseer Console.</p>
        </div>

        <div className="rounded-md bg-rose-950/60 p-3 text-xs text-rose-100">
          <p><strong>FreeIPA endpoint:</strong> {cfg.base_url || 'Inte konfigurerad'}</p>
          <p><strong>Username suffix:</strong> {cfg.username_suffix || '(none)'}</p>
          <p><strong>Konfig-fil:</strong> {getFreeIPAConfigPath()}</p>
        </div>

        {searchParams?.error && (
          <p className="rounded-md border border-rose-400 bg-rose-200/20 p-2 text-sm text-rose-100">{searchParams.error}</p>
        )}

        <form action="/api/auth/login" method="post" className="space-y-3">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label className="block text-sm text-rose-100">Användarnamn
            <input className="mt-1 w-full rounded-md border border-rose-700 bg-rose-950/70 px-3 py-2 text-rose-50" name="username" required />
          </label>
          <label className="block text-sm text-rose-100">Lösenord
            <input className="mt-1 w-full rounded-md border border-rose-700 bg-rose-950/70 px-3 py-2 text-rose-50" type="password" name="password" required />
          </label>
          <button className="w-full rounded-md bg-rose-600 py-2 text-white hover:bg-rose-500" type="submit">Logga in</button>
        </form>
      </section>
    </main>
  );
}
