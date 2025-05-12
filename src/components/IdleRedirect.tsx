'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface IdleRedirectProps {
  timeout?: number; // milliseconds
  redirectTo: string;
}

export default function IdleRedirect({ timeout = 120000, redirectTo }: IdleRedirectProps) {
  const router = useRouter();
  const lastInteractionRef = useRef<number>(Date.now());

  useEffect(() => {
    const updateInteraction = () => {
      lastInteractionRef.current = Date.now();
    };

    window.addEventListener('mousemove', updateInteraction);
    window.addEventListener('keydown', updateInteraction);
    window.addEventListener('touchstart', updateInteraction);
    window.addEventListener('click', updateInteraction);

    const interval = setInterval(() => {
      if (Date.now() - lastInteractionRef.current > timeout) {
        router.push(redirectTo);
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', updateInteraction);
      window.removeEventListener('keydown', updateInteraction);
      window.removeEventListener('touchstart', updateInteraction);
      window.removeEventListener('click', updateInteraction);
      clearInterval(interval);
    };
  }, [router, timeout, redirectTo]);

  return null;
}
