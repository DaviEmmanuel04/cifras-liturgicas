/**
 * Normaliza um texto para comparação na busca: minúsculas e sem acentos
 * ("Glória" → "gloria", "Ação" → "acao").
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Diz se algum dos `campos` corresponde à `busca`, ignorando acentos e
 * maiúsculas. Cada termo da busca (separado por espaços) precisa aparecer em
 * algum campo, em qualquer ordem — "deus gloria" encontra "Glória a Deus".
 * Busca vazia corresponde a tudo.
 */
export function correspondeBusca(busca: string, ...campos: (string | undefined | null)[]): boolean {
  const termos = normalizarTexto(busca).split(/\s+/).filter(Boolean);
  if (termos.length === 0) return true;
  const alvo = campos.filter(Boolean).map(c => normalizarTexto(c as string)).join(" ");
  return termos.every(termo => alvo.includes(termo));
}
