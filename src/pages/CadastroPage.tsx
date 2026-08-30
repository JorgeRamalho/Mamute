import { Link, useSearchParams } from "react-router";
import { RegisterForm } from "../components/dj/RegisterForm";
import { PLAN_NAMES, isPlanId } from "../data/plans";
import { loadProfile } from "../lib/storage";

export function CadastroPage() {
  const profile = loadProfile();
  const [params] = useSearchParams();
  const requested = params.get("plano");
  const selectedPlan = isPlanId(requested) ? requested : null;

  return (
    <div className="page dj-page">
      <header className="dj-page-intro">
        <p className="kicker">Cadastro DJ</p>
        <h1>Cadastro completo de cabine</h1>
        <p className="lede">
          Somente cadastro — identidade, contato, som, equipamento, redes, carreira, aprendizado e
          termos. Depois, entre na Área do DJ para acessar o portal.{" "}
          {profile.artistName
            ? `Visor atual: ${profile.artistName}.`
            : "Preencha o essencial, defina a senha e grave o perfil."}
        </p>
        <p className="dj-page-switch">
          Já tem cadastro?{" "}
          <Link to="/dj">Entrar na Área do DJ</Link>
        </p>
      </header>
      {selectedPlan ? (
        <p className="plan-callout" role="status">
          Combo escolhido no visor: <strong>{PLAN_NAMES[selectedPlan]}</strong>. Grave o perfil para
          seguir ao portal e ao checkout da assinatura.
        </p>
      ) : null}
      <RegisterForm selectedPlan={selectedPlan} />
    </div>
  );
}
