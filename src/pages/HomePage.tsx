import { Hero } from "../components/hero/Hero";
import { PLATFORMS } from "../data/platforms";
import { NavLink } from "react-router";

export function HomePage() {
  return (
    <div className="page">
      <Hero />
      <section className="section-title">
        <h2>Três camadas da cabine Harako</h2>
        <p>
          Interface de player moderno, motor pedagógico de CDJ e um catálogo que respeita
          cada plataforma em vez de fingir um LINK que ainda não existe.
        </p>
      </section>
      <div className="grid-3">
        <article className="card">
          <h3>Simulador CDJ / controladora</h3>
          <p>
            Dois decks, jog, pitch, EQ de 3 bandas, waveform e crossfader com curva equal-power.
            O áudio nasce no Web Audio API — loops sintéticos para treinar sem infringir termos.
          </p>
          <NavLink className="btn" to="/mixer">Abrir mixer</NavLink>
        </article>
        <article className="card">
          <h3>Academia iniciante → conclusão</h3>
          <p>
            Aulas em vídeo, dicas de cabine e exercícios cronometrados. O progresso fica no
            visor até você fechar o checklist da booth.
          </p>
          <NavLink className="btn" to="/academia">Entrar na sala</NavLink>
        </article>
        <article className="card">
          <h3>Rádio em modo clipe</h3>
          <p>
            Tracks passam como videoclipes no visor widescreen, com BPM, tom e fila — o hábito
            de ler metadados antes de mixar.
          </p>
          <NavLink className="btn" to="/radio">Ouvir Harako FM</NavLink>
        </article>
      </div>
      <section className="section-title">
        <h2>Tecnologias no visor</h2>
        <p>Cada chip do hero é uma integração real, com limites publicados pelas próprias plataformas.</p>
      </section>
      <div className="grid-3">
        {PLATFORMS.map((platform) => (
          <article className="card" key={platform.id}>
            <p className="kicker">{platform.role}</p>
            <h3>{platform.name}</h3>
            <p>{platform.summary}</p>
            <NavLink className="btn" to={`/catalogo#${platform.id}`}>Ver ficha</NavLink>
          </article>
        ))}
      </div>
    </div>
  );
}
