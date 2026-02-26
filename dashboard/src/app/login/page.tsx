import LoginForm from '../_components/LoginForm';

type LoginPageParams = {
  error?: string;
  redirectTo?: string;
};

const ENVIRONMENT_NAME = process.env.NEXT_PUBLIC_ENVIRONMENT_NAME;

export default function LoginPage({ searchParams }: { searchParams?: LoginPageParams }) {
  const redirectTo = searchParams?.redirectTo || '/machines';

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_45%),linear-gradient(to_bottom,_rgba(15,23,42,0.92),_rgba(2,6,23,0.98))]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:36px_36px]"
        aria-hidden
      />

      <section className="relative w-full max-w-[460px] rounded-md border border-slate-300 bg-slate-50 p-8 shadow-2xl shadow-black/45">
        <div className="mb-7 space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Overseer Infrastructure Manager</h1>
          <p className="text-sm text-slate-600">Authenticate using your directory account</p>
        </div>

        {searchParams?.error && (
          <p className="mb-5 rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{searchParams.error}</p>
        )}

        <LoginForm redirectTo={redirectTo} environmentLabel={ENVIRONMENT_NAME} />
      </section>
    </main>
  );
}
