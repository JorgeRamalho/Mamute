import { expect, test } from "@playwright/test";

test.describe("Harmonia · roda Camelot", () => {
  test("o header leva à seção abaixo do hero e a roda troca o tom", async ({ page }) => {
    await page.goto("/");
    const menu = page.getByRole("button", { name: "Menu" });
    if (await menu.isVisible()) await menu.click();

    await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Harmonia" }).click();
    await expect(page).toHaveURL(/#harmonia/);
    const section = page.locator("#harmonia");
    await expect(section).toBeVisible();
    await expect(section.getByRole("heading", { name: "Navegue em boa sintonia" })).toBeVisible();

    await expect(section.getByText("8A", { exact: true }).first()).toBeVisible();
    await expect(section.getByRole("heading", { name: "Lá menor" })).toBeVisible();

    await section.getByRole("radio", { name: /8B · Dó maior/ }).click();
    await expect(section.getByRole("heading", { name: "Dó maior" })).toBeVisible();
    await expect(section.getByText("8B → 8A → 9A → 9B")).toBeVisible();

    await section.getByRole("tab", { name: "Como aplicar no set" }).click();
    await expect(section.getByText("Leia a key no visor ou nos metadados")).toBeVisible();
  });
});
