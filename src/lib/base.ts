export function normalizeLiveServerUrl(): void {
  const { pathname, search, hash } = window.location;
  if (!pathname.endsWith("/index.html")) return;
  const next = `${pathname.slice(0, -"index.html".length)}${search}${hash}`;
  window.history.replaceState(null, "", next || "/");
}

export function appBasename(): string {
  const { pathname, port } = window.location;
  if (/^517\d$/.test(port) || port === "4173") return "/";

  const path = pathname.endsWith("/index.html")
    ? pathname.slice(0, -"index.html".length)
    : pathname;

  const known = new Set(["mixer", "academia", "radio", "catalogo", "dj"]);
  const segments = path.split("/").filter(Boolean);
  const first = segments[0];
  if (first && !known.has(first)) {
    return `/${first}/`;
  }

  return "/";
}

function assetFileName(file: string): string {
  return file.replace(/^\/+/, "");
}

export function publicAsset(file: string): string {
  const name = assetFileName(file);

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
