import Image from 'next/image';
import Link from 'next/link';
import { SITE_VIDEOS, watchPath } from '@/features/videos';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Product Videos',
  description:
    'Short animations of Petromac wireline conveyance and centraliser technology: Wireline Express, Pathfinder and Focus centralisers, each on its own page.',
  path: '/watch',
});

/**
 * /watch — index of the public product animations. Each video has its own
 * page so a link to exactly that animation can follow a presentation (slide
 * footer, PDF, email) and unfurl with its own thumbnail. The homepage keeps
 * the tabbed selector; this is the addressable form of the same four clips.
 */
export default function WatchIndexPage() {
  return (
    <div className="bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="max-w-3xl mb-10">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900">
            Product videos
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-slate-600">
            How each Petromac system solves a specific wireline logging challenge, in a few minutes
            each.
          </p>
        </header>

        <ul className="grid gap-6 sm:grid-cols-2">
          {SITE_VIDEOS.map((v) => (
            <li key={v.slug}>
              <Link
                href={watchPath(v.slug)}
                className="group block rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm hover:border-brand/50 hover:shadow transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <div className="relative aspect-video bg-slate-900">
                  <Image
                    src={v.poster}
                    alt={`${v.product} — ${v.challenge} video preview`}
                    fill
                    className="object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-brand shadow-xl group-hover:bg-white group-hover:scale-105 motion-safe:transition-transform">
                      <svg
                        className="h-6 w-6 translate-x-0.5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M8 5.5v13l11-6.5-11-6.5z" />
                      </svg>
                    </span>
                  </span>
                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                    {v.duration}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
                    {v.product}
                  </p>
                  <h2 className="mt-1 font-heading text-xl font-bold text-slate-900 group-hover:text-brand transition-colors">
                    {v.challenge}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{v.summary}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
