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

/**
 * Ação única da cabine. Mouse, knobs da tela e a DDJ-400 emitem o mesmo union,
 * porque o reducer em MixerBoard é o único caminho até o audio-engine.
 */
export type MixerAction =
  | { type: "refresh" }
  | { type: "toggle"; id: DeckId }
  | { type: "pitch"; id: DeckId; value: number }
  | { type: "gain"; id: DeckId; value: number }
  | { type: "trim"; id: DeckId; value: number }
  | { type: "filter"; id: DeckId; value: number }
  | { type: "eq"; id: DeckId; band: "high" | "mid" | "low"; value: number }
  | { type: "eqKill"; id: DeckId; band: "high" | "mid" | "low"; value: boolean }
  | { type: "xf"; value: number }
  | { type: "master"; value: number }
  | { type: "booth"; value: number }
  | { type: "cueMix"; value: number }
  | { type: "sync"; id: DeckId; value: boolean }
  | { type: "masterDeck"; id: DeckId }
  | { type: "cueMonitor"; id: DeckId; value: boolean }
  | { type: "jogMode"; id: DeckId; value: JogMode }
  | { type: "quantize"; id: DeckId; value: boolean }
  | { type: "loadTrack"; id: DeckId; trackId: string }
  | { type: "callCue"; id: DeckId }
  | { type: "setCue"; id: DeckId }
  | { type: "toggleLoop"; id: DeckId }
  | { type: "nudge"; id: DeckId; direction: -1 | 1 };
