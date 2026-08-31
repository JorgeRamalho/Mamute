import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { PasswordField } from "../forms/PasswordField";
import {
  AUTH_CODE_LENGTH,
  confirmDjVerificationCode,
  loginWithPassword,
  MIN_PASSWORD_LENGTH,
  normalizeAuthCode,
  resetDjPassword,
  sendDjPasswordReset,
  sendDjVerificationCode,
  type DjSession,
} from "../../lib/dj-auth";
import { loadProfile } from "../../lib/storage";

type DjLoginFormProps = {
  onLoggedIn: (session: DjSession) => void;
};

type LoginPanel = "login" | "forgot" | "verify";

export function DjLoginForm({ onLoggedIn }: DjLoginFormProps) {
  const [params] = useSearchParams();
  const justRegistered = params.get("cadastrado") === "1";
  const saved = loadProfile();
  const [panel, setPanel] = useState<LoginPanel>("login");
  const [email, setEmail] = useState(saved.email);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [pending, setPending] = useState(false);

  const resetMessages = () => {
    setError("");
    setStatus("");
  };

  const switchPanel = (next: LoginPanel) => {
    resetMessages();
    setCode("");
    setPassword("");
    setPasswordConfirm("");
    setCodeSent(false);
    setPanel(next);
  };

  const applySendCodeResult = (
    result: { ok: true; message: string; emailSent?: boolean; alreadyVerified?: boolean } | { ok: false; message: string },
  ): boolean => {
    if (!result.ok) {
      setError(result.message);
      return false;
    }
    setStatus(result.message);
    if (result.alreadyVerified) {
      setCodeSent(false);
      return true;
    }
    if (result.emailSent) {
      setCodeSent(true);
      return true;
    }
    setCodeSent(false);
    return true;
  };

  const onLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    setPending(true);
    const result = await loginWithPassword(email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      if (result.code === "EMAIL_NOT_VERIFIED") {
        setStatus("Use Receber código abaixo ou confirme pelo link enviado ao seu e-mail.");
      }
      return;
    }
    onLoggedIn(result.session);
  };

  const onSendVerificationCode = async () => {
    resetMessages();
    setPending(true);
    const result = await sendDjVerificationCode(email);
    setPending(false);
    applySendCodeResult(result);
  };

  const onConfirmVerificationCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    setPending(true);
    const result = await confirmDjVerificationCode(email, code);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onLoggedIn(result.session);
  };

  const onSendPasswordReset = async () => {
    resetMessages();
    setPending(true);
    const result = await sendDjPasswordReset(email);
    setPending(false);
    applySendCodeResult(result);
  };

  const onResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    if (password !== passwordConfirm) {
      setError("A confirmação da senha não confere.");
      return;
    }
    setPending(true);
    const result = await resetDjPassword(email, code, password);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onLoggedIn(result.session);
  };

  const emailField = (
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
  );

  const codeField = (
    <label className="field">
      Código de verificação
      <input
        className="dj-login-code"
        type="text"
        name="otp"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        minLength={AUTH_CODE_LENGTH}
        maxLength={AUTH_CODE_LENGTH}
        placeholder="000000"
        value={code}
        onChange={(event) => setCode(normalizeAuthCode(event.target.value))}
        aria-label="Código de verificação"
      />
    </label>
  );

  return (
    <div className="page dj-page">
      <header className="dj-page-intro">
        <p className="kicker">Área do DJ</p>
        <h1>Entrar no portal</h1>
        <p className="lede">
          Acesso ao portal da cabine após confirmar o e-mail e usar a senha definida no cadastro DJ.
          Se precisar, envie um código de verificação ou redefina a senha pelo e-mail cadastrado.
        </p>
      </header>

      {justRegistered ? (
        <p className="form-status dj-login-banner" role="status">
          Perfil salvo no Mamute. Confirme o e-mail com o código enviado (Receber código) ou pelo link na
          sua caixa de entrada antes de entrar no portal.
        </p>
      ) : null}

      {panel === "login" ? (
        <section className="dj-login card" aria-labelledby="dj-login-title">
          <h2 id="dj-login-title">Login da cabine</h2>
          <form className="dj-login-form" onSubmit={(event) => void onLogin(event)}>
            {emailField}
            <label className="field">
              Senha
              <PasswordField
                name="password"
                aria-label="Senha"
                autoComplete="current-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
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
            {status ? (
              <p className="form-status" role="status">
                {status}
              </p>
            ) : null}
            <button className="btn btn-solid" type="submit" disabled={pending}>
              {pending ? "Entrando…" : "Entrar no portal"}
            </button>
          </form>
          <div className="dj-login-extras">
            <button className="dj-login-text-btn" type="button" onClick={() => switchPanel("forgot")}>
              Esqueci a senha
            </button>
            <button className="dj-login-text-btn" type="button" onClick={() => switchPanel("verify")}>
              Receber código
            </button>
          </div>
          <p className="dj-page-switch">
            Ainda não cadastrou? <Link to="/cadastro">Cadastrar DJ</Link>
          </p>
        </section>
      ) : null}

      {panel === "forgot" ? (
        <section className="dj-login card" aria-labelledby="dj-forgot-title">
          <h2 id="dj-forgot-title">Esqueci a senha</h2>
          <p className="lede">
            Enviaremos um código de 6 dígitos para o e-mail da cabine. Use-o para definir uma nova senha.
          </p>
          <form
            className="dj-login-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (codeSent) {
                void onResetPassword(event);
                return;
              }
              void onSendPasswordReset();
            }}
          >
            {emailField}
            {codeSent ? (
              <>
                {codeField}
                <label className="field">
                  Nova senha
                  <PasswordField
                    name="new-password"
                    aria-label="Nova senha"
                    autoComplete="new-password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={setPassword}
                  />
                </label>
                <label className="field">
                  Confirmar nova senha
                  <PasswordField
                    name="confirm-new-password"
                    aria-label="Confirmar nova senha"
                    autoComplete="new-password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    placeholder="Repita a senha"
                    value={passwordConfirm}
                    onChange={setPasswordConfirm}
                  />
                </label>
              </>
            ) : null}
            {error ? (
              <p className="dj-login-error" role="alert">
                {error}
              </p>
            ) : null}
            {status ? (
              <p className="form-status" role="status">
                {status}
              </p>
            ) : null}
            <button className="btn btn-solid" type="submit" disabled={pending || !email}>
              {pending
                ? codeSent
                  ? "Redefinindo…"
                  : "Enviando…"
                : codeSent
                  ? "Redefinir senha e entrar"
                  : "Enviar código"}
            </button>
          </form>
          <p className="dj-page-switch">
            <button className="dj-login-text-btn" type="button" onClick={() => switchPanel("login")}>
              Voltar ao login
            </button>
          </p>
        </section>
      ) : null}

      {panel === "verify" ? (
        <section className="dj-login card" aria-labelledby="dj-verify-title">
          <h2 id="dj-verify-title">Código de verificação</h2>
          <p className="lede">
            Envie o código para o e-mail cadastrado e confirme para liberar o acesso ao portal.
          </p>
          <form
            className="dj-login-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (codeSent) {
                void onConfirmVerificationCode(event);
                return;
              }
              void onSendVerificationCode();
            }}
          >
            {emailField}
            {codeSent ? codeField : null}
            {error ? (
              <p className="dj-login-error" role="alert">
                {error}
              </p>
            ) : null}
            {status ? (
              <p className="form-status" role="status">
                {status}
              </p>
            ) : null}
            <button className="btn btn-solid" type="submit" disabled={pending || !email}>
              {pending
                ? codeSent
                  ? "Confirmando…"
                  : "Enviando…"
                : codeSent
                  ? "Confirmar código e entrar"
                  : "Enviar código de verificação"}
            </button>
          </form>
          {codeSent ? (
            <p className="dj-page-switch">
              <button
                className="dj-login-text-btn"
                type="button"
                disabled={pending}
                onClick={() => void onSendVerificationCode()}
              >
                Reenviar código
              </button>
            </p>
          ) : null}
          <p className="dj-page-switch">
            <button className="dj-login-text-btn" type="button" onClick={() => switchPanel("login")}>
              Voltar ao login
            </button>
          </p>
        </section>
      ) : null}
    </div>
  );
}
