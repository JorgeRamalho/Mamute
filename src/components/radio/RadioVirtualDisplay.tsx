import { useEffect, useRef, useState, type CSSProperties } from "react";
import { syncBeginnerDjToStorage } from "../../lib/radio-catalog-import";
import { markBeginnerPlaylistLoaded } from "../../lib/radio-user-playlist";
import type { RadioClip } from "../../types/radio";
import type { PlatformId } from "../../types/platform";

const SPECTRUM_BARS = 32;
const VU_SEGMENTS = 12;

type RadioVirtualDisplayProps = {
  clip?: RadioClip | null;
  accent: string;
  platformLabel: string;
  isPlaying: boolean;
  catalogReady: boolean;
  continuous: boolean;
  playbackLabel: string;
  playlistCount: number;
  playlistOnly: boolean;
  onPlaylistOnlyChange: (value: boolean) => void;
  onCatalogUpdated: () => void;
};

function platformCode(id?: PlatformId): string {
  if (!id) return "SYS";
  if (id === "youtube") return "YTM";
  return id.slice(0, 3).toUpperCase();
}

export function RadioVirtualDisplay({
  clip,
  accent,
  platformLabel,
  isPlaying,
  catalogReady,
  continuous,
  playbackLabel,
  playlistCount,
  playlistOnly,
  onPlaylistOnlyChange,
  onCatalogUpdated,
}: RadioVirtualDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const [busy, setBusy] = useState(false);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const beatMs = clip ? Math.round(60_000 / Math.max(clip.bpm, 1)) : 500;

  const loadBeginnerPlaylist = async () => {
    setBusy(true);
    setStatusLine(null);
    try {
      const merged = await syncBeginnerDjToStorage();
      markBeginnerPlaylistLoaded();
      setStatusLine(`SYNC OK · ${merged.length} FAIXAS`);
      onCatalogUpdated();
    } catch (error) {
      setStatusLine(error instanceof Error ? error.message : "ERRO DE SYNC");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const draw = () => {
      frameRef.current += 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const active = isPlaying && catalogReady;
      const t = frameRef.current * 0.04;
      const midY = h * 0.5;

      ctx.strokeStyle = isPlaying && catalogReady ? accent : "rgba(120, 140, 180, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      for (let x = 0; x <= w; x += 2) {
        const phase = t + x * 0.08;
        const amp = active ? 0.22 + Math.sin(phase * 0.7) * 0.08 : 0.04;
        const y =
          midY +
          Math.sin(phase) * h * amp +
          Math.sin(phase * 2.3 + 1.2) * h * amp * 0.35;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();

      if (active) {
        ctx.strokeStyle = `${accent}44`;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const phase = t * 1.4 + x * 0.05 + 2;
          const y = midY + Math.sin(phase) * h * 0.12;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      raf = window.requestAnimationFrame(draw);
    };

    raf = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [accent, catalogReady, isPlaying]);

  const marquee = clip ? `${clip.artist} — ${clip.title}    ${clip.artist} — ${clip.title}    ` : "MAMUTE FM · AGUARDANDO SINAL";

  return (
    <div
      className="radio-hud"
      role="region"
      aria-label="Visor digital Mamute FM"
      data-playing={isPlaying && catalogReady ? "true" : "false"}
      style={
        {
          "--hud-accent": accent,
          "--beat-ms": `${beatMs}ms`,
        } as CSSProperties
      }
    >
      <div className="radio-hud-bezel">
        <div className="radio-hud-bezel-top">
          <span className="radio-hud-brand">MAMUTE · HUD</span>
          <span className="radio-hud-chip">{platformCode(clip?.platform)}</span>
          <span className="radio-hud-live" role="status">
            {isPlaying && catalogReady ? "STREAM" : catalogReady ? "STANDBY" : "SYNC"}
          </span>
        </div>

        <div className="radio-hud-screen">
          <div className="radio-hud-screen-inner">
            <span className="radio-hud-scan" aria-hidden="true" />
            <span className="radio-hud-grid" aria-hidden="true" />
            <span className="radio-hud-glow" aria-hidden="true" />
            <span className="radio-hud-noise" aria-hidden="true" />

            <div className="radio-hud-vu radio-hud-vu--left" aria-hidden="true">
              {Array.from({ length: VU_SEGMENTS }, (_, i) => (
                <span
                  key={i}
                  className="radio-hud-vu-seg"
                  style={{ "--seg-i": i } as CSSProperties}
                />
              ))}
            </div>

            <div className="radio-hud-core">
              <div className="radio-hud-marquee" aria-live="polite">
                <span className="radio-hud-marquee-track">{marquee}</span>
              </div>

              <canvas ref={canvasRef} className="radio-hud-wave" aria-hidden="true" />

              <div className="radio-hud-metrics">
                <div className="radio-hud-metric">
                  <span className="radio-hud-metric-label">BPM</span>
                  <span className="radio-hud-metric-value">{clip?.bpm ?? "—"}</span>
                </div>
                <div className="radio-hud-metric">
                  <span className="radio-hud-metric-label">KEY</span>
                  <span className="radio-hud-metric-value">{clip?.key ?? "—"}</span>
                </div>
                <div className="radio-hud-metric">
                  <span className="radio-hud-metric-label">GENRE</span>
                  <span className="radio-hud-metric-value">{clip?.genre ?? "—"}</span>
                </div>
                <div className="radio-hud-metric">
                  <span className="radio-hud-metric-label">TIME</span>
                  <span className="radio-hud-metric-value">{clip?.duration ?? "—"}</span>
                </div>
              </div>

              <p className="radio-hud-status">{playbackLabel}</p>
            </div>

            <div className="radio-hud-vu radio-hud-vu--right" aria-hidden="true">
              {Array.from({ length: VU_SEGMENTS }, (_, i) => (
                <span
                  key={i}
                  className="radio-hud-vu-seg"
                  style={{ "--seg-i": i } as CSSProperties}
                />
              ))}
            </div>
          </div>

          <div className="radio-hud-spectrum" aria-hidden="true">
            {Array.from({ length: SPECTRUM_BARS }, (_, index) => (
              <span
                key={index}
                className="radio-hud-spectrum-bar"
                style={{ "--bar-i": index } as CSSProperties}
              />
            ))}
          </div>
        </div>

        <div className="radio-hud-footer">
          <div className="radio-hud-footer-meta">
            <span>{platformLabel}</span>
            <span>{continuous ? "RÁDIO CONTÍNUA" : "MANUAL"}</span>
            {statusLine ? <span className="radio-hud-footer-sync">{statusLine}</span> : null}
          </div>
          <div className="radio-hud-footer-actions">
            <button
              type="button"
              className="radio-hud-action"
              disabled={busy}
              onClick={() => void loadBeginnerPlaylist()}
            >
              {busy ? "SYNC…" : "DJ INICIANTE"}
            </button>
            <button
              type="button"
              className={playlistOnly ? "radio-hud-action is-on" : "radio-hud-action"}
              aria-pressed={playlistOnly}
              disabled={playlistCount === 0}
              onClick={() => onPlaylistOnlyChange(!playlistOnly)}
            >
              MINHA ({playlistCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
