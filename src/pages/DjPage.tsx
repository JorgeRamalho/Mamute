import { RegisterForm } from "../components/dj/RegisterForm";
import { loadProfile } from "../lib/storage";

export function DjPage() {
  const profile = loadProfile();

  return (
    <div className="page">
      <p className="kicker">Área do DJ</p>
      <h1>Cadastro completo de cabine</h1>
      <p className="lede">
        Oito seções: identidade, contato, perfil, equipamento, redes, carreira, aprendizado
        e termos. {profile.artistName ? `Visor atual: ${profile.artistName}.` : "Nenhum perfil gravado ainda."}
      </p>
      <RegisterForm />
    </div>
  );
}
