export function normalizeLiveServerUrl(): void {
  const { pathname, search, hash } = window.location;
  if (!pathname.endsWith("/index.html")) return;
  const next = `${pathname.slice(0, -"index.html".length)}${search}${hash}`;
  window.history.replaceState(null, "", next || "/");
}

const APP_SEGMENTS = new Set([
  "mixer",
  "academia",
  "harmonia",
  "radio",
  "catalogo",
  "cadastro",
  "dj",
  "politicas",
]);

export function appBasename(): string {
  const { pathname, port } = window.location;
  if (/^517\d$/.test(port) || port === "4173" || port === "8888") return "/";

  const path = pathname.endsWith("/index.html")
    ? pathname.slice(0, -"index.html".length)
    : pathname;

  const segments = path.split("/").filter(Boolean);
  const first = segments[0];
  if (first && !APP_SEGMENTS.has(first)) {
    return `/${first}/`;
  }

  return "/";
}

function assetFileName(file: string): string {
  return file.replace(/^\/+/, "");
}

export function publicAsset(file: string): string {
  const name = assetFileName(file);

  const viteLiveScript = document.querySelector<HTMLScriptElement>("script[data-mamute-vite]");
  if (viteLiveScript) {
    return new URL(name, "http://127.0.0.1:5173/").href;
  }

  const liveRootScript = document.querySelector<HTMLScriptElement>(
    'script[src*="dist/assets/main.js"]',
  );
  if (liveRootScript) {
    return new URL(`./public/${name}`, document.baseURI).href;
  }

  const bundledScript = document.querySelector<HTMLScriptElement>(
    'script[src*="assets/main.js"]',
  );
  if (bundledScript?.src) {
    return new URL(`../${name}`, bundledScript.src).href;
  }

  return new URL(name, `${window.location.origin}${appBasename()}`).href;
}
