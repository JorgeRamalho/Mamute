import { useCallback, useState, type CSSProperties } from "react";
import { Link, useLocation } from "react-router";
import { PLATFORMS } from "../../data/platforms";
import { RADIO_PLATFORM_ORDER } from "../../data/radio";
import { useRadioFmStation } from "../../lib/use-radio-fm";
import type { PlatformId } from "../../types/platform";
import { RadioYoutubeFrame } from "./RadioYoutubeFrame";

const platformById = new Map(PLATFORMS.map((platform) => [platform.id, platform]));

function platformLabel(id: PlatformId): string {
  if (id === "youtube") return "YouTube Music";
  return platformById.get(id)?.name ?? id;
}

export function RadioFmBalloon() {
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
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const hidden = location.pathname === "/radio";
  const onAir = started && !paused;
  const showPlayer = started && Boolean(clip?.youtubeId);
  const showMini = showPlayer && !open;

  const ligar = useCallback(() => {
    setOpen(true);
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

  if (hidden || !clip) return null;

  return (
    <aside
      className="radio-fm-balloon"
      data-open={open ? "true" : "false"}
      data-on-air={onAir ? "true" : "false"}
      data-mini={showMini ? "true" : "false"}
      style={{ "--platform-accent": accent } as CSSProperties}
      aria-label="Mamute FM"
    >
      {showPlayer ? (
        <div className="radio-fm-balloon-player-host">
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

      {open ? (
        <div className="radio-fm-balloon-shell">
          <div className="radio-fm-balloon-panel">
            <header className="radio-fm-balloon-head">
              <div className="radio-fm-balloon-head-copy">
                <p className="radio-fm-balloon-kicker">
                  {continuous ? "Rádio contínua" : "Mamute FM"}
                  {isPlaying && !paused ? <span className="radio-fm-balloon-live">NO AR</span> : null}
                </p>
                <h2 className="radio-fm-balloon-title">{clip.title}</h2>
                <p className="radio-fm-balloon-artist">{clip.artist}</p>
              </div>
              <span className="radio-fm-balloon-platform">{platformLabel(clip.platform)}</span>
            </header>

            <div className="radio-fm-balloon-dial" aria-label="Plataformas da programação">
              {RADIO_PLATFORM_ORDER.map((platformId) => (
                <span
                  key={platformId}
                  className={
                    clip.platform === platformId
                      ? "radio-fm-balloon-chip is-active"
                      : "radio-fm-balloon-chip"
                  }
                  style={
                    {
                      "--platform-accent": platformById.get(platformId)?.accent ?? accent,
                    } as CSSProperties
                  }
                >
                  {platformLabel(platformId)}
                </span>
              ))}
            </div>

            <div className="radio-fm-balloon-controls">
              <button type="button" onClick={() => handleSkip(-1)} aria-label="Faixa anterior">
                ◀
              </button>
              <button
                type="button"
                className="radio-fm-balloon-controls-primary"
                onClick={togglePause}
                aria-label={paused ? "Ligar rádio" : "Pausar rádio"}
              >
                {paused ? "Ligar" : "Pausar"}
              </button>
              <button type="button" onClick={() => handleSkip(1)} aria-label="Próxima faixa">
                ▶
              </button>
            </div>

            <p className="radio-fm-balloon-note">
              {catalogReady ? "Programação editorial · playback oficial no visor." : "Sintonizando…"}
            </p>

            <div className="radio-fm-balloon-links">
              {clip.sourceUrl ? (
                <a href={clip.sourceUrl} target="_blank" rel="noreferrer">
                  Na plataforma
                </a>
              ) : null}
              <Link to="/radio">Cabine completa</Link>
            </div>
          </div>
        </div>
      ) : showMini ? (
        <button
          type="button"
          className="radio-fm-balloon-mini"
          onClick={() => setOpen(true)}
          aria-label="Expandir Mamute FM"
        >
          <span className="radio-fm-balloon-mini-meta">
            <span className="radio-fm-balloon-mini-kicker">
              {isPlaying && !paused ? "NO AR" : "Mamute FM"}
            </span>
            <span className="radio-fm-balloon-mini-title">{clip.title}</span>
          </span>
        </button>
      ) : null}

      <div className="radio-fm-balloon-fab-row">
        {open ? (
          <button
            type="button"
            className="radio-fm-balloon-close"
            onClick={() => setOpen(false)}
            aria-label="Recolher Mamute FM"
          >
            Recolher
          </button>
        ) : null}
        <button
          type="button"
          className="radio-fm-balloon-fab"
          aria-expanded={open}
          aria-label={
            open
              ? "Mamute FM aberta"
              : started && !paused
                ? "Mamute FM no ar — abrir"
                : "Abrir Mamute FM"
          }
          onClick={() => {
            if (open) return;
            setOpen(true);
            if (!started) ligar();
          }}
        >
          <span className="radio-fm-balloon-fab-pip" aria-hidden="true" data-on={onAir ? "true" : "false"} />
          <span className="radio-fm-balloon-fab-label">FM</span>
        </button>
      </div>
    </aside>
  );
}
