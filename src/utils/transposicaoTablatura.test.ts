import { describe, expect, it } from "vitest";
import { transporTablatura } from "./transposicaoTablatura";
import type { Passo, SecaoTablatura } from "@/types/tablatura";

describe("transporTablatura", () => {
  it("retorna os mesmos passos quando semitons é 0", () => {
    const passos: Passo[] = [[{ corda: 0, casa: 3 }]];

    expect(transporTablatura(passos, 0)).toEqual(passos);
  });

  it("desloca casa pra cima dentro do intervalo tocável", () => {
    const passos: Passo[] = [[{ corda: 0, casa: 3 }]];

    expect(transporTablatura(passos, 2)).toEqual([[{ corda: 0, casa: 5 }]]);
  });

  it("desloca casa pra baixo dentro do intervalo tocável", () => {
    const passos: Passo[] = [[{ corda: 0, casa: 5 }]];

    expect(transporTablatura(passos, -2)).toEqual([[{ corda: 0, casa: 3 }]]);
  });

  it("envolve por oitava quando o resultado fica negativo", () => {
    const passos: Passo[] = [[{ corda: 0, casa: 1 }]];

    expect(transporTablatura(passos, -3)).toEqual([[{ corda: 0, casa: 10 }]]);
  });

  it("envolve por oitava quando o resultado passa de 20", () => {
    const passos: Passo[] = [[{ corda: 0, casa: 19 }]];

    expect(transporTablatura(passos, 3)).toEqual([[{ corda: 0, casa: 10 }]]);
  });

  it("desloca cada corda de um passo com múltiplas notas independentemente", () => {
    const passos: Passo[] = [
      [
        { corda: 0, casa: 0 },
        { corda: 1, casa: 2 },
        { corda: 2, casa: 19 },
      ],
    ];

    expect(transporTablatura(passos, 3)).toEqual([
      [
        { corda: 0, casa: 3 },
        { corda: 1, casa: 5 },
        { corda: 2, casa: 10 },
      ],
    ]);
  });

  it("mantém um passo vazio vazio", () => {
    const passos: Passo[] = [[], [{ corda: 0, casa: 3 }]];

    expect(transporTablatura(passos, 5)).toEqual([[], [{ corda: 0, casa: 8 }]]);
  });

  it("aceita uma SecaoTablatura e preserva id/nome ao transpor seus passos", () => {
    const secao: SecaoTablatura = {
      id: "s1",
      nome: "Intro",
      passos: [[{ corda: 0, casa: 3 }]],
    };

    expect(transporTablatura(secao, 2)).toEqual({
      id: "s1",
      nome: "Intro",
      passos: [[{ corda: 0, casa: 5 }]],
    });
  });

  it("não modifica o valor original recebido", () => {
    const passos: Passo[] = [[{ corda: 0, casa: 3 }]];

    transporTablatura(passos, 5);

    expect(passos).toEqual([[{ corda: 0, casa: 3 }]]);
  });

  it("passa uma Nota abafada intocada, sem tentar ler/deslocar `casa`", () => {
    const passos: Passo[] = [[{ corda: 0, tipo: "abafada" }]];

    expect(transporTablatura(passos, 5)).toEqual([[{ corda: 0, tipo: "abafada" }]]);
  });

  it("desloca `casa` normalmente numa Nota com técnica, preservando a técnica junto", () => {
    const passos: Passo[] = [[{ corda: 0, casa: 5, tecnica: "ligadura" }]];

    expect(transporTablatura(passos, 2)).toEqual([[{ corda: 0, casa: 7, tecnica: "ligadura" }]]);
  });

  it("envolve por oitava uma Nota com técnica, preservando a técnica junto", () => {
    const passos: Passo[] = [[{ corda: 0, casa: 19, tecnica: "slide" }]];

    expect(transporTablatura(passos, 3)).toEqual([[{ corda: 0, casa: 10, tecnica: "slide" }]]);
  });

  it("mistura Nota tocada, Nota com técnica e Nota abafada no mesmo Passo", () => {
    const passos: Passo[] = [
      [
        { corda: 0, casa: 3 },
        { corda: 1, casa: 5, tecnica: "vibrato" },
        { corda: 2, tipo: "abafada" },
      ],
    ];

    expect(transporTablatura(passos, 2)).toEqual([
      [
        { corda: 0, casa: 5 },
        { corda: 1, casa: 7, tecnica: "vibrato" },
        { corda: 2, tipo: "abafada" },
      ],
    ]);
  });
});
