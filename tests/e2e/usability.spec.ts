import { expect, test } from "@playwright/test";

test.describe("Usabilidade e função", () => {
  test("header leva à área DJ e o formulário tem oito seções", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Cadastrar DJ" }).click();
    await expect(page).toHaveURL(/\/dj/);
    await expect(page.getByRole("heading", { name: "1. Identidade" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "8. Termos" })).toBeVisible();
    await page.getByRole("textbox", { name: "Nome artístico" }).fill("DJ Visor");
    await page.getByRole("textbox", { name: "Nome completo" }).fill("Ana Mamute");
    await page.getByRole("textbox", { name: "E-mail" }).fill("ana@mamutedjplayerm.app");
    await page.getByRole("textbox", { name: "Cidade" }).fill("São Paulo");
    await page.getByRole("textbox", { name: "Bio" }).fill("Sets de melodic e techno.");
    await page.getByText("Tenho 18 anos ou mais").click();
    await page.getByText("Aceito os termos de uso").click();
    await page.getByRole("button", { name: "Gravar perfil de cabine" }).click();
    await expect(page.getByText("Perfil salvo no visor Mamute.")).toBeVisible();
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
    await expect(page).toHaveURL(/\/dj\?plano=prata/);
    await expect(page.getByText(/Combo escolhido no visor: Prata/)).toBeVisible();
  });
});
