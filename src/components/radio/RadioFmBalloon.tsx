import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import { Link, useLocation } from "react-router";
import { PLATFORMS } from "../../data/platforms";
import { RADIO_PLATFORM_STATION_TYPES } from "../../data/radio";
import { useRadioMp3 } from "../../lib/use-radio-mp3";
import type { PlatformId } from "../../types/platform";
import { RadioLiveStage } from "./RadioLiveStage";

const platformById = new Map(PLATFORMS.map((platform) => [platform.id, platform]));
const FM_SPECTRUM_BARS = 8;

function platformLabel(id: PlatformId): string {
  if (id === "youtube") return "YouTube";
  return platformById.get(id)?.name ?? id;
}

function syncRadioFmReserve(el: HTMLElement | null): void {
  if (!el) {
    document.documentElement.style.setProperty("--radio-fm-reserve-h", "0px");
    document.documentElement.style.setProperty("--radio-fm-reserve-w", "0px");
    return;
  }
  const rect = el.getBoundingClientRect();
  const isNarrow = window.matchMedia("(max-width: 720px)").matches;
  const reserveH = Math.max(0, Math.ceil(window.innerHeight - rect.top));
  const reserveW = isNarrow
    ? 0
    : Math.max(0, Math.ceil(document.documentElement.clientWidth - rect.left));
  document.documentElement.style.setProperty("--radio-fm-reserve-h", `${reserveH}px`);
  document.documentElement.style.setProperty("--radio-fm-reserve-w", `${reserveW}px`);
}

export function RadioFmBalloon() {
  const rootRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const { clip, catalogReady, playing, start, pause, skip } = useRadioMp3();
  const hidden = location.pathname === "/radio";
  const onAir = playing;
  const accent = clip ? (platformById.get(clip.platform)?.accent ?? "#00e8ff") : "#00e8ff";

  const ligar = useCallback(() => {
    void start();
  }, [start]);

  const togglePause = useCallback(() => {
    if (playing) {
      pause();
      return;
    }
    ligar();
  }, [ligar, pause, playing]);

  const handleSkip = useCallback(
    (delta: 1 | -1) => {
      void skip(delta);
    },
    [skip],
  );

  useEffect(() => {
    if (hidden || !clip) {
      syncRadioFmReserve(null);
      return;
    }

    const el = rootRef.current;
    if (!el) return;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => syncRadioFmReserve(el));
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", update);
      syncRadioFmReserve(null);
    };
  }, [hidden, clip, playing]);

  if (hidden || !clip) return null;

  return (
    <aside
      ref={rootRef}
      className="radio-fm-balloon"
      data-open="true"
      data-on-air={onAir ? "true" : "false"}
      data-random="on"
      data-mini="false"
      style={{ "--platform-accent": accent } as CSSProperties}
      aria-label="Mamute FM"
    >
      <div className="radio-fm-balloon-chassis">
        <div className="radio-fm-balloon-player-host">
          <span className="radio-fm-balloon-viewport-label">VISOR · STREAM MP3</span>
          <RadioLiveStage className="radio-fm-balloon-frame" />
        </div>

        <div className="radio-fm-balloon-shell">
          <div className="radio-fm-balloon-panel">
            <header className="radio-fm-balloon-head">
              <div className="radio-fm-balloon-brand">
                <span className="radio-fm-balloon-brand-mark">MAMUTE</span>
                <span className="radio-fm-balloon-brand-fm">FM</span>
              </div>
              <div className="radio-fm-balloon-head-copy">
                <p className="radio-fm-balloon-kicker">
                  Rádio aleatória
                  {onAir ? (
                    <span className="radio-fm-balloon-live">AO VIVO</span>
                  ) : (
                    <span className="radio-fm-balloon-live radio-fm-balloon-live--idle">STANDBY</span>
                  )}
                </p>
                <h2 className="radio-fm-balloon-title">{clip.title}</h2>
                <p className="radio-fm-balloon-artist">{clip.artist}</p>
              </div>
              <span className="radio-fm-balloon-platform">{platformLabel(clip.platform)}</span>
            </header>

            <div className="radio-fm-balloon-telemetry" aria-label="Telemetria da faixa">
              <div className="radio-fm-balloon-metric">
                <span className="radio-fm-balloon-metric-label">BPM</span>
                <span className="radio-fm-balloon-metric-value">{clip.bpm}</span>
              </div>
              <div className="radio-fm-balloon-metric">
                <span className="radio-fm-balloon-metric-label">KEY</span>
                <span className="radio-fm-balloon-metric-value">{clip.key}</span>
              </div>
              <div className="radio-fm-balloon-metric">
                <span className="radio-fm-balloon-metric-label">TIME</span>
                <span className="radio-fm-balloon-metric-value">{clip.duration}</span>
              </div>
              <div className="radio-fm-balloon-metric">
                <span className="radio-fm-balloon-metric-label">GENRE</span>
                <span className="radio-fm-balloon-metric-value">{clip.genre}</span>
              </div>
            </div>

            <div className="radio-fm-balloon-dial-wrap">
              <p className="radio-fm-balloon-dial-kicker">
                {onAir ? "Plataforma ao vivo" : "Próxima no flow"}
              </p>
              <div className="radio-fm-balloon-dial" aria-label="Plataforma no ar">
                <span
                  className="radio-fm-balloon-chip is-active"
                  data-platform={clip.platform}
                  data-live={onAir ? "true" : "false"}
                  style={
                    {
                      "--platform-accent": platformById.get(clip.platform)?.accent ?? accent,
                    } as CSSProperties
                  }
                  title={`${platformLabel(clip.platform)} · ${RADIO_PLATFORM_STATION_TYPES[clip.platform]}`}
                >
                  <span className="radio-fm-balloon-chip-name">{platformLabel(clip.platform)}</span>
                  <span className="radio-fm-balloon-chip-type">
                    {onAir ? "AO VIVO" : RADIO_PLATFORM_STATION_TYPES[clip.platform]}
                  </span>
                </span>
              </div>
            </div>

            <div className="radio-fm-balloon-spectrum" aria-hidden="true" data-on={onAir ? "true" : "false"}>
              {Array.from({ length: FM_SPECTRUM_BARS }, (_, index) => (
                <span
                  key={index}
                  className="radio-fm-balloon-spectrum-bar"
                  style={{ "--bar-i": index } as CSSProperties}
                />
              ))}
            </div>

            <div className="radio-fm-balloon-deck">
              <button type="button" className="radio-fm-balloon-deck-btn" onClick={() => handleSkip(-1)} aria-label="Faixa anterior">
                <span aria-hidden="true">⏮</span>
              </button>
              <button
                type="button"
                className="radio-fm-balloon-deck-btn radio-fm-balloon-deck-btn--primary"
                onClick={togglePause}
                aria-label={playing ? "Pausar rádio" : "Ligar rádio"}
              >
                {playing ? "Pausar" : "Ligar"}
              </button>
              <button type="button" className="radio-fm-balloon-deck-btn" onClick={() => handleSkip(1)} aria-label="Próxima faixa">
                <span aria-hidden="true">⏭</span>
              </button>
            </div>

            <footer className="radio-fm-balloon-footer">
              <p className="radio-fm-balloon-note">
                {catalogReady
                  ? `Aleatório · stream MP3 · ${platformLabel(clip.platform)}.`
                  : "Sintonizando catálogo…"}
              </p>
              <div className="radio-fm-balloon-links">
                {clip.sourceUrl ? (
                  <a href={clip.sourceUrl} target="_blank" rel="noreferrer">
                    Na plataforma
                  </a>
                ) : null}
                <Link to="/radio">Cabine completa</Link>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </aside>
  );
}
