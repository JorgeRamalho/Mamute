import { CatalogHub } from "../components/catalog/CatalogHub";

export function CatalogPage() {
  return (
    <div className="page">
      <p className="kicker">Integrações</p>
      <h1>Beatport, Deezer, SoundCloud, YouTube e Spotify</h1>
      <p className="lede">
        Pesquisa consolidada das APIs oficiais. O Mamute DJPLAYER mostra o que cada serviço permite
        — e o que bloqueia uma cabine de verdade.
      </p>
      <CatalogHub />
    </div>
  );
}
