import { describe, expect, it } from "vitest";
import { tablaturasDeFirestore, tablaturasParaFirestore } from "./tablaturaFirestore";
import type { SecaoTablatura } from "@/types/tablatura";

describe("tablaturasParaFirestore", () => {
  it("envolve cada Passo num objeto, pra `passos` não ficar como array-de-array", () => {
    const secoes: SecaoTablatura[] = [
      { id: "s1", nome: "Intro", passos: [[{ corda: 0, casa: 3 }], [{ corda: 1, casa: 5 }]] },
    ];

    const resultado = tablaturasParaFirestore(secoes);

    expect(resultado).toEqual([
      {
        id: "s1",
        nome: "Intro",
        passos: [{ notas: [{ corda: 0, casa: 3 }] }, { notas: [{ corda: 1, casa: 5 }] }],
      },
    ]);
    // Nenhum elemento de `passos` pode ser, ele mesmo, um array.
    for (const secao of resultado) {
      for (const passo of secao.passos) {
        expect(Array.isArray(passo)).toBe(false);
      }
    }
  });

  it("preserva um Passo vazio (sem Notas) como `{ notas: [] }`", () => {
    const secoes: SecaoTablatura[] = [{ id: "s1", nome: "Intro", passos: [[]] }];

    expect(tablaturasParaFirestore(secoes)).toEqual([
      { id: "s1", nome: "Intro", passos: [{ notas: [] }] },
    ]);
  });

  it("preserva uma Seção sem nenhum Passo", () => {
    const secoes: SecaoTablatura[] = [{ id: "s1", nome: "Intro", passos: [] }];

    expect(tablaturasParaFirestore(secoes)).toEqual([{ id: "s1", nome: "Intro", passos: [] }]);
  });
});

describe("tablaturasDeFirestore", () => {
  it("desfaz o envelope de `paraFirestore`, restaurando `passos: Passo[]`", () => {
    const bruto = [
      {
        id: "s1",
        nome: "Intro",
        passos: [{ notas: [{ corda: 0, casa: 3 }] }, { notas: [{ corda: 1, casa: 5 }] }],
      },
    ];

    const resultado: SecaoTablatura[] = tablaturasDeFirestore(bruto);

    expect(resultado).toEqual([
      { id: "s1", nome: "Intro", passos: [[{ corda: 0, casa: 3 }], [{ corda: 1, casa: 5 }]] },
    ]);
  });

  it("é a inversa de paraFirestore (round-trip)", () => {
    const secoes: SecaoTablatura[] = [
      { id: "s1", nome: "Intro", passos: [[{ corda: 0, casa: 3 }, { corda: 5, casa: 0 }], []] },
      { id: "s2", nome: "Solo", passos: [] },
    ];

    expect(tablaturasDeFirestore(tablaturasParaFirestore(secoes))).toEqual(secoes);
  });

  it("retorna array vazio quando o campo não existe (documento antigo)", () => {
    expect(tablaturasDeFirestore(undefined)).toEqual([]);
    expect(tablaturasDeFirestore(null)).toEqual([]);
  });

  it("aceita um Passo já no formato cru (array direto, sem o envelope `notas`)", () => {
    const bruto = [{ id: "s1", nome: "Intro", passos: [[{ corda: 0, casa: 3 }]] }];

    expect(tablaturasDeFirestore(bruto)).toEqual([
      { id: "s1", nome: "Intro", passos: [[{ corda: 0, casa: 3 }]] },
    ]);
  });
});
