import { generateId } from "@/utils/cifraParser";
import type { ConteudoVersao } from "@/utils/resolverVersao";
import type { Versao } from "@/types/versao";

export type CriarSegundaVersaoParams = {
  /** Conteúdo já salvo da Música (a Versão até então implícita). Vira a Versão existente, e continua Principal. */
  conteudoAtual: ConteudoVersao;
  /** Conteúdo da cópia editada livremente pelo admin. Vira a Versão nova. */
  conteudoNovo: ConteudoVersao;
  rotuloVersaoExistente: string;
  rotuloVersaoNova: string;
  autor: string;
  /** Timestamp ISO da operação, injetado pelo chamador — mantém a função sem `Date.now()` interno. */
  agora: string;
};

export type CriarSegundaVersaoResultado = {
  versoes: [Versao, Versao];
  versaoPrincipalId: string;
};

/**
 * Transforma uma Música de Versão única em duas Versões nomeadas: a que já
 * existia (com `conteudoAtual`) continua a Principal, e a cópia editada
 * (`conteudoNovo`) nasce como a segunda. Ids nunca colidem entre as duas.
 * Pura — não depende de Firestore nem de UI; quem chama decide `autor` e
 * `agora`.
 */
export function criarSegundaVersao(params: CriarSegundaVersaoParams): CriarSegundaVersaoResultado {
  const { conteudoAtual, conteudoNovo, rotuloVersaoExistente, rotuloVersaoNova, autor, agora } = params;

  const versaoExistente: Versao = {
    id: generateId("versao"),
    rotulo: rotuloVersaoExistente,
    ...conteudoAtual,
    criadoPor: autor,
    criadoEm: agora,
    modificadoPor: autor,
    modificadoEm: agora,
  };

  const versaoNova: Versao = {
    id: generateId("versao"),
    rotulo: rotuloVersaoNova,
    ...conteudoNovo,
    criadoPor: autor,
    criadoEm: agora,
    modificadoPor: autor,
    modificadoEm: agora,
  };

  return {
    versoes: [versaoExistente, versaoNova],
    versaoPrincipalId: versaoExistente.id,
  };
}
