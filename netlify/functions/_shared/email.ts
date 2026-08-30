import { createHash, randomInt, timingSafeEqual } from "node:crypto";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const AUTH_CODE_TTL_MS = 15 * 60 * 1000;
const AUTH_CODE_LENGTH = 6;

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

export function createAuthCode(): string {
  return String(randomInt(0, 10 ** AUTH_CODE_LENGTH)).padStart(AUTH_CODE_LENGTH, "0");
}

export function hashAuthCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

export function authCodeMatches(code: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;
  const incoming = Buffer.from(hashAuthCode(code), "hex");
  const stored = Buffer.from(storedHash, "hex");
  if (incoming.length !== stored.length) return false;
  return timingSafeEqual(incoming, stored);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export type SendEmailResult =
  | { sent: true }
  | { sent: false; reason: "missing_api_key" | "provider_error" };

async function sendEmail(to: string, subject: string, html: string, fallbackLog: string): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() ?? "Mamute DJPLAYER <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(`[mamute-email] RESEND_API_KEY ausente. ${fallbackLog}`);
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

export async function sendVerificationEmail(
  to: string,
  artistName: string,
  verificationUrl: string,
  code: string,
): Promise<SendEmailResult> {
  const displayName = escapeHtml(artistName.trim() || "DJ Mamute");
  const subject = "Código de verificação — Mamute DJPLAYER";
  const html = `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
      <h1 style="font-size: 1.25rem;">Confirme sua cabine no Mamute</h1>
      <p>Olá, <strong>${displayName}</strong>!</p>
      <p>Use este código de verificação para confirmar o e-mail e entrar no portal da Área do DJ:</p>
      <p style="font-size:1.75rem;letter-spacing:0.28em;font-weight:700;margin:1rem 0;">${escapeHtml(code)}</p>
      <p>O código vale por 15 minutos. Você também pode confirmar pelo link:</p>
      <p>
        <a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#00e8ff;color:#0a0a0f;text-decoration:none;border-radius:8px;font-weight:600;">
          Confirmar e-mail
        </a>
      </p>
      <p>Ou copie e cole este link no navegador:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p style="color:#555;font-size:0.9rem;">Se você não fez este cadastro, ignore esta mensagem.</p>
    </div>
  `;

  return sendEmail(to, subject, html, `Código de verificação para ${to}: ${code} · ${verificationUrl}`);
}

export async function sendPasswordResetEmail(
  to: string,
  artistName: string,
  code: string,
): Promise<SendEmailResult> {
  const displayName = escapeHtml(artistName.trim() || "DJ Mamute");
  const subject = "Redefinir senha — Mamute DJPLAYER";
  const html = `
    <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
      <h1 style="font-size: 1.25rem;">Código para redefinir a senha</h1>
      <p>Olá, <strong>${displayName}</strong>!</p>
      <p>Recebemos um pedido para redefinir a senha da Área do DJ. Use este código no portal:</p>
      <p style="font-size:1.75rem;letter-spacing:0.28em;font-weight:700;margin:1rem 0;">${escapeHtml(code)}</p>
      <p style="color:#555;font-size:0.9rem;">O código vale por 15 minutos. Se você não pediu a redefinição, ignore esta mensagem — a senha permanece a mesma.</p>
    </div>
  `;

  return sendEmail(to, subject, html, `Código de redefinição para ${to}: ${code}`);
}

export { AUTH_CODE_LENGTH, AUTH_CODE_TTL_MS, VERIFICATION_TTL_MS };
