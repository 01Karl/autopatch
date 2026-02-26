import LoginForm from './LoginForm';

type LoginPageParams = {
  error?: string;
  redirectTo?: string;
};

export default function LoginPage({ searchParams }: { searchParams?: LoginPageParams }) {
  const redirectTo = searchParams?.redirectTo || '/machines';

  return (
    <main className="min-h-screen bg-rose-950 flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-xl border border-rose-800 bg-rose-900/90 p-6 shadow-xl shadow-rose-950/50 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-rose-50">Sign in with FreeIPA</h1>
          <p className="text-sm text-rose-200">Secure LDAP authentication for Overseer Console.</p>
        </div>

        {searchParams?.error && (
          <p className="rounded-md border border-rose-400 bg-rose-200/20 p-2 text-sm text-rose-100">{searchParams.error}</p>
        )}

        <LoginForm redirectTo={redirectTo} />
      </section>
    </main>
  );
}
