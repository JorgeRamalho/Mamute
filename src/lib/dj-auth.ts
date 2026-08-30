import type { DjProfile } from "../types";
import { hydrateAcademyProgress } from "./academy";
import {
  clearApiToken,
  fetchRemoteProfile,
  loginProfile,
  logoutProfile,
  loadApiToken,
  registerProfile,
  requestPasswordReset,
  resendVerificationEmail,
  resetPasswordWithCode,
  sendVerificationCode,
  confirmVerificationCode,
  verifyEmailToken,
} from "./dj-api";
import { loadProfile, saveProfile, saveSelectedPlan } from "./storage";

const CREDENTIALS_KEY = "mamute.dj.credentials";
const SESSION_KEY = "mamute.dj.session";
const SESSION_CHANGE_EVENT = "mamute-dj-session-change";

export const MIN_PASSWORD_LENGTH = 8;
export const AUTH_CODE_LENGTH = 6;

export function normalizeAuthCode(code: string): string {
  return code.replace(/\D/g, "").slice(0, AUTH_CODE_LENGTH);
}

export interface DjCredentials {
  email: string;
  passwordHash: string;
}

export interface DjSession {
  email: string;
  artistName: string;
  loggedInAt: number;
}

export type LoginResult =
  | { ok: true; session: DjSession }
  | { ok: false; message: string; code?: string };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return bytesToHex(digest);
}

export function loadCredentials(): DjCredentials | null {
  const raw = localStorage.getItem(CREDENTIALS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DjCredentials>;
    if (typeof parsed.email === "string" && typeof parsed.passwordHash === "string") {
      return { email: normalizeEmail(parsed.email), passwordHash: parsed.passwordHash };
    }
    return null;
  } catch {
    return null;
  }
}

export function hasCredentials(): boolean {
  return loadCredentials() !== null || loadApiToken() !== null;
}

export async function saveCredentials(email: string, password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  const record: DjCredentials = {
    email: normalizeEmail(email),
    passwordHash,
  };
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(record));
}

export function syncCredentialEmail(email: string): void {
  const current = loadCredentials();
  if (!current) return;
  const next: DjCredentials = { ...current, email: normalizeEmail(email) };
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(next));
}

export function hasRegisteredProfile(): boolean {
  const profile = loadProfile();
  return Boolean(
    profile.email.trim() && profile.artistName.trim() && profile.terms && profile.over18,
  );
}

export function loadSession(): DjSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DjSession>;
    if (
      typeof parsed.email === "string" &&
      typeof parsed.artistName === "string" &&
      typeof parsed.loggedInAt === "number"
    ) {
      return {
        email: parsed.email,
        artistName: parsed.artistName,
        loggedInAt: parsed.loggedInAt,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function emitSessionChange(): void {
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function saveSession(session: DjSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  emitSessionChange();
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  clearApiToken();
  emitSessionChange();
}

export function onDjSessionChange(listener: () => void): () => void {
  window.addEventListener(SESSION_CHANGE_EVENT, listener);
  return () => window.removeEventListener(SESSION_CHANGE_EVENT, listener);
}

export function sessionIdentityName(): string | null {
  const session = loadSession();
  if (!session) return null;
  const profile = loadProfile();
  const name = profile.artistName.trim() || session.artistName.trim() || profile.fullName.trim();
  return name || null;
}

export async function logoutDj(): Promise<void> {
  await logoutProfile();
  clearSession();
}

export type RegisterResult =
  | {
      ok: true;
      mode: "created" | "updated" | "local";
      emailVerificationRequired?: boolean;
      emailSent?: boolean;
      message?: string;
    }
  | { ok: false; message: string };

export async function registerDjProfile(
  profile: DjProfile,
  password: string,
  selectedPlan?: string | null,
): Promise<RegisterResult> {
  try {
    const remote = await registerProfile(profile, password, selectedPlan);
    if (remote.ok) {
      saveProfile(remote.profile);
      if (selectedPlan) saveSelectedPlan(selectedPlan);
      if (!password) {
        syncCredentialEmail(remote.profile.email);
      } else {
        await saveCredentials(remote.profile.email, password);
      }

      if (remote.emailVerificationRequired) {
        return {
          ok: true,
          mode: remote.mode,
          emailVerificationRequired: true,
          emailSent: remote.emailSent,
          message: remote.message,
        };
      }

      const session: DjSession = {
        email: remote.profile.email,
        artistName: remote.profile.artistName,
        loggedInAt: Date.now(),
      };
      saveSession(session);
      await hydrateAcademyProgress();
      return { ok: true, mode: remote.mode };
    }
    return { ok: false, message: remote.error };
  } catch {
    if (!password && loadCredentials()) {
      saveProfile(profile);
      if (selectedPlan) saveSelectedPlan(selectedPlan);
      syncCredentialEmail(profile.email);
      return { ok: true, mode: "local" };
    }
    if (!password) {
      return {
        ok: false,
        message: "Sem conexão com o servidor. Defina a senha para gravar localmente.",
      };
    }
    await saveCredentials(profile.email, password);
    saveProfile(profile);
    if (selectedPlan) saveSelectedPlan(selectedPlan);
    return { ok: true, mode: "local" };
  }
}

async function loginLocally(email: string, password: string): Promise<LoginResult> {
  if (!hasRegisteredProfile()) {
    return {
      ok: false,
      message: "Nenhum cadastro de DJ neste visor. Preencha o formulário de cadastro para criar o acesso.",
    };
  }

  const credentials = loadCredentials();
  if (!credentials) {
    return {
      ok: false,
      message: "Este perfil ainda não tem senha. Conclua o cadastro DJ para criar o acesso ao portal.",
    };
  }

  const profile = loadProfile();
  const incoming = normalizeEmail(email);
  const hash = await hashPassword(password);
  const emailOk = incoming === credentials.email && incoming === normalizeEmail(profile.email);
  const passwordOk = hash === credentials.passwordHash;

  if (!emailOk || !passwordOk) {
    return { ok: false, message: "E-mail ou senha inválidos." };
  }

  const session: DjSession = {
    email: credentials.email,
    artistName: profile.artistName,
    loggedInAt: Date.now(),
  };
  saveSession(session);
  return { ok: true, session };
}

export async function loginWithPassword(email: string, password: string): Promise<LoginResult> {
  try {
    const remote = await loginProfile(email, password);
    if (remote.ok) {
      saveProfile(remote.profile);
      saveSession(remote.session);
      await hydrateAcademyProgress();
      return { ok: true, session: remote.session };
    }
    return { ok: false, message: remote.error, code: remote.code };
  } catch {
    return loginLocally(email, password);
  }
}

export async function hydrateProfileFromServer(): Promise<DjProfile | null> {
  try {
    const remote = await fetchRemoteProfile();
    if (remote?.ok) {
      saveProfile(remote.profile);
      saveSelectedPlan(remote.selectedPlan);
      return remote.profile;
    }
  } catch {
    return null;
  }
  return null;
}

export async function confirmEmailWithToken(token: string): Promise<LoginResult> {
  try {
    const remote = await verifyEmailToken(token);
    if (remote.ok) {
      saveProfile(remote.profile);
      saveSession(remote.session);
      await hydrateAcademyProgress();
      return { ok: true, session: remote.session };
    }
    return { ok: false, message: remote.error };
  } catch {
    return {
      ok: false,
      message: "Sem conexão com o servidor. Tente abrir o link de confirmação novamente.",
    };
  }
}

export async function resendEmailVerification(
  email: string,
  password: string,
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  try {
    const remote = await resendVerificationEmail(email, password);
    if (remote.ok) {
      return { ok: true, message: remote.message };
    }
    return { ok: false, message: remote.error };
  } catch {
    return {
      ok: false,
      message: "Sem conexão com o servidor. Tente reenviar em alguns minutos.",
    };
  }
}

export type AuthCodeResult = { ok: true; message: string } | { ok: false; message: string };

export async function sendDjVerificationCode(email: string): Promise<AuthCodeResult> {
  const trimmed = email.trim();
  if (!trimmed) {
    return { ok: false, message: "Informe o e-mail cadastrado." };
  }
  try {
    const remote = await sendVerificationCode(trimmed);
    if (remote.ok) {
      return { ok: true, message: remote.message };
    }
    return { ok: false, message: remote.error };
  } catch {
    return {
      ok: false,
      message: "Sem conexão com o servidor. Tente enviar o código em alguns minutos.",
    };
  }
}

export async function confirmDjVerificationCode(email: string, code: string): Promise<LoginResult> {
  const normalized = normalizeAuthCode(code);
  if (normalized.length !== AUTH_CODE_LENGTH) {
    return { ok: false, message: "O código de verificação precisa ter 6 dígitos." };
  }
  try {
    const remote = await confirmVerificationCode(email, normalized);
    if (remote.ok) {
      saveProfile(remote.profile);
      saveSession(remote.session);
      await hydrateAcademyProgress();
      return { ok: true, session: remote.session };
    }
    return { ok: false, message: remote.error };
  } catch {
    return {
      ok: false,
      message: "Sem conexão com o servidor. Tente confirmar o código novamente.",
    };
  }
}

export async function sendDjPasswordReset(email: string): Promise<AuthCodeResult> {
  const trimmed = email.trim();
  if (!trimmed) {
    return { ok: false, message: "Informe o e-mail cadastrado." };
  }
  try {
    const remote = await requestPasswordReset(trimmed);
    if (remote.ok) {
      return { ok: true, message: remote.message };
    }
    return { ok: false, message: remote.error };
  } catch {
    return {
      ok: false,
      message: "Sem conexão com o servidor. Tente enviar o código em alguns minutos.",
    };
  }
}

export async function resetDjPassword(
  email: string,
  code: string,
  password: string,
): Promise<LoginResult> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }
  const normalized = normalizeAuthCode(code);
  if (normalized.length !== AUTH_CODE_LENGTH) {
    return { ok: false, message: "O código de verificação precisa ter 6 dígitos." };
  }
  try {
    const remote = await resetPasswordWithCode(email, normalized, password);
    if (remote.ok) {
      saveProfile(remote.profile);
      await saveCredentials(remote.profile.email, password);
      saveSession(remote.session);
      await hydrateAcademyProgress();
      return { ok: true, session: remote.session };
    }
    return { ok: false, message: remote.error };
  } catch {
    return {
      ok: false,
      message: "Sem conexão com o servidor. Tente redefinir a senha novamente.",
    };
  }
}
