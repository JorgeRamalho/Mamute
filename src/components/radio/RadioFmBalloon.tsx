import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation } from "react-router";
import { PLATFORMS } from "../../data/platforms";
import { RADIO_PLATFORM_STATION_TYPES } from "../../data/radio";
import { useRadioFmStation } from "../../lib/use-radio-fm";
import type { PlatformId } from "../../types/platform";
import { RadioYoutubeFrame } from "./RadioYoutubeFrame";

const platformById = new Map(PLATFORMS.map((platform) => [platform.id, platform]));
const FM_SPECTRUM_BARS = 10;

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
  const height = Math.ceil(rect.height);
  const width = Math.ceil(rect.width);
  const gapPx = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--radio-fm-gap"),
  );
  const gap = Number.isFinite(gapPx) ? gapPx : 12;
  const isNarrow = window.matchMedia("(max-width: 720px)").matches;
  const reserveW = isNarrow ? 0 : width + gap;
  const mobileBuffer = isNarrow ? 28 : 0;
  document.documentElement.style.setProperty("--radio-fm-reserve-h", `${height + gap + mobileBuffer}px`);
  document.documentElement.style.setProperty("--radio-fm-reserve-w", `${reserveW}px`);
}

export function RadioFmBalloon() {
  const rootRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const {
    clip,
    catalogReady,
    continuous,
    autoplay,
    accent,
    skip,
    handleTrackEnded,
    consumeAutoplay,
    start,
  } = useRadioFmStation();
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const hidden = location.pathname === "/radio";
  const onAir = started && !paused && isPlaying;
  const showPlayer = started && Boolean(clip?.youtubeId);

  const ligar = useCallback(() => {
    setStarted(true);
    setPaused(false);
    start();
  }, [start]);

  const togglePause = useCallback(() => {
    if (!started) {
      ligar();
      return;
    }
    if (!paused) setIsPlaying(false);
    setPaused((current) => !current);
  }, [ligar, paused, started]);

  const handleSkip = useCallback(
    (delta: 1 | -1) => {
      setPaused(false);
      setStarted(true);
      setIsPlaying(false);
      skip(delta);
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
  }, [hidden, clip, showPlayer, started]);

  if (hidden || !clip) return null;

  return (
    <aside
      ref={rootRef}
      className="radio-fm-balloon"
      data-open="true"
      data-on-air={onAir ? "true" : "false"}
      data-mini="false"
      style={{ "--platform-accent": accent } as CSSProperties}
      aria-label="Mamute FM"
    >
      <div className="radio-fm-balloon-chassis">
        {showPlayer ? (
          <div className="radio-fm-balloon-player-host">
            <span className="radio-fm-balloon-viewport-label">VISOR · STREAM</span>
            <RadioYoutubeFrame
              videoId={clip.youtubeId}
              title={`${clip.artist} — ${clip.title}`}
              autoplay={autoplay || !paused}
              paused={paused}
              unavailableAfterMs={12_000}
              onEnded={handleTrackEnded}
              onUnavailable={handleTrackEnded}
              onPlaying={() => {
                setIsPlaying(true);
                setPaused(false);
              }}
              onReady={autoplay ? consumeAutoplay : undefined}
              className="radio-fm-balloon-frame"
            />
          </div>
        ) : null}

        <div className="radio-fm-balloon-shell">
          <div className="radio-fm-balloon-panel">
            <header className="radio-fm-balloon-head">
              <div className="radio-fm-balloon-brand">
                <span className="radio-fm-balloon-brand-mark">MAMUTE</span>
                <span className="radio-fm-balloon-brand-fm">FM</span>
              </div>
              <div className="radio-fm-balloon-head-copy">
                <p className="radio-fm-balloon-kicker">
                  {continuous ? "Rádio contínua" : "Programação editorial"}
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
                aria-label={paused ? "Ligar rádio" : "Pausar rádio"}
              >
                {paused ? "Ligar" : "Pausar"}
              </button>
              <button type="button" className="radio-fm-balloon-deck-btn" onClick={() => handleSkip(1)} aria-label="Próxima faixa">
                <span aria-hidden="true">⏭</span>
              </button>
            </div>

            <footer className="radio-fm-balloon-footer">
              <p className="radio-fm-balloon-note">
                {catalogReady
                  ? `Flow contínuo · ${platformLabel(clip.platform)} · playback oficial no visor.`
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
