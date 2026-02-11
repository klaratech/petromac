import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-brand">404</h1>
      <p className="mt-4 text-xl text-brandblack">Page not found</p>
      <p className="mt-2 text-brandgray">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand/90"
      >
        Back to Home
      </Link>
    </main>
  );
}
