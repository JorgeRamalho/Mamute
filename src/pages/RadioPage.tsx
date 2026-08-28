import { RadioStudio } from "../components/radio/RadioStudio";

export function RadioPage() {
  return (
    <div className="page">
      <p className="kicker">Mamute FM</p>
      <h1>Rádio em modo clipe</h1>
      <p className="lede">
        As tracks passam como clipes: capa em movimento, BPM, tom e fila. Playback via
        YouTube IFrame Player API — o caminho legal para vídeo oficial.
      </p>
      <RadioStudio />
    </div>
  );
}
