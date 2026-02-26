'use client';

import { useEffect } from 'react';
import { AppButton } from '@/app/_components/ui/AppButton';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="sv">
      <body className="bg-[#f3f2f1] text-slate-900">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
          <p className="text-xs uppercase tracking-wider text-slate-500">Overseer</p>
          <h1 className="mt-2 text-3xl font-semibold">Overseer | Error</h1>
          <p className="mt-3 text-sm text-slate-600">
            Ett oväntat fel uppstod. Försök igen eller gå tillbaka till startsidan.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-slate-500">Reference: {error.digest}</p>
          )}
          <div className="mt-6 flex gap-3">
            <AppButton type="button" variant="primary" onClick={() => reset()}>Try again</AppButton>
            <a href="/" className="ghost-btn">Back to home</a>
          </div>
        </main>
      </body>
    </html>
  );
}
