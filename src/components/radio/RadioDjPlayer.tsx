import { useMemo, type CSSProperties } from "react";
import { PLATFORMS } from "../../data/platforms";
import { RADIO_PLATFORM_ORDER } from "../../data/radio";
import type { RadioClip, RadioSource } from "../../types/radio";
import type { PlatformId } from "../../types/platform";

type RadioDjPlayerProps = {
  clips: RadioClip[];
  source: RadioSource;
  onSelectClip: (clip: RadioClip) => void;
  onToggleLoop: () => void;
};

const platformById = new Map(PLATFORMS.map((platform) => [platform.id, platform]));

function platformLabel(id: PlatformId): string {
  if (id === "youtube") return "YouTube Music";
  return platformById.get(id)?.name ?? id;
}

function youtubeSrc(id: string, loop: boolean): string {
  const base = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  return loop ? `${base}&loop=1&playlist=${id}` : base;
}

export function RadioDjPlayer({ clips, source, onSelectClip, onToggleLoop }: RadioDjPlayerProps) {
  const activeClip = source.kind === "clip" ? source.clip : null;
  const clipLoop = source.kind === "clip" && source.loop;
  const activeIndex = activeClip ? clips.findIndex((clip) => clip.id === activeClip.id) : -1;

  const goRelative = (delta: number) => {
    if (activeIndex < 0 || clips.length === 0) return;
    const nextIndex = (activeIndex + delta + clips.length) % clips.length;
    const next = clips[nextIndex];
    if (next) onSelectClip(next);
  };

  const platformTracks = useMemo(
    () =>
      RADIO_PLATFORM_ORDER.map((platformId) => ({
        platformId,
        tracks: clips.filter((clip) => clip.platform === platformId),
      })),
    [clips],
  );

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
          <button type="button" className="radio-dj-back" onClick={() => onSelectClip(clips[0]!)}>
            Voltar às plataformas integradas
          </button>
        ) : null}
      </section>
    );
  }

  const active = activeClip!;
  const hasVideo = Boolean(active.youtubeId);
  const fallbackClip = clips.find((clip) => clip.id !== active.id && clip.youtubeId);

  return (
    <section className="radio-dj-player card" aria-label="Player DJ Mamute FM">
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
          const firstTrack = clips.find((clip) => clip.platform === platformId);
          return (
            <button
              key={platformId}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? "radio-dj-platform-chip is-active" : "radio-dj-platform-chip"}
              style={{ "--platform-accent": platform?.accent } as CSSProperties}
              onClick={() => firstTrack && onSelectClip(firstTrack)}
            >
              {platformLabel(platformId)}
            </button>
          );
        })}
      </div>

      <div className="radio-dj-deck">
        <div className="radio-dj-transport">
          <button type="button" className="radio-dj-btn" onClick={() => goRelative(-1)} aria-label="Faixa anterior">
            ◀
          </button>
          <button
            type="button"
            className={`radio-dj-btn radio-dj-btn--loop${clipLoop ? " is-on" : ""}`}
            aria-pressed={clipLoop}
            onClick={onToggleLoop}
            aria-label="Alternar loop do clipe"
            disabled={!hasVideo}
          >
            ⟳
          </button>
          <span className="radio-dj-live-dot" aria-hidden="true" />
          <button type="button" className="radio-dj-btn" onClick={() => goRelative(1)} aria-label="Próxima faixa">
            ▶
          </button>
        </div>

        <div className="video-frame radio-dj-screen">
          {hasVideo ? (
            <iframe
              key={`${active.youtubeId}-${clipLoop ? "loop" : "once"}`}
              title={`${active.artist} — ${active.title}`}
              src={youtubeSrc(active.youtubeId, clipLoop)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : active.previewUrl ? (
            <div className="radio-dj-preview">
              <p className="radio-dj-preview-label">Preview 30s · Deezer</p>
              <audio controls src={active.previewUrl} className="radio-dj-audio">
                Seu browser não suporta áudio HTML5.
              </audio>
            </div>
          ) : (
            <div className="radio-dj-preview radio-dj-preview--empty">
              <p>Sem clipe mapeado para esta faixa importada.</p>
              {fallbackClip ? (
                <button type="button" className="radio-dj-back" onClick={() => onSelectClip(fallbackClip)}>
                  Tocar outra faixa
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <p className="radio-dj-caption">{active.caption}</p>

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
                      onClick={() => onSelectClip(clip)}
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
