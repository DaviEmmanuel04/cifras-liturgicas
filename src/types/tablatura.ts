/**
 * Uma Técnica de Execução opcional numa Nota tocada: Ligadura (hammer-on/
 * pull-off, direção sempre derivada — nunca armazenada), Slide (idem,
 * direção derivada), ou Vibrato (flag pura, sem relação com outra Nota).
 * Ver CONTEXT.md e docs/adr/0002-nota-abafada-como-variante-discriminada.md.
 */
export type Tecnica = "ligadura" | "slide" | "vibrato";

/**
 * Uma Nota com altura definida: corda+casa, com Técnica de Execução opcional.
 * Este shape é o mesmo já salvo no Firestore antes da união discriminada —
 * sem migração necessária.
 */
export type NotaTocada = {
  corda: number;
  casa: number;
  tecnica?: Tecnica;
};

/**
 * Uma Nota percussiva sem altura definida (corda abafada / dead note). Não
 * tem `casa` — estruturalmente não pode ser confundida com uma Nota tocada
 * nem carregar uma Técnica de Execução (ver ADR 0002).
 */
export type NotaAbafada = {
  corda: number;
  tipo: "abafada";
};

/**
 * Uma corda+casa (ou corda abafada) dentro de um Passo. Corda: 0–5 (índice
 * fixo de 6 cordas, igual ao ChordShape). Casa (quando tocada): sempre
 * absoluta (>= 0), sem `baseFret` — um Passo não tem janela visual (ver ADR
 * 0001).
 */
export type Nota = NotaTocada | NotaAbafada;

/**
 * Discrimina uma Nota abafada de uma Nota tocada. Use antes de acessar
 * `casa`/`tecnica` — só a variante tocada os possui.
 */
export function ehNotaAbafada(nota: Nota): nota is NotaAbafada {
  return "tipo" in nota;
}

/**
 * Um instante dentro de uma Seção de Tablatura: fatia vertical com 0 a 6
 * Notas tocadas simultaneamente. Uma corda sem Nota num Passo simplesmente
 * não aparece no array — não é um sentinela tipo 'x' (isso é NotaAbafada,
 * que ocupa um slot no Passo como qualquer Nota).
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

/**
 * Índices de CORDAS_TABLATURA na ordem de exibição em tela/impressão: agudo
 * (e) no topo, grave (E) na base — convenção padrão de tablatura, inversa à
 * ordem de armazenamento acima (que vai do grave ao agudo). Só a ordem das
 * linhas na tela inverte; o índice de corda salvo em cada Nota não muda.
 * Compartilhado entre TablaturaViewer e TablaturaEditor pra manter a mesma
 * ordem visual nos dois — o admin cadastra vendo a mesma ordem que será
 * exibida publicamente.
 */
export const ORDEM_EXIBICAO_TABLATURA: readonly number[] = [...CORDAS_TABLATURA.keys()].reverse();
