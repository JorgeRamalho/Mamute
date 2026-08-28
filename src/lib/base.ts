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

export function publicAsset(file: string): string {
  if (document.querySelector('script[src*="dist/assets/main.js"]')) {
    return `./public/${file}`;
  }
  return `${appBasename()}${file}`;
}
