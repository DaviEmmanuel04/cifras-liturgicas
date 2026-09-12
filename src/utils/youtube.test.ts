import { describe, expect, it } from "vitest";
import { extrairIdYoutube, urlAssistirYoutube, urlEmbedYoutube } from "./youtube";

const ID = "dQw4w9WgXcQ";

describe("extrairIdYoutube", () => {
  it("aceita o id puro, colado diretamente", () => {
    expect(extrairIdYoutube(ID)).toBe(ID);
  });

  it("aceita a URL de assistir (watch?v=)", () => {
    expect(extrairIdYoutube(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it("aceita a URL de assistir sem www.", () => {
    expect(extrairIdYoutube(`https://youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it("aceita a URL de assistir com parâmetros extras (ex. lista de reprodução)", () => {
    expect(extrairIdYoutube(`https://www.youtube.com/watch?v=${ID}&list=PL123&t=42s`)).toBe(ID);
  });

  it("aceita o link curto youtu.be", () => {
    expect(extrairIdYoutube(`https://youtu.be/${ID}`)).toBe(ID);
  });

  it("aceita shorts", () => {
    expect(extrairIdYoutube(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
  });

  it("aceita embed", () => {
    expect(extrairIdYoutube(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
  });

  it("aceita live", () => {
    expect(extrairIdYoutube(`https://www.youtube.com/live/${ID}`)).toBe(ID);
  });

  it("aceita o domínio m.youtube.com (versão mobile)", () => {
    expect(extrairIdYoutube(`https://m.youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it("ignora espaços em volta do texto", () => {
    expect(extrairIdYoutube(`  https://youtu.be/${ID}  `)).toBe(ID);
  });

  it("texto vazio: undefined", () => {
    expect(extrairIdYoutube("")).toBeUndefined();
    expect(extrairIdYoutube("   ")).toBeUndefined();
  });

  it("URL de outro site: undefined", () => {
    expect(extrairIdYoutube("https://vimeo.com/12345678")).toBeUndefined();
  });

  it("texto que não é uma URL nem um id válido: undefined", () => {
    expect(extrairIdYoutube("essa música é linda")).toBeUndefined();
  });

  it("URL do YouTube sem id reconhecível (home page): undefined", () => {
    expect(extrairIdYoutube("https://www.youtube.com/")).toBeUndefined();
  });
});

describe("urlAssistirYoutube / urlEmbedYoutube", () => {
  it("gera a URL canônica de assistir a partir do id", () => {
    expect(urlAssistirYoutube(ID)).toBe(`https://www.youtube.com/watch?v=${ID}`);
  });

  it("gera a URL de embed a partir do id", () => {
    expect(urlEmbedYoutube(ID)).toBe(`https://www.youtube.com/embed/${ID}`);
  });

  it("id extraído de qualquer formato reconstrói pra mesma URL de assistir", () => {
    const extraido = extrairIdYoutube(`https://youtu.be/${ID}`)!;
    expect(urlAssistirYoutube(extraido)).toBe(`https://www.youtube.com/watch?v=${ID}`);
  });
});
