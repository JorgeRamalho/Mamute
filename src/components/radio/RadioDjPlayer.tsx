import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { PLATFORMS } from "../../data/platforms";
import { RADIO_PLATFORM_ORDER } from "../../data/radio";
import { getFirstClipForPlatform } from "../../lib/radio-playlist";
import type { RadioClip, RadioSource } from "../../types/radio";
import type { PlatformId } from "../../types/platform";
import { RadioVirtualDisplay } from "./RadioVirtualDisplay";
import { RadioYoutubeFrame } from "./RadioYoutubeFrame";

type RadioDjPlayerProps = {
  clips: RadioClip[];
  source: RadioSource;
  catalogReady: boolean;
  accent: string;
  playlistIds: string[];
  playlistOnly: boolean;
  onPlaylistOnlyChange: (value: boolean) => void;
  onCatalogUpdated: () => void;
  onTogglePlaylistClip: (clipId: string) => void;
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
  accent,
  playlistIds,
  playlistOnly,
  onPlaylistOnlyChange,
  onCatalogUpdated,
  onTogglePlaylistClip,
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
  const [isPlayingFull, setIsPlayingFull] = useState(false);

  const goRelative = (delta: number) => {
    if (activeIndex < 0 || clips.length === 0) return;
    const nextIndex = (activeIndex + delta + clips.length) % clips.length;
    const next = clips[nextIndex];
    if (next) onSelectClip(next, { autoplay: true });
  };

  const platformTracks = useMemo(
    () =>
      RADIO_PLATFORM_ORDER.map((platformId) => {
        const tracks = clips.filter((clip) => clip.platform === platformId);
        const featured = getFirstClipForPlatform(clips, platformId) ?? tracks[0];
        return { platformId, featured };
      }),
    [clips],
  );

  const handlePlaybackEnded = useCallback(() => {
    if (!continuous) return;
    onTrackEnded();
  }, [continuous, onTrackEnded]);

  useEffect(() => {
    setIsPlayingFull(false);
  }, [activeClip?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeClip?.previewUrl || source.kind !== "clip") return;
    if (activeClip.youtubeId) return;
    if (!autoplay) return;

    void audio.play().finally(() => {
      onAutoplayConsumed();
    });
  }, [activeClip?.id, activeClip?.previewUrl, activeClip?.youtubeId, autoplay, onAutoplayConsumed, source.kind]);

  if (source.kind === "upload") {
    return (
      <section className="radio-dj-player card radio-dj-player--plain radio-dj-player--upload" aria-label="Loop MP3 ativo">
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
            Voltar à rádio integrada
          </button>
        ) : null}
      </section>
    );
  }

  if (clips.length === 0) {
    return (
      <section className="radio-dj-player card radio-dj-player--plain radio-dj-player--unified" aria-label="Mamute DJ · rádio integrada">
        <header className="radio-dj-head radio-dj-head--unified">
          <div>
            <p className="kicker">Mamute DJ · rádio integrada</p>
            <h2 className="radio-dj-title">Cabine Mamute FM</h2>
          </div>
        </header>
        <RadioVirtualDisplay
          accent={accent}
          platformLabel="Mamute FM"
          isPlaying={false}
          catalogReady={catalogReady}
          continuous
          playbackLabel="Aguardando playlist — carregue DJ iniciante ou adicione faixas."
          playlistCount={playlistIds.length}
          playlistOnly={playlistOnly}
          onPlaylistOnlyChange={onPlaylistOnlyChange}
          onCatalogUpdated={onCatalogUpdated}
        />
      </section>
    );
  }

  const active = activeClip!;
  const inPlaylist = playlistIds.includes(active.id);
  const hasYoutube = Boolean(active.youtubeId);
  const hasPreview = Boolean(active.previewUrl);

  const handleYoutubeUnavailable = () => {
    if (continuous) {
      onTrackEnded();
      return;
    }
    if (hasPreview) {
      void audioRef.current?.play().catch(() => undefined);
    }
  };

  const playbackLabel = !catalogReady
    ? "Sintonizando catálogo…"
    : hasYoutube
      ? isPlayingFull
        ? "Tocando faixa completa · rádio Mamute FM"
        : "Iniciando faixa completa…"
      : hasPreview
        ? "Sem clipe completo — usando áudio disponível"
        : "Sem áudio para esta faixa — pulando na fila";

  return (
    <section
      className="radio-dj-player card radio-dj-player--plain radio-dj-player--unified"
      aria-label="Mamute DJ · rádio integrada"
      data-continuous={continuous ? "on" : "off"}
      data-catalog-ready={catalogReady ? "true" : "false"}
    >
      <header className="radio-dj-head radio-dj-head--unified">
        <div>
          <p className="kicker">Mamute DJ · rádio integrada</p>
          <h2 className="radio-dj-title">{active.title}</h2>
          <p className="radio-dj-artist">{active.artist}</p>
        </div>
        <div className="radio-dj-head-actions">
          <button
            type="button"
            className={inPlaylist ? "radio-dj-playlist-btn is-on" : "radio-dj-playlist-btn"}
            aria-pressed={inPlaylist}
            onClick={() => onTogglePlaylistClip(active.id)}
          >
            {inPlaylist ? "Na playlist" : "+ Playlist"}
          </button>
          <span
            className="radio-dj-platform"
            style={{ "--platform-accent": platformById.get(active.platform)?.accent } as CSSProperties}
          >
            {platformLabel(active.platform)}
          </span>
          <span className="radio-dj-live-badge" role="status">
            NO AR
          </span>
        </div>
      </header>

      <RadioVirtualDisplay
        clip={active}
        accent={accent}
        platformLabel={platformLabel(active.platform)}
        isPlaying={isPlayingFull || (hasPreview && !hasYoutube)}
        catalogReady={catalogReady}
        continuous={continuous}
        playbackLabel={playbackLabel}
        playlistCount={playlistIds.length}
        playlistOnly={playlistOnly}
        onPlaylistOnlyChange={onPlaylistOnlyChange}
        onCatalogUpdated={onCatalogUpdated}
      />

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

      <div className="radio-dj-music-player radio-dj-music-player--engine">
        {!catalogReady ? null : hasYoutube ? (
          <RadioYoutubeFrame
            videoId={active.youtubeId}
            title={`${active.artist} — ${active.title}`}
            autoplay={autoplay}
            unavailableAfterMs={12_000}
            onEnded={handlePlaybackEnded}
            onUnavailable={handleYoutubeUnavailable}
            onPlaying={() => setIsPlayingFull(true)}
            onReady={autoplay ? onAutoplayConsumed : undefined}
            className="radio-dj-youtube-engine"
          />
        ) : hasPreview ? (
          <audio
            ref={audioRef}
            src={active.previewUrl}
            className="radio-dj-audio radio-dj-audio--hidden"
            onPlay={() => setIsPlayingFull(true)}
            onEnded={handlePlaybackEnded}
          >
            Seu browser não suporta áudio HTML5.
          </audio>
        ) : (
          <div className="radio-dj-music-empty">
            <button type="button" className="radio-dj-back" onClick={() => goRelative(1)}>
              Próxima faixa
            </button>
          </div>
        )}
      </div>

      <p className="radio-dj-caption">
        {continuous
          ? "Rádio contínua — cada faixa toca por inteiro e a programação avança sozinha entre Spotify, SoundCloud, YouTube Music, Beatport e Deezer."
          : active.caption}
      </p>

      <div className="radio-dj-queue radio-dj-queue--featured" aria-label="Destaques por plataforma">
        {platformTracks.map(({ platformId, featured }) => (
          <div key={platformId} className="radio-dj-queue-group">
            <p
              className="radio-dj-queue-label"
              style={{ "--platform-accent": platformById.get(platformId)?.accent } as CSSProperties}
            >
              {platformLabel(platformId)}
            </p>
            <ul className="radio-dj-queue-list">
              {featured ? (
                <li>
                  <button
                    type="button"
                    className={
                      featured.id === active.id
                        ? "radio-dj-queue-item is-active"
                        : playlistIds.includes(featured.id)
                          ? "radio-dj-queue-item is-saved"
                          : "radio-dj-queue-item"
                    }
                    aria-pressed={featured.id === active.id}
                    onClick={() => onSelectClip(featured, { autoplay: true })}
                  >
                    <strong>{featured.title}</strong>
                    <span>{featured.artist}</span>
                  </button>
                </li>
              ) : (
                <li className="radio-dj-queue-empty" aria-hidden="true">
                  <span>—</span>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
