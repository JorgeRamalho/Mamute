import type { PlatformId } from "../types/platform";
import type { RadioClip } from "../types/radio";
import {
  PLATFORM_IMPORT_QUERIES,
  platformSearchUrl,
  resolveYoutubeId,
} from "../data/radio-youtube-map";

const STORAGE_KEY = "mamute.radio.imports";

interface DeezerArtist {
  name: string;
}

interface DeezerAlbum {
  title: string;
}

interface DeezerTrack {
  id: number;
  title: string;
  title_short: string;
  link: string;
  duration: number;
  preview: string;
  artist: DeezerArtist;
  album: DeezerAlbum;
}

interface DeezerSearchResponse {
  data: DeezerTrack[];
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function guessGenre(platform: PlatformId): string {
  switch (platform) {
    case "beatport":
      return "Dance / Club";
    case "spotify":
      return "Editorial";
    case "deezer":
      return "Rádio editorial";
    case "youtube":
      return "Clipe oficial";
    default:
      return "Electronic";
  }
}

function mapDeezerTrack(track: DeezerTrack, platform: PlatformId): RadioClip {
  const artist = track.artist.name;
  const title = track.title_short || track.title;
  const youtubeId = resolveYoutubeId(artist, title);

  return {
    id: `import-${platform}-${track.id}`,
    title,
    artist,
    genre: guessGenre(platform),
    bpm: 126,
    key: "—",
    duration: formatDuration(track.duration),
    youtubeId: youtubeId ?? "",
    previewUrl: track.preview,
    sourceUrl: track.link || platformSearchUrl(platform, artist, title),
    caption: `Importado de ${platform} · metadados Deezer · preview 30s ou clipe no visor.`,
    platform,
    importedAt: Date.now(),
  };
}

async function fetchDeezerSearch(query: string, limit = 1): Promise<DeezerTrack[]> {
  const url = `https://api.deezer.com/search/track?q=${encodeURIComponent(query)}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Deezer indisponível (${response.status}).`);
  const payload = (await response.json()) as DeezerSearchResponse;
  return payload.data ?? [];
}

function dedupeClips(clips: RadioClip[]): RadioClip[] {
  const seen = new Set<string>();
  return clips.filter((clip) => {
    const key = `${clip.platform}:${clip.artist}:${clip.title}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function loadStoredImports(): RadioClip[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RadioClip[];
  } catch {
    return [];
  }
}

export function saveStoredImports(clips: RadioClip[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clips));
}

export function mergeImports(existing: RadioClip[], incoming: RadioClip[]): RadioClip[] {
  const byId = new Map(existing.map((clip) => [clip.id, clip]));
  for (const clip of incoming) {
    byId.set(clip.id, clip);
  }
  return dedupeClips([...byId.values()]);
}

export async function importPlatformCatalog(platform: PlatformId): Promise<RadioClip[]> {
  const queries = PLATFORM_IMPORT_QUERIES[platform];
  if (!queries?.length) return [];

  const imported: RadioClip[] = [];
  for (const query of queries) {
    const tracks = await fetchDeezerSearch(query, 1);
    const first = tracks[0];
    if (first) imported.push(mapDeezerTrack(first, platform));
  }

  return dedupeClips(imported);
}

export async function importAllPlatformCatalogs(
  platforms: PlatformId[] = ["spotify", "beatport", "deezer", "youtube"],
): Promise<RadioClip[]> {
  const batches = await Promise.all(platforms.map((platform) => importPlatformCatalog(platform)));
  return dedupeClips(batches.flat());
}

export async function syncCatalogToStorage(platform?: PlatformId): Promise<RadioClip[]> {
  const stored = loadStoredImports();
  const incoming = platform
    ? await importPlatformCatalog(platform)
    : await importAllPlatformCatalogs();
  const merged = mergeImports(stored, incoming);
  saveStoredImports(merged);
  return merged;
}
