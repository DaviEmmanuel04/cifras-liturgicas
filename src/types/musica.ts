import type { SecaoTablatura } from "@/types/tablatura";
import type { Versao } from "@/types/versao";

export type Musica = {
  id: string;
  titulo: string;
  artista?: string;
  categoria: string;
  tempo: string;
  tom: string;
  letraCifra: string;
  tablaturas?: SecaoTablatura[];
  /**
   * Vídeo de Referência próprio da Versão implícita (a Principal, enquanto
   * `versoes` não existe) — mesmo papel de `tom`/`letraCifra` acima: espelha
   * o campo equivalente em `Versao` pra Música nunca depender da coleção
   * existir. Ver CONTEXT.md, "Vídeo de Referência".
   */
  videoReferencia?: string;
  /** Espelho de `Versao.videoReferenciaSuprimida` pra Versão implícita. */
  videoReferenciaSuprimida?: boolean;
  /**
   * Vídeo de Referência Padrão da Música: fallback pra qualquer Versão sem
   * vídeo próprio nem supressão. Independente de qual Versão é a Principal —
   * ver CONTEXT.md, "Vídeo de Referência Padrão", e
   * docs/adr/0004-video-de-referencia-padrao-desacoplado-da-principal.md.
   */
  videoReferenciaPadrao?: string;
  /**
   * Coleção de Versões da Música. Ausente enquanto a Música só tem uma
   * Versão implícita (os campos de topo acima, sem migração necessária) —
   * só passa a existir a partir do momento em que uma segunda Versão é
   * criada. Ver docs/adr/0003-versao-como-array-embutido-com-backfill-preguicoso.md.
   */
  versoes?: Versao[];
  /** `id` da Versão em `versoes` marcada como Principal. Só relevante quando `versoes` existe. */
  versaoPrincipalId?: string;
  criadoPor?: string;
  criadoEm?: string;
  modificadoPor?: string;
  modificadoEm?: string;
};
