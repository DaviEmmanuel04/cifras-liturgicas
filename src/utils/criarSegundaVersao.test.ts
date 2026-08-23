import { describe, expect, it } from "vitest";
import { criarSegundaVersao } from "./criarSegundaVersao";

describe("criarSegundaVersao", () => {
  const conteudoAtual = { tom: "C", letraCifra: "[C] Letra original", tablaturas: undefined };
  const conteudoNovo = { tom: "C", letraCifra: "[C] Letra simplificada", tablaturas: undefined };

  it("retorna duas Versões: a existente com o conteúdo atual, a nova com o conteúdo editado", () => {
    const resultado = criarSegundaVersao({
      conteudoAtual,
      conteudoNovo,
      rotuloVersaoExistente: "Completa",
      rotuloVersaoNova: "Simplificada",
      autor: "regente@paroquia.org",
      agora: "2026-08-23T10:00:00.000Z",
    });

    const [versaoExistente, versaoNova] = resultado.versoes;

    expect(versaoExistente).toMatchObject({
      rotulo: "Completa",
      tom: "C",
      letraCifra: "[C] Letra original",
    });
    expect(versaoNova).toMatchObject({
      rotulo: "Simplificada",
      tom: "C",
      letraCifra: "[C] Letra simplificada",
    });
  });

  it("marca a Versão que já existia como Principal", () => {
    const resultado = criarSegundaVersao({
      conteudoAtual,
      conteudoNovo,
      rotuloVersaoExistente: "Completa",
      rotuloVersaoNova: "Simplificada",
      autor: "regente@paroquia.org",
      agora: "2026-08-23T10:00:00.000Z",
    });

    const [versaoExistente] = resultado.versoes;
    expect(resultado.versaoPrincipalId).toBe(versaoExistente.id);
  });

  it("gera ids distintos e não vazios pras duas Versões", () => {
    const resultado = criarSegundaVersao({
      conteudoAtual,
      conteudoNovo,
      rotuloVersaoExistente: "Completa",
      rotuloVersaoNova: "Simplificada",
      autor: "regente@paroquia.org",
      agora: "2026-08-23T10:00:00.000Z",
    });

    const [versaoExistente, versaoNova] = resultado.versoes;
    expect(versaoExistente.id).toBeTruthy();
    expect(versaoNova.id).toBeTruthy();
    expect(versaoExistente.id).not.toBe(versaoNova.id);
  });

  it("preenche metadados de auditoria de criação e alteração em ambas as Versões", () => {
    const resultado = criarSegundaVersao({
      conteudoAtual,
      conteudoNovo,
      rotuloVersaoExistente: "Completa",
      rotuloVersaoNova: "Simplificada",
      autor: "regente@paroquia.org",
      agora: "2026-08-23T10:00:00.000Z",
    });

    for (const versao of resultado.versoes) {
      expect(versao.criadoPor).toBe("regente@paroquia.org");
      expect(versao.criadoEm).toBe("2026-08-23T10:00:00.000Z");
      expect(versao.modificadoPor).toBe("regente@paroquia.org");
      expect(versao.modificadoEm).toBe("2026-08-23T10:00:00.000Z");
    }
  });

  it("carrega a Tablatura de cada Versão a partir do respectivo conteúdo", () => {
    const secoes = [{ id: "s1", nome: "Intro", passos: [] }];
    const resultado = criarSegundaVersao({
      conteudoAtual: { ...conteudoAtual, tablaturas: secoes },
      conteudoNovo,
      rotuloVersaoExistente: "Completa",
      rotuloVersaoNova: "Simplificada",
      autor: "regente@paroquia.org",
      agora: "2026-08-23T10:00:00.000Z",
    });

    const [versaoExistente, versaoNova] = resultado.versoes;
    expect(versaoExistente.tablaturas).toBe(secoes);
    expect(versaoNova.tablaturas).toBeUndefined();
  });
});
