import { type CSSProperties } from "react";
import type { DeckId, MixerSnapshot } from "../../types/mixer";
import type { MixerAction } from "./CdjDeck";
import { VolumeKnob } from "./VolumeKnob";

const EQ_BANDS = [
  { id: "high", label: "HIGH" },
  { id: "mid", label: "MED" },
  { id: "low", label: "LOW" },
] as const;

const EQ_MIN = -24;
const EQ_MAX = 12;
const EQ_STEP = 1;

function clampEq(value: number) {
  return Math.min(EQ_MAX, Math.max(EQ_MIN, value));
}

function formatEqDb(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function eqDialDeg(value: number) {
  return ((value - EQ_MIN) / (EQ_MAX - EQ_MIN)) * 270 - 135;
}

function EqBand({
  deckId,
  band,
  label,
  value,
  killed,
  onChange,
}: {
  deckId: DeckId;
  band: (typeof EQ_BANDS)[number]["id"];
  label: string;
  value: number;
  killed: boolean;
  onChange: (action: MixerAction) => void;
}) {
  const channel = deckId.toUpperCase();

  return (
    <div className="mixer-eq-band" data-killed={killed ? "true" : "false"}>
      <button
        type="button"
        className={`mixer-eq-name${killed ? " is-on" : ""}`}
        aria-pressed={killed}
        aria-label={`Kill ${label} canal ${channel}`}
        onClick={() => onChange({ type: "eqKill", id: deckId, band, value: !killed })}
      >
        {label}
      </button>
      <div
        className="mixer-eq-dial"
        style={{ "--eq-rot": `${eqDialDeg(value)}deg` } as CSSProperties}
        aria-hidden="true"
      >
        <span className="mixer-eq-dial-face">
          <span className="mixer-eq-dial-tick" />
        </span>
      </div>
      <p className="mixer-eq-db">{killed ? "KILL" : `${formatEqDb(value)} dB`}</p>
      <div className="mixer-eq-boost">
        <button
          type="button"
          aria-label={`Diminuir ${label} canal ${channel}`}
          disabled={killed || value <= EQ_MIN}
          onClick={() =>
            onChange({ type: "eq", id: deckId, band, value: clampEq(value - EQ_STEP) })
          }
        >
          −
        </button>
        <input
          type="range"
          min={EQ_MIN}
          max={EQ_MAX}
          step={EQ_STEP}
          value={value}
          disabled={killed}
          aria-label={`${label} canal ${channel}`}
          onChange={(event) =>
            onChange({ type: "eq", id: deckId, band, value: Number(event.target.value) })
          }
        />
        <button
          type="button"
          aria-label={`Aumentar ${label} canal ${channel}`}
          disabled={killed || value >= EQ_MAX}
          onClick={() =>
            onChange({ type: "eq", id: deckId, band, value: clampEq(value + EQ_STEP) })
          }
        >
          +
        </button>
      </div>
    </div>
  );
}

function ChannelEq({
  deckId,
  snap,
  onChange,
}: {
  deckId: DeckId;
  snap: MixerSnapshot;
  onChange: (action: MixerAction) => void;
}) {
  const deck = snap[deckId];

  return (
    <div className="mixer-eq-channel" data-channel={deckId}>
      <p className="mixer-eq-channel-label">CH {deckId.toUpperCase()}</p>
      {EQ_BANDS.map((item) => (
        <EqBand
          key={item.id}
          deckId={deckId}
          band={item.id}
          label={item.label}
          value={deck.eq[item.id]}
          killed={deck.eqKill[item.id]}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

export function MixerConsole({
  snap,
  onChange,
}: {
  snap: MixerSnapshot;
  onChange: (action: MixerAction) => void;
}) {
  return (
    <section className="mixer-console" data-stage="7" aria-label="Mixer central">
      <header className="mixer-console-head">
        <p className="kicker">Mamute · DJM-V10</p>
        <h2 className="mixer-console-title">Mixer &amp; EQ</h2>
      </header>

      <div className="mixer-eq-rack" role="group" aria-label="Equalizador de 3 bandas">
        <p className="mixer-eq-rack-label">EQ · HIGH / MED / LOW</p>
        <div className="mixer-eq-split">
          <ChannelEq deckId="a" snap={snap} onChange={onChange} />
          <ChannelEq deckId="b" snap={snap} onChange={onChange} />
        </div>
      </div>

      <div className="mixer-faders">
        <label className="mixer-fader">
          <span>CH A</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={snap.a.gain}
            aria-label="Volume deck A"
            onChange={(event) => onChange({ type: "gain", id: "a", value: Number(event.target.value) })}
          />
        </label>
        <label className="mixer-fader">
          <span>CH B</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={snap.b.gain}
            aria-label="Volume deck B"
            onChange={(event) => onChange({ type: "gain", id: "b", value: Number(event.target.value) })}
          />
        </label>
      </div>

      <div className="mixer-xf-block">
        <p className="mixer-xf-label">CROSSFADER</p>
        <input
          className="mixer-xfader"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={snap.crossfader}
          aria-label="Crossfader"
          onChange={(event) => onChange({ type: "xf", value: Number(event.target.value) })}
        />
        <div className="mixer-xf-curve" aria-hidden="true">
          <span>A</span>
          <span>B</span>
        </div>
      </div>

      <div className="mixer-monitor-knobs" role="group" aria-label="Master, booth e cue mix">
        <VolumeKnob
          label="MASTER"
          tone="master"
          value={snap.master}
          ariaLabel="Volume master"
          onChange={(value) => onChange({ type: "master", value })}
        />
        <VolumeKnob
          label="BOOTH"
          tone="booth"
          value={snap.booth}
          ariaLabel="Volume booth"
          onChange={(value) => onChange({ type: "booth", value })}
        />
        <VolumeKnob
          label="CUE MIX"
          tone="cue"
          value={snap.cueMix}
          ariaLabel="Cue mix headphone"
          onChange={(value) => onChange({ type: "cueMix", value })}
        />
      </div>

      <div className="mixer-console-tags">
        <span data-on={snap.a.cueMonitor ? "true" : "false"}>CUE A</span>
        <span data-on={snap.b.cueMonitor ? "true" : "false"}>CUE B</span>
        <span data-on={snap.masterDeck === "a" ? "true" : "false"}>MT A</span>
        <span data-on={snap.masterDeck === "b" ? "true" : "false"}>MT B</span>
      </div>
    </section>
  );
}
