'use client';

import { useState } from 'react';

type LoginFormProps = {
  redirectTo: string;
  environmentLabel?: string;
};

export default function LoginForm({ redirectTo, environmentLabel }: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form action="/api/auth/login" method="post" className="space-y-5" onSubmit={() => setIsSubmitting(true)}>
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {environmentLabel && (
        <div className="rounded-sm border border-slate-300 bg-slate-100 px-3 py-2 text-xs tracking-wide text-slate-700">
          <span className="font-semibold text-slate-800">Environment</span>: {environmentLabel}
        </div>
      )}

      <label className="block text-sm font-medium text-slate-700">
        Username
        <input
          className="mt-1.5 w-full rounded-sm border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition-colors focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
          name="username"
          autoComplete="username"
          required
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Password
        <input
          className="mt-1.5 w-full rounded-sm border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition-colors focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>

      <button
        className="w-full rounded-sm bg-blue-800 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-800/80"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
