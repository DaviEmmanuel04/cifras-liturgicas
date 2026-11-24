import { describe, expect, it } from "vitest";
import { completarLivreto, estrofesDaLetra, imporLivreto, interpretarAvisos, paginar } from "./folheto";

describe("estrofesDaLetra", () => {
  it("separa estrofes por linha em branco", () => {
    expect(estrofesDaLetra("[C]Linha um\nLinha [G]dois\n\n\nLinha três")).toEqual([
      "[C]Linha um\nLinha [G]dois",
      "Linha três",
    ]);
  });

  it("tira linhas só de acordes", () => {
    expect(estrofesDaLetra("[Dm] [G7]\n[C]Senhor\n[C] | [G] |")).toEqual(["[C]Senhor"]);
  });

  it("descarta estrofe que fica só com título de seção", () => {
    expect(estrofesDaLetra("Intro:\n[Dm] [G7]\n\nRefrão:\nGlória a Deus")).toEqual([
      "Refrão:\nGlória a Deus",
    ]);
  });

  it("linha só de acordes não separa estrofes", () => {
    expect(estrofesDaLetra("Um\n[C]\nDois")).toEqual(["Um\nDois"]);
  });

  it("tira linhas de acordes sem colchetes (acordes na linha de cima)", () => {
    expect(
      estrofesDaLetra("C.        \nSenhor, que pelo Espírito\n Am\nmundo\n   Dm7   C7/B  F#m  Bm/A  C4  G9\nE o Verbo se fez carne")
    ).toEqual(["Senhor, que pelo Espírito\nmundo\nE o Verbo se fez carne"]);
  });

  it("letra vazia não gera estrofes", () => {
    expect(estrofesDaLetra("")).toEqual([]);
  });
});

describe("paginar", () => {
  it("enche cada página até a altura", () => {
    const blocos = ["a", "b", "c", "d"].map((id) => ({ id, altura: 40 }));
    expect(paginar(blocos, 100)).toEqual([["a", "b"], ["c", "d"]]);
  });

  it("novaPagina começa uma página nova", () => {
    expect(
      paginar([{ id: "a", altura: 10 }, { id: "b", altura: 10, novaPagina: true }], 100)
    ).toEqual([["a"], ["b"]]);
  });

  it("título não fica sozinho no fim da página", () => {
    expect(
      paginar(
        [
          { id: "a", altura: 70 },
          { id: "titulo", altura: 10, manterComProximo: true },
          { id: "estrofe", altura: 30 },
        ],
        100
      )
    ).toEqual([["a"], ["titulo", "estrofe"]]);
  });

  it("bloco maior que a página fica sozinho", () => {
    expect(
      paginar([{ id: "a", altura: 10 }, { id: "b", altura: 150 }, { id: "c", altura: 10 }], 100)
    ).toEqual([["a"], ["b"], ["c"]]);
  });
});

describe("completarLivreto", () => {
  it("completa até múltiplo de 4 com brancas antes das páginas finais", () => {
    expect(completarLivreto([1, 2, 3], [9])).toEqual([1, 2, 3, 9]);
    expect(completarLivreto([1, 2, 3, 4], [9])).toEqual([1, 2, 3, 4, null, null, null, 9]);
    expect(completarLivreto([1, 2], [])).toEqual([1, 2, null, null]);
  });
});

describe("imporLivreto", () => {
  it("monta 8 páginas em 2 folhas", () => {
    expect(imporLivreto(8)).toEqual([
      { frente: [7, 0], verso: [1, 6] },
      { frente: [5, 2], verso: [3, 4] },
    ]);
  });

  it("usa cada página exatamente uma vez", () => {
    const usadas = imporLivreto(12).flatMap((f) => [...f.frente, ...f.verso]).sort((a, b) => a - b);
    expect(usadas).toEqual([...Array(12).keys()]);
  });
});

describe("interpretarAvisos", () => {
  const t = (texto: string, negrito = false, italico = false) => ({ texto, negrito, italico });

  it("separa parágrafos por linha em branco", () => {
    expect(interpretarAvisos("Um\nDois\n\n\nTrês")).toEqual([
      [{ tipo: "texto", trechos: [t("Um")] }, { tipo: "texto", trechos: [t("Dois")] }],
      [{ tipo: "texto", trechos: [t("Três")] }],
    ]);
  });

  it("reconhece subtítulo, listas e numeração", () => {
    expect(interpretarAvisos("# Agenda\n- Terço às **19h**\n• Missa\n1. Primeiro\n2) Segundo")).toEqual([
      [
        { tipo: "titulo", trechos: [t("Agenda")] },
        { tipo: "item", trechos: [t("Terço às "), t("19h", true)] },
        { tipo: "item", trechos: [t("Missa")] },
        { tipo: "numerado", numero: "1", trechos: [t("Primeiro")] },
        { tipo: "numerado", numero: "2", trechos: [t("Segundo")] },
      ],
    ]);
  });

  it("colchetes ficam como texto e itálico funciona", () => {
    expect(interpretarAvisos("[Pastoral] *dia 30*")).toEqual([
      [{ tipo: "texto", trechos: [t("[Pastoral] "), t("dia 30", false, true)] }],
    ]);
  });

  it("hífen sem espaço não vira lista", () => {
    expect(interpretarAvisos("-5% de desconto")).toEqual([[{ tipo: "texto", trechos: [t("-5% de desconto")] }]]);
  });
});
