import { resolveMusicalKey } from "../lib/musical-key";
import { RADIO_CLIPS } from "./radio";
import type { TrainingTrack } from "../types/mixer";

function fromRadio(index: number, grid: string): TrainingTrack {
  const clip = RADIO_CLIPS[index];
  if (!clip) {
    throw new Error(`Radio clip index ${index} not found`);
  }
  const musical = resolveMusicalKey(clip.key);
  return {
    id: clip.id,
    title: clip.title,
    artist: clip.artist,
    genre: clip.genre,
    bpm: clip.bpm,
    key: clip.key,
    scale: musical.label,
    duration: clip.duration,
    grid,
  };
}

export const TRAINING_TRACKS: TrainingTrack[] = [
  fromRadio(0, "HOUSE · 4/4"),
  fromRadio(1, "PROG · 4/4"),
  fromRadio(2, "ELECTRO · 4/4"),
  fromRadio(3, "ANTHEM · 4/4"),
  fromRadio(4, "PROG · LONG"),
];

export const DEFAULT_DECK_TRACKS: Record<"a" | "b", string> = {
  a: "clip-01",
  b: "clip-02",
};

export function getTrainingTrack(id: string): TrainingTrack | undefined {
  return TRAINING_TRACKS.find((track) => track.id === id);
}
