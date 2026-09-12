import { generateId } from "@/utils/cifraParser";
import type { ConteudoVersao } from "@/utils/resolverVersao";
import { transporAcorde, transporCifra } from "@/utils/transposicao";
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

/**
 * Conteúdo de uma Versão nova a partir do preview transposto do fluxo
 * "salvar em outro tom": Tom e Cifra reescritos por `semitons`
 * (`transporAcorde`/`transporCifra`), Tablatura copiada sem alteração de
 * casas (deslocar fret automaticamente quebra em cordas soltas — ver
 * docs/adr/0003-versao-como-array-embutido-com-backfill-preguicoso.md).
 * Nunca herda o Capotraste de `conteudoAtual` — a Versão nova nasce sem
 * capotraste definido, decisão independente da Versão de origem, mesmo que
 * ela tenha um definido (ver
 * docs/adr/0005-capotraste-como-camada-independente-de-exibicao.md).
 * Pura — não depende de Firestore nem de UI.
 */
export function conteudoVersaoTransposta(conteudoAtual: ConteudoVersao, semitons: number): ConteudoVersao {
  return {
    tom: transporAcorde(conteudoAtual.tom, semitons),
    letraCifra: transporCifra(conteudoAtual.letraCifra, semitons),
    tablaturas: conteudoAtual.tablaturas,
  };
}
