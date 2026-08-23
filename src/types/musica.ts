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
