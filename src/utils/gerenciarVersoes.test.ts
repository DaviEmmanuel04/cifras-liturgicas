import { describe, expect, it } from "vitest";
import { atualizarVersao, avaliarExclusaoVersao, promoverVersaoPrincipal, repertoriosComVersaoFixada } from "./gerenciarVersoes";
import type { Versao } from "@/types/versao";

const versoes: Versao[] = [
  { id: "v1", rotulo: "Completa", tom: "C", letraCifra: "[C] Completa" },
  { id: "v2", rotulo: "Simplificada", tom: "G", letraCifra: "[G] Simplificada" },
];

describe("atualizarVersao", () => {
  it("aplica o patch só na Versão de id correspondente, preenchendo auditoria de alteração", () => {
    const resultado = atualizarVersao(versoes, "v2", { rotulo: "Fácil" }, "regente@paroquia.org", "2026-08-23T12:00:00.000Z");

    expect(resultado.find((v) => v.id === "v2")).toMatchObject({
      rotulo: "Fácil",
      tom: "G",
      letraCifra: "[G] Simplificada",
      modificadoPor: "regente@paroquia.org",
      modificadoEm: "2026-08-23T12:00:00.000Z",
    });
  });

  it("não altera as demais Versões da coleção", () => {
    const resultado = atualizarVersao(versoes, "v2", { rotulo: "Fácil" }, "regente@paroquia.org", "2026-08-23T12:00:00.000Z");

    expect(resultado.find((v) => v.id === "v1")).toEqual(versoes[0]);
  });

  it("atualiza campos de conteúdo (tom, letraCifra, tablaturas) do mesmo jeito que o rótulo", () => {
    const secoes = [{ id: "s1", nome: "Intro", passos: [] }];
    const resultado = atualizarVersao(
      versoes,
      "v1",
      { tom: "D", letraCifra: "[D] Nova letra", tablaturas: secoes },
      "regente@paroquia.org",
      "2026-08-23T12:00:00.000Z"
    );

    expect(resultado.find((v) => v.id === "v1")).toMatchObject({
      rotulo: "Completa",
      tom: "D",
      letraCifra: "[D] Nova letra",
      tablaturas: secoes,
    });
  });
});

describe("promoverVersaoPrincipal", () => {
  it("retorna o conteúdo (tom, letraCifra, tablaturas) da Versão promovida", () => {
    expect(promoverVersaoPrincipal(versoes, "v2")).toEqual({
      tom: "G",
      letraCifra: "[G] Simplificada",
      tablaturas: undefined,
    });
  });

  it("lança erro se o id não corresponder a nenhuma Versão existente", () => {
    expect(() => promoverVersaoPrincipal(versoes, "v-inexistente")).toThrow();
  });
});

describe("avaliarExclusaoVersao", () => {
  it("bloqueia apagar a Principal enquanto existir qualquer outra Versão", () => {
    const resultado = avaliarExclusaoVersao("v1", "v1", 2, []);
    expect(resultado.permitido).toBe(false);
    if (!resultado.permitido) expect(resultado.motivo).toMatch(/Principal/);
  });

  it("permite apagar uma Versão não-principal sem outros bloqueios", () => {
    expect(avaliarExclusaoVersao("v1", "v2", 2, [])).toEqual({ permitido: true });
  });

  it("bloqueia apagar uma Versão fixada em algum item de Repertório, citando o(s) repertório(s)", () => {
    const resultado = avaliarExclusaoVersao("v1", "v2", 2, ["Missa de Domingo"]);
    expect(resultado.permitido).toBe(false);
    if (!resultado.permitido) expect(resultado.motivo).toMatch(/Missa de Domingo/);
  });

  it("permite apagar a Principal quando é a única Versão restante — reverte a Música pro modo implícito de versão única", () => {
    expect(avaliarExclusaoVersao("v1", "v1", 1, [])).toEqual({ permitido: true });
  });
});

describe("repertoriosComVersaoFixada", () => {
  it("retorna o nome dos repertórios cuja música tem essa Versão fixada", () => {
    const repertorios = [
      { id: "r1", nome: "Missa de Domingo", versoesFixadas: { m1: "v2" } },
      { id: "r2", nome: "Ensaio do Coral", versoesFixadas: { m1: "v1" } },
    ];

    expect(repertoriosComVersaoFixada(repertorios, "v2")).toEqual(["Missa de Domingo"]);
  });

  it("ignora repertórios sem nenhuma Versão fixada (formato de hoje, antes do ticket 6)", () => {
    const repertorios = [{ id: "r1", nome: "Missa de Domingo" }];
    expect(repertoriosComVersaoFixada(repertorios, "v2")).toEqual([]);
  });

  it("retorna vazio quando nenhum repertório fixa a Versão informada", () => {
    const repertorios = [{ id: "r1", nome: "Missa de Domingo", versoesFixadas: { m1: "v1" } }];
    expect(repertoriosComVersaoFixada(repertorios, "v2")).toEqual([]);
  });
});
