import { useState, useEffect, useCallback } from 'react';
import { fetchJsonWithValidation, validateCountryLabels } from '@/lib/validation';

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
      
      // Static JSON from the data pipeline. The backend route is only a
      // passthrough, so fetch the deployed file directly.
      const labels = await fetchJsonWithValidation(
        '/data/country_labels.json',
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
