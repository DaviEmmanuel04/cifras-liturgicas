import { describe, expect, it } from "vitest";
import { opcoesTransposicao, transporAcorde, transporCifra } from "./transposicao";

describe("transporAcorde", () => {
  it("retorna o próprio acorde quando semitons é 0", () => {
    expect(transporAcorde("C", 0)).toBe("C");
  });

  it("retorna string vazia/falsy sem alterações", () => {
    expect(transporAcorde("", 3)).toBe("");
  });

  it("transpõe para cima dentro da mesma oitava (sustenidos)", () => {
    expect(transporAcorde("C", 2)).toBe("D");
    expect(transporAcorde("G", 1)).toBe("G#");
  });

  it("transpõe para baixo, dando a volta pelo início da escala", () => {
    expect(transporAcorde("C", -1)).toBe("B");
  });

  it("preserva o sufixo do acorde (ex. m7, sus4)", () => {
    expect(transporAcorde("Am7", 2)).toBe("Bm7");
    expect(transporAcorde("Csus4", 2)).toBe("Dsus4");
  });

  it("preserva a grafia em bemol ao transpor", () => {
    expect(transporAcorde("Db", 1)).toBe("D");
    expect(transporAcorde("Eb", -1)).toBe("D");
  });

  it("transpõe cada lado de um acorde com baixo invertido (ex. C/E)", () => {
    expect(transporAcorde("C/E", 2)).toBe("D/F#");
  });

  it("dá a volta corretamente com deslocamentos maiores que uma oitava", () => {
    expect(transporAcorde("C", 12)).toBe("C");
    expect(transporAcorde("C", -12)).toBe("C");
  });
});

describe("transporCifra", () => {
  it("retorna o texto inalterado quando não há nenhum acorde entre colchetes", () => {
    const texto = "Refrão:\nSenhor, tende piedade de nós.";
    expect(transporCifra(texto, 2)).toBe(texto);
  });

  it("reescreve cada acorde reconhecido no texto para o tom transposto", () => {
    const texto = "[C] Senhor, tende [G] pie[Am]dade";
    expect(transporCifra(texto, 2)).toBe("[D] Senhor, tende [A] pie[Bm]dade");
  });

  it("mantém um token não reconhecido como acorde inalterado, sem quebrar o texto", () => {
    const texto = "[Solo] [C] Glória a Deus [G]";
    expect(transporCifra(texto, 2)).toBe("[Solo] [D] Glória a Deus [A]");
  });

  it("retorna string vazia/falsy sem alterações", () => {
    expect(transporCifra("", 3)).toBe("");
  });
});

describe("opcoesTransposicao", () => {
  it("retorna as 12 opções de tom a partir da nota raiz, marcando a original com semitons 0", () => {
    const opcoes = opcoesTransposicao("C");
    expect(opcoes).toHaveLength(12);
    expect(opcoes.find((o) => o.semitons === 0)).toMatchObject({ label: "⭐ C" });
    expect(opcoes.find((o) => o.semitons === 2)).toMatchObject({ label: "D" });
  });

  it("preserva o sufixo do tom original (ex. Am) em cada opção", () => {
    const opcoes = opcoesTransposicao("Am");
    expect(opcoes.find((o) => o.semitons === 2)).toMatchObject({ label: "Bm" });
  });

  it("retorna lista vazia quando não há tom informado", () => {
    expect(opcoesTransposicao("")).toEqual([]);
  });
});
