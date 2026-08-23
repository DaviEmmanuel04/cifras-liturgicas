import type { Versao } from "@/types/versao";
import { tablaturasDeFirestore, tablaturasParaFirestore } from "@/utils/tablaturaFirestore";

/**
 * Mesma fronteira de persistência de `tablaturaFirestore.ts`, aplicada a
 * `Musica.versoes`: cada Versão embutida também carrega uma Tablatura, cujos
 * Passos (array de Notas) não podem ficar diretamente aninhados dentro de
 * outro array pras regras do Firestore — daí reaproveitar
 * `tablaturasParaFirestore`/`tablaturasDeFirestore` por Versão. Mapeamento
 * de dado puro — sem SDK do Firestore, sem I/O.
 *
 * A ausência de `tablaturas` numa Versão (ela nunca teve Tablatura
 * cadastrada) é preservada como ausência — nunca vira um array vazio
 * implícito.
 */
type VersaoFirestore = Omit<Versao, "tablaturas"> & {
  tablaturas?: ReturnType<typeof tablaturasParaFirestore>;
};

export function versoesParaFirestore(versoes: Versao[]): VersaoFirestore[] {
  return versoes.map((versao) => {
    const { tablaturas, ...resto } = versao;
    return tablaturas !== undefined ? { ...resto, tablaturas: tablaturasParaFirestore(tablaturas) } : { ...resto };
  });
}

export function versoesDeFirestore(bruto: unknown): Versao[] {
  if (!Array.isArray(bruto)) return [];

  return bruto.map((versao: VersaoFirestore) => {
    const { tablaturas, ...resto } = versao;
    return Array.isArray(tablaturas) ? { ...resto, tablaturas: tablaturasDeFirestore(tablaturas) } : { ...resto };
  });
}
