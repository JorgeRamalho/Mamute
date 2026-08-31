import type { Config } from "@netlify/functions";
import { findAccountByEmail, getProfileByAccountId, issueEmailVerification } from "./_shared/auth.js";
import { errorResponse, jsonResponse, normalizeEmail } from "./_shared/dj.js";
import { cooldownMessage } from "./_shared/rate-limit.js";

type SendCodeBody = {
  email?: string;
};

const GENERIC_MESSAGE =
  "Se este e-mail estiver cadastrado e pendente de confirmação, enviamos um código de verificação.";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let body: SendCodeBody;
  try {
    body = (await req.json()) as SendCodeBody;
  } catch {
    return errorResponse("JSON inválido.");
  }

  const email = normalizeEmail(body.email ?? "");
  if (!email) {
    return errorResponse("Informe o e-mail cadastrado.");
  }

  const account = await findAccountByEmail(email);
  if (!account) {
    return jsonResponse({
      ok: true,
      alreadyVerified: false,
      emailSent: false,
      message: GENERIC_MESSAGE,
    });
  }

  if (account.emailVerified) {
    return jsonResponse({
      ok: true,
      alreadyVerified: true,
      emailSent: false,
      message: "Este e-mail já está confirmado. Use sua senha para entrar no portal.",
    });
  }

  const profile = await getProfileByAccountId(account.id);
  const { emailSent, cooldownMs } = await issueEmailVerification(
    account.id,
    account.email,
    profile?.artistName ?? "",
  );

  if (cooldownMs) {
    return jsonResponse({
      ok: true,
      alreadyVerified: false,
      emailSent: false,
      cooldownMs,
      message: cooldownMessage(cooldownMs),
    });
  }

  return jsonResponse({
    ok: true,
    alreadyVerified: false,
    emailSent,
    message: emailSent
      ? "Enviamos um código de verificação para o seu e-mail. Ele vale por 15 minutos."
      : "Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos.",
  });
};

export const config: Config = {
  path: "/api/dj/send-verification-code",
  method: "POST",
};
