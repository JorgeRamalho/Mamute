import { NavLink } from "react-router";
import { DigitalVisor } from "./DigitalVisor";

export function Hero() {
  return (
    <section className="hero">
      <div>
        <p className="kicker">Harako OS · visor do dancefloor</p>
        <h1>
          Mixer player para quem está
          <span> começando</span> e para quem já fecha a noite.
        </h1>
        <p className="lede">
          Um painel de cabine com CDJ e controladora virtuais, academia do iniciante
          à conclusão, rádio em modo clipe e um catálogo honesto de Beatport, Deezer,
          SoundCloud, YouTube e Spotify.
        </p>
        <div className="hero-actions">
          <NavLink className="btn btn-solid" to="/mixer">
            Entrar na cabine
          </NavLink>
          <NavLink className="btn" to="/academia">
            Abrir sala de aula
          </NavLink>
          <NavLink className="btn btn-magenta" to="/dj">
            Área do DJ
          </NavLink>
          <a className="btn" href="#assinatura">
            Ver assinaturas
          </a>
        </div>
      </div>
      <DigitalVisor />
    </section>
  );
}
