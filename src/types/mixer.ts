export type DeckId = "a" | "b";

export type JogMode = "vinyl" | "cdj";

export interface TrainingTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  key: string;
  scale: string;
  duration: string;
  grid: string;
}

export interface HotCue {
  slot: number;
  beat: number;
  set: boolean;
}

export interface DeckEq {
  high: number;
  mid: number;
  low: number;
}

export interface DeckEqKill {
  high: boolean;
  mid: boolean;
  low: boolean;
}

export interface DeckLoop {
  active: boolean;
  inBeat: number | null;
  outBeat: number | null;
}

export interface DeckState {
  playing: boolean;
  bpm: number;
  pitch: number;
  gain: number;
  trim: number;
  eq: DeckEq;
  eqKill: DeckEqKill;
  filter: number;
  sync: boolean;
  masterTempo: boolean;
  cueMonitor: boolean;
  jogMode: JogMode;
  quantize: boolean;
  loop: DeckLoop;
  hotCues: HotCue[];
  cueBeat: number;
  track: TrainingTrack;
  phase: number;
}

export interface MixerSnapshot {
  a: DeckState;
  b: DeckState;
  crossfader: number;
  master: number;
  booth: number;
  cueMix: number;
  masterDeck: DeckId;
}
