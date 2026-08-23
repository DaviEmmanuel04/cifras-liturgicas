import { describe, expect, it } from "vitest";
import { resolverConteudoVersao } from "./resolverVersao";
import type { Musica } from "@/types/musica";

const musicaSemVersoes: Musica = {
  id: "m1",
  titulo: "Música Sem Versões",
  categoria: "entrada",
  tempo: "comum",
  tom: "C",
  letraCifra: "[C] Letra única",
};

const musicaComVersoes: Musica = {
  id: "m2",
  titulo: "Música Com Versões",
  categoria: "entrada",
  tempo: "comum",
  tom: "C",
  letraCifra: "conteúdo de topo desatualizado",
  versaoPrincipalId: "v1",
  versoes: [
    { id: "v1", rotulo: "Completa", tom: "C", letraCifra: "[C] Completa" },
    { id: "v2", rotulo: "Simplificada", tom: "G", letraCifra: "[G] Simplificada" },
  ],
};

describe("resolverConteudoVersao", () => {
  it("sem coleção de Versões, sem versaoId: retorna os campos de topo da própria Música", () => {
    expect(resolverConteudoVersao(musicaSemVersoes)).toEqual({
      tom: "C",
      letraCifra: "[C] Letra única",
      tablaturas: undefined,
    });
  });

  it("com coleção de Versões, sem versaoId: retorna a Versão marcada como Principal", () => {
    expect(resolverConteudoVersao(musicaComVersoes)).toEqual({
      tom: "C",
      letraCifra: "[C] Completa",
      tablaturas: undefined,
    });
  });

  it("com versaoId de uma Versão existente: retorna aquela Versão", () => {
    expect(resolverConteudoVersao(musicaComVersoes, "v2")).toEqual({
      tom: "G",
      letraCifra: "[G] Simplificada",
      tablaturas: undefined,
    });
  });

  it("com versaoId que não existe mais: cai pra Principal sem erro", () => {
    expect(resolverConteudoVersao(musicaComVersoes, "v-apagada")).toEqual({
      tom: "C",
      letraCifra: "[C] Completa",
      tablaturas: undefined,
    });
  });

  it("com versaoPrincipalId que não corresponde a nenhuma Versão: cai pra primeira da coleção sem erro", () => {
    const musicaComPrincipalDesalinhada: Musica = {
      ...musicaComVersoes,
      versaoPrincipalId: "v-inexistente",
    };

    expect(resolverConteudoVersao(musicaComPrincipalDesalinhada)).toEqual({
      tom: "C",
      letraCifra: "[C] Completa",
      tablaturas: undefined,
    });
  });
});
