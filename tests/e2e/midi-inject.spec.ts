import { expect, test, type Page } from "@playwright/test";
import {
  DDJ_STATUS,
  DECK_CC_14BIT,
  MIXER_CC_14BIT,
  type Cc14Bit,
} from "../../src/lib/midi/ddj-400-protocol";

const DESKTOP = { width: 1440, height: 900 };

/**
 * Empurra pacotes crus pela mesma ponte que a porta USB alimenta.
 *
 * @param page Página já em `/mixer`, porque a ponte nasce com o hook.
 * @param messages Lista de `[status, data1, data2]`.
 */
async function inject(page: Page, messages: number[][]): Promise<void> {
  await page.evaluate((batch) => {
    const fn = (window as unknown as { __mamuteMidiInject?: (bytes: number[]) => void })
      .__mamuteMidiInject;
    if (typeof fn !== "function") throw new Error("window.__mamuteMidiInject não existe");
    for (const bytes of batch) fn(bytes);
  }, messages);
}

/**
 * Manda o par MSB/LSB de um controle de 14 bits, na ordem em que a
 * controladora manda.
 *
 * @param page Página já em `/mixer`.
 * @param status Canal MIDI do controle.
 * @param pair Endereço 14-bit do protocolo.
 * @param msb Byte mais significativo.
 * @param lsb Byte menos significativo.
 */
async function send14(
  page: Page,
  status: number,
  pair: Cc14Bit,
  msb: number,
  lsb: number,
): Promise<void> {
  await inject(page, [
    [status, pair.msb, msb],
    [status, pair.lsb, lsb],
  ]);
}

test.describe("físico→virtual sem USB", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chrome", "o caminho é o mesmo nas três viewports");
    await page.setViewportSize(DESKTOP);
    await page.goto("/mixer");
    await expect(page.getByRole("status", { name: /Controladora MIDI/ })).toBeVisible();
  });

  test("channel fader e crossfader movem os sliders da tela", async ({ page }) => {
    await send14(page, DDJ_STATUS.ccDeckA, DECK_CC_14BIT.channelFader, 0x40, 0x00);
    await expect(page.getByLabel("Volume deck A")).toHaveValue("0.5");

    await send14(page, DDJ_STATUS.ccDeckB, DECK_CC_14BIT.channelFader, 0x7f, 0x7f);
    await expect(page.getByLabel("Volume deck B")).toHaveValue("1");

    await send14(page, DDJ_STATUS.ccMixer, MIXER_CC_14BIT.crossfader, 0x7f, 0x7f);
    await expect(page.getByLabel("Crossfader")).toHaveValue("1");
  });

  test("o fader entrega resolução de 14 bits, e não os cem degraus de antes", async ({ page }) => {
    // 0x3A/0x3A fecha 7482 de 16383, que é 0.4566. Com o arredondamento antigo
    // de duas casas isso viraria 0.46, ou seja, o par MSB/LSB não compraria
    // nada além do que um CC de 7 bits já daria.
    await send14(page, DDJ_STATUS.ccDeckA, DECK_CC_14BIT.channelFader, 0x3a, 0x3a);
    await expect(page.getByLabel("Volume deck A")).toHaveValue("0.457");
  });

  test("EQ, filter e os knobs de fone acompanham", async ({ page }) => {
    await send14(page, DDJ_STATUS.ccDeckA, DECK_CC_14BIT.eqHigh, 0x20, 0x00);
    await expect(page.getByRole("slider", { name: "HIGH canal A" })).toHaveValue("25");

    await send14(page, DDJ_STATUS.ccMixer, MIXER_CC_14BIT.filterDeckA, 0x40, 0x00);
    await expect(page.getByRole("slider", { name: "Filter deck A" })).toHaveValue("50");

    await send14(page, DDJ_STATUS.ccMixer, MIXER_CC_14BIT.headphonesLevel, 0x7f, 0x7f);
    await expect(page.getByLabel("Volume booth")).toHaveValue("100");

    await send14(page, DDJ_STATUS.ccMixer, MIXER_CC_14BIT.headphonesMixing, 0x00, 0x00);
    await expect(page.getByLabel("Cue mix headphone")).toHaveValue("0");
  });

  test("rajada de um frame termina no último valor, sem perder o gesto", async ({ page }) => {
    const fader = DECK_CC_14BIT.channelFader;
    await inject(page, [
      [DDJ_STATUS.ccDeckA, fader.msb, 0x10],
      [DDJ_STATUS.ccDeckA, fader.lsb, 0x00],
      [DDJ_STATUS.ccDeckA, fader.msb, 0x30],
      [DDJ_STATUS.ccDeckA, fader.lsb, 0x00],
      [DDJ_STATUS.ccDeckA, fader.msb, 0x60],
      [DDJ_STATUS.ccDeckA, fader.lsb, 0x00],
    ]);

    await expect(page.getByLabel("Volume deck A")).toHaveValue("0.75");
  });

  test("o chip registra a última mensagem, mesmo a que o mapper ignora", async ({ page }) => {
    // Note de play, que só entra no mapa na onda de transporte.
    await inject(page, [[DDJ_STATUS.noteDeckA, 0x0b, 0x7f]]);

    const chip = page.getByRole("status", { name: /Controladora MIDI/ });
    await expect(chip.locator(".mixer-midi-detail")).toContainText("noteOn ch1 n11=127");
  });
});
