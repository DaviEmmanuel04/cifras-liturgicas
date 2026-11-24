/** Texto de um campo com a seleção atual (`inicio`/`fim` como em selectionStart/End). */
export interface TextoComSelecao {
  texto: string;
  inicio: number;
  fim: number;
}

/** Envolve a seleção com `marcador` (ex. `**` para negrito), mantendo-a selecionada. */
export function envolverSelecao({ texto, inicio, fim }: TextoComSelecao, marcador: string): TextoComSelecao {
  return {
    texto: texto.slice(0, inicio) + marcador + texto.slice(inicio, fim) + marcador + texto.slice(fim),
    inicio: inicio + marcador.length,
    fim: fim + marcador.length,
  };
}

export type TipoLinha = "item" | "numerado" | "titulo";

const PREFIXO_EXISTENTE = /^(#+\s+|[-•]\s+|\d+[.)]\s+)/;

const temPrefixo = (linha: string, tipo: TipoLinha) =>
  tipo === "item" ? /^[-•]\s+/.test(linha) : tipo === "numerado" ? /^\d+[.)]\s+/.test(linha) : /^#+\s+/.test(linha);

/**
 * Transforma as linhas tocadas pela seleção em itens de lista (`- `),
 * numerados (`1. `, `2. `…) ou subtítulo (`# `). Se todas já são desse tipo,
 * tira o prefixo (alterna). Um prefixo de outro tipo é trocado. Linhas em
 * branco ficam como estão. A seleção passa a cobrir as linhas inteiras.
 */
export function alternarPrefixoLinhas({ texto, inicio, fim }: TextoComSelecao, tipo: TipoLinha): TextoComSelecao {
  const comecoBloco = texto.lastIndexOf("\n", inicio - 1) + 1;
  const quebraFinal = texto.indexOf("\n", fim > inicio && texto[fim - 1] === "\n" ? fim - 1 : fim);
  const fimBloco = quebraFinal === -1 ? texto.length : quebraFinal;

  const linhas = texto.slice(comecoBloco, fimBloco).split("\n");
  const preenchidas = linhas.filter((l) => l.trim() !== "");
  const remover = preenchidas.length > 0 && preenchidas.every((l) => temPrefixo(l, tipo));

  let numero = 0;
  const novas = linhas.map((linha) => {
    if (linha.trim() === "") return linha;
    const semPrefixo = linha.replace(PREFIXO_EXISTENTE, "");
    if (remover) return semPrefixo;
    if (tipo === "item") return `- ${semPrefixo}`;
    if (tipo === "titulo") return `# ${semPrefixo}`;
    return `${++numero}. ${semPrefixo}`;
  });

  const bloco = novas.join("\n");
  return {
    texto: texto.slice(0, comecoBloco) + bloco + texto.slice(fimBloco),
    inicio: comecoBloco,
    fim: comecoBloco + bloco.length,
  };
}
