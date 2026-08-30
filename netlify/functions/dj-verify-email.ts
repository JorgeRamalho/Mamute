import type { Config } from "@netlify/functions";
import { createSession, getProfileByAccountId, verifyEmailToken } from "./_shared/auth.js";
import { errorResponse, jsonResponse, profileRowToClient } from "./_shared/dj.js";

type VerifyBody = {
  token?: string;
};

export default async (req: Request) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let body: VerifyBody;
  try {
    body = (await req.json()) as VerifyBody;
  } catch {
    return errorResponse("JSON inválido.");
  }

  const token = body.token?.trim() ?? "";
  if (!token) {
    return errorResponse("Token de confirmação ausente.");
  }

  const verified = await verifyEmailToken(token);
  if (!verified) {
    return errorResponse("Link inválido ou expirado. Peça um novo e-mail de confirmação.", 400);
  }

  const profile = await getProfileByAccountId(verified.accountId);
  if (!profile) {
    return errorResponse("Perfil não encontrado para esta conta.", 404);
  }

  const session = await createSession(verified.accountId);

  return jsonResponse({
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    session: {
      email: verified.email,
      artistName: profile.artistName,
      loggedInAt: Date.now(),
    },
    profile: profileRowToClient(profile, verified.email),
  });
};

export const config: Config = {
  path: "/api/dj/verify-email",
  method: "POST",
};
