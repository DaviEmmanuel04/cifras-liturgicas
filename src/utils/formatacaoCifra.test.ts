import { describe, expect, it } from "vitest";
import { removerFormatacao, segmentarLinha } from "./formatacaoCifra";

const t = (texto: string, negrito = false, italico = false) => ({ texto, negrito, italico });

describe("segmentarLinha", () => {
  it("linha sem formatação vira segmentos acorde+texto", () => {
    expect(segmentarLinha("[C]Senhor, tende pie[G]dade")).toEqual([
      { acorde: "C", trechos: [t("Senhor, tende pie")] },
      { acorde: "G", trechos: [t("dade")] },
    ]);
  });

  it("texto antes do primeiro acorde fica num segmento sem acorde", () => {
    expect(segmentarLinha("Ó [D]Pai")).toEqual([
      { acorde: null, trechos: [t("Ó ")] },
      { acorde: "D", trechos: [t("Pai")] },
    ]);
  });

  it("interpreta negrito e itálico", () => {
    expect(segmentarLinha("canta **forte** e *suave*")).toEqual([
      { acorde: null, trechos: [t("canta "), t("forte", true), t(" e "), t("suave", false, true)] },
    ]);
  });

  it("formatação atravessa acordes", () => {
    expect(segmentarLinha("**[C]Senhor, tende pie[G]dade** (2x)")).toEqual([
      { acorde: "C", trechos: [t("Senhor, tende pie", true)] },
      { acorde: "G", trechos: [t("dade", true), t(" (2x)")] },
    ]);
  });

  it("combina negrito e itálico", () => {
    expect(segmentarLinha("***Bis***")).toEqual([{ acorde: null, trechos: [t("Bis", true, true)] }]);
  });

  it("marcador sem par fica literal", () => {
    expect(segmentarLinha("5 * 3")).toEqual([{ acorde: null, trechos: [t("5 * 3")] }]);
    expect(segmentarLinha("**a** b **")).toEqual([
      { acorde: null, trechos: [t("a", true), t(" b **")] },
    ]);
  });

  it("acordes consecutivos geram segmentos vazios", () => {
    expect(segmentarLinha("[Dm][G7]")).toEqual([
      { acorde: "Dm", trechos: [] },
      { acorde: "G7", trechos: [] },
    ]);
  });
});

describe("removerFormatacao", () => {
  it("tira os marcadores mas mantém acordes", () => {
    expect(removerFormatacao("**[C]Senhor** *pie[G]dade*")).toBe("[C]Senhor pie[G]dade");
  });

  it("mantém marcador sem par", () => {
    expect(removerFormatacao("5 * 3")).toBe("5 * 3");
  });
});
