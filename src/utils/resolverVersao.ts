import type { Musica } from "@/types/musica";
import type { Versao } from "@/types/versao";

/**
 * O conteúdo exibível de uma Versão: Tom, Cifra e Tablatura — sem os campos
 * de identidade/rótulo/auditoria da Versão de onde veio (ou sem os
 * equivalentes de topo da própria Música, quando a coleção de Versões ainda
 * não existe).
 */
export type ConteudoVersao = Pick<
  Versao,
  "tom" | "letraCifra" | "tablaturas" | "videoReferencia" | "videoReferenciaSuprimida" | "capotraste"
>;

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
function resolverVersaoEfetiva(musica: Musica, versaoId?: string): Versao | undefined {
  const versoes = musica.versoes;
  if (!versoes || versoes.length === 0) return undefined;

  const versaoSelecionada = versaoId ? versoes.find((versao) => versao.id === versaoId) : undefined;
  const versaoPrincipal = versoes.find((versao) => versao.id === musica.versaoPrincipalId) ?? versoes[0];
  return versaoSelecionada ?? versaoPrincipal;
}

export function resolverConteudoVersao(musica: Musica, versaoId?: string): ConteudoVersao {
  const versao = resolverVersaoEfetiva(musica, versaoId);
  if (!versao) {
    return {
      tom: musica.tom,
      letraCifra: musica.letraCifra,
      tablaturas: musica.tablaturas,
      videoReferencia: musica.videoReferencia,
      videoReferenciaSuprimida: musica.videoReferenciaSuprimida,
      capotraste: musica.capotraste,
    };
  }

  return {
    tom: versao.tom,
    letraCifra: versao.letraCifra,
    tablaturas: versao.tablaturas,
    videoReferencia: versao.videoReferencia,
    videoReferenciaSuprimida: versao.videoReferenciaSuprimida,
    capotraste: versao.capotraste,
  };
}

/**
 * Vídeo de Referência efetivamente exibido pra Música/Versão dada: o próprio
 * da Versão resolvida (ou da implícita, sem `versaoId`), se houver; nenhum,
 * se ela suprimiu explicitamente o padrão; senão, o Vídeo de Referência
 * Padrão da Música. Ver CONTEXT.md, "Vídeo de Referência" e "Vídeo de
 * Referência Padrão".
 *
 * Pura — não depende de Firestore nem de UI.
 */
export function resolverVideoReferencia(musica: Musica, versaoId?: string): string | undefined {
  const conteudo = resolverConteudoVersao(musica, versaoId);
  if (conteudo.videoReferencia) return conteudo.videoReferencia;
  if (conteudo.videoReferenciaSuprimida) return undefined;
  return musica.videoReferenciaPadrao;
}

/**
 * Id da Versão que `resolverConteudoVersao` efetivamente usaria — pra UI que
 * precisa saber qual destacar (ex. o seletor público), sem duplicar a lógica
 * de fallback. `undefined` quando a coleção `versoes` não existe, já que aí
 * não há id de Versão nenhum a destacar.
 */
export function resolverVersaoIdEfetivo(musica: Musica, versaoId?: string): string | undefined {
  return resolverVersaoEfetiva(musica, versaoId)?.id;
}
