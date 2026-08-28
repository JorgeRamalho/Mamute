import { expect, test } from "@playwright/test";

test.describe("Identidade visual e responsividade", () => {
  test("tipografia e tokens CSS estão no documento", async ({ page }) => {
    await page.goto("/");
    const fonts = await page.evaluate(() => {
      const styles = getComputedStyle(document.body);
      return {
        body: styles.fontFamily,
        display: getComputedStyle(document.querySelector("h1")!).fontFamily,
        cyan: getComputedStyle(document.documentElement).getPropertyValue("--cyan").trim(),
        void: getComputedStyle(document.documentElement).getPropertyValue("--void").trim(),
      };
    });
    expect(fonts.body).toMatch(/Outfit/i);
    expect(fonts.display).toMatch(/Syne/i);
    expect(fonts.cyan).toBe("#00e8ff");
    expect(fonts.void).toBe("#06070c");
  });

  test("layout não estoura viewport e o visor permanece no fluxo", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(8);
    await expect(page.getByText("MAMUTE OS 1.0")).toBeVisible();
    await expect(page.getByText("Beatport").first()).toBeVisible();
  });

  test("header oferece navegação em qualquer projeto", async ({ page }) => {
    await page.goto("/");
    const menu = page.getByRole("button", { name: "Menu" });
    if (await menu.isVisible()) {
      await menu.click();
    }
    await expect(page.getByRole("navigation", { name: "Principal" })).toBeVisible();
    await page.getByRole("link", { name: "Mixer CDJ" }).click();
    await expect(page).toHaveURL(/\/mixer/);
  });
});
