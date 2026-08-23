import type { Musica } from "@/types/musica";
import type { Versao } from "@/types/versao";

/**
 * O conteúdo exibível de uma Versão: Tom, Cifra e Tablatura — sem os campos
 * de identidade/rótulo/auditoria da Versão de onde veio (ou sem os
 * equivalentes de topo da própria Música, quando a coleção de Versões ainda
 * não existe).
 */
export type ConteudoVersao = Pick<Versao, "tom" | "letraCifra" | "tablaturas">;

/**
 * Decide qual conteúdo mostrar pra uma Música, dado um identificador de
 * Versão opcional (ex. vindo de um parâmetro de URL, ou de uma Versão
 * fixada num item de Repertório):
 * - sem `versaoId`, ou a coleção `versoes` ainda não existe: conteúdo da
 *   Principal — dos campos de topo da Música quando a coleção não existe,
 *   ou da Versão marcada como principal quando existe.
 * - com um `versaoId` de uma Versão que ainda existe em `versoes`: o
 *   conteúdo dela.
 * - com um `versaoId` que não corresponde a nenhuma Versão em `versoes`
 *   (ex. link salvo pra uma Versão já apagada): cai pra Principal sem erro.
 *
 * Pura — não depende de Firestore nem de UI.
 */
export function resolverConteudoVersao(musica: Musica, versaoId?: string): ConteudoVersao {
  const versoes = musica.versoes;

  if (!versoes || versoes.length === 0) {
    return { tom: musica.tom, letraCifra: musica.letraCifra, tablaturas: musica.tablaturas };
  }

  const versaoSelecionada = versaoId ? versoes.find((versao) => versao.id === versaoId) : undefined;
  const versaoPrincipal = versoes.find((versao) => versao.id === musica.versaoPrincipalId) ?? versoes[0];
  const versao = versaoSelecionada ?? versaoPrincipal;

  return { tom: versao.tom, letraCifra: versao.letraCifra, tablaturas: versao.tablaturas };
}
