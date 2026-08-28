import { useState } from "react";
import { RADIO_CLIPS } from "../../data/radio";

export function RadioStudio() {
  const [active, setActive] = useState(RADIO_CLIPS[0]);
  if (!active) return null;

  return (
    <div className="radio-layout">
      <article className="card">
        <p className="kicker">Mamute FM · modo clipe</p>
        <h2>{active.title}</h2>
        <p>
          {active.artist} · {active.genre} · {active.bpm} BPM · {active.key} · {active.duration}
        </p>
        <div className="video-frame">
          <iframe
            title={`${active.artist} — ${active.title}`}
            src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p>{active.caption}</p>
      </article>
      <aside className="clip-list" aria-label="Fila da rádio">
        {RADIO_CLIPS.map((clip) => (
          <button
            key={clip.id}
            type="button"
            className={clip.id === active.id ? "active" : ""}
            onClick={() => setActive(clip)}
          >
            <strong>{clip.artist}</strong>
            <span> — {clip.title}</span>
            <p>{clip.bpm} BPM · {clip.genre}</p>
          </button>
        ))}
      </aside>
    </div>
  );
}
