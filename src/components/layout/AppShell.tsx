import { useEffect, type ReactNode } from "react";
import { bindStageLight } from "../../lib/stage-light";
import { Header } from "./Header";
import { StatusBar } from "./StatusBar";

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
      </footer>
    </div>
  );
}
