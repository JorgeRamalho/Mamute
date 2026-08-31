import { useEffect, type ReactNode } from "react";
import { Link } from "react-router";
import { bindStageLight } from "../../lib/stage-light";
import { CookieConsent } from "./CookieConsent";
import { Header } from "./Header";
import { StatusBar } from "./StatusBar";
import { RadioFmBalloon } from "../radio/RadioFmBalloon";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  useEffect(() => bindStageLight(), []);

  return (
    <div className="app-shell">
      <div className="stage-haze" aria-hidden="true">
        <span className="stage-orb stage-orb-cyan" />
        <span className="stage-orb stage-orb-magenta" />
        <span className="stage-orb stage-orb-violet" />
      </div>
      <div className="stage-grain" aria-hidden="true" />
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Header />
      <StatusBar />
      <main id="conteudo">{children}</main>
      <footer className="site-footer">
        <p>MAMUTE DJPLAYER · visor do dancefloor · mixer pedagógico, não substitui licenças oficiais.</p>
        <p>Beatport, Spotify, SoundCloud, Deezer e YouTube são marcas de seus respectivos donos.</p>
        <nav className="site-footer-legal" aria-label="Legal">
          <Link to="/politicas#privacidade">Política de privacidade</Link>
          <Link to="/politicas#cookies">Política de cookies</Link>
        </nav>
      </footer>
      <CookieConsent />
      <RadioFmBalloon />
    </div>
  );
}
