import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { AppShell } from "../components/layout/AppShell";
import { appBasename } from "../lib/base";
import { AcademyPage } from "../pages/AcademyPage";
import { CatalogPage } from "../pages/CatalogPage";
import { DjPage } from "../pages/DjPage";
import { HomePage } from "../pages/HomePage";
import { MixerPage } from "../pages/MixerPage";
import { RadioPage } from "../pages/RadioPage";

const TITLES: Record<string, string> = {
  "/": "Mamute DJPLAYER — Mixer player para DJs iniciantes e avançados",
  "/mixer": "Mixer CDJ e controladora — Mamute DJPLAYER",
  "/academia": "Academia DJ · iniciante ao avançado — Mamute DJPLAYER",
  "/radio": "Mamute FM · rádio em modo clipe",
  "/catalogo": "Catálogo Beatport, Deezer, SoundCloud, YouTube e Spotify — Mamute DJPLAYER",
  "/dj": "Área do DJ · cadastro de cabine — Mamute DJPLAYER",
};

function RouteMeta() {
  const location = useLocation();

  useEffect(() => {
    document.title = TITLES[location.pathname] ?? "Mamute DJPLAYER";
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter basename={appBasename()}>
      <RouteMeta />
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/mixer" element={<MixerPage />} />
          <Route path="/academia" element={<AcademyPage />} />
          <Route path="/radio" element={<RadioPage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/dj" element={<DjPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
