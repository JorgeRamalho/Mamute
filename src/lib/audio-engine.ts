import type { DeckId } from "../types";

export interface DeckState {
  playing: boolean;
  bpm: number;
  pitch: number;
  gain: number;
  eq: { high: number; mid: number; low: number };
}

export interface MixerSnapshot {
  a: DeckState;
  b: DeckState;
  crossfader: number;
  master: number;
}

const DEFAULT_DECK: DeckState = {
  playing: false,
  bpm: 124,
  pitch: 0,
  gain: 0.85,
  eq: { high: 0, mid: 0, low: 0 },
};

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
    const current = data[index] ?? 0;
    data[index] = current + Math.sin(2 * Math.PI * freq * t) * env;
  }
}

function writeHat(data: Float32Array, noise: Float32Array, sampleRate: number, at: number): void {
  const dur = Math.floor(sampleRate * 0.045);
  for (let i = 0; i < dur && at + i < data.length; i += 1) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 70) * 0.22;
    const idx = (at + i) % noise.length;
    const index = at + i;
    const current = data[index] ?? 0;
    data[index] = current + (noise[idx] ?? 0) * env;
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
  gain: GainNode;
  high: BiquadFilterNode;
  mid: BiquadFilterNode;
  low: BiquadFilterNode;
  analyser: AnalyserNode;
  buffer: AudioBuffer | null = null;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.gain = ctx.createGain();
    this.high = ctx.createBiquadFilter();
    this.mid = ctx.createBiquadFilter();
    this.low = ctx.createBiquadFilter();
    this.analyser = ctx.createAnalyser();
    this.high.type = "highshelf";
    this.high.frequency.value = 9000;
    this.mid.type = "peaking";
    this.mid.frequency.value = 1000;
    this.low.type = "lowshelf";
    this.low.frequency.value = 180;
    this.analyser.fftSize = 256;
    this.gain.connect(this.low);
    this.low.connect(this.mid);
    this.mid.connect(this.high);
    this.high.connect(this.analyser);
    this.analyser.connect(destination);
  }
}

export class MamuteEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private xfA: GainNode | null = null;
  private xfB: GainNode | null = null;
  private decks: { a: DeckNodes; b: DeckNodes } | null = null;
  snapshot: MixerSnapshot = {
    a: { ...DEFAULT_DECK, bpm: 124 },
    b: { ...DEFAULT_DECK, bpm: 128 },
    crossfader: 0.5,
    master: 0.8,
  };

  async ensure(): Promise<void> {
    if (this.ctx) return;
    const ctx = new AudioContext();
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
    this.decks.a.buffer = buildLoop(ctx, this.snapshot.a.bpm, "a");
    this.decks.b.buffer = buildLoop(ctx, this.snapshot.b.bpm, "b");
    this.applyGains();
  }

  analyser(id: DeckId): AnalyserNode | null {
    return this.decks?.[id].analyser ?? null;
  }

  async toggle(id: DeckId): Promise<void> {
    await this.ensure();
    const deck = this.snapshot[id];
    if (deck.playing) {
      this.stop(id);
      return;
    }
    this.start(id);
  }

  setPitch(id: DeckId, pitch: number): void {
    this.snapshot[id].pitch = pitch;
    const source = this.decks?.[id].source;
    if (source) source.playbackRate.value = 1 + pitch / 100;
  }

  setEq(id: DeckId, band: keyof DeckState["eq"], value: number): void {
    this.snapshot[id].eq[band] = value;
    const nodes = this.decks?.[id];
    if (!nodes) return;
    nodes[band].gain.value = value;
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

  private start(id: DeckId): void {
    if (!this.ctx || !this.decks) return;
    this.stop(id);
    const nodes = this.decks[id];
    if (!nodes.buffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = nodes.buffer;
    source.loop = true;
    source.playbackRate.value = 1 + this.snapshot[id].pitch / 100;
    source.connect(nodes.gain);
    source.start();
    nodes.source = source;
    this.snapshot[id].playing = true;
  }

  private stop(id: DeckId): void {
    const source = this.decks?.[id].source;
    if (source) {
      source.stop();
      source.disconnect();
    }
    if (this.decks) this.decks[id].source = null;
    this.snapshot[id].playing = false;
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
