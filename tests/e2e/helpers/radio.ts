import { expect, type Page } from "@playwright/test";

export async function dismissPrivacyBanner(page: Page): Promise<void> {
  const accept = page.getByRole("button", { name: "Aceitar" });
  if (await accept.isVisible()) {
    await accept.click();
  }
}

export async function cueRadioPlatform(page: Page, platformId: string): Promise<void> {
  const player = page.getByRole("region", { name: "Mamute DJ · rádio integrada" });
  await expect(player).toHaveAttribute("data-catalog-ready", "true");

  const onAir = page.getByLabel("Plataforma no ar").locator("[data-platform]");
  await expect(onAir).toBeVisible();
  const title = player.locator(".radio-dj-title");
  const next = player.getByRole("button", { name: "Próxima faixa" });

  const queued = player.locator(`button.radio-dj-queue-item[data-platform="${platformId}"]`).first();
  if ((await queued.count()) > 0) {
    await queued.click({ force: true });
    await expect(onAir).toHaveAttribute("data-platform", platformId, { timeout: 8_000 });
    return;
  }

  for (let step = 0; step < 40; step += 1) {
    if ((await onAir.getAttribute("data-platform")) === platformId) {
      return;
    }
    const before = (await title.textContent()) ?? "";
    await next.click({ force: true });
    await expect(title).not.toHaveText(before, { timeout: 8_000 });
  }

  await expect(onAir).toHaveAttribute("data-platform", platformId);
}
