import { describe, expect, it } from "vitest";
import { parseNota, simboloNota } from "./execucaoTablatura";
import type { Passo } from "@/types/tablatura";

describe("parseNota", () => {
  it("texto vazio retorna undefined (sem Nota)", () => {
    expect(parseNota("", 0)).toBeUndefined();
  });

  it("'x' retorna uma Nota abafada na corda dada", () => {
    expect(parseNota("x", 2)).toEqual({ corda: 2, tipo: "abafada" });
  });

  it("um inteiro puro retorna uma Nota tocada sem técnica", () => {
    expect(parseNota("5", 0)).toEqual({ corda: 0, casa: 5 });
  });

  it("'0' (corda solta) é uma casa válida", () => {
    expect(parseNota("0", 1)).toEqual({ corda: 1, casa: 0 });
  });

  it("inteiro + 'h' retorna Nota tocada com técnica ligadura", () => {
    expect(parseNota("5h", 0)).toEqual({ corda: 0, casa: 5, tecnica: "ligadura" });
  });

  it("inteiro + 'p' retorna Nota tocada com técnica ligadura", () => {
    expect(parseNota("5p", 0)).toEqual({ corda: 0, casa: 5, tecnica: "ligadura" });
  });

  it("inteiro + '/' retorna Nota tocada com técnica slide", () => {
    expect(parseNota("5/", 0)).toEqual({ corda: 0, casa: 5, tecnica: "slide" });
  });

  it("inteiro + '\\' retorna Nota tocada com técnica slide", () => {
    expect(parseNota("5\\", 0)).toEqual({ corda: 0, casa: 5, tecnica: "slide" });
  });

  it("inteiro + '~' retorna Nota tocada com técnica vibrato", () => {
    expect(parseNota("5~", 0)).toEqual({ corda: 0, casa: 5, tecnica: "vibrato" });
  });

  it("letra de sufixo desconhecida retorna undefined", () => {
    expect(parseNota("5b", 0)).toBeUndefined();
  });

  it("sufixo duplicado retorna undefined", () => {
    expect(parseNota("5hh", 0)).toBeUndefined();
    expect(parseNota("5h/", 0)).toBeUndefined();
  });

  it("número negativo retorna undefined", () => {
    expect(parseNota("-3", 0)).toBeUndefined();
  });

  it("número negativo com sufixo retorna undefined", () => {
    expect(parseNota("-3h", 0)).toBeUndefined();
  });

  it("texto sem sentido retorna undefined", () => {
    expect(parseNota("abc", 0)).toBeUndefined();
    expect(parseNota("5 h", 0)).toBeUndefined();
    expect(parseNota("xh", 0)).toBeUndefined();
  });
});

describe("simboloNota", () => {
  it("Nota abafada mostra 'x', ignorando o Passo seguinte", () => {
    expect(simboloNota({ corda: 0, tipo: "abafada" }, undefined)).toBe("x");
  });

  it("Nota tocada sem técnica mostra só a casa", () => {
    expect(simboloNota({ corda: 0, casa: 5 }, undefined)).toBe("5");
  });

  it("vibrato mostra '~' anexado, independente do Passo seguinte", () => {
    expect(simboloNota({ corda: 0, casa: 5, tecnica: "vibrato" }, undefined)).toBe("5~");
  });

  it("ligadura ascendente mostra 'h' quando a Nota seguinte tem casa maior", () => {
    const nota = { corda: 0, casa: 5, tecnica: "ligadura" as const };
    const passoSeguinte: Passo = [{ corda: 0, casa: 7 }];

    expect(simboloNota(nota, passoSeguinte)).toBe("5h");
  });

  it("ligadura descendente mostra 'p' quando a Nota seguinte tem casa menor", () => {
    const nota = { corda: 0, casa: 7, tecnica: "ligadura" as const };
    const passoSeguinte: Passo = [{ corda: 0, casa: 5 }];

    expect(simboloNota(nota, passoSeguinte)).toBe("7p");
  });

  it("slide ascendente mostra '/' quando a Nota seguinte tem casa maior", () => {
    const nota = { corda: 0, casa: 5, tecnica: "slide" as const };
    const passoSeguinte: Passo = [{ corda: 0, casa: 9 }];

    expect(simboloNota(nota, passoSeguinte)).toBe("5/");
  });

  it("slide descendente mostra '\\' quando a Nota seguinte tem casa menor", () => {
    const nota = { corda: 0, casa: 9, tecnica: "slide" as const };
    const passoSeguinte: Passo = [{ corda: 0, casa: 5 }];

    expect(simboloNota(nota, passoSeguinte)).toBe("9\\");
  });

  it("ligadura sem Passo seguinte mostra só a casa", () => {
    const nota = { corda: 0, casa: 5, tecnica: "ligadura" as const };

    expect(simboloNota(nota, undefined)).toBe("5");
  });

  it("ligadura sem Nota nesta corda no Passo seguinte mostra só a casa", () => {
    const nota = { corda: 0, casa: 5, tecnica: "ligadura" as const };
    const passoSeguinte: Passo = [{ corda: 1, casa: 3 }];

    expect(simboloNota(nota, passoSeguinte)).toBe("5");
  });

  it("ligadura com alvo abafado no Passo seguinte mostra só a casa", () => {
    const nota = { corda: 0, casa: 5, tecnica: "ligadura" as const };
    const passoSeguinte: Passo = [{ corda: 0, tipo: "abafada" }];

    expect(simboloNota(nota, passoSeguinte)).toBe("5");
  });

  it("slide sem Passo seguinte mostra só a casa", () => {
    const nota = { corda: 0, casa: 5, tecnica: "slide" as const };

    expect(simboloNota(nota, undefined)).toBe("5");
  });

  it("slide sem Nota nesta corda no Passo seguinte mostra só a casa", () => {
    const nota = { corda: 0, casa: 5, tecnica: "slide" as const };
    const passoSeguinte: Passo = [{ corda: 1, casa: 3 }];

    expect(simboloNota(nota, passoSeguinte)).toBe("5");
  });

  it("slide com alvo abafado no Passo seguinte mostra só a casa", () => {
    const nota = { corda: 0, casa: 5, tecnica: "slide" as const };
    const passoSeguinte: Passo = [{ corda: 0, tipo: "abafada" }];

    expect(simboloNota(nota, passoSeguinte)).toBe("5");
  });
});
