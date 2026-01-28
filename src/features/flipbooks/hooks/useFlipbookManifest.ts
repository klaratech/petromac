'use client';

import { useEffect, useState } from 'react';
import type { FlipbookManifest } from '../types';
import type { FlipbookKey } from '../constants';
import { loadFlipbookManifest } from '../services/flipbookManifest';

export function useFlipbookManifest(docKey: FlipbookKey) {
  const [manifest, setManifest] = useState<FlipbookManifest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    loadFlipbookManifest(docKey)
      .then((data) => {
        if (!mounted) return;
        setManifest(data);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load flipbook manifest');
      });

    return () => {
      mounted = false;
    };
  }, [docKey]);

  return { manifest, error };
}
