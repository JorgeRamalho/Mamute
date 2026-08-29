import { RadioErrorBoundary } from "../components/radio/RadioErrorBoundary";
import { RadioStudio } from "../components/radio/RadioStudio";

export function RadioPage() {
  return (
    <div className="page radio-page">
      <p className="kicker">Mamute FM</p>
      <h1>Rádio integrada</h1>
      <p className="lede">
        Uma única cabine com equalizador, playlist DJ iniciante e rádio contínua das plataformas —
        faixas completas em sequência automática.
      </p>
      <RadioErrorBoundary>
        <RadioStudio />
      </RadioErrorBoundary>
    </div>
  );
}
