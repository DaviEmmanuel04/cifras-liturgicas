/**
 * Uma corda+casa dentro de um Passo. Corda: 0–5 (índice fixo de 6 cordas,
 * igual ao ChordShape). Casa: sempre absoluta (>= 0), sem `baseFret` — um
 * Passo não tem janela visual (ver ADR 0001).
 */
export type Nota = {
  corda: number;
  casa: number;
};

/**
 * Um instante dentro de uma Seção de Tablatura: fatia vertical com 0 a 6
 * Notas tocadas simultaneamente. Uma corda sem Nota num Passo simplesmente
 * não aparece no array — não é um sentinela tipo 'x' (isso fica reservado
 * pro trabalho futuro de técnicas de execução).
 */
export type Passo = Nota[];

/**
 * Uma sequência nomeada e ordenada de Passos dentro da Tablatura de uma
 * Música (ex. "Intro", "Solo"). A ordem do array já é a ordem de exibição.
 */
export type SecaoTablatura = {
  id: string;
  nome: string;
  passos: Passo[];
};

/**
 * Rótulos de corda, do grave (índice 0) ao agudo (índice 5) — mesma ordem do
 * ChordShape em dicionarioAcordes.ts. Compartilhado entre o editor admin
 * (TablaturaEditor) e a exibição pro visitante (TablaturaViewer).
 */
export const CORDAS_TABLATURA = ["E", "A", "D", "G", "B", "e"] as const;
