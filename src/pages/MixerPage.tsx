import { MixerBoard } from "../components/mixer/MixerBoard";

export function MixerPage() {
  return (
    <div className="page">
      <p className="kicker">Modo equipamento</p>
      <h1>Cabine dual deck</h1>
      <p className="lede">
        Deck A simula uma CDJ em grid house. Deck B simula controladora techno. Use fone,
        treine beatmatch e nunca roteie Spotify ou Deezer neste mixer — os termos não permitem.
      </p>
      <MixerBoard />
    </div>
  );
}
