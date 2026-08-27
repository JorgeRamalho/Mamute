import { Classroom } from "../components/academy/Classroom";

export function AcademyPage() {
  return (
    <div className="page">
      <p className="kicker">Sala de aula</p>
      <h1>Do primeiro beat à conclusão de cabine</h1>
      <p className="lede">
        Quatro módulos, dez aulas, dicas e um laboratório. Marque cada checklist. O diploma
        Harako é pedagógico — o palco real ainda pede horas de booth.
      </p>
      <Classroom />
    </div>
  );
}
