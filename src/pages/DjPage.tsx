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
    <div className="page">
      <p className="kicker">Área do DJ</p>
      <h1>Cadastro completo de cabine</h1>
      <p className="lede">
        Oito seções: identidade, contato, perfil, equipamento, redes, carreira, aprendizado
        e termos. {profile.artistName ? `Visor atual: ${profile.artistName}.` : "Nenhum perfil gravado ainda."}
      </p>
      {selectedPlan ? (
        <p className="plan-callout" role="status">
          Combo escolhido no visor: <strong>{PLAN_NAMES[selectedPlan]}</strong>. Grave o perfil
          para seguir ao checkout da assinatura.
        </p>
      ) : null}
      <RegisterForm />
    </div>
  );
}
