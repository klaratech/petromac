import { useState, useEffect, useCallback } from 'react';
import { EXTERNAL_URLS } from '@/constants/app';
import { fetchJsonWithValidation, validateCountryLabels } from '@/utils/dataValidation';

interface UseCountryLabelsResult {
  countryLabels: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useCountryLabels(): UseCountryLabelsResult {
  const [countryLabels, setCountryLabels] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCountryLabels = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const labels = await fetchJsonWithValidation(
        EXTERNAL_URLS.COUNTRY_LABELS,
        validateCountryLabels
      );
      
      setCountryLabels(labels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load country labels';
      setError(errorMessage);
      // Log error for debugging without console
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Country labels loading error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    loadCountryLabels();
  }, [loadCountryLabels]);

  useEffect(() => {
    loadCountryLabels();
  }, [loadCountryLabels]);

  return {
    countryLabels,
    isLoading,
    error,
    retry
  };
}
