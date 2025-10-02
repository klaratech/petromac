import type { JobRecord } from '@/types/JobRecord';

// Data validation utilities
export function validateJobRecord(data: unknown): data is JobRecord {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const record = data as Record<string, unknown>;
  
  // Check required fields
  return (
    typeof record.Country === 'string' &&
    typeof record.System === 'string' &&
    (typeof record.Year === 'string' || typeof record.Year === 'number') &&
    (typeof record.Successful === 'string' || typeof record.Successful === 'number')
  );
}

export function validateJobRecords(data: unknown): JobRecord[] {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }

  const validRecords = data.filter(validateJobRecord);
  
  if (validRecords.length === 0) {
    throw new Error('No valid job records found');
  }

  return validRecords;
}

export function validateCountryLabels(data: unknown): Record<string, string> {
  if (!data || typeof data !== 'object') {
    throw new Error('Country labels must be an object');
  }

  const labels = data as Record<string, unknown>;
  const validLabels: Record<string, string> = {};

  for (const [key, value] of Object.entries(labels)) {
    if (typeof key === 'string' && typeof value === 'string') {
      validLabels[key] = value;
    }
  }

  return validLabels;
}

// Network error handling
export async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  maxRetries = 3
): Promise<Response> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw new Error(`Failed to fetch after ${maxRetries} attempts: ${lastError!.message}`);
}

export async function fetchJsonWithValidation<T>(
  url: string,
  validator: (_data: unknown) => T,
  maxRetries = 3
): Promise<T> {
  try {
    const response = await fetchWithRetry(url, { cache: 'force-cache' }, maxRetries);
    const jsonData = await response.json();
    return validator(jsonData);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch and validate data from ${url}: ${message}`);
  }
}
