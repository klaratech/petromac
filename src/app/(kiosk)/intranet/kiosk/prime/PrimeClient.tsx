'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStaffSession } from '@/hooks/useStaffSession';

const MANIFEST_URL = '/data/kiosk-offline-assets.json';
const MAX_ATTEMPTS = 3;

type PrimeKind =
  | 'route'
  | 'route-warmup'
  | 'data'
  | 'flipbook'
  | 'image'
  | 'video'
  | 'icon'
  | 'manifest'
  | 'model';

interface PrimeEntry {
  kind: PrimeKind;
  url: string;
  label?: string;
}

interface OfflineManifest {
  version: string;
  profile: string;
  launchUrl: string;
  required: PrimeEntry[];
  optional?: PrimeEntry[];
}

type ItemStatus = 'pending' | 'running' | 'ok' | 'error';

interface PrimeItem extends PrimeEntry {
  status: ItemStatus;
  attempts: number;
  bytes: number;
  // `string | undefined` (not `?: string`) so callers can explicitly
  // clear the field by passing `error: undefined` — required for
  // `Partial<PrimeItem>` updates under exactOptionalPropertyTypes.
  error: string | undefined;
}

interface ServiceWorkerStatus {
  supported: boolean;
  ready: boolean;
  controlled: boolean;
  scope?: string;
}

function toPrimeItems(entries: PrimeEntry[]): PrimeItem[] {
  return entries.map((entry) => ({
    ...entry,
    status: 'pending',
    attempts: 0,
    bytes: 0,
    error: undefined,
  }));
}

function formatBytes(bytes: number): string {
  if (!bytes) return '-';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function labelFor(entry: PrimeEntry): string {
  return entry.label ?? entry.url;
}

// navigator.serviceWorker.ready never rejects and waits indefinitely until
// an active SW exists for the current scope. On a kiosk where SW install
// hangs (bad PRECACHE_ASSETS URL, slow network during route precache, or
// the SW file simply isn't reachable), this hang propagates up to
// startPriming and the UI sits on "Priming..." with no items ever moving
// from pending → running. Race against a hard timeout so priming proceeds
// either way — the actual asset fetches don't need the SW to be active,
// they just benefit from its caching when it is.
const SW_READY_TIMEOUT_MS = 5_000;

async function getServiceWorkerStatus(): Promise<ServiceWorkerStatus> {
  if (!('serviceWorker' in navigator)) {
    return { supported: false, ready: false, controlled: false };
  }

  try {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('serviceWorker.ready timeout')), SW_READY_TIMEOUT_MS)
      ),
    ]);
    return {
      supported: true,
      ready: Boolean(registration.active),
      controlled: Boolean(navigator.serviceWorker.controller),
      scope: registration.scope,
    };
  } catch {
    // Timed out — SW probably still installing or failed to register. Report
    // 'supported but not ready' so the UI shows the real state, and let
    // priming proceed without waiting any longer.
    return {
      supported: true,
      ready: false,
      controlled: Boolean(navigator.serviceWorker.controller),
    };
  }
}

async function warmRoute(url: string): Promise<number> {
  await new Promise<void>((resolve, reject) => {
    const frame = document.createElement('iframe');
    let settled = false;
    const done = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      frame.remove();
      if (error) reject(error);
      else resolve();
    };
    const timeout = window.setTimeout(() => done(new Error(`Timed out warming ${url}`)), 15_000);

    frame.src = url;
    frame.title = `Prime ${url}`;
    frame.style.position = 'fixed';
    frame.style.width = '1px';
    frame.style.height = '1px';
    frame.style.opacity = '0';
    frame.style.pointerEvents = 'none';
    frame.style.inset = '0';
    frame.onload = () => window.setTimeout(() => done(), 750);
    frame.onerror = () => done(new Error(`Failed warming ${url}`));
    document.body.appendChild(frame);
  });
  return 0;
}

async function fetchAsset(entry: PrimeEntry): Promise<number> {
  if (entry.kind === 'route-warmup') {
    return warmRoute(entry.url);
  }

  const response = await fetch(entry.url, {
    cache: 'reload',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`.trim());
  }

  if (entry.kind === 'route') {
    const text = await response.text();
    return text.length;
  }

  const blob = await response.blob();
  return blob.size;
}

async function fetchWithRetry(entry: PrimeEntry): Promise<{ bytes: number; attempts: number }> {
  let lastError: unknown;
  for (let attempts = 1; attempts <= MAX_ATTEMPTS; attempts += 1) {
    try {
      const bytes = await fetchAsset(entry);
      return { bytes, attempts };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown failure');
}

export default function PrimeClient() {
  const staff = useStaffSession();
  const [manifest, setManifest] = useState<OfflineManifest | null>(null);
  const [items, setItems] = useState<PrimeItem[]>([]);
  const [includeOptional, setIncludeOptional] = useState(false);
  const [isPriming, setIsPriming] = useState(false);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<ServiceWorkerStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(MANIFEST_URL, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${MANIFEST_URL}: ${response.status}`);
        }
        return response.json() as Promise<OfflineManifest>;
      })
      .then((data) => {
        if (cancelled) return;
        setManifest(data);
        setItems(toPrimeItems(data.required));
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setManifestError(error instanceof Error ? error.message : 'Failed to load manifest');
        }
      });

    void getServiceWorkerStatus()
      .then((status) => {
        if (!cancelled) setServiceWorkerStatus(status);
      })
      .catch(() => {
        if (!cancelled) {
          setServiceWorkerStatus({ supported: false, ready: false, controlled: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!manifest || isPriming) return;
    const entries = includeOptional
      ? [...manifest.required, ...(manifest.optional ?? [])]
      : manifest.required;
    setItems(toPrimeItems(entries));
  }, [includeOptional, isPriming, manifest]);

  const totals = useMemo(() => {
    const ok = items.filter((item) => item.status === 'ok').length;
    const errors = items.filter((item) => item.status === 'error').length;
    const bytes = items.reduce((sum, item) => sum + item.bytes, 0);
    return { ok, errors, bytes, total: items.length };
  }, [items]);

  const authRequired = staff.enabled && !staff.authenticated;
  const ready = totals.total > 0 && totals.ok === totals.total;

  const updateItem = (url: string, update: Partial<PrimeItem>) => {
    setItems((current) =>
      current.map((item) => (item.url === url ? { ...item, ...update } : item))
    );
  };

  const startPriming = async () => {
    if (!manifest || authRequired) return;
    setIsPriming(true);

    try {
      setServiceWorkerStatus(await getServiceWorkerStatus());
      for (const item of items) {
        updateItem(item.url, {
          status: 'running',
          attempts: 0,
          bytes: 0,
          error: undefined,
        });

        try {
          const result = await fetchWithRetry(item);
          updateItem(item.url, {
            status: 'ok',
            attempts: result.attempts,
            bytes: result.bytes,
            error: undefined,
          });
        } catch (error) {
          updateItem(item.url, {
            status: 'error',
            attempts: MAX_ATTEMPTS,
            error: error instanceof Error ? error.message : 'Failed',
          });
        }
      }
      setServiceWorkerStatus(await getServiceWorkerStatus());
    } finally {
      setIsPriming(false);
    }
  };

  // prompt=select_account: kiosk tablets are shared — always show the
  // account picker instead of silently reusing the previous member's SSO.
  const loginHref = `/auth/microsoft/login?returnTo=${encodeURIComponent('/intranet/kiosk/prime')}&prompt=select_account`;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/45">Staff Utility</p>
            <h1 className="mt-2 text-4xl font-extrabold">Prime Offline Kiosk</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              Cache the Android tablet + Chromecast kiosk routes, data, images, flipbooks, and
              balanced 1080p videos before going offline.
            </p>
          </div>
          {manifest && (
            <a
              href={manifest.launchUrl}
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              Open kiosk
            </a>
          )}
        </header>

        {authRequired ? (
          <section className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-5">
            <h2 className="text-xl font-bold">Microsoft sign-in required</h2>
            <p className="mt-2 text-sm text-white/70">
              This priming screen is staff-only when kiosk identity is enabled.
            </p>
            <a
              href={loginHref}
              className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Sign in with Microsoft
            </a>
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <StatusCard label="Manifest" value={manifest?.version ?? 'Loading'} />
              <StatusCard
                label="Service Worker"
                value={
                  !serviceWorkerStatus
                    ? 'Checking…'
                    : !serviceWorkerStatus.supported
                      ? 'Unsupported'
                      : serviceWorkerStatus.controlled
                        ? 'Ready and controlling'
                        : serviceWorkerStatus.ready
                          ? 'Ready; reload if first run'
                          : 'Not yet active — priming will still run'
                }
              />
              <StatusCard
                label="Status"
                value={
                  ready
                    ? 'Ready for offline'
                    : totals.errors
                      ? `${totals.errors} failed`
                      : isPriming
                        ? 'Priming...'
                        : 'Not primed'
                }
              />
            </section>

            {manifestError && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                {manifestError}
              </div>
            )}

            {manifest && (
              <section className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{manifest.profile}</h2>
                    <p className="mt-1 text-sm text-white/60">
                      {totals.ok} / {totals.total} complete - {formatBytes(totals.bytes)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {(manifest.optional?.length ?? 0) > 0 && (
                      <label className="flex items-center gap-2 text-sm text-white/70">
                        <input
                          type="checkbox"
                          checked={includeOptional}
                          disabled={isPriming}
                          onChange={(event) => setIncludeOptional(event.target.checked)}
                        />
                        {/* Optional bucket holds the 1080p kiosk-hd masters
                            (~175 MB) plus the 3D GLB models. Default is
                            SD-only so a routine prime stays light on
                            bandwidth — we mostly mirror to Chromecast and
                            the 1080p set is overkill there. Tick this only
                            when the kiosk will run untethered offline at
                            full HD. */}
                        Include 1080p videos + 3D models
                      </label>
                    )}
                    <button
                      onClick={startPriming}
                      disabled={isPriming || !manifest}
                      className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isPriming ? 'Priming...' : totals.errors ? 'Retry priming' : 'Start priming'}
                    </button>
                  </div>
                </div>

                <div className="mt-5 max-h-[55vh] overflow-auto rounded-lg border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-zinc-950 text-xs uppercase tracking-[0.18em] text-white/45">
                      <tr>
                        <th className="px-4 py-3">Asset</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.url} className="border-t border-white/10">
                          <td className="px-4 py-3">
                            <div className="font-medium text-white/85">{labelFor(item)}</div>
                            <div className="break-all text-xs text-white/40">{item.url}</div>
                            {item.error && (
                              <div className="mt-1 text-xs text-red-300">{item.error}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-white/55">{item.kind}</td>
                          <td className="px-4 py-3">
                            <StatusPill status={item.status} />
                          </td>
                          <td className="px-4 py-3 text-white/55">{formatBytes(item.bytes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-white/40">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: ItemStatus }) {
  const classes: Record<ItemStatus, string> = {
    pending: 'bg-white/10 text-white/60',
    running: 'bg-blue-400/20 text-blue-100',
    ok: 'bg-emerald-400/20 text-emerald-100',
    error: 'bg-red-400/20 text-red-100',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes[status]}`}>
      {status}
    </span>
  );
}
