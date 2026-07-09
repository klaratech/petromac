'use client';

import { useEffect, useState } from 'react';
import type { StaffUser } from '@/types/staffSession';

interface StaffSessionState {
  enabled: boolean;
  authenticated: boolean;
  user: StaffUser | null;
  canSendAsStaff: boolean;
  isLoading: boolean;
}

const initialState: StaffSessionState = {
  enabled: false,
  authenticated: false,
  user: null,
  canSendAsStaff: false,
  isLoading: true,
};

export function useStaffSession() {
  const [state, setState] = useState<StaffSessionState>(initialState);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch('/api/staff/session', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load staff session: ${response.status}`);
        }

        const payload = (await response.json()) as Omit<StaffSessionState, 'isLoading'>;
        if (!cancelled) {
          setState({ ...payload, isLoading: false });
        }
      } catch {
        if (!cancelled) {
          setState({ ...initialState, isLoading: false });
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
