import { NavLink } from "react-router";

const MASCOT_SRC = "/mamute-mascot.png";
const MASCOT_WIDTH = 256;
const MASCOT_HEIGHT = 256;

export function MamuteSpotlightSection() {
  return (
    <section
      className="mamute-spotlight"
      id="mascote"
      aria-labelledby="mamute-spotlight-title"
    >
      <div className="mamute-spotlight-ambient" aria-hidden="true">
        <span className="mamute-spotlight-orb mamute-spotlight-orb--cyan" />
        <span className="mamute-spotlight-orb mamute-spotlight-orb--magenta" />
      </div>

      <div className="mamute-spotlight-inner">
        <div className="mamute-spotlight-copy">
          <p className="kicker">Mascote · identidade Mamute</p>
          <h2 id="mamute-spotlight-title">O mamute que manda no visor</h2>
          <p>
            Fones no ouvido, pista refletida no visor e neon de club na pelagem — a cara do
            Mamute DJPLAYER: treino sério, estética de cabine e zero pose vazia.
          </p>
          <ul className="mamute-spotlight-tags" aria-label="Destaques da identidade">
            <li>CDJ virtual</li>
            <li>Academia guiada</li>
            <li>Rádio em clipe</li>
            <li>Catálogo honesto</li>
          </ul>
          <div className="mamute-spotlight-actions">
            <NavLink className="btn btn-solid" to="/mixer">
              Ver a cabine
            </NavLink>
            <NavLink className="btn btn-magenta" to="/academia">
              Começar aula
            </NavLink>
          </div>
        </div>

        <figure className="mamute-spotlight-art">
          <div className="mamute-spotlight-stage">
            <span className="mamute-spotlight-ring mamute-spotlight-ring--outer" aria-hidden="true" />
            <span className="mamute-spotlight-ring mamute-spotlight-ring--inner" aria-hidden="true" />
            <span className="mamute-spotlight-halo" aria-hidden="true" />
            <div className="mamute-spotlight-frame">
              <img
                src={MASCOT_SRC}
                alt="Mamute DJ com fones e óculos refletindo a pista iluminada por luzes de clube"
                width={MASCOT_WIDTH}
                height={MASCOT_HEIGHT}
                decoding="async"
                fetchPriority="high"
                draggable={false}
              />
            </div>
          </div>
          <figcaption className="mamute-spotlight-caption">
            Mamute DJ · visor cyan &amp; magenta
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
