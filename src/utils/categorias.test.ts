import { describe, expect, it } from "vitest";
import {
  CATEGORIAS_PADRAO,
  adicionarCategoria,
  categoriasDeFirestore,
  opcoesDeCategoria,
  ordenarPorCategorias,
  removerCategoria,
} from "./categorias";

describe("categoriasDeFirestore", () => {
  it("usa o padrão quando o documento não existe", () => {
    expect(categoriasDeFirestore(undefined)).toEqual(CATEGORIAS_PADRAO);
  });

  it("usa o padrão quando a lista é inválida ou vazia", () => {
    expect(categoriasDeFirestore({ lista: "Entrada" })).toEqual(CATEGORIAS_PADRAO);
    expect(categoriasDeFirestore({ lista: [] })).toEqual(CATEGORIAS_PADRAO);
  });

  it("preserva a ordem salva e descarta entradas inválidas", () => {
    expect(categoriasDeFirestore({ lista: ["Final", 3, "", "Entrada"] })).toEqual(["Final", "Entrada"]);
  });
});

describe("adicionarCategoria", () => {
  it("adiciona ao fim, sem espaços sobrando", () => {
    expect(adicionarCategoria(["Entrada"], "  Missa   de Cura ")).toEqual({ ok: true, lista: ["Entrada", "Missa de Cura"] });
  });

  it("rejeita nome vazio", () => {
    expect(adicionarCategoria(["Entrada"], "   ").ok).toBe(false);
  });

  it("rejeita duplicata ignorando acentos e maiúsculas", () => {
    const resultado = adicionarCategoria(["Glória"], "gloria");
    expect(resultado).toEqual({ ok: false, erro: 'A categoria "Glória" já existe.' });
  });
});

describe("removerCategoria", () => {
  it("remove quando nenhuma música usa", () => {
    expect(removerCategoria(["Entrada", "Final"], "Final", 0)).toEqual({ ok: true, lista: ["Entrada"] });
  });

  it("bloqueia quando alguma música usa", () => {
    expect(removerCategoria(["Entrada", "Final"], "Final", 3)).toEqual({
      ok: false,
      erro: 'Não é possível excluir "Final": 3 músicas usam essa categoria.',
    });
  });
});

describe("ordenarPorCategorias", () => {
  it("segue a ordem cadastrada e põe as desconhecidas no fim, em ordem alfabética", () => {
    const ordem = ["Entrada", "Glória", "Final"];
    expect(ordenarPorCategorias(["Final", "Zeta", "Entrada", "Alfa"], ordem)).toEqual(["Entrada", "Final", "Alfa", "Zeta"]);
  });
});

describe("opcoesDeCategoria", () => {
  it("inclui a categoria atual da música quando ela não está mais cadastrada", () => {
    expect(opcoesDeCategoria(["Entrada"], "Antiga")).toEqual(["Entrada", "Antiga"]);
    expect(opcoesDeCategoria(["Entrada"], "Entrada")).toEqual(["Entrada"]);
    expect(opcoesDeCategoria(["Entrada"], "")).toEqual(["Entrada"]);
  });
});
