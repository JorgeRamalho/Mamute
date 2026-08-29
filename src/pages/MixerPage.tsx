import { MixerBoard } from "../components/mixer/MixerBoard";

export function MixerPage() {
  return (
    <div className="page">
      <p className="kicker">Modo equipamento · cabine profissional</p>
      <h1>CDJ Virtual + Dual CDJ + mixer integrado</h1>
      <p className="lede">
        EQ HIGH / MED / LOW com boost, sync, master tempo, loop, trim e filter.
        Beatmatch no fone — loops sintéticos, sem Spotify ou Deezer.
      </p>
      <MixerBoard />
    </div>
  );
}
