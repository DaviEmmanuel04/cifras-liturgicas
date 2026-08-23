import { describe, expect, it } from "vitest";
import { linhasSecao } from "./linhaTablatura";
import type { SecaoTablatura } from "@/types/tablatura";

function secao(passos: SecaoTablatura["passos"]): SecaoTablatura {
  return { id: "s1", nome: "Intro", passos };
}

describe("linhasSecao", () => {
  it("retorna as 6 linhas na ordem de exibição — agudo (e) no topo, grave (E) na base", () => {
    const linhas = linhasSecao(secao([[]]));
    const rotulos = linhas.map((l) => l[0]);

    expect(rotulos).toEqual(["e", "B", "G", "D", "A", "E"]);
  });

  it("Passo com uma Nota de um dígito: coluna de largura 2 (símbolo + 1 traço de respiro)", () => {
    // corda 0 = E (grave), casa 3
    const linhas = linhasSecao(secao([[{ corda: 0, casa: 3 }]]));

    expect(linhas).toEqual(["e|--|", "B|--|", "G|--|", "D|--|", "A|--|", "E|3-|"]);
  });

  it("casa de dois dígitos alarga a coluna pras 6 cordas naquele Passo", () => {
    const linhas = linhasSecao(secao([[{ corda: 0, casa: 12 }]]));

    expect(linhas).toEqual(["e|---|", "B|---|", "G|---|", "D|---|", "A|---|", "E|12-|"]);
  });

  it("símbolo com técnica (ex. '5h') conta pra largura da coluna", () => {
    const passo1 = [{ corda: 0, casa: 5, tecnica: "ligadura" as const }];
    const passo2 = [{ corda: 0, casa: 7 }];
    const linhas = linhasSecao(secao([passo1, passo2]));

    // "5h" tem 2 caracteres -> coluna do 1º passo com largura 3
    expect(linhas[5]).toBe("E|5h-7-|");
  });

  it("Nota abafada mostra 'x' na linha da corda certa", () => {
    const linhas = linhasSecao(secao([[{ corda: 5, tipo: "abafada" }]]));

    // corda 5 = e (agudo), primeira linha exibida
    expect(linhas[0]).toBe("e|x-|");
  });

  it("cada Passo tem largura de coluna independente", () => {
    const passo1 = [{ corda: 0, casa: 3 }];
    const passo2 = [{ corda: 0, casa: 12 }];
    const passo3 = [{ corda: 0, casa: 5 }];
    const linhas = linhasSecao(secao([passo1, passo2, passo3]));

    expect(linhas[5]).toBe("E|3-12-5-|");
  });

  it("Passo sem nenhuma Nota mostra só traços em todas as cordas", () => {
    const linhas = linhasSecao(secao([[]]));

    expect(linhas).toEqual(["e|--|", "B|--|", "G|--|", "D|--|", "A|--|", "E|--|"]);
  });

  it("mistura de cordas com e sem Nota no mesmo Passo", () => {
    const passo = [{ corda: 0, casa: 3 }, { corda: 5, casa: 0 }];
    const linhas = linhasSecao(secao([passo]));

    expect(linhas[0]).toBe("e|0-|"); // corda 5 = e
    expect(linhas[5]).toBe("E|3-|"); // corda 0 = E
    expect(linhas[1]).toBe("B|--|"); // corda 4 = B, sem Nota
  });
});
