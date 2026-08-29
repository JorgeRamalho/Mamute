import type { RadioClip } from "../types/radio";
import { fetchDeezerJson } from "./deezer-api";

interface DeezerTrack {
  preview: string;
}

interface DeezerSearchResponse {
  data: DeezerTrack[];
}

export async function fetchDeezerPreview(artist: string, title: string): Promise<string | undefined> {
  const query = `${artist} ${title}`.trim();
  if (!query) return undefined;

  const payload = await fetchDeezerJson<DeezerSearchResponse>("search/track", {
    q: query,
    limit: 1,
  });
  const preview = payload?.data?.[0]?.preview;
  return preview || undefined;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current]!);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

/** Garante preview Deezer em cada faixa — fallback legal quando o embed do YouTube falha. */
export async function enrichCatalogWithPreviews(clips: RadioClip[]): Promise<RadioClip[]> {
  const pending = clips.map((clip, clipIndex) => ({ clip, clipIndex }));
  const missing = pending.filter(({ clip }) => !clip.previewUrl);
  if (missing.length === 0) return clips;

  const enriched = [...clips];
  const previews = await mapWithConcurrency(missing, 4, async ({ clip }) =>
    fetchDeezerPreview(clip.artist, clip.title),
  );

  missing.forEach(({ clip, clipIndex }, index) => {
    const previewUrl = previews[index];
    if (previewUrl) {
      enriched[clipIndex] = { ...clip, previewUrl };
    }
  });

  return enriched;
}
