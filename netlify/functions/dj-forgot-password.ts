import type { Config } from "@netlify/functions";
import { findAccountByEmail, getProfileByAccountId, issuePasswordReset } from "./_shared/auth.js";
import { errorResponse, jsonResponse, normalizeEmail } from "./_shared/dj.js";
import { cooldownMessage } from "./_shared/rate-limit.js";

type ForgotBody = {
  email?: string;
};

const GENERIC_MESSAGE =
  "Se este e-mail estiver cadastrado, enviamos um código para redefinir a senha.";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let body: ForgotBody;
  try {
    body = (await req.json()) as ForgotBody;
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
      emailSent: false,
      message: GENERIC_MESSAGE,
    });
  }

  const profile = await getProfileByAccountId(account.id);
  const { emailSent, cooldownMs } = await issuePasswordReset(
    account.id,
    account.email,
    profile?.artistName ?? "",
  );

  if (cooldownMs) {
    return jsonResponse({
      ok: true,
      emailSent: false,
      cooldownMs,
      message: cooldownMessage(cooldownMs),
    });
  }

  return jsonResponse({
    ok: true,
    emailSent,
    message: emailSent
      ? "Enviamos um código para redefinir a senha. Ele vale por 15 minutos."
      : "Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos.",
  });
};

export const config: Config = {
  path: "/api/dj/forgot-password",
  method: "POST",
};
