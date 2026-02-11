'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error); // eslint-disable-line no-console
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-brand">500</h1>
      <p className="mt-4 text-xl text-brandblack">Something went wrong</p>
      <p className="mt-2 text-brandgray">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-lg bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand/90"
      >
        Try Again
      </button>
    </main>
  );
}
