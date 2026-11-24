import { describe, expect, it } from "vitest";
import { alternarPrefixoLinhas, envolverSelecao } from "./formatarSelecao";

/** Monta o estado a partir de um texto com `[` e `]` marcando a seleção. */
const sel = (marcado: string) => {
  const inicio = marcado.indexOf("[");
  const fim = marcado.indexOf("]") - 1;
  return { texto: marcado.replace("[", "").replace("]", ""), inicio, fim };
};
/** Inverso de `sel`, para comparar resultados de forma legível. */
const marcar = ({ texto, inicio, fim }: { texto: string; inicio: number; fim: number }) =>
  texto.slice(0, inicio) + "[" + texto.slice(inicio, fim) + "]" + texto.slice(fim);

describe("envolverSelecao", () => {
  it("envolve a seleção e mantém ela selecionada", () => {
    expect(marcar(envolverSelecao(sel("Missa [domingo] às 8h"), "**"))).toBe("Missa **[domingo]** às 8h");
  });

  it("sem seleção, deixa o cursor entre os marcadores", () => {
    expect(marcar(envolverSelecao(sel("Missa []"), "*"))).toBe("Missa *[]*");
  });
});

describe("alternarPrefixoLinhas", () => {
  it("vira lista nas linhas tocadas pela seleção", () => {
    expect(marcar(alternarPrefixoLinhas(sel("Agenda\nTer[ço\nMis]sa\nFim"), "item"))).toBe(
      "Agenda\n[- Terço\n- Missa]\nFim"
    );
  });

  it("cursor sem seleção afeta só a linha atual", () => {
    expect(marcar(alternarPrefixoLinhas(sel("Um\nDo[]is\nTrês"), "titulo"))).toBe("Um\n[# Dois]\nTrês");
  });

  it("numera em sequência e pula linhas em branco", () => {
    expect(marcar(alternarPrefixoLinhas(sel("[a\n\nb\nc]"), "numerado"))).toBe("[1. a\n\n2. b\n3. c]");
  });

  it("se todas já têm o prefixo, tira", () => {
    expect(marcar(alternarPrefixoLinhas(sel("[- a\n- b]"), "item"))).toBe("[a\nb]");
    expect(marcar(alternarPrefixoLinhas(sel("[1. a\n2) b]"), "numerado"))).toBe("[a\nb]");
  });

  it("troca prefixo de outro tipo", () => {
    expect(marcar(alternarPrefixoLinhas(sel("[- a\n1. b]"), "numerado"))).toBe("[1. a\n2. b]");
  });

  it("seleção terminando logo após a quebra não pega a linha seguinte", () => {
    expect(marcar(alternarPrefixoLinhas(sel("[a\n]b"), "item"))).toBe("[- a]\nb");
  });
});
