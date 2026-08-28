import { useCallback, useState, type CSSProperties, type KeyboardEvent } from "react";
import { NavLink } from "react-router";
import { PLATFORMS } from "../../data/platforms";
import type { PlatformId, PlatformIntel } from "../../types/platform";

function platformById(id: PlatformId): PlatformIntel {
  return PLATFORMS.find((platform) => platform.id === id) ?? PLATFORMS[0]!;
}

export function VisorTechSection() {
  const [activeId, setActiveId] = useState<PlatformId>("mamute");
  const active = platformById(activeId);

  const onChipKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = (index + delta + PLATFORMS.length) % PLATFORMS.length;
      setActiveId(PLATFORMS[next]!.id);
    },
    [],
  );

  return (
    <section
      className="home-showcase visor-tech"
      id="tecnologias"
      aria-labelledby="visor-tech-title"
    >
      <div className="home-showcase-head">
        <p className="kicker">Integrações · visor HUD</p>
        <h2 id="visor-tech-title">Tecnologias no visor</h2>
        <p>
          Mamute como player nativo da cabine, mais integrações reais — cada uma com limites
          publicados pelas próprias plataformas.
        </p>
      </div>

      <div
        className="visor-tech-orbit"
        role="tablist"
        aria-label="Plataformas no visor"
      >
        {PLATFORMS.map((platform, index) => {
          const selected = platform.id === activeId;
          return (
            <button
              key={platform.id}
              type="button"
              role="tab"
              id={`visor-tab-${platform.id}`}
              aria-selected={selected}
              aria-controls="visor-tech-panel"
              tabIndex={selected ? 0 : -1}
              className={selected ? "visor-tech-chip is-active" : "visor-tech-chip"}
              style={{ "--chip-accent": platform.accent } as CSSProperties}
              onClick={() => setActiveId(platform.id)}
              onKeyDown={(event) => onChipKeyDown(event, index)}
            >
              <span className="visor-tech-chip-dot" aria-hidden="true" />
              {platform.name}
            </button>
          );
        })}
      </div>

      <article
        className="card visor-tech-panel"
        id="visor-tech-panel"
        role="tabpanel"
        aria-labelledby={`visor-tab-${activeId}`}
        data-stage="10"
        style={{ "--panel-accent": active.accent } as CSSProperties}
      >
        <div className="visor-tech-panel-glow" aria-hidden="true" />
        <header className="visor-tech-panel-head">
          <p className="kicker">{active.role}</p>
          <h3>{active.name}</h3>
        </header>
        <p className="visor-tech-summary">{active.summary}</p>

        <div className="visor-tech-columns">
          <div>
            <h4>O que entra</h4>
            <ul>
              {active.capabilities.slice(0, 3).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Limites</h4>
            <ul>
              {active.limits.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="visor-tech-footer">
          <NavLink className="btn" to={`/catalogo#${active.id}`}>
            Ver ficha completa
          </NavLink>
          {active.id === "mamute" ? (
            <NavLink className="btn btn-solid" to="/mixer">
              Abrir player nativo
            </NavLink>
          ) : null}
        </div>
      </article>

      <div className="visor-tech-grid" aria-label="Resumo das plataformas">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            type="button"
            className={
              platform.id === activeId ? "visor-tech-tile is-active" : "visor-tech-tile"
            }
            style={{ "--tile-accent": platform.accent } as CSSProperties}
            aria-pressed={platform.id === activeId}
            onClick={() => setActiveId(platform.id)}
          >
            <span className="visor-tech-tile-dot" aria-hidden="true" />
            <strong>{platform.name}</strong>
            <span>{platform.role}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
