import { describe, expect, it } from "vitest";
import { resolverConteudoVersao, resolverVersaoIdEfetivo, resolverVideoReferencia } from "./resolverVersao";
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

  it("inclui o Capotraste (próprio da Música ou da Versão resolvida) do mesmo jeito que tom/letraCifra", () => {
    const musicaComCapotraste: Musica = { ...musicaSemVersoes, capotraste: 2 };
    expect(resolverConteudoVersao(musicaComCapotraste)).toMatchObject({ capotraste: 2 });

    const musicaComVersoesECapotraste: Musica = {
      ...musicaComVersoes,
      versoes: [
        { ...musicaComVersoes.versoes![0], capotraste: 3 },
        musicaComVersoes.versoes![1],
      ],
    };
    expect(resolverConteudoVersao(musicaComVersoesECapotraste)).toMatchObject({ capotraste: 3 });
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

describe("resolverVersaoIdEfetivo", () => {
  it("sem coleção de Versões: retorna undefined — não há id de Versão a destacar", () => {
    expect(resolverVersaoIdEfetivo(musicaSemVersoes)).toBeUndefined();
  });

  it("com coleção de Versões, sem versaoId: retorna o id da Principal", () => {
    expect(resolverVersaoIdEfetivo(musicaComVersoes)).toBe("v1");
  });

  it("com versaoId de uma Versão existente: retorna esse id", () => {
    expect(resolverVersaoIdEfetivo(musicaComVersoes, "v2")).toBe("v2");
  });

  it("com versaoId que não existe mais: retorna o id da Principal", () => {
    expect(resolverVersaoIdEfetivo(musicaComVersoes, "v-apagada")).toBe("v1");
  });
});

describe("resolverVideoReferencia", () => {
  it("sem Vídeo de Referência Padrão e sem Versões: nenhum vídeo", () => {
    expect(resolverVideoReferencia(musicaSemVersoes)).toBeUndefined();
  });

  it("sem vídeo próprio: cai pro Vídeo de Referência Padrão da Música", () => {
    const musica: Musica = { ...musicaSemVersoes, videoReferenciaPadrao: "padrao123" };
    expect(resolverVideoReferencia(musica)).toBe("padrao123");
  });

  it("Versão com vídeo próprio: usa o da Versão, não o padrão", () => {
    const musica: Musica = {
      ...musicaComVersoes,
      videoReferenciaPadrao: "padrao123",
      versoes: [
        { ...musicaComVersoes.versoes![0], videoReferencia: "proprioV1" },
        musicaComVersoes.versoes![1],
      ],
    };
    expect(resolverVideoReferencia(musica)).toBe("proprioV1");
  });

  it("Versão sem vídeo próprio, mas com coleção de Versões: cai pro padrão da Música — independente de qual é a Principal", () => {
    const musica: Musica = { ...musicaComVersoes, videoReferenciaPadrao: "padrao123" };
    expect(resolverVideoReferencia(musica, "v2")).toBe("padrao123");
  });

  it("Versão que suprime explicitamente: nenhum vídeo, mesmo havendo padrão", () => {
    const musica: Musica = {
      ...musicaComVersoes,
      videoReferenciaPadrao: "padrao123",
      versoes: [
        { ...musicaComVersoes.versoes![0], videoReferenciaSuprimida: true },
        musicaComVersoes.versoes![1],
      ],
    };
    expect(resolverVideoReferencia(musica)).toBeUndefined();
  });

  it("promover outra Versão a Principal não muda o padrão herdado por quem não tem vídeo próprio", () => {
    const musica: Musica = { ...musicaComVersoes, videoReferenciaPadrao: "padrao123" };
    const comOutraPrincipal: Musica = { ...musica, versaoPrincipalId: "v2" };
    expect(resolverVideoReferencia(musica)).toBe("padrao123");
    expect(resolverVideoReferencia(comOutraPrincipal)).toBe("padrao123");
  });
});
