import { MixerBoard } from "../components/mixer/MixerBoard";

export function MixerPage() {
  return (
    <div className="page">
      <p className="kicker">Modo equipamento · cabine profissional</p>
      <h1>Cabine dual CDJ</h1>
      <p className="lede">
        Duas CDJ-3000 virtuais com mixer no centro: EQ HIGH / MED / LOW com boost, sync, master
        tempo, hot cues, loop, trim e filter. Treine beatmatch no fone — loops sintéticos
        pedagógicos, sem roteamento de Spotify ou Deezer.
      </p>
      <MixerBoard />
    </div>
  );
}
