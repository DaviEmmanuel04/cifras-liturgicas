import { describe, expect, it } from "vitest";
import { buscarMusicasParaRepertorio, ordenarPelaMissa } from "./seletorMusicas";

const ordem = ["Entrada", "Glória", "Comunhão", "Final"];

const musicas = [
  { id: "c1", titulo: "Pão da Vida", categoria: "Comunhão", letraCifra: "[C]Eu sou o pão [G]vivo" },
  { id: "e2", titulo: "Vem, Espírito", categoria: "Entrada", artista: "Ministério Ágape" },
  { id: "g1", titulo: "Glória a Deus", categoria: "Glória", tempo: "Tempo Comum" },
  { id: "e1", titulo: "A Barca", categoria: "Entrada" },
  { id: "x1", titulo: "Antiga", categoria: "Categoria removida" },
];

const ids = (lista: { id: string }[]) => lista.map((m) => m.id);

describe("buscarMusicasParaRepertorio", () => {
  it("sem filtro, ordena pela missa e depois pelo título", () => {
    expect(ids(buscarMusicasParaRepertorio(musicas, { busca: "", categoria: null }, ordem))).toEqual([
      "e1", "e2", "g1", "c1", "x1",
    ]);
  });

  it("filtra por categoria", () => {
    expect(ids(buscarMusicasParaRepertorio(musicas, { busca: "", categoria: "Entrada" }, ordem))).toEqual(["e1", "e2"]);
  });

  it("busca sem acento no título e no artista", () => {
    expect(ids(buscarMusicasParaRepertorio(musicas, { busca: "gloria", categoria: null }, ordem))).toEqual(["g1"]);
    expect(ids(buscarMusicasParaRepertorio(musicas, { busca: "agape", categoria: null }, ordem))).toEqual(["e2"]);
  });

  it("busca por trecho da letra, ignorando acordes", () => {
    expect(ids(buscarMusicasParaRepertorio(musicas, { busca: "pão vivo", categoria: null }, ordem))).toEqual(["c1"]);
  });

  it("combina busca e categoria", () => {
    expect(ids(buscarMusicasParaRepertorio(musicas, { busca: "barca", categoria: "Glória" }, ordem))).toEqual([]);
  });
});

describe("ordenarPelaMissa", () => {
  it("ordena pelas categorias mantendo a ordem dentro de cada uma", () => {
    expect(ordenarPelaMissa(["c1", "e2", "x1", "g1", "e1"], musicas, ordem)).toEqual(["e2", "e1", "g1", "c1", "x1"]);
  });

  it("id desconhecido vai para o fim", () => {
    expect(ordenarPelaMissa(["sumiu", "c1", "e1"], musicas, ordem)).toEqual(["e1", "c1", "sumiu"]);
  });
});
