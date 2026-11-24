import { formatarTexto, removerFormatacao, type TrechoFormatado } from "@/utils/formatacaoCifra";

const eTituloDeSecao = (linha: string) => {
  const linhaTrim = linha.trim();
  return !linha.includes("[") && (linhaTrim.endsWith(":") || (linhaTrim.startsWith("**") && linhaTrim.endsWith("**")));
};

// Só acordes e símbolos de compasso — some no modo só-letra do CifraRenderer
const eLinhaInstrumental = (linha: string) =>
  linha.includes("[") && /^[-|/\s]*$/.test(removerFormatacao(linha).replace(/\[.*?\]/g, ""));

const ACORDE_SEM_COLCHETE = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|M|º|°|\+)?\d*(\([^)]*\))?(\/[A-G][#b]?)?\.?$/;

// Cifras importadas no formato "acordes na linha de cima", sem colchetes
// (ex. "C.   G7   Am"): a linha inteira é só de nomes de acorde
const eLinhaDeAcordesSemColchete = (linha: string) => {
  const tokens = linha.trim().split(/\s+/);
  return !linha.includes("[") && tokens[0] !== "" && tokens.every((token) => ACORDE_SEM_COLCHETE.test(token));
};

/**
 * Divide a Cifra em estrofes para o Folheto: blocos separados por linha em
 * branco, sem as linhas só de acordes. Estrofes que sobram só com títulos de
 * seção (ex. "Intro:" cujo conteúdo era instrumental) são descartadas. Cada
 * estrofe continua no formato da Cifra — o CifraRenderer em `somenteLetra`
 * tira os acordes na hora de desenhar.
 */
export function estrofesDaLetra(letraCifra: string): string[] {
  const estrofes: string[][] = [[]];
  for (const linha of letraCifra.split("\n")) {
    if (eLinhaInstrumental(linha) || eLinhaDeAcordesSemColchete(linha)) continue;
    if (linha.trim() === "") {
      if (estrofes[estrofes.length - 1].length > 0) estrofes.push([]);
    } else {
      estrofes[estrofes.length - 1].push(linha);
    }
  }
  return estrofes
    .filter((estrofe) => estrofe.some((linha) => !eTituloDeSecao(linha)))
    .map((estrofe) => estrofe.join("\n"));
}

export interface BlocoMedido {
  id: string;
  altura: number;
  /** Não pode terminar uma página sozinho (ex. título do cântico). */
  manterComProximo?: boolean;
  /** Começa sempre no topo de uma página nova. */
  novaPagina?: boolean;
}

/**
 * Distribui blocos em páginas, em ordem, sem quebrar nenhum bloco. Um bloco
 * maior que a página ocupa uma página sozinho (e transborda).
 */
export function paginar(blocos: BlocoMedido[], alturaPagina: number): string[][] {
  const paginas: string[][] = [];
  let atual: string[] = [];
  let usado = 0;

  const fecharPagina = () => {
    if (atual.length > 0) paginas.push(atual);
    atual = [];
    usado = 0;
  };

  for (let i = 0; i < blocos.length; i++) {
    // Um bloco "manter com próximo" entra junto com o seguinte, como uma unidade
    const grupo = [blocos[i]];
    while (grupo[grupo.length - 1].manterComProximo && i + 1 < blocos.length && !blocos[i + 1].novaPagina) {
      grupo.push(blocos[++i]);
    }
    const alturaGrupo = grupo.reduce((soma, bloco) => soma + bloco.altura, 0);

    if (grupo[0].novaPagina || usado + alturaGrupo > alturaPagina) fecharPagina();
    for (const bloco of grupo) atual.push(bloco.id);
    usado += alturaGrupo;
  }
  fecharPagina();
  return paginas;
}

/**
 * Junta as partes do livreto e completa com páginas em branco (`null`) até um
 * múltiplo de 4 — o necessário para imprimir em folhas A4 dobradas. As páginas
 * em branco entram antes de `finais`, que ficam sempre no fim (contracapa).
 */
export function completarLivreto<T>(miolo: T[], finais: T[]): (T | null)[] {
  const total = miolo.length + finais.length;
  const brancas = (4 - (total % 4)) % 4;
  return [...miolo, ...Array<null>(brancas).fill(null), ...finais];
}

export interface FolhaImposta {
  /** Índices (0-based) das páginas: [esquerda, direita]. */
  frente: [number, number];
  verso: [number, number];
}

/**
 * Ordem de impressão de um livreto grampeado no meio: cada folha A4 leva
 * quatro páginas A5. Supõe frente e verso virando na borda curta.
 * `totalPaginas` precisa ser múltiplo de 4.
 */
export function imporLivreto(totalPaginas: number): FolhaImposta[] {
  const folhas: FolhaImposta[] = [];
  const ultima = totalPaginas - 1;
  for (let i = 0; i < totalPaginas / 4; i++) {
    folhas.push({
      frente: [ultima - 2 * i, 2 * i],
      verso: [2 * i + 1, ultima - 2 * i - 1],
    });
  }
  return folhas;
}

export type LinhaAviso =
  | { tipo: "texto" | "titulo" | "item"; trechos: TrechoFormatado[] }
  | { tipo: "numerado"; numero: string; trechos: TrechoFormatado[] };

/**
 * Interpreta os Avisos do Folheto: parágrafos separados por linha em branco
 * (cada um é uma unidade que não se quebra entre páginas). Em cada linha:
 * `# ` vira subtítulo, `- ` (ou `• `) item de lista, `1. ` item numerado; o
 * texto aceita `**negrito**` e `*itálico*`, como na Cifra.
 */
export function interpretarAvisos(avisos: string): LinhaAviso[][] {
  return avisos
    .split(/\n\s*\n/)
    .map((paragrafo) =>
      paragrafo
        .split("\n")
        .filter((linha) => linha.trim() !== "")
        .map((linha): LinhaAviso => {
          const texto = linha.trim();
          const titulo = texto.match(/^#+\s+(.*)$/);
          if (titulo) return { tipo: "titulo", trechos: formatarTexto(titulo[1]) };
          const item = texto.match(/^[-•]\s+(.*)$/);
          if (item) return { tipo: "item", trechos: formatarTexto(item[1]) };
          const numerado = texto.match(/^(\d+)[.)]\s+(.*)$/);
          if (numerado) return { tipo: "numerado", numero: numerado[1], trechos: formatarTexto(numerado[2]) };
          return { tipo: "texto", trechos: formatarTexto(texto) };
        })
    )
    .filter((paragrafo) => paragrafo.length > 0);
}
