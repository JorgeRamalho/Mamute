import type { ReactNode } from "react";
import { Header } from "./Header";
import { StatusBar } from "./StatusBar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Header />
      <StatusBar />
      <main id="conteudo">{children}</main>
      <footer className="site-footer">
        <p>HARAKO · visor do dancefloor · mixer pedagógico, não substitui licenças oficiais.</p>
        <p>Beatport, Spotify, SoundCloud, Deezer e YouTube são marcas de seus respectivos donos.</p>
      </footer>
    </div>
  );
}
