import { describe, expect, it } from "vitest";
import {
  acordeExibido,
  opcoesCapotraste,
  opcoesTransposicao,
  transporAcorde,
  transporAcordeComCapotraste,
  transporCifra,
  transporCifraComCapotraste,
} from "./transposicao";

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

describe("transporAcordeComCapotraste", () => {
  it("capotraste 0 é no-op: a forma retornada é idêntica ao tom atual recebido", () => {
    expect(transporAcordeComCapotraste("D", 0)).toBe("D");
  });

  it("rebaixa a forma pelo tanto de casas do capotraste", () => {
    expect(transporAcordeComCapotraste("D", 2)).toBe("C");
  });

  it("compõe corretamente sobre um tom atual já transposto por semitons", () => {
    const tomAtual = transporAcorde("C", 2); // preview de +2 semitons já aplicado
    expect(transporAcordeComCapotraste(tomAtual, 2)).toBe("C");
  });

  it("retorna string vazia/falsy sem alterações", () => {
    expect(transporAcordeComCapotraste("", 3)).toBe("");
  });
});

describe("transporCifraComCapotraste", () => {
  it("capotraste 0 é no-op: a Cifra retornada é idêntica à recebida", () => {
    const texto = "[D] Senhor, tende [A] piedade";
    expect(transporCifraComCapotraste(texto, 0)).toBe(texto);
  });

  it("rebaixa cada acorde reconhecido pelo tanto de casas do capotraste", () => {
    expect(transporCifraComCapotraste("[D] Senhor, tende [A] piedade", 2)).toBe("[C] Senhor, tende [G] piedade");
  });

  it("retorna o texto inalterado quando não há nenhum acorde entre colchetes", () => {
    const texto = "Refrão:\nSenhor, tende piedade de nós.";
    expect(transporCifraComCapotraste(texto, 2)).toBe(texto);
  });

  it("mantém um token não reconhecido como acorde inalterado, sem quebrar o texto", () => {
    const texto = "[Solo] [D] Glória a Deus [A]";
    expect(transporCifraComCapotraste(texto, 2)).toBe("[Solo] [C] Glória a Deus [G]");
  });
});

describe("acordeExibido", () => {
  it("compõe semitons e capotraste em cadeia sobre o acorde original", () => {
    // C +2 semitons (Tom atual) = D; D com capotraste na 2ª casa = C.
    expect(acordeExibido("C", 2, 2)).toBe("C");
  });

  it("semitons 0 e capotraste 0: retorna o próprio acorde original", () => {
    expect(acordeExibido("G", 0, 0)).toBe("G");
  });

  it("só capotraste, sem semitons: rebaixa a forma pelo tanto de casas", () => {
    expect(acordeExibido("D", 0, 2)).toBe("C");
  });

  it("mantém um token não reconhecido como acorde inalterado", () => {
    expect(acordeExibido("Solo", 2, 2)).toBe("Solo");
  });
});

describe("opcoesCapotraste", () => {
  it("retorna 8 opções: 'Sem capotraste' (0) até a 7ª casa", () => {
    const opcoes = opcoesCapotraste();
    expect(opcoes).toHaveLength(8);
    expect(opcoes[0]).toEqual({ valor: 0, label: "Sem capotraste" });
    expect(opcoes[7]).toEqual({ valor: 7, label: "7ª casa" });
  });

  it("numera as casas intermediárias em ordem", () => {
    const opcoes = opcoesCapotraste();
    expect(opcoes[1]).toEqual({ valor: 1, label: "1ª casa" });
    expect(opcoes[3]).toEqual({ valor: 3, label: "3ª casa" });
  });
});
