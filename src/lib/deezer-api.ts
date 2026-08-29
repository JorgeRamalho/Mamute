const DEEZER_API_BASE = "/api/deezer";

export function deezerApiUrl(path: string, params?: Record<string, string | number>): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${DEEZER_API_BASE}${normalized}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.pathname + url.search;
}

export async function fetchDeezerJson<T>(path: string, params?: Record<string, string | number>): Promise<T | null> {
  try {
    const response = await fetch(deezerApiUrl(path, params));
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
