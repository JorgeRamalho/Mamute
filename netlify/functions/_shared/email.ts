const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export function getSiteUrl(): string {
  const configured = process.env.SITE_URL ?? process.env.URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return "http://localhost:8888";
}

export function buildVerificationUrl(token: string): string {
  const siteUrl = getSiteUrl();
  return `${siteUrl}/cadastro/confirmar-email?token=${encodeURIComponent(token)}`;
}

export type SendVerificationResult =
  | { sent: true }
  | { sent: false; reason: "missing_api_key" | "provider_error" };

export async function sendVerificationEmail(
  to: string,
  artistName: string,
  verificationUrl: string,
): Promise<SendVerificationResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() ?? "Mamute DJPLAYER <onboarding@resend.dev>";

  const displayName = artistName.trim() || "DJ Mamute";
  const subject = "Confirme seu e-mail — Mamute DJPLAYER";
  const html = `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
      <h1 style="font-size: 1.25rem;">Confirme seu cadastro na cabine Mamute</h1>
      <p>Olá, <strong>${displayName}</strong>!</p>
      <p>Recebemos o cadastro da sua cabine no Mamute DJPLAYER. Para entrar no portal da Área do DJ, confirme este e-mail:</p>
      <p>
        <a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#00e8ff;color:#0a0a0f;text-decoration:none;border-radius:8px;font-weight:600;">
          Confirmar e-mail
        </a>
      </p>
      <p>Ou copie e cole este link no navegador:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p style="color:#555;font-size:0.9rem;">O link expira em 24 horas. Se você não fez este cadastro, ignore esta mensagem.</p>
    </div>
  `;

  if (!apiKey) {
    console.warn(
      `[mamute-email] RESEND_API_KEY ausente. Link de verificação para ${to}: ${verificationUrl}`,
    );
    return { sent: false, reason: "missing_api_key" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[mamute-email] Falha ao enviar e-mail:", response.status, detail);
    return { sent: false, reason: "provider_error" };
  }

  return { sent: true };
}

export { VERIFICATION_TTL_MS };
