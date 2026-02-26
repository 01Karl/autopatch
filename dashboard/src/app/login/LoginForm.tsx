'use client';

import { useState } from 'react';

type LoginFormProps = {
  redirectTo: string;
};

export default function LoginForm({ redirectTo }: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form action="/api/auth/login" method="post" className="space-y-3" onSubmit={() => setIsSubmitting(true)}>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <label className="block text-sm text-rose-100">
        Username
        <input className="mt-1 w-full rounded-md border border-rose-700 bg-rose-950/70 px-3 py-2 text-rose-50" name="username" autoComplete="username" required />
      </label>
      <label className="block text-sm text-rose-100">
        Password
        <input className="mt-1 w-full rounded-md border border-rose-700 bg-rose-950/70 px-3 py-2 text-rose-50" type="password" name="password" autoComplete="current-password" required />
      </label>
      <button className="w-full rounded-md bg-rose-600 py-2 text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-70" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
