import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { PasswordField } from "../forms/PasswordField";
import { loginWithPassword, resendEmailVerification, type DjSession } from "../../lib/dj-auth";
import { loadProfile } from "../../lib/storage";

type DjLoginFormProps = {
  onLoggedIn: (session: DjSession) => void;
};

export function DjLoginForm({ onLoggedIn }: DjLoginFormProps) {
  const [params] = useSearchParams();
  const justRegistered = params.get("cadastrado") === "1";
  const saved = loadProfile();
  const [email, setEmail] = useState(saved.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [resendMessage, setResendMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setErrorCode(undefined);
    setResendMessage("");
    setPending(true);
    const result = await loginWithPassword(email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      setErrorCode(result.code);
      return;
    }
    onLoggedIn(result.session);
  };

  const onResendVerification = async () => {
    setResendMessage("");
    setResendPending(true);
    const result = await resendEmailVerification(email, password);
    setResendPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setResendMessage(result.message);
  };

  return (
    <div className="page dj-page">
      <header className="dj-page-intro">
        <p className="kicker">Área do DJ</p>
        <h1>Entrar no portal</h1>
        <p className="lede">
          Acesso ao portal da cabine após confirmar o e-mail e usar a senha definida no cadastro DJ.
        </p>
      </header>

      {justRegistered ? (
        <p className="form-status dj-login-banner" role="status">
          Perfil salvo no Mamute. Se ainda não confirmou o e-mail, verifique a caixa de entrada antes de entrar.
        </p>
      ) : null}

      <section className="dj-login card" aria-labelledby="dj-login-title">
        <h2 id="dj-login-title">Login da cabine</h2>
        <form className="dj-login-form" onSubmit={(event) => void onSubmit(event)}>
          <label className="field">
            E-mail
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              placeholder="voce@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="field">
            Senha
            <PasswordField
              name="password"
              aria-label="Senha"
              autoComplete="current-password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={setPassword}
            />
          </label>
          {error ? (
            <p className="dj-login-error" role="alert">
              {error}
            </p>
          ) : null}
          {errorCode === "EMAIL_NOT_VERIFIED" ? (
            <div className="dj-login-form">
              <button
                className="btn"
                type="button"
                disabled={resendPending || !email || !password}
                onClick={() => void onResendVerification()}
              >
                {resendPending ? "Reenviando…" : "Reenviar e-mail de confirmação"}
              </button>
              <p className="dj-page-switch">
                <Link to={`/cadastro/confirmar-email?email=${encodeURIComponent(email)}`}>
                  Abrir página de confirmação
                </Link>
              </p>
            </div>
          ) : null}
          {resendMessage ? (
            <p className="form-status" role="status">{resendMessage}</p>
          ) : null}
          <button className="btn btn-solid" type="submit" disabled={pending}>
            {pending ? "Entrando…" : "Entrar no portal"}
          </button>
        </form>
        <p className="dj-page-switch">
          Ainda não cadastrou? <Link to="/cadastro">Cadastrar DJ</Link>
        </p>
      </section>
    </div>
  );
}
