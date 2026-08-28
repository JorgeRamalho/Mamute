import { useEffect, useReducer, useRef, type CSSProperties } from "react";
import { engine } from "../../lib/audio-engine";
import type { DeckId } from "../../types";

type Action =
  | { type: "refresh" }
  | { type: "pitch"; id: DeckId; value: number }
  | { type: "gain"; id: DeckId; value: number }
  | { type: "eq"; id: DeckId; band: "high" | "mid" | "low"; value: number }
  | { type: "xf"; value: number }
  | { type: "master"; value: number };

function reducer(_state: typeof engine.snapshot, action: Action) {
  switch (action.type) {
    case "pitch":
      engine.setPitch(action.id, action.value);
      break;
    case "gain":
      engine.setGain(action.id, action.value);
      break;
    case "eq":
      engine.setEq(action.id, action.band, action.value);
      break;
    case "xf":
      engine.setCrossfader(action.value);
      break;
    case "master":
      engine.setMaster(action.value);
      break;
    case "refresh":
      break;
  }
  return {
    ...engine.snapshot,
    a: { ...engine.snapshot.a, eq: { ...engine.snapshot.a.eq } },
    b: { ...engine.snapshot.b, eq: { ...engine.snapshot.b.eq } },
  };
}

function Waveform({ id, spinning }: { id: DeckId; spinning: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const bins = new Uint8Array(128);

    const draw = () => {
      const analyser = engine.analyser(id);
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      if (analyser) analyser.getByteTimeDomainData(bins);
      const glow = id === "a" ? "#00e8ff" : "#ff2d95";
      const fade = ctx.createLinearGradient(0, 0, canvas.clientWidth, 0);
      if (id === "a") {
        fade.addColorStop(0, "rgba(0, 232, 255, 0.2)");
        fade.addColorStop(0.5, "#7af6ff");
        fade.addColorStop(1, "rgba(139, 124, 255, 0.7)");
      } else {
        fade.addColorStop(0, "rgba(255, 45, 149, 0.25)");
        fade.addColorStop(0.5, "#ff7ac4");
        fade.addColorStop(1, "rgba(255, 193, 74, 0.65)");
      }
      ctx.shadowBlur = spinning ? 10 : 4;
      ctx.shadowColor = glow;
      ctx.strokeStyle = fade;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      bins.forEach((value, index) => {
        const x = (index / bins.length) * canvas.clientWidth;
        const y = ((value ?? 128) / 255) * canvas.clientHeight;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [id, spinning]);

  return <canvas ref={ref} className="wave" aria-hidden="true" />;
}

function DeckPanel({
  id,
  onChange,
}: {
  id: DeckId;
  onChange: (action: Action) => void;
}) {
  const deck = engine.snapshot[id];
  const bpm = (deck.bpm * (1 + deck.pitch / 100)).toFixed(2);

  return (
    <section className="deck" data-deck={id} data-playing={deck.playing ? "true" : "false"} aria-label={`Deck ${id.toUpperCase()}`}>
      <div className="deck-head">
        <span>DECK {id.toUpperCase()} · {id === "a" ? "HOUSE GRID" : "TECHNO GRID"}</span>
        <span className="bpm">{bpm} BPM</span>
      </div>
      <div className="jog-stage" aria-hidden="true">
        <div
          className="jog"
          style={{ "--spin": `${deck.playing ? "400deg" : "0deg"}` } as CSSProperties}
        />
      </div>
      <Waveform id={id} spinning={deck.playing} />
      <div className="deck-controls">
        <button className="btn btn-solid" type="button" onClick={async () => {
          await engine.toggle(id);
          onChange({ type: "refresh" });
        }}>
          {deck.playing ? "Pause" : "Play"}
        </button>
        <button className="btn" type="button" onClick={() => onChange({ type: "pitch", id, value: 0 })}>
          Cue / Zero
        </button>
        <span className="btn">{id === "a" ? "CDJ-A" : "CTRL-B"}</span>
      </div>
      <div className="eq-row">
        {(["high", "mid", "low"] as const).map((band) => (
          <label key={band}>
            EQ {band}
            <input
              type="range"
              min={-24}
              max={12}
              value={deck.eq[band]}
              onChange={(event) =>
                onChange({ type: "eq", id, band, value: Number(event.target.value) })
              }
            />
          </label>
        ))}
      </div>
      <div className="pitch-wrap">
        <label>
          Pitch {deck.pitch.toFixed(1)}%
          <input
            type="range"
            min={-8}
            max={8}
            step={0.1}
            value={deck.pitch}
            onChange={(event) =>
              onChange({ type: "pitch", id, value: Number(event.target.value) })
            }
          />
        </label>
      </div>
    </section>
  );
}

export function MixerBoard() {
  const [, dispatch] = useReducer(reducer, engine.snapshot);

  return (
    <div className="mixer-board" data-stage="6">
      <DeckPanel id="a" onChange={dispatch} />
      <div className="mixer-center">
        <p className="kicker">CROSSFADER</p>
        <input
          className="xfader"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={engine.snapshot.crossfader}
          aria-label="Crossfader"
          onChange={(event) => dispatch({ type: "xf", value: Number(event.target.value) })}
        />
        <div className="channel-faders">
          <label>
            A
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={engine.snapshot.a.gain}
              aria-label="Volume deck A"
              onChange={(event) =>
                dispatch({ type: "gain", id: "a", value: Number(event.target.value) })
              }
            />
          </label>
          <label>
            B
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={engine.snapshot.b.gain}
              aria-label="Volume deck B"
              onChange={(event) =>
                dispatch({ type: "gain", id: "b", value: Number(event.target.value) })
              }
            />
          </label>
        </div>
        <label>
          Master
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={engine.snapshot.master}
            aria-label="Volume master"
            onChange={(event) => dispatch({ type: "master", value: Number(event.target.value) })}
          />
        </label>
      </div>
      <DeckPanel id="b" onChange={dispatch} />
    </div>
  );
}
