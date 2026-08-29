import { RadioErrorBoundary } from "../components/radio/RadioErrorBoundary";
import { RadioStudio } from "../components/radio/RadioStudio";

export function RadioPage() {
  return (
    <div className="page radio-page">
      <p className="kicker">Mamute FM</p>
      <h1>Rádio integrada</h1>
      <p className="lede">
        Equalizador de cabine, player com loop nos clipes das plataformas e deck local para enviar
        MP3 — Spotify, Deezer, YouTube Music e Beatport no mesmo visor.
      </p>
      <RadioErrorBoundary>
        <RadioStudio />
      </RadioErrorBoundary>
    </div>
  );
}
