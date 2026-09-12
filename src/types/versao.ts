import type { SecaoTablatura } from "@/types/tablatura";

/**
 * Uma Versão: registro de conteúdo independente de uma Música — Tom, Cifra e
 * Tablatura próprios — identificado por um rótulo de texto livre, mais
 * metadados de auditoria (quem/quando criou e alterou). Ids nunca são
 * reciclados nem destruídos ao promover outra Versão a Principal — é o que
 * mantém uma referência externa por `id` (ex. um item de Repertório) válida.
 * Ver CONTEXT.md e docs/adr/0003-versao-como-array-embutido-com-backfill-preguicoso.md.
 */
export type Versao = {
  id: string;
  rotulo: string;
  tom: string;
  letraCifra: string;
  tablaturas?: SecaoTablatura[];
  /**
   * Id do vídeo de referência do YouTube próprio desta Versão (ver
   * CONTEXT.md, "Vídeo de Referência"). Vazio/ausente significa que esta
   * Versão não tem vídeo próprio — nesse caso, `videoReferenciaSuprimida`
   * decide se ela herda o Vídeo de Referência Padrão da Música.
   */
  videoReferencia?: string;
  /**
   * Quando `true`, esta Versão explicitamente não mostra nenhum vídeo, nem
   * mesmo o Vídeo de Referência Padrão da Música — mesmo sem um vídeo
   * próprio. Só tem efeito quando `videoReferencia` está vazio.
   */
  videoReferenciaSuprimida?: boolean;
  criadoPor?: string;
  criadoEm?: string;
  modificadoPor?: string;
  modificadoEm?: string;
};
