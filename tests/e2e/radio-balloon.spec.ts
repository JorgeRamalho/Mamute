import { expect, test, type Page } from "@playwright/test";

async function dismissPrivacyBanner(page: Page): Promise<void> {
  const accept = page.getByRole("button", { name: "Aceitar" });
  if (await accept.isVisible()) {
    await accept.click();
  }
}

test.describe("Mamute FM — balão flutuante", () => {
  test("na home o balão abre com as plataformas da programação", async ({ page }) => {
    await page.goto("/");
    await dismissPrivacyBanner(page);

    const balloon = page.getByRole("complementary", { name: "Mamute FM" });
    await expect(balloon).toBeVisible();

    await balloon.getByRole("button", { name: "Abrir Mamute FM" }).click();
    await expect(balloon.getByRole("heading", { level: 2 })).toBeVisible();
    const dial = balloon.getByLabel("Plataformas da programação");
    await expect(dial.getByText("Spotify", { exact: true })).toBeVisible();
    await expect(dial.getByText("SoundCloud", { exact: true })).toBeVisible();
    await expect(dial.getByText("YouTube Music", { exact: true })).toBeVisible();
    await expect(dial.getByText("Beatport", { exact: true })).toBeVisible();
    await expect(balloon.getByRole("button", { name: /Ligar rádio|Pausar rádio/ })).toBeVisible();
    await expect(balloon.getByRole("link", { name: "Cabine completa" })).toHaveAttribute("href", /\/radio$/);
  });

  test("o balão some na cabine /radio e volta no mixer", async ({ page }) => {
    await page.goto("/");
    await dismissPrivacyBanner(page);
    await expect(page.getByRole("complementary", { name: "Mamute FM" })).toBeVisible();

    await page.goto("/radio");
    await dismissPrivacyBanner(page);
    await expect(page.getByRole("complementary", { name: "Mamute FM" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Rádio integrada" })).toBeVisible();

    await page.goto("/mixer");
    await expect(page.getByRole("complementary", { name: "Mamute FM" })).toBeVisible();
  });
});
