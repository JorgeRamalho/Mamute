import { DEFAULT_DECK_TRACKS, getTrainingTrack } from "../data/training-tracks";
import { HOT_CUE_SLOTS } from "../types/mixer";
import type {
  DeckId,
  DeckState,
  HotCue,
  JogMode,
  MixerSnapshot,
  TrainingTrack,
} from "../types/mixer";

export type { DeckState, MixerSnapshot } from "../types/mixer";

/** Fábrica de `AudioContext`, injetável nos testes para não usar o Web Audio real. */
export type AudioContextFactory = () => AudioContext;

/**
 * Opções do engine. A UI não passa nada, e os testes injetam o mock.
 */
export interface MamuteEngineOptions {
  createAudioContext?: AudioContextFactory;
}

function emptyHotCues(): HotCue[] {
  return Array.from({ length: HOT_CUE_SLOTS }, (_, index) => ({
    slot: index + 1,
    beat: index * 4,
    set: index === 0,
  }));
}

function defaultTrack(id: DeckId): TrainingTrack {
  const trackId = DEFAULT_DECK_TRACKS[id];
  return getTrainingTrack(trackId) ?? getTrainingTrack("radio-spotify-01")!;
}

function createDeck(id: DeckId): DeckState {
  const track = defaultTrack(id);
  return {
    playing: false,
    bpm: track.bpm,
    pitch: 0,
    gain: 0.85,
    trim: 0.72,
    eq: { high: 0, mid: 0, low: 0 },
    eqKill: { high: false, mid: false, low: false },
    filter: 0,
    sync: false,
    masterTempo: id === "a",
    cueMonitor: false,
    jogMode: "cdj",
    quantize: true,
    loop: { active: false, inBeat: null, outBeat: null },
    hotCues: emptyHotCues(),
    cueBeat: 0,
    track,
    phase: 0,
  };
}

function makeNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function writeKick(data: Float32Array, sampleRate: number, at: number, accent: number): void {
  const dur = Math.floor(sampleRate * 0.18);
  for (let i = 0; i < dur && at + i < data.length; i += 1) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 28) * accent;
    const freq = 48 + 90 * Math.exp(-t * 40);
    const index = at + i;
    data[index] = (data[index] ?? 0) + Math.sin(2 * Math.PI * freq * t) * env;
  }
}

function writeHat(data: Float32Array, noise: Float32Array, sampleRate: number, at: number): void {
  const dur = Math.floor(sampleRate * 0.045);
  for (let i = 0; i < dur && at + i < data.length; i += 1) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 70) * 0.22;
    const idx = (at + i) % noise.length;
    const index = at + i;
    data[index] = (data[index] ?? 0) + (noise[idx] ?? 0) * env;
  }
}

function buildLoop(ctx: AudioContext, bpm: number, color: DeckId): AudioBuffer {
  const bars = 2;
  const beats = bars * 4;
  const seconds = (60 / bpm) * beats;
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const noise = makeNoiseBuffer(ctx, 1).getChannelData(0);
  const step = Math.floor((60 / bpm) * ctx.sampleRate);

  for (let beat = 0; beat < beats; beat += 1) {
    const at = beat * step;
    const accent = beat % 4 === 0 ? 1 : 0.78;
    writeKick(left, ctx.sampleRate, at, accent);
    writeKick(right, ctx.sampleRate, at, accent * 0.92);
    if (beat % 2 === 1) {
      writeHat(left, noise, ctx.sampleRate, at);
      writeHat(right, noise, ctx.sampleRate, at + 40);
    }
    if (color === "b" && beat % 4 === 2) {
      writeKick(left, ctx.sampleRate, at + Math.floor(step * 0.5), 0.35);
    }
  }
  return buffer;
}

class DeckNodes {
  source: AudioBufferSourceNode | null = null;
  trim: GainNode;
  gain: GainNode;
  filter: BiquadFilterNode;
  high: BiquadFilterNode;
  mid: BiquadFilterNode;
  low: BiquadFilterNode;
  analyser: AnalyserNode;
  buffer: AudioBuffer | null = null;
  startedAt = 0;
  pausedPhase = 0;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.trim = ctx.createGain();
    this.gain = ctx.createGain();
    this.filter = ctx.createBiquadFilter();
    this.high = ctx.createBiquadFilter();
    this.mid = ctx.createBiquadFilter();
    this.low = ctx.createBiquadFilter();
    this.analyser = ctx.createAnalyser();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 20000;
    this.filter.Q.value = 0.7;
    this.high.type = "highshelf";
    this.high.frequency.value = 9000;
    this.mid.type = "peaking";
    this.mid.frequency.value = 1000;
    this.mid.Q.value = 0.9;
    this.low.type = "lowshelf";
    this.low.frequency.value = 180;
    this.analyser.fftSize = 512;
    this.trim.connect(this.filter);
    this.filter.connect(this.low);
    this.low.connect(this.mid);
    this.mid.connect(this.high);
    this.high.connect(this.gain);
    this.gain.connect(this.analyser);
    this.analyser.connect(destination);
  }
}

export class MamuteEngine {
  private readonly createAudioContext: AudioContextFactory;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private xfA: GainNode | null = null;
  private xfB: GainNode | null = null;
  private decks: { a: DeckNodes; b: DeckNodes } | null = null;
  private phaseTimer: number | null = null;
  snapshot: MixerSnapshot = {
    a: createDeck("a"),
    b: createDeck("b"),
    crossfader: 0.5,
    master: 0.82,
    booth: 0.65,
    cueMix: 0.5,
    masterDeck: "a",
  };

  /**
   * @param options Fábrica de contexto; omitida na cabine, obrigatória no harness.
   */
  constructor(options: MamuteEngineOptions = {}) {
    this.createAudioContext = options.createAudioContext ?? (() => new AudioContext());
  }

  /**
   * Superfície só para testes: métodos privados e nós do grafo.
   *
   * Não usar na UI. O getter existe para o harness não precisar de `as any`.
   */
  get __test__() {
    return {
      applySync: (id: DeckId) => this.applySync(id),
      applyGains: () => this.applyGains(),
      rebuildBuffer: (id: DeckId) => this.rebuildBuffer(id),
      start: (id: DeckId) => this.start(id),
      stop: (id: DeckId) => this.stop(id),
      ctx: () => this.ctx,
      decks: () => this.decks,
      master: () => this.master,
      xfA: () => this.xfA,
      xfB: () => this.xfB,
      phaseTimer: () => this.phaseTimer,
      stopPhaseLoop: () => {
        if (this.phaseTimer === null) return;
        window.clearInterval(this.phaseTimer);
        this.phaseTimer = null;
      },
    };
  }

  async ensure(): Promise<void> {
    if (this.ctx) return;
    const ctx = this.createAudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.xfA = ctx.createGain();
    this.xfB = ctx.createGain();
    this.xfA.connect(this.master);
    this.xfB.connect(this.master);
    this.master.connect(ctx.destination);
    this.decks = {
      a: new DeckNodes(ctx, this.xfA),
      b: new DeckNodes(ctx, this.xfB),
    };
    this.rebuildBuffer("a");
    this.rebuildBuffer("b");
    this.applyGains();
    this.applyDeck("a");
    this.applyDeck("b");
    this.startPhaseLoop();
  }

  analyser(id: DeckId): AnalyserNode | null {
    return this.decks?.[id].analyser ?? null;
  }

  effectiveBpm(id: DeckId): number {
    const deck = this.snapshot[id];
    return deck.bpm * (1 + deck.pitch / 100);
  }

  async toggle(id: DeckId): Promise<void> {
    await this.ensure();
    if (this.snapshot[id].playing) {
      this.stop(id);
      return;
    }
    this.start(id);
  }

  loadTrack(id: DeckId, trackId: string): void {
    const track = getTrainingTrack(trackId);
    if (!track) return;
    const wasPlaying = this.snapshot[id].playing;
    if (wasPlaying) this.stop(id);
    this.snapshot[id].track = track;
    this.snapshot[id].bpm = track.bpm;
    this.snapshot[id].pitch = 0;
    this.snapshot[id].cueBeat = 0;
    this.snapshot[id].phase = 0;
    this.rebuildBuffer(id);
    if (this.snapshot[id].sync) this.applySync(id);
    if (wasPlaying) this.start(id);
  }

  setPitch(id: DeckId, pitch: number): void {
    this.snapshot[id].pitch = pitch;
    if (this.snapshot[id].sync) this.applySync(id);
    const source = this.decks?.[id].source;
    if (source) source.playbackRate.value = 1 + this.snapshot[id].pitch / 100;
  }

  setEq(id: DeckId, band: keyof DeckState["eq"], value: number): void {
    this.snapshot[id].eq[band] = value;
    this.applyEq(id);
  }

  setEqKill(id: DeckId, band: keyof DeckState["eqKill"], value: boolean): void {
    this.snapshot[id].eqKill[band] = value;
    this.applyEq(id);
  }

  setTrim(id: DeckId, value: number): void {
    this.snapshot[id].trim = value;
    if (this.decks?.[id].trim) this.decks[id].trim.gain.value = value;
  }

  setFilter(id: DeckId, value: number): void {
    this.snapshot[id].filter = value;
    this.applyFilter(id);
  }

  setGain(id: DeckId, value: number): void {
    this.snapshot[id].gain = value;
    this.applyGains();
  }

  setCrossfader(value: number): void {
    this.snapshot.crossfader = value;
    this.applyGains();
  }

  setMaster(value: number): void {
    this.snapshot.master = value;
    if (this.master) this.master.gain.value = value;
  }

  setBooth(value: number): void {
    this.snapshot.booth = value;
  }

  setCueMix(value: number): void {
    this.snapshot.cueMix = value;
  }

  setSync(id: DeckId, enabled: boolean): void {
    this.snapshot[id].sync = enabled;
    if (enabled) this.applySync(id);
  }

  setMasterDeck(id: DeckId): void {
    this.snapshot.masterDeck = id;
    this.snapshot.a.masterTempo = id === "a";
    this.snapshot.b.masterTempo = id === "b";
    if (this.snapshot.a.sync) this.applySync("a");
    if (this.snapshot.b.sync) this.applySync("b");
  }

  setCueMonitor(id: DeckId, enabled: boolean): void {
    this.snapshot[id].cueMonitor = enabled;
  }

  setJogMode(id: DeckId, mode: JogMode): void {
    this.snapshot[id].jogMode = mode;
  }

  setQuantize(id: DeckId, enabled: boolean): void {
    this.snapshot[id].quantize = enabled;
  }

  setCueBeat(id: DeckId, beat: number): void {
    this.snapshot[id].cueBeat = beat;
  }

  callCue(id: DeckId): void {
    this.snapshot[id].phase = this.beatToPhase(id, this.snapshot[id].cueBeat);
    if (this.snapshot[id].playing) {
      this.restart(id);
    }
  }

  setHotCue(id: DeckId, slot: number): void {
    const cue = this.snapshot[id].hotCues.find((item) => item.slot === slot);
    if (!cue) return;
    cue.beat = this.phaseToBeat(id, this.snapshot[id].phase);
    cue.set = true;
  }

  triggerHotCue(id: DeckId, slot: number): void {
    const cue = this.snapshot[id].hotCues.find((item) => item.slot === slot);
    if (!cue || !cue.set) return;
    this.snapshot[id].phase = this.beatToPhase(id, cue.beat);
    if (!this.snapshot[id].playing) this.start(id);
    else this.restart(id);
  }

  toggleLoop(id: DeckId): void {
    const loop = this.snapshot[id].loop;
    if (!loop.active) {
      loop.inBeat = this.phaseToBeat(id, this.snapshot[id].phase);
      loop.outBeat = loop.inBeat + 4;
      loop.active = true;
      return;
    }
    loop.active = false;
    loop.inBeat = null;
    loop.outBeat = null;
  }

  nudge(id: DeckId, direction: -1 | 1): void {
    const deck = this.snapshot[id];
    const bump = direction * (deck.jogMode === "vinyl" ? 0.035 : 0.018);
    deck.phase = (deck.phase + bump + 1) % 1;
    const source = this.decks?.[id].source;
    if (source) {
      const rate = 1 + deck.pitch / 100 + direction * 0.04;
      source.playbackRate.value = rate;
      window.setTimeout(() => {
        if (source.playbackRate) source.playbackRate.value = 1 + deck.pitch / 100;
      }, 120);
    }
  }

  private beatToPhase(_id: DeckId, beat: number): number {
    return (beat % 8) / 8;
  }

  private phaseToBeat(_id: DeckId, phase: number): number {
    return Math.round(phase * 8) % 8;
  }

  private applySync(id: DeckId): void {
    const master = this.snapshot[this.snapshot.masterDeck];
    const target = master.bpm;
    const deck = this.snapshot[id];
    deck.pitch = ((target / deck.bpm) - 1) * 100;
    const source = this.decks?.[id].source;
    if (source) source.playbackRate.value = 1 + deck.pitch / 100;
  }

  private applyEq(id: DeckId): void {
    const nodes = this.decks?.[id];
    const deck = this.snapshot[id];
    if (!nodes) return;
    nodes.high.gain.value = deck.eqKill.high ? -40 : deck.eq.high;
    nodes.mid.gain.value = deck.eqKill.mid ? -40 : deck.eq.mid;
    nodes.low.gain.value = deck.eqKill.low ? -40 : deck.eq.low;
  }

  private applyFilter(id: DeckId): void {
    const nodes = this.decks?.[id];
    if (!nodes) return;
    const value = this.snapshot[id].filter;
    if (value === 0) {
      nodes.filter.type = "lowpass";
      nodes.filter.frequency.value = 20000;
      return;
    }
    if (value < 0) {
      nodes.filter.type = "lowpass";
      nodes.filter.frequency.value = 180 + (1 + value / 100) * 4800;
      return;
    }
    nodes.filter.type = "highpass";
    nodes.filter.frequency.value = 80 + (value / 100) * 4200;
  }

  private applyDeck(id: DeckId): void {
    this.setTrim(id, this.snapshot[id].trim);
    this.applyEq(id);
    this.applyFilter(id);
  }

  private rebuildBuffer(id: DeckId): void {
    if (!this.ctx || !this.decks) return;
    this.decks[id].buffer = buildLoop(this.ctx, this.snapshot[id].bpm, id);
    if (this.decks[id].source) {
      this.decks[id].source!.buffer = this.decks[id].buffer;
    }
  }

  private start(id: DeckId): void {
    if (!this.ctx || !this.decks) return;
    this.stop(id);
    const nodes = this.decks[id];
    if (!nodes.buffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = nodes.buffer;
    source.loop = true;
    source.playbackRate.value = 1 + this.snapshot[id].pitch / 100;
    source.connect(nodes.trim);
    const offset = nodes.buffer.duration * this.snapshot[id].phase;
    source.start(0, offset);
    nodes.source = source;
    nodes.startedAt = this.ctx.currentTime - offset / source.playbackRate.value;
    this.snapshot[id].playing = true;
  }

  private restart(id: DeckId): void {
    if (this.snapshot[id].playing) this.start(id);
  }

  private stop(id: DeckId): void {
    const nodes = this.decks?.[id];
    if (nodes?.source && this.ctx) {
      const elapsed = this.ctx.currentTime - nodes.startedAt;
      const rate = 1 + this.snapshot[id].pitch / 100;
      const loopDuration = nodes.buffer?.duration ?? 1;
      nodes.pausedPhase = ((elapsed * rate) / loopDuration + this.snapshot[id].phase) % 1;
      this.snapshot[id].phase = nodes.pausedPhase;
      nodes.source.stop();
      nodes.source.disconnect();
      nodes.source = null;
    }
    this.snapshot[id].playing = false;
  }

  private startPhaseLoop(): void {
    if (this.phaseTimer !== null) return;
    this.phaseTimer = window.setInterval(() => {
      if (!this.ctx || !this.decks) return;
      (["a", "b"] as const).forEach((id) => {
        const deck = this.snapshot[id];
        const nodes = this.decks![id];
        if (!deck.playing || !nodes.source) return;
        const elapsed = this.ctx!.currentTime - nodes.startedAt;
        const rate = 1 + deck.pitch / 100;
        const loopDuration = nodes.buffer?.duration ?? 1;
        deck.phase = ((elapsed * rate) / loopDuration) % 1;
      });
    }, 50);
  }

  private applyGains(): void {
    const x = this.snapshot.crossfader;
    const a = Math.cos((x * Math.PI) / 2);
    const b = Math.sin((x * Math.PI) / 2);
    if (this.decks) {
      this.decks.a.gain.gain.value = this.snapshot.a.gain * a;
      this.decks.b.gain.gain.value = this.snapshot.b.gain * b;
    }
    if (this.master) this.master.gain.value = this.snapshot.master;
  }
}

export const engine = new MamuteEngine();
