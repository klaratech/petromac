import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_VIDEOS, getVideo, isoDuration, watchPath } from '@/features/videos';
import { caseStudyQueryHref } from '@/features/case-studies/filters';
import JsonLd, { absoluteUrl } from '@/components/shared/JsonLd';
import WatchPlayer from '@/components/public/videos/WatchPlayer';
import { pageMetadata } from '@/lib/seo';

interface Params {
  slug: string;
}

export function generateStaticParams(): Params[] {
  return SITE_VIDEOS.map((v) => ({ slug: v.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const video = getVideo(slug);
  if (!video) return {};
  return pageMetadata({
    title: video.title,
    description: video.summary,
    path: watchPath(slug),
    // The poster is the share image, so a pasted link unfurls as THIS video
    // in Outlook / Teams / LinkedIn rather than as the generic site card.
    ogImage: {
      url: video.poster,
      width: 1280,
      height: 720,
      alt: `${video.product} — ${video.challenge} video`,
    },
  });
}

/**
 * /watch/<slug> — one page per public product animation (Oct 2026). Exists so
 * that after an in-person presentation the follow-up PDF/email can link to
 * exactly the clip that was shown, with a URL short enough to type. Same
 * no-download policy as the homepage lightbox; "Request the file" is the
 * honest route to the MP4.
 */
export default async function WatchPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const video = getVideo(slug);
  if (!video) notFound();

  const others = SITE_VIDEOS.filter((v) => v.slug !== video.slug);
  const storiesHref = caseStudyQueryHref({ device: video.storiesDevice });

  const videoSchema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.summary,
    thumbnailUrl: [absoluteUrl(video.poster)],
    uploadDate: video.published,
    duration: isoDuration(video.durationSeconds),
    contentUrl: absoluteUrl(video.src),
    url: absoluteUrl(watchPath(video.slug)),
    publisher: { '@type': 'Organization', name: 'Petromac', url: absoluteUrl('/') },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Videos', item: absoluteUrl('/watch') },
      { '@type': 'ListItem', position: 2, name: video.title },
    ],
  };

  return (
    <div className="bg-white">
      <JsonLd data={videoSchema} />
      <JsonLd data={breadcrumbSchema} />
      <article className="max-w-6xl mx-auto px-6 py-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/watch" className="hover:text-brand transition-colors">
                Videos
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-slate-600">{video.challenge}</li>
          </ol>
        </nav>

        <header className="max-w-3xl mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand">
            {video.product}
          </p>
          <h1 className="mt-1 font-heading text-3xl md:text-4xl font-bold text-slate-900">
            {video.challenge}
          </h1>
        </header>

        <div className="grid lg:grid-cols-[3fr_2fr] gap-8 lg:gap-12 items-start">
          <WatchPlayer video={video} />

          <div>
            <p className="text-slate-600 leading-relaxed">{video.summary}</p>
            <ul className="mt-4 space-y-2">
              {video.proofPoints.map((point) => (
                <li key={point} className="flex gap-2 text-sm text-slate-600">
                  <span className="text-brand font-bold mt-0.5" aria-hidden="true">
                    ✓
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={video.catalog.href}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white bg-brand hover:bg-brand/90 shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-px hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              >
                {video.catalog.label} in the catalog
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <Link
                href={storiesHref}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-brand border-2 border-brand/30 hover:border-brand hover:bg-brand/[0.04] transition-all focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              >
                Success stories
              </Link>
            </div>
          </div>
        </div>

        <section aria-labelledby="more-videos" className="mt-14 border-t border-slate-200 pt-10">
          <h2 id="more-videos" className="font-heading text-xl font-bold text-slate-900 mb-5">
            More videos
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {others.map((v) => (
              <li key={v.slug}>
                <Link
                  href={watchPath(v.slug)}
                  className="group block rounded-lg border border-slate-200 overflow-hidden hover:border-brand/50 hover:shadow transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  <div className="relative aspect-video bg-slate-900">
                    <Image
                      src={v.poster}
                      alt={`${v.product} — ${v.challenge} video preview`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                    <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                      {v.duration}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand">
                      {v.product}
                    </p>
                    <p className="mt-0.5 font-semibold text-slate-900 group-hover:text-brand transition-colors">
                      {v.challenge}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
