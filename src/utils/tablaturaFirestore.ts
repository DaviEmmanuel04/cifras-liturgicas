import type { Nota, SecaoTablatura } from "@/types/tablatura";

/**
 * Firestore rejeita arrays aninhados diretamente dentro de outro array
 * (`updateDoc()`/`addDoc()` lançam "Nested arrays are not supported"). O
 * modelo de domínio `SecaoTablatura.passos: Passo[]`, com `Passo = Nota[]`,
 * é exatamente isso — um array cujos elementos são, eles mesmos, arrays.
 *
 * Este módulo converte entre o formato de domínio e um formato seguro pro
 * Firestore, que envolve cada Passo num objeto `{ notas }`, só na fronteira
 * de persistência. O tipo de domínio (`Passo = Nota[]`, ver ADR 0001)
 * continua puro — a conversão é responsabilidade de quem lê/escreve no
 * Firestore, não do resto do app. Mapeamento de dado puro — sem SDK do
 * Firestore, sem I/O.
 *
 * `tablaturasDeFirestore` aceita tanto o formato envolvido (`{ notas }`)
 * quanto o formato antigo/cru (`Passo` como array direto) — documentos
 * gravados antes desta conversão existir não têm Passos (o próprio bug que
 * este módulo corrige impedia salvar Seções com Passos), mas ler os dois
 * formatos custa pouco e evita depender dessa suposição.
 */
type PassoFirestore = { notas: Nota[] };

type SecaoTablaturaFirestore = {
  id: string;
  nome: string;
  passos: PassoFirestore[];
};

export function tablaturasParaFirestore(secoes: SecaoTablatura[]): SecaoTablaturaFirestore[] {
  return secoes.map((secao) => ({
    ...secao,
    passos: secao.passos.map((passo) => ({ notas: passo })),
  }));
}

export function tablaturasDeFirestore(bruto: unknown): SecaoTablatura[] {
  if (!Array.isArray(bruto)) return [];

  return bruto.map((secao: SecaoTablaturaFirestore) => ({
    id: secao.id,
    nome: secao.nome,
    passos: Array.isArray(secao.passos)
      ? secao.passos.map((passo) => (Array.isArray(passo) ? passo : (passo?.notas ?? [])))
      : [],
  }));
}
