import { describe, expect, it } from "vitest";
import { correspondeBusca, normalizarTexto } from "./busca";

describe("normalizarTexto", () => {
  it("remove acentos e passa para minúsculas", () => {
    expect(normalizarTexto("Glória")).toBe("gloria");
    expect(normalizarTexto("AÇÃO de Graças")).toBe("acao de gracas");
  });
});

describe("correspondeBusca", () => {
  it("encontra 'Glória' buscando 'gloria'", () => {
    expect(correspondeBusca("gloria", "Glória a Deus nas Alturas")).toBe(true);
  });

  it("encontra texto sem acento buscando com acento", () => {
    expect(correspondeBusca("glória", "Gloria")).toBe(true);
  });

  it("aceita os termos em qualquer ordem", () => {
    expect(correspondeBusca("deus gloria", "Glória a Deus")).toBe(true);
  });

  it("exige que todos os termos apareçam", () => {
    expect(correspondeBusca("gloria santo", "Glória a Deus")).toBe(false);
  });

  it("procura em qualquer um dos campos e ignora campos ausentes", () => {
    expect(correspondeBusca("comunhao", "Pão da Vida", undefined, "Comunhão")).toBe(true);
  });

  it("busca vazia ou só com espaços corresponde a tudo", () => {
    expect(correspondeBusca("", "Qualquer")).toBe(true);
    expect(correspondeBusca("   ", "Qualquer")).toBe(true);
  });
});
