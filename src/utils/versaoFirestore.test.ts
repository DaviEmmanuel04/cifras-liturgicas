import { describe, expect, it } from "vitest";
import { versoesDeFirestore, versoesParaFirestore } from "./versaoFirestore";
import type { Versao } from "@/types/versao";

describe("versoesParaFirestore", () => {
  it("preserva os campos de uma Versão sem Tablatura, sem adicionar um array vazio implícito", () => {
    const versoes: Versao[] = [
      {
        id: "v1",
        rotulo: "Completa",
        tom: "C",
        letraCifra: "[C] Letra",
        criadoPor: "regente@paroquia.org",
        criadoEm: "2026-08-23T10:00:00.000Z",
        modificadoPor: "regente@paroquia.org",
        modificadoEm: "2026-08-23T10:00:00.000Z",
      },
    ];

    const resultado = versoesParaFirestore(versoes);
    expect(resultado).toEqual(versoes);
    expect(resultado[0]).not.toHaveProperty("tablaturas");
  });

  it("envolve os Passos da Tablatura de cada Versão, pra nenhum array ficar aninhado diretamente noutro", () => {
    const versoes: Versao[] = [
      {
        id: "v1",
        rotulo: "Completa",
        tom: "C",
        letraCifra: "[C] Letra",
        tablaturas: [{ id: "s1", nome: "Intro", passos: [[{ corda: 0, casa: 3 }], []] }],
      },
    ];

    const resultado = versoesParaFirestore(versoes);
    const passosBrutos = resultado[0].tablaturas![0].passos;
    for (const passo of passosBrutos) {
      expect(Array.isArray(passo)).toBe(false);
    }
  });
});

describe("versoesDeFirestore", () => {
  it("é a inversa de versoesParaFirestore (round-trip), com ou sem Tablatura", () => {
    const versoes: Versao[] = [
      { id: "v1", rotulo: "Completa", tom: "C", letraCifra: "[C] Letra" },
      {
        id: "v2",
        rotulo: "Simplificada",
        tom: "G",
        letraCifra: "[G] Letra",
        tablaturas: [{ id: "s1", nome: "Intro", passos: [[{ corda: 0, casa: 3 }], []] }],
      },
    ];

    expect(versoesDeFirestore(versoesParaFirestore(versoes))).toEqual(versoes);
  });

  it("retorna array vazio quando o campo bruto não é um array (documento sem Versões)", () => {
    expect(versoesDeFirestore(undefined)).toEqual([]);
    expect(versoesDeFirestore(null)).toEqual([]);
  });

  it("lê Passos no formato antigo/cru (array direto), tolerando o formato pré-conversão", () => {
    const bruto = [
      {
        id: "v1",
        rotulo: "Completa",
        tom: "C",
        letraCifra: "[C] Letra",
        tablaturas: [{ id: "s1", nome: "Intro", passos: [[{ corda: 0, casa: 3 }]] }],
      },
    ];

    expect(versoesDeFirestore(bruto)).toEqual([
      {
        id: "v1",
        rotulo: "Completa",
        tom: "C",
        letraCifra: "[C] Letra",
        tablaturas: [{ id: "s1", nome: "Intro", passos: [[{ corda: 0, casa: 3 }]] }],
      },
    ]);
  });
});
