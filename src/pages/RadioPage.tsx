import { RadioStudio } from "../components/radio/RadioStudio";

export function RadioPage() {
  return (
    <div className="page radio-page">
      <p className="kicker">Mamute FM</p>
      <h1>Rádio integrada</h1>
      <p className="lede">
        Equalizador de cabine, player com loop nos clipes das plataformas e deck local para enviar
        MP3 — Spotify, Beatport, SoundCloud, Deezer e YouTube Music no mesmo visor.
      </p>
      <RadioStudio />
    </div>
  );
}
