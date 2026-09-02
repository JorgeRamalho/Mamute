import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type http from "node:http";
import { startStaticWorkspace } from "./helpers/static-workspace";

const LIVE_PORT_BASE = 15500;
const INDEX_HTML = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../index.html");
const DIST_MAIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../dist/assets/main.js");

/**
 * Porta deste worker, e não uma porta fixa.
 *
 * A config liga `fullyParallel` com três projects, e cada project dispara o
 * `beforeAll` deste arquivo. Com a porta 15500 cravada, o primeiro worker
 * ganha o `listen` e os outros caem em `EADDRINUSE`, mesmo com a porta livre
 * antes da suíte. O índice do worker é único na execução inteira, por isso
 * somá-lo à base evita o choque sem serializar a suíte.
 */
function livePort(): number {
  const worker = Number(process.env.TEST_PARALLEL_INDEX ?? 0);
  return LIVE_PORT_BASE + worker;
}

async function waitForSrcApp(page: Page) {
  const accept = page.getByRole("button", { name: "Aceitar" });
  await accept.click({ timeout: 8_000 }).catch(() => undefined);
  await expect(page.getByRole("banner").getByRole("link", { name: "Cadastrar DJ" })).toBeVisible({
    timeout: 25_000,
  });
  await expect(page.locator("script[data-mamute-vite]")).toHaveCount(1);
  await expect
    .poll(() => page.evaluate("Boolean(window.__vite_plugin_react_preamble_installed__)"))
    .toBe(true);
  const fromSrc = await page.evaluate(() =>
    performance.getEntriesByType("resource").some((entry) => entry.name.includes("/src/main.tsx")),
  );
  expect(fromSrc).toBe(true);
}

test.describe("Go Live prefere Vite e cai para dist/", () => {
  let server: http.Server | undefined;
  let liveOrigin = "";

  test.beforeAll(async () => {
    const port = livePort();
    server = await startStaticWorkspace(port);
    liveOrigin = `http://127.0.0.1:${port}`;
  });

  test.afterAll(async () => {
    if (!server) return;
    await new Promise<void>((resolve, reject) => {
      server!.close((error) => (error ? reject(error) : resolve()));
    });
  });

  test("sem Vite monta o bundle de dist/", async ({ page }) => {
    // O `globalSetup` só aplica migrações, e não faz `npm run build`. Sem o
    // asset em disco o `tryLoadDist` do `index.html` recusa o fallback HTML
    // do 404 e não injeta a tag, o que faz o caso falhar por arquivo ausente
    // e não por regressão do boot.
    test.skip(!fs.existsSync(DIST_MAIN), "exige npm run build para o fallback de dist/");
    await page.route("http://127.0.0.1:5173/**", (route) => route.abort());
    await page.goto(`${liveOrigin}/`, { waitUntil: "domcontentloaded" });

    await expect(page.locator("script[src*='dist/assets/main.js']")).toHaveCount(1);
    const accept = page.getByRole("button", { name: "Aceitar" });
    await accept.click({ timeout: 8_000 }).catch(() => undefined);
    await expect(page.getByRole("banner").getByRole("link", { name: "Cadastrar DJ" })).toBeVisible({
      timeout: 25_000,
    });
  });

  test("index.html tenta Vite e cai para dist/", () => {
    const html = fs.readFileSync(INDEX_HTML, "utf8");
    expect(html).toMatch(/dist\/assets\/main\.js/);
    expect(html).toContain("tryLoadDist");
    expect(html).toContain("/@react-refresh");
    expect(html).toContain("/src/main.tsx");
  });

  test("com Vite monta o app a partir de src/", async ({ page }) => {
    await page.goto(`${liveOrigin}/`, { waitUntil: "domcontentloaded" });
    await waitForSrcApp(page);
    await expect(page.locator("script[src*='dist/assets/main.js']")).toHaveCount(0);
    await page.getByRole("link", { name: "Cadastrar DJ" }).click();
    await expect(page).toHaveURL(/\/cadastro/);
    await expect(page.getByRole("heading", { name: "1. Identidade" })).toBeVisible();
  });

  test("Área DJ no Go Live usa o formulário atual de src/", async ({ page }) => {
    await page.goto(`${liveOrigin}/dj`, { waitUntil: "domcontentloaded" });
    await waitForSrcApp(page);
    await expect(page.getByRole("heading", { name: "Entrar no portal" })).toBeVisible();
    await page.getByRole("button", { name: "Receber código" }).click();
    await expect(
      page.getByText("Se o cadastro ficou só neste navegador", { exact: false }),
    ).toBeVisible();
  });
});
