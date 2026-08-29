import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { PLATFORMS } from "../../data/platforms";
import { RADIO_PLATFORM_ORDER } from "../../data/radio";
import { getFirstClipForPlatform } from "../../lib/radio-playlist";
import type { RadioClip, RadioSource } from "../../types/radio";
import type { PlatformId } from "../../types/platform";
import { RadioYoutubeFrame } from "./RadioYoutubeFrame";

type RadioDjPlayerProps = {
  clips: RadioClip[];
  source: RadioSource;
  catalogReady: boolean;
  onSelectClip: (clip: RadioClip, options?: { autoplay?: boolean }) => void;
  onToggleContinuous: () => void;
  onTrackEnded: () => void;
  onAutoplayConsumed: () => void;
};

const platformById = new Map(PLATFORMS.map((platform) => [platform.id, platform]));

function platformLabel(id: PlatformId): string {
  if (id === "youtube") return "YouTube Music";
  return platformById.get(id)?.name ?? id;
}

export function RadioDjPlayer({
  clips,
  source,
  catalogReady,
  onSelectClip,
  onToggleContinuous,
  onTrackEnded,
  onAutoplayConsumed,
}: RadioDjPlayerProps) {
  const activeClip = source.kind === "clip" ? source.clip : null;
  const continuous = source.kind === "clip" && source.continuous;
  const autoplay = source.kind === "clip" && source.autoplay;
  const activeIndex = activeClip ? clips.findIndex((clip) => clip.id === activeClip.id) : -1;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [usePreviewFallback, setUsePreviewFallback] = useState(false);

  const goRelative = (delta: number) => {
    if (activeIndex < 0 || clips.length === 0) return;
    const nextIndex = (activeIndex + delta + clips.length) % clips.length;
    const next = clips[nextIndex];
    if (next) onSelectClip(next, { autoplay: true });
  };

  const platformTracks = useMemo(
    () =>
      RADIO_PLATFORM_ORDER.map((platformId) => ({
        platformId,
        tracks: clips.filter((clip) => clip.platform === platformId),
      })),
    [clips],
  );

  const handlePlaybackEnded = useCallback(() => {
    if (!continuous) return;
    onTrackEnded();
  }, [continuous, onTrackEnded]);

  useEffect(() => {
    setUsePreviewFallback(false);
  }, [activeClip?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeClip?.previewUrl || source.kind !== "clip") return;
    if (!usePreviewFallback && activeClip.youtubeId) return;
    if (!autoplay) return;

    void audio.play().finally(() => {
      onAutoplayConsumed();
    });
  }, [
    activeClip?.id,
    activeClip?.previewUrl,
    activeClip?.youtubeId,
    autoplay,
    onAutoplayConsumed,
    source.kind,
    usePreviewFallback,
  ]);

  if (source.kind === "upload") {
    return (
      <section className="radio-dj-player card radio-dj-player--upload" aria-label="Loop MP3 ativo">
        <header className="radio-dj-head">
          <div>
            <p className="kicker">Mamute DJ · loop local</p>
            <h2 className="radio-dj-title">{source.upload.title}</h2>
            <p className="radio-dj-artist">{source.upload.artist}</p>
          </div>
          <span className="radio-dj-platform radio-dj-platform--upload">MP3 · cabine</span>
        </header>
        <p className="radio-dj-caption">
          Faixa local em loop via Web Audio — use o painel abaixo para ajustar região e enviar novos MP3.
        </p>
        {clips[0] ? (
          <button type="button" className="radio-dj-back" onClick={() => onSelectClip(clips[0]!, { autoplay: true })}>
            Voltar às plataformas integradas
          </button>
        ) : null}
      </section>
    );
  }

  const active = activeClip!;
  const hasYoutube = Boolean(active.youtubeId);
  const hasPreview = Boolean(active.previewUrl);
  const showYoutube = hasYoutube && !usePreviewFallback;
  const showPreview = hasPreview && (usePreviewFallback || !hasYoutube);

  const handleYoutubeUnavailable = () => {
    if (hasPreview) {
      setUsePreviewFallback(true);
      if (continuous || autoplay) {
        void audioRef.current?.play().catch(() => undefined);
      }
      return;
    }
    if (continuous) onTrackEnded();
  };

  return (
    <section
      className="radio-dj-player card radio-dj-player--plain"
      aria-label="Player DJ Mamute FM"
      data-continuous={continuous ? "on" : "off"}
      data-catalog-ready={catalogReady ? "true" : "false"}
    >
      <header className="radio-dj-head">
        <div>
          <p className="kicker">Mamute DJ · rádio integrada</p>
          <h2 className="radio-dj-title">{active.title}</h2>
          <p className="radio-dj-artist">{active.artist}</p>
        </div>
        <span
          className="radio-dj-platform"
          style={{ "--platform-accent": platformById.get(active.platform)?.accent } as CSSProperties}
        >
          {platformLabel(active.platform)}
        </span>
      </header>

      {active.sourceUrl ? (
        <a className="radio-dj-source" href={active.sourceUrl} target="_blank" rel="noreferrer">
          Abrir na plataforma
        </a>
      ) : null}

      <div className="radio-dj-platforms" role="tablist" aria-label="Plataformas integradas">
        {RADIO_PLATFORM_ORDER.map((platformId) => {
          const platform = platformById.get(platformId);
          const isActive = active.platform === platformId;
          const firstTrack = getFirstClipForPlatform(clips, platformId);
          return (
            <button
              key={platformId}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? "radio-dj-platform-chip is-active" : "radio-dj-platform-chip"}
              style={{ "--platform-accent": platform?.accent } as CSSProperties}
              onClick={() => firstTrack && onSelectClip(firstTrack, { autoplay: true })}
            >
              {platformLabel(platformId)}
            </button>
          );
        })}
      </div>

      <div className="radio-dj-controls">
        <button type="button" className="radio-dj-btn" onClick={() => goRelative(-1)} aria-label="Faixa anterior">
          ◀
        </button>
        <button
          type="button"
          className={`radio-dj-btn radio-dj-btn--loop${continuous ? " is-on" : ""}`}
          aria-pressed={continuous}
          onClick={onToggleContinuous}
          aria-label="Alternar rádio contínua"
          title={continuous ? "Rádio contínua ligada" : "Rádio contínua desligada"}
        >
          ⟳
        </button>
        <button type="button" className="radio-dj-btn" onClick={() => goRelative(1)} aria-label="Próxima faixa">
          ▶
        </button>
      </div>

      <div className="radio-dj-music-player">
        {!catalogReady ? (
          <p className="radio-dj-music-status">Carregando catálogo das plataformas…</p>
        ) : showYoutube ? (
          <>
            <RadioYoutubeFrame
              videoId={active.youtubeId}
              title={`${active.artist} — ${active.title}`}
              autoplay={autoplay}
              unavailableAfterMs={hasPreview ? 4_000 : 9_000}
              onEnded={handlePlaybackEnded}
              onUnavailable={handleYoutubeUnavailable}
              onReady={autoplay ? onAutoplayConsumed : undefined}
              className="radio-dj-youtube-audio"
            />
            {hasPreview ? (
              <audio
                ref={audioRef}
                className="radio-dj-audio radio-dj-audio--hidden"
                src={active.previewUrl}
                onEnded={handlePlaybackEnded}
                preload="auto"
              />
            ) : null}
            <p className="radio-dj-music-status">Reprodução automática · próxima faixa na fila ao terminar.</p>
          </>
        ) : showPreview ? (
          <>
            <audio
              ref={audioRef}
              controls
              src={active.previewUrl}
              className="radio-dj-audio"
              onEnded={handlePlaybackEnded}
            >
              Seu browser não suporta áudio HTML5.
            </audio>
            <p className="radio-dj-music-status">
              {usePreviewFallback
                ? "Áudio Deezer · clipe indisponível no YouTube."
                : "Áudio Deezer · preview de 30s."}
            </p>
          </>
        ) : (
          <div className="radio-dj-music-empty">
            <p>Sem áudio disponível para esta faixa.</p>
            <button type="button" className="radio-dj-back" onClick={() => goRelative(1)}>
              Próxima faixa
            </button>
          </div>
        )}
      </div>

      <p className="radio-dj-caption">
        {continuous
          ? "Programação contínua ativa — ao terminar, a próxima faixa entra automaticamente."
          : active.caption}
      </p>

      <div className="radio-dj-queue" aria-label="Fila por plataforma">
        {platformTracks.map(({ platformId, tracks }) =>
          tracks.length === 0 ? null : (
            <div key={platformId} className="radio-dj-queue-group">
              <p
                className="radio-dj-queue-label"
                style={{ "--platform-accent": platformById.get(platformId)?.accent } as CSSProperties}
              >
                {platformLabel(platformId)}
              </p>
              <ul className="radio-dj-queue-list">
                {tracks.map((clip) => (
                  <li key={clip.id}>
                    <button
                      type="button"
                      className={clip.id === active.id ? "radio-dj-queue-item is-active" : "radio-dj-queue-item"}
                      aria-pressed={clip.id === active.id}
                      onClick={() => onSelectClip(clip, { autoplay: true })}
                    >
                      <strong>{clip.title}</strong>
                      <span>{clip.artist}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
