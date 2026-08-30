import { expect, test } from "@playwright/test";

const LIVE_URL = "http://127.0.0.1:5500/";

test.describe("Live Server (porta 5500)", () => {
  test("serve o cadastro e os dados novos do visor", async ({ page }) => {
    const response = await page.goto(LIVE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 12_000,
    }).catch(() => null);

    test.skip(!response || !response.ok(), "Live Server ausente na porta 5500");

    await expect(page.getByRole("link", { name: "Cadastrar DJ" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("link", { name: "Cadastrar DJ" })).toHaveAttribute(
      "href",
      /cadastro/,
    );
    const menu = page.getByRole("button", { name: "Menu" });
    if (await menu.isVisible()) {
      await menu.click();
    }
    await expect(page.getByRole("link", { name: "Plataformas" })).toBeVisible();

    await page.getByRole("link", { name: "Cadastrar DJ" }).click();
    await expect(page).toHaveURL(/\/cadastro/);
    await expect(page.getByRole("heading", { name: "1. Identidade" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "8. Termos" })).toBeVisible();
  });
});
