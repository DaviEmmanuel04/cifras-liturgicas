/** Um pedaço contínuo de letra com o mesmo estilo. */
export interface TrechoFormatado {
  texto: string;
  negrito: boolean;
  italico: boolean;
}

/** Um acorde (ou nenhum) seguido do texto que fica embaixo dele. */
export interface SegmentoCifra {
  acorde: string | null;
  trechos: TrechoFormatado[];
}

type Peca =
  | { tipo: "acorde"; valor: string }
  | { tipo: "marcador"; valor: "**" | "*" }
  | { tipo: "texto"; valor: string };

/**
 * Quebra uma linha da Cifra em segmentos acorde+texto, interpretando
 * `**negrito**` e `*itálico*` no texto. A formatação pode atravessar acordes
 * (`**[C]Senhor, tende pie[G]dade**`), mas nunca atravessa linhas. Um marcador
 * sem par na mesma linha é mantido como texto literal.
 */
export function segmentarLinha(linha: string, { comAcordes = true } = {}): SegmentoCifra[] {
  const pecas: Peca[] = linha
    .split(comAcordes ? /(\[.*?\]|\*\*|\*)/g : /(\*\*|\*)/g)
    .filter((parte) => parte.length > 0)
    .map((parte): Peca => {
      if (comAcordes && parte.startsWith("[") && parte.endsWith("]")) return { tipo: "acorde", valor: parte.slice(1, -1) };
      if (parte === "**" || parte === "*") return { tipo: "marcador", valor: parte };
      return { tipo: "texto", valor: parte };
    });

  // Marcadores de cada tipo pareiam em ordem; um último sem par vira texto.
  for (const marcador of ["**", "*"] as const) {
    const indices = pecas.flatMap((p, i) => (p.tipo === "marcador" && p.valor === marcador ? [i] : []));
    if (indices.length % 2 === 1) {
      pecas[indices[indices.length - 1]] = { tipo: "texto", valor: marcador };
    }
  }

  const segmentos: SegmentoCifra[] = [];
  let negrito = false;
  let italico = false;

  const segmentoAtual = () => {
    if (segmentos.length === 0) segmentos.push({ acorde: null, trechos: [] });
    return segmentos[segmentos.length - 1];
  };

  for (const peca of pecas) {
    if (peca.tipo === "acorde") {
      segmentos.push({ acorde: peca.valor, trechos: [] });
    } else if (peca.tipo === "marcador") {
      if (peca.valor === "**") negrito = !negrito;
      else italico = !italico;
    } else {
      const trechos = segmentoAtual().trechos;
      const ultimo = trechos[trechos.length - 1];
      if (ultimo && ultimo.negrito === negrito && ultimo.italico === italico) {
        ultimo.texto += peca.valor;
      } else {
        trechos.push({ texto: peca.valor, negrito, italico });
      }
    }
  }

  return segmentos;
}

/** Negrito e itálico de um texto comum, sem acordes — colchetes ficam como texto. */
export function formatarTexto(texto: string): TrechoFormatado[] {
  return segmentarLinha(texto, { comAcordes: false }).flatMap((seg) => seg.trechos);
}

/** Remove os marcadores de formatação, deixando só o texto (acordes intactos). */
export function removerFormatacao(linha: string): string {
  return segmentarLinha(linha)
    .map((seg) => (seg.acorde !== null ? `[${seg.acorde}]` : "") + seg.trechos.map((t) => t.texto).join(""))
    .join("");
}
