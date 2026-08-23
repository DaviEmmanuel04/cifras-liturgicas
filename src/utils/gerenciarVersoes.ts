import type { Versao } from "@/types/versao";
import type { ConteudoVersao } from "@/utils/resolverVersao";

/**
 * Aplica `patch` (rótulo e/ou conteúdo) só na Versão de id `versaoId`,
 * preenchendo auditoria de alteração; as demais Versões da coleção saem
 * intactas. Usada tanto pra renomear uma Versão quanto pra manter a Versão
 * Principal sincronizada com o formulário normal de edição da Música (ver
 * docs/adr/0003-versao-como-array-embutido-com-backfill-preguicoso.md).
 * Pura — não depende de Firestore nem de UI.
 */
export function atualizarVersao(
  versoes: Versao[],
  versaoId: string,
  patch: Partial<Pick<Versao, "rotulo" | "tom" | "letraCifra" | "tablaturas">>,
  autor: string,
  agora: string
): Versao[] {
  return versoes.map((versao) =>
    versao.id === versaoId ? { ...versao, ...patch, modificadoPor: autor, modificadoEm: agora } : versao
  );
}

/**
 * Promove a Versão `versaoId` a Principal: retorna o conteúdo dela, pra o
 * chamador espelhar nos campos de topo da Música (que sempre refletem a
 * Principal) e atualizar `versaoPrincipalId`. Não modifica a coleção
 * `versoes` — nenhum id é destruído ou reaproveitado na troca.
 * Pura — não depende de Firestore nem de UI.
 */
export function promoverVersaoPrincipal(versoes: Versao[], versaoId: string): ConteudoVersao {
  const versao = versoes.find((v) => v.id === versaoId);
  if (!versao) throw new Error(`Versão "${versaoId}" não encontrada.`);

  return { tom: versao.tom, letraCifra: versao.letraCifra, tablaturas: versao.tablaturas };
}

export type AvaliacaoExclusaoVersao = { permitido: true } | { permitido: false; motivo: string };

/**
 * Decide se a Versão `versaoId` pode ser apagada:
 * - bloqueada se for a Principal e existir qualquer outra Versão (a Música
 *   nunca pode ficar sem Principal enquanto há mais de uma Versão — promova
 *   outra primeiro);
 * - bloqueada se `repertoriosFixando` (nomes dos repertórios que fixam essa
 *   Versão em algum item, ver [[repertoriosComVersaoFixada]]) não for vazio;
 * - permitida nos demais casos — inclusive apagar a última Versão restante,
 *   o que deixa a coleção vazia e reverte a Música pro modo implícito de
 *   versão única (`resolverConteudoVersao` já trata `versoes` vazio assim).
 * Pura — não depende de Firestore nem de UI.
 */
export function avaliarExclusaoVersao(
  versaoPrincipalId: string | undefined,
  versaoId: string,
  totalVersoes: number,
  repertoriosFixando: string[]
): AvaliacaoExclusaoVersao {
  if (versaoId === versaoPrincipalId && totalVersoes > 1) {
    return {
      permitido: false,
      motivo: "Não é possível apagar a Versão Principal enquanto houver outras Versões. Promova outra Versão a Principal antes.",
    };
  }

  if (repertoriosFixando.length > 0) {
    return {
      permitido: false,
      motivo: `Esta Versão está fixada no(s) repertório(s): ${repertoriosFixando.join(", ")}. Desvincule antes de apagar.`,
    };
  }

  return { permitido: true };
}

/** Forma mínima de um Repertório relevante pra [[repertoriosComVersaoFixada]] — não o tipo completo do domínio. */
export type RepertorioComVersoesFixadas = {
  id: string;
  nome?: string;
  /**
   * Música → Versão fixada nesse item de Repertório. Ausente em todo
   * documento até o ticket 6 (Repertório fixa Versão) passar a gravá-lo —
   * até lá, a busca abaixo sempre retorna vazio.
   */
  versoesFixadas?: Record<string, string>;
};

/**
 * Nomes dos repertórios que fixam a Versão `versaoId` em alguma de suas
 * músicas — usada pra bloquear a exclusão de uma Versão referenciada (ver
 * [[avaliarExclusaoVersao]]). Pura — não depende de Firestore; quem chama
 * busca os repertórios e passa aqui.
 */
export function repertoriosComVersaoFixada(repertorios: RepertorioComVersoesFixadas[], versaoId: string): string[] {
  return repertorios
    .filter((repertorio) => Object.values(repertorio.versoesFixadas ?? {}).includes(versaoId))
    .map((repertorio) => repertorio.nome || repertorio.id);
}
