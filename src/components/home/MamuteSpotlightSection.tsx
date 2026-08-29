import { NavLink } from "react-router";
import { MamutePortrait } from "./MamutePortrait";

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
          <h2 id="mamute-spotlight-title">O mamute que manda as melhores</h2>
          <p>
            A cara do Mamute DJPLAYER: fones no ouvido, visor de club e presença de palco — identidade
            refinada para quem leva mix, academia e rádio a sério.
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
          <MamutePortrait />
          <figcaption className="mamute-spotlight-caption">
            Mamute · portrait signature · cyan &amp; magenta
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
