import type { PlatformId } from "../types/platform";
import type { RadioClip } from "../types/radio";
import { RADIO_PLATFORM_ORDER } from "../data/radio";

export function isPlayableClip(clip: RadioClip): boolean {
  return Boolean(clip.youtubeId || clip.previewUrl);
}

export function getPlayableClips(clips: RadioClip[]): RadioClip[] {
  return clips.filter(isPlayableClip);
}

/** Ordem editorial da rádio: alterna Spotify → Deezer → YouTube Music → Beatport. */
export function buildRadioProgramming(clips: RadioClip[]): RadioClip[] {
  const groups = RADIO_PLATFORM_ORDER.map((platformId) =>
    clips.filter((clip) => clip.platform === platformId && isPlayableClip(clip)),
  );
  const maxLen = Math.max(0, ...groups.map((group) => group.length));
  const programming: RadioClip[] = [];

  for (let index = 0; index < maxLen; index += 1) {
    for (const group of groups) {
      const clip = group[index];
      if (clip) programming.push(clip);
    }
  }

  return programming;
}

export function getNextPlayableClip(clips: RadioClip[], currentId: string): RadioClip | null {
  const programming = buildRadioProgramming(clips);
  if (programming.length === 0) return null;

  const currentIndex = programming.findIndex((clip) => clip.id === currentId);
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % programming.length;
  return programming[nextIndex] ?? null;
}

export function getFirstClipForPlatform(clips: RadioClip[], platformId: PlatformId): RadioClip | undefined {
  const editorial = clips.find(
    (clip) => clip.platform === platformId && clip.id.startsWith("radio-"),
  );
  return editorial ?? clips.find((clip) => clip.platform === platformId);
}
