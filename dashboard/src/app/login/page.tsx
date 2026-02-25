import db from '@/lib/db';

type LoginPageParams = {
  error?: string;
  redirectTo?: string;
};

export default function LoginPage({ searchParams }: { searchParams?: LoginPageParams }) {
  const cfg = db.prepare('SELECT base_url, username_suffix FROM freeipa_config WHERE id = 1').get() as { base_url: string; username_suffix: string };
  const redirectTo = searchParams?.redirectTo || '/';

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Logga in via FreeIPA</h1>
          <p className="text-sm text-slate-500">Säker inloggning till OpenPatch Console.</p>
        </div>

        <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
          <p><strong>FreeIPA endpoint:</strong> {cfg.base_url || 'Inte konfigurerad'}</p>
          <p><strong>Username suffix:</strong> {cfg.username_suffix || '(none)'}</p>
        </div>

        {searchParams?.error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">{searchParams.error}</p>
        )}

        <form action="/api/auth/login" method="post" className="space-y-3">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label className="block text-sm text-slate-600">Användarnamn
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" name="username" required />
          </label>
          <label className="block text-sm text-slate-600">Lösenord
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" type="password" name="password" required />
          </label>
          <button className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700" type="submit">Logga in</button>
        </form>
      </section>
    </main>
  );
}
