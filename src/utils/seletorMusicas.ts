import { correspondeBusca } from "@/utils/busca";
import { removerFormatacao } from "@/utils/formatacaoCifra";
import type { Musica } from "@/types/musica";

type MusicaBuscavel = Pick<Musica, "id" | "titulo" | "categoria"> & Partial<Pick<Musica, "artista" | "tempo" | "letraCifra">>;

const posicaoNaMissa = (ordem: readonly string[]) => {
  const posicao = new Map(ordem.map((c, i) => [c, i]));
  return (categoria: string) => posicao.get(categoria) ?? Infinity;
};

/** Letra sem acordes nem marcadores, para buscar por um trecho cantado. */
const letraPura = (letraCifra?: string) => removerFormatacao(letraCifra ?? "").replace(/\[.*?\]/g, "");

/**
 * Músicas para o seletor do Repertório: filtra pela busca (título, artista,
 * categoria, tempo e letra, ignorando acentos) e pela categoria, e ordena pela
 * ordem da missa e depois pelo título.
 */
export function buscarMusicasParaRepertorio<T extends MusicaBuscavel>(
  musicas: readonly T[],
  { busca, categoria }: { busca: string; categoria: string | null },
  ordemCategorias: readonly string[]
): T[] {
  const posicao = posicaoNaMissa(ordemCategorias);
  return musicas
    .filter((m) => !categoria || m.categoria === categoria)
    .filter((m) => correspondeBusca(busca, m.titulo, m.artista, m.categoria, m.tempo, letraPura(m.letraCifra)))
    .sort((a, b) => posicao(a.categoria) - posicao(b.categoria) || a.titulo.localeCompare(b.titulo, "pt-BR"));
}

/**
 * Reordena os itens de um Repertório pela ordem da missa (ordem das
 * categorias). Itens da mesma categoria mantêm a ordem em que estavam; ids sem
 * música conhecida vão para o fim.
 */
export function ordenarPelaMissa(
  ids: readonly string[],
  musicas: readonly MusicaBuscavel[],
  ordemCategorias: readonly string[]
): string[] {
  const posicao = posicaoNaMissa(ordemCategorias);
  const categoriaDe = new Map(musicas.map((m) => [m.id, m.categoria]));
  const chave = (id: string) => (categoriaDe.has(id) ? posicao(categoriaDe.get(id)!) : Infinity);
  // sort é estável: empates preservam a ordem atual
  return [...ids].sort((a, b) => {
    const ka = chave(a);
    const kb = chave(b);
    return ka === kb ? 0 : ka < kb ? -1 : 1;
  });
}
