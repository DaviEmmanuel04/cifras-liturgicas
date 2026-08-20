import { describe, expect, it } from "vitest";
import { transporAcorde } from "./transposicao";

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
