import { expect, test, type Page } from "@playwright/test";

async function dismissPrivacyBanner(page: Page): Promise<void> {
  const accept = page.getByRole("button", { name: "Aceitar" });
  if (await accept.isVisible()) {
    await accept.click();
  }
}

test.describe("Usabilidade e função", () => {
  test("header leva ao cadastro DJ e o formulário tem oito seções", async ({ page }) => {
    await page.goto("/");
    await dismissPrivacyBanner(page);
    await page.getByRole("link", { name: "Cadastrar DJ" }).click();
    await expect(page).toHaveURL(/\/cadastro/);
    await expect(page.getByRole("heading", { name: "1. Identidade" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "8. Termos" })).toBeVisible();
    await page.getByRole("textbox", { name: "Nome artístico" }).fill("DJ Visor");
    await page.getByRole("textbox", { name: "Nome completo" }).fill("Ana Mamute");
    await page.getByRole("textbox", { name: "E-mail" }).fill("ana@mamutedjplayerm.app");
    await page.getByLabel("Senha", { exact: true }).fill("cabine123");
    await page.getByRole("button", { name: "Mostrar senha" }).first().click();
    await expect(page.getByRole("button", { name: "Ocultar senha" }).first()).toBeVisible();
    await expect(page.getByLabel("Senha", { exact: true })).toHaveValue("cabine123");
    await page.getByLabel("Confirmar senha").fill("cabine123");
    await page.getByRole("textbox", { name: "Cidade" }).fill("São Paulo");
    await page.getByRole("textbox", { name: "Bio" }).fill("Sets de melodic e techno.");
    await page.getByText("Tenho 18 anos ou mais").click();
    await page.getByText("Aceito os termos de uso").click();
    await page.getByRole("button", { name: "Gravar perfil de cabine" }).click();
    await expect(page).toHaveURL(/\/dj\?cadastrado=1/);
    await expect(page.getByText(/Perfil salvo no visor Mamute/)).toBeVisible();
    await page.getByLabel("Senha", { exact: true }).fill("cabine123");
    await page.getByRole("button", { name: "Entrar no portal" }).click();
    await expect(page.getByRole("heading", { name: "Portal da cabine" })).toBeVisible();
    await expect(page.getByText("DJ Visor").first()).toBeVisible();
    await expect(page.getByText("Ana Mamute").first()).toBeVisible();
    await expect(page.getByText("Sets de melodic e techno.")).toBeVisible();
    await expect(page.getByText("São Paulo").first()).toBeVisible();
    await expect(page.getByText("ana@mamutedjplayerm.app").first()).toBeVisible();
    await expect(page.locator(".header-cta").getByRole("link", { name: "DJ Visor" })).toBeVisible();
    await expect(page.locator(".header-cta").getByRole("link", { name: "Cadastrar DJ" })).toHaveCount(0);
    await page.getByRole("link", { name: "Mamute DJPLAYER" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".header-cta").getByRole("link", { name: "DJ Visor" })).toBeVisible();
    await expect(page.locator(".header-cta").getByRole("link", { name: "DJ Visor" })).toHaveAttribute(
      "href",
      /\/dj$/,
    );
    await expect(page.getByRole("link", { name: "Cadastrar DJ" })).toHaveCount(0);
  });

  test("mixer expõe play, EQ e crossfader", async ({ page }) => {
    await page.goto("/mixer");
    await expect(page.getByRole("region", { name: "Deck A" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Deck B" })).toBeVisible();
    await expect(page.getByLabel("Crossfader")).toBeVisible();
    await page.getByRole("region", { name: "Deck A" }).getByRole("button", { name: "Play" }).click();
    await expect(page.getByRole("region", { name: "Deck A" }).getByRole("button", { name: "Pause" })).toBeVisible();
  });

  test("academia e rádio trocam conteúdo", async ({ page }) => {
    await page.goto("/academia");
    await page.getByRole("button", { name: /Pitch fader/ }).click();
    await expect(page.getByRole("heading", { level: 2, name: /Pitch fader/ })).toBeVisible();
    await page.getByRole("button", { name: "Concluir aula" }).click();
    await expect(page.getByRole("button", { name: "Desmarcar aula" })).toBeVisible();

    await page.goto("/radio");
    await page.getByRole("button", { name: /Levels/ }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Levels" })).toBeVisible();
  });

  test("catálogo lista Mamute e as cinco plataformas externas", async ({ page }) => {
    await page.goto("/catalogo");
    for (const name of ["Mamute", "Beatport", "SoundCloud", "Deezer", "Spotify", "YouTube"]) {
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    }
  });

  test("home mostra combos Bronze, Prata e Ouro e leva o Prata ao cadastro", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Bronze, Prata e Ouro/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bronze", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Prata", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ouro", exact: true })).toBeVisible();
    await page.locator("#assinatura").getByRole("button", { name: /Anual/ }).click();
    await expect(page.getByText("R$ 590")).toBeVisible();
    await page.getByRole("link", { name: "Assinar Prata" }).click();
    await expect(page).toHaveURL(/\/cadastro\?plano=prata/);
    await expect(page.getByText(/Combo escolhido no visor: Prata/)).toBeVisible();
  });
});
