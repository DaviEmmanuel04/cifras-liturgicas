import { normalizarTexto } from "./busca";

/**
 * Categorias usadas enquanto `config/categorias` não existe no Firestore (ou
 * ainda não está no cache offline do aparelho). O documento só é criado na
 * primeira vez que o admin altera a lista.
 */
export const CATEGORIAS_PADRAO: readonly string[] = [
  "Entrada", "Ato Penitencial", "Glória", "Salmo", "Aclamação ao Evangelho", "Ofertório", "Santo",
  "Comunhão", "Ação de Graças", "Final", "Adoração", "Terço", "Festa de Santo Antônio",
  "Festa do Sagrado Coração de Jesus", "Outros",
];

/** Converte o documento `config/categorias` na lista ordenada, caindo no padrão se ausente ou inválido. */
export function categoriasDeFirestore(data: unknown): string[] {
  const lista = (data as { lista?: unknown } | undefined)?.lista;
  if (!Array.isArray(lista)) return [...CATEGORIAS_PADRAO];
  const nomes = lista.filter((n): n is string => typeof n === "string" && n.trim() !== "");
  return nomes.length > 0 ? nomes : [...CATEGORIAS_PADRAO];
}

export type ResultadoCategorias = { ok: true; lista: string[] } | { ok: false; erro: string };

/** Adiciona `nome` ao fim da lista. Rejeita vazio e duplicata (ignorando acentos e maiúsculas). */
export function adicionarCategoria(lista: readonly string[], nome: string): ResultadoCategorias {
  const limpo = nome.trim().replace(/\s+/g, " ");
  if (!limpo) return { ok: false, erro: "Informe o nome da categoria." };
  const existente = lista.find(c => normalizarTexto(c) === normalizarTexto(limpo));
  if (existente) return { ok: false, erro: `A categoria "${existente}" já existe.` };
  return { ok: true, lista: [...lista, limpo] };
}

/** Remove `nome`, a menos que alguma Música ainda o use. */
export function removerCategoria(lista: readonly string[], nome: string, musicasUsando: number): ResultadoCategorias {
  if (musicasUsando > 0) {
    const plural = musicasUsando === 1 ? "1 música usa" : `${musicasUsando} músicas usam`;
    return { ok: false, erro: `Não é possível excluir "${nome}": ${plural} essa categoria.` };
  }
  return { ok: true, lista: lista.filter(c => c !== nome) };
}

/**
 * Ordena `nomes` pela ordem das categorias cadastradas. Nomes fora do cadastro
 * (músicas antigas com categoria removida) vão para o fim, em ordem alfabética.
 */
export function ordenarPorCategorias(nomes: readonly string[], ordem: readonly string[]): string[] {
  const posicao = new Map(ordem.map((c, i) => [c, i]));
  return [...nomes].sort((a, b) => {
    const pa = posicao.get(a) ?? Infinity;
    const pb = posicao.get(b) ?? Infinity;
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b, "pt-BR");
  });
}

/** Opções do seletor de categoria de uma Música: garante que a categoria atual apareça mesmo fora do cadastro. */
export function opcoesDeCategoria(lista: readonly string[], atual: string): string[] {
  return atual && !lista.includes(atual) ? [...lista, atual] : [...lista];
}
