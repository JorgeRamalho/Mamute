import { useSearchParams } from "react-router";
import { RegisterForm } from "../components/dj/RegisterForm";
import { PLAN_NAMES, isPlanId } from "../data/plans";
import { loadProfile } from "../lib/storage";

export function DjPage() {
  const profile = loadProfile();
  const [params] = useSearchParams();
  const requested = params.get("plano");
  const selectedPlan = isPlanId(requested) ? requested : null;

  return (
    <div className="page dj-page">
      <header className="dj-page-intro">
        <p className="kicker">Área do DJ</p>
        <h1>Cadastro completo de cabine</h1>
        <p className="lede">
          Monte seu perfil em oito passos — identidade, contato, som, equipamento, redes, carreira,
          aprendizado e termos.{" "}
          {profile.artistName
            ? `Visor atual: ${profile.artistName}.`
            : "Preencha o essencial e grave para liberar o visor Mamute."}
        </p>
      </header>
      {selectedPlan ? (
        <p className="plan-callout" role="status">
          Combo escolhido no visor: <strong>{PLAN_NAMES[selectedPlan]}</strong>. Grave o perfil para
          seguir ao checkout da assinatura.
        </p>
      ) : null}
      <RegisterForm />
    </div>
  );
}
