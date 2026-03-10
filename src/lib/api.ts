const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export function buildClientApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return path;
  return `${stripTrailingSlash(base)}${path}`;
}

export function buildServerApiUrl(path: string): string {
  const base =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL;

  if (!base) {
    throw new Error(`No API base URL configured for server-side request to ${path}`);
  }

  return `${stripTrailingSlash(base)}${path}`;
}
