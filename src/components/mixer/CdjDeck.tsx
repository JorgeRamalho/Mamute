import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { TRAINING_TRACKS } from "../../data/training-tracks";
import { engine } from "../../lib/audio-engine";
import { harmonicDistance, resolveMusicalKey } from "../../lib/musical-key";
import type { DeckId, MixerAction } from "../../types";

function Waveform({
  id,
  spinning,
  phase,
}: {
  id: DeckId;
  spinning: boolean;
  phase: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const bins = new Uint8Array(256);

    const draw = () => {
      const analyser = engine.analyser(id);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const base = id === "a" ? "#00e8ff" : "#ff2d95";
      ctx.fillStyle = "rgba(7, 11, 18, 0.92)";
      ctx.fillRect(0, 0, width, height);

      for (let bar = 0; bar < 64; bar += 1) {
        const x = (bar / 64) * width;
        const h = 8 + Math.sin(bar * 0.55 + phase * Math.PI * 2) * 6 + (bar % 4 === 0 ? 14 : 6);
        const grad = ctx.createLinearGradient(0, height - h, 0, height);
        grad.addColorStop(0, `${base}88`);
        grad.addColorStop(1, `${base}22`);
        ctx.fillStyle = grad;
        ctx.fillRect(x, height - h, width / 64 - 1, h);
      }

      const playhead = phase * width;
      ctx.strokeStyle = "#ffe08a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playhead, 0);
      ctx.lineTo(playhead, height);
      ctx.stroke();

      if (analyser) {
        analyser.getByteTimeDomainData(bins);
        ctx.strokeStyle = base;
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = spinning ? 12 : 4;
        ctx.shadowColor = base;
        ctx.beginPath();
        bins.forEach((value, index) => {
          const x = (index / bins.length) * width;
          const y = height * 0.35 + ((value ?? 128) / 255) * height * 0.22;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [id, phase, spinning]);

  return <canvas ref={ref} className="cdj-wave" aria-hidden="true" />;
}

function JogWheel({
  id,
  playing,
  mode,
  onNudge,
}: {
  id: DeckId;
  playing: boolean;
  mode: "vinyl" | "cdj";
  onNudge: (direction: -1 | 1) => void;
}) {
  const lastY = useRef(0);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    lastY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const delta = event.clientY - lastY.current;
    if (Math.abs(delta) > 6) {
      onNudge(delta > 0 ? -1 : 1);
      lastY.current = event.clientY;
    }
  };

  return (
    <div className="cdj-jog-shell">
      <div
        className="cdj-jog"
        data-stage="10"
        data-playing={playing ? "true" : "false"}
        data-mode={mode}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        role="slider"
        aria-label={`Jog wheel deck ${id.toUpperCase()}`}
        aria-valuemin={-100}
        aria-valuemax={100}
        aria-valuenow={0}
      >
        <span className="cdj-jog-cap" aria-hidden="true" />
        <span className="cdj-jog-ring" aria-hidden="true" />
      </div>
      <p className="cdj-jog-label">{mode === "vinyl" ? "VINYL · SCRUB" : "CDJ · NUDGE"}</p>
    </div>
  );
}

export function CdjDeck({
  id,
  masterKey,
  onChange,
}: {
  id: DeckId;
  masterKey: string;
  onChange: (action: MixerAction) => void;
}) {
  const deck = engine.snapshot[id];
  const bpm = engine.effectiveBpm(id).toFixed(2);
  const musical = resolveMusicalKey(deck.track.key);
  const harmony = harmonicDistance(masterKey, deck.track.key);

  const pitchFader = (
    <label className="cdj-pitch cdj-pitch--hero">
      <span className="cdj-pitch-label">PITCH · TEMPO</span>
      <div className="cdj-pitch-slider">
        <input
          className="cdj-pitch-input"
          type="range"
          min={-8}
          max={8}
          step={0.1}
          value={deck.pitch}
          aria-label={`Pitch deck ${id.toUpperCase()}`}
          onChange={(event) => onChange({ type: "pitch", id, value: Number(event.target.value) })}
        />
      </div>
      <span className="cdj-pitch-value">{deck.pitch.toFixed(1)}%</span>
    </label>
  );

  return (
    <section
      className="cdj-deck"
      data-stage="9"
      data-deck={id}
      data-playing={deck.playing ? "true" : "false"}
      aria-label={`Deck ${id.toUpperCase()}`}
    >
      <header className="cdj-deck-top">
        <div className="cdj-brand">
          <span className="cdj-brand-mark">{id === "a" ? "CDJ-3000" : "CDJ-3000XJ"}</span>
          <span className="cdj-brand-grid">{deck.track.grid}</span>
        </div>
        <div className="cdj-status-leds" aria-hidden="true">
          <span data-on={deck.sync ? "true" : "false"}>SYNC</span>
          <span data-on={deck.masterTempo ? "true" : "false"}>M.TEMPO</span>
          <span data-on={deck.loop.active ? "true" : "false"}>LOOP</span>
        </div>
      </header>

      <div className="cdj-display">
        <div className="cdj-track-meta">
          <strong>{deck.track.title}</strong>
          <span>{deck.track.artist}</span>
          <span className="cdj-genre">{deck.track.genre}</span>
        </div>
        <div className="cdj-metrics">
          <div className="cdj-metric cdj-metric--bpm">
            <span className="cdj-metric-label">BPM</span>
            <span className="cdj-metric-value">{bpm}</span>
            <span className="cdj-metric-sub">Pitch {deck.pitch.toFixed(1)}%</span>
          </div>
          <div className="cdj-metric cdj-metric--key" data-harmony={harmony}>
            <span className="cdj-metric-label">KEY</span>
            <span className="cdj-metric-value">{deck.track.key}</span>
            <span className="cdj-metric-sub">{musical.label}</span>
          </div>
          <div className="cdj-metric cdj-metric--phase">
            <span className="cdj-metric-label">PHASE</span>
            <span
              className="cdj-phase-ring"
              style={{ "--phase": deck.phase } as CSSProperties}
            >
              <span className="cdj-phase-dot" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>

      <label className="cdj-track-select">
        <span>USB · treino Mamute</span>
        <select
          value={deck.track.id}
          aria-label={`Track deck ${id.toUpperCase()}`}
          onChange={(event) => onChange({ type: "loadTrack", id, trackId: event.target.value })}
        >
          {TRAINING_TRACKS.map((track) => (
            <option key={track.id} value={track.id}>
              {track.title} · {track.key} · {track.bpm} BPM
            </option>
          ))}
        </select>
      </label>

      <Waveform id={id} phase={deck.phase} spinning={deck.playing} />

      <div className="cdj-transport-primary">
        <p className="cdj-transport-label">Comandos principais</p>
        <div className="cdj-transport" aria-label={`Transporte deck ${id.toUpperCase()}`}>
          {/*
            CUE agora é o ponto de cue, e não o monitor de fone, que passou a
            ter botão próprio no mixer central. Ele não leva `aria-pressed`
            porque virou ação momentânea, ao passo que antes era um toggle.
          */}
          <button
            className="cdj-btn cdj-btn--primary cdj-btn--cue"
            type="button"
            aria-label={`Cue deck ${id.toUpperCase()}: grava o ponto com o deck pausado e volta a ele tocando`}
            onClick={() => onChange({ type: "cueButton", id })}
          >
            CUE
          </button>
          <button
            className="cdj-btn cdj-btn--primary cdj-btn--play"
            type="button"
            onClick={() => onChange({ type: "toggle", id })}
          >
            {deck.playing ? "Pause" : "Play"}
          </button>
          <button
            className={`cdj-btn cdj-btn--primary cdj-btn--sync${deck.sync ? " is-on" : ""}`}
            type="button"
            aria-pressed={deck.sync}
            onClick={() => onChange({ type: "sync", id, value: !deck.sync })}
          >
            SYNC
          </button>
          <button
            className={`cdj-btn cdj-btn--primary cdj-btn--master${deck.masterTempo ? " is-on" : ""}`}
            type="button"
            aria-pressed={deck.masterTempo}
            onClick={() => onChange({ type: "masterDeck", id })}
          >
            MASTER
          </button>
        </div>
      </div>

      <div className="cdj-jog-row">
        <div className="cdj-jog-row-side cdj-jog-row-side--left">
          {id === "a" ? pitchFader : null}
        </div>
        <JogWheel
          id={id}
          mode={deck.jogMode}
          playing={deck.playing}
          onNudge={(direction) => onChange({ type: "nudge", id, direction })}
        />
        <div className="cdj-jog-row-side cdj-jog-row-side--right">
          {id === "b" ? pitchFader : null}
        </div>
      </div>
    </section>
  );
}
