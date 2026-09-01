import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type http from "node:http";
import { startStaticWorkspace } from "./helpers/static-workspace";

const LIVE_PORT = 15500;
const LIVE_ORIGIN = `http://127.0.0.1:${LIVE_PORT}`;
const INDEX_HTML = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../index.html");

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
  let server: http.Server;

  test.beforeAll(async () => {
    server = await startStaticWorkspace(LIVE_PORT);
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  test("sem Vite monta o bundle de dist/", async ({ page }) => {
    await page.route("http://127.0.0.1:5173/**", (route) => route.abort());
    await page.goto(`${LIVE_ORIGIN}/`, { waitUntil: "domcontentloaded" });

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
    await page.goto(`${LIVE_ORIGIN}/`, { waitUntil: "domcontentloaded" });
    await waitForSrcApp(page);
    await expect(page.locator("script[src*='dist/assets/main.js']")).toHaveCount(0);
    await page.getByRole("link", { name: "Cadastrar DJ" }).click();
    await expect(page).toHaveURL(/\/cadastro/);
    await expect(page.getByRole("heading", { name: "1. Identidade" })).toBeVisible();
  });

  test("Área DJ no Go Live usa o formulário atual de src/", async ({ page }) => {
    await page.goto(`${LIVE_ORIGIN}/dj`, { waitUntil: "domcontentloaded" });
    await waitForSrcApp(page);
    await expect(page.getByRole("heading", { name: "Entrar no portal" })).toBeVisible();
    await page.getByRole("button", { name: "Receber código" }).click();
    await expect(
      page.getByText("Se o cadastro ficou só neste navegador", { exact: false }),
    ).toBeVisible();
  });
});
