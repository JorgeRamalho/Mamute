import { RadioErrorBoundary } from "../components/radio/RadioErrorBoundary";
import { RadioStudio } from "../components/radio/RadioStudio";

export function RadioPage() {
  return (
    <div className="page radio-page">
      <p className="kicker">Mamute FM</p>
      <h1>Rádio integrada</h1>
      <p className="lede">
        Flow contínuo das plataformas — só a que está tocando aparece no visor, marcada AO VIVO.
      </p>
      <RadioErrorBoundary>
        <RadioStudio />
      </RadioErrorBoundary>
    </div>
  );
}
