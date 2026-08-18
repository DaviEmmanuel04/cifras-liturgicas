export interface WordToken {
  id: string;
  text: string;
  chord: string | null;
  isWord: boolean;
}

export interface LineToken {
  id: string;
  isSection: boolean;
  sectionText?: string;
  tokens: WordToken[];
}

export function generateId(prefix: string = "gen"): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Converte uma string de cifra no formato [Acorde]Letra em uma estrutura de tokens editáveis.
 * IDs determinísticos garantem estabilidade de foco no editor interativo.
 */
export function parseBracketString(texto: string): LineToken[] {
  const linhas = texto.split('\n');

  return linhas.map((linha, lIdx) => {
    const linhaTrim = linha.trim();
    const lineId = `l_${lIdx}`;
    let tokenCounter = 0;

    const getTokenId = () => `l_${lIdx}_t_${tokenCounter++}`;

    // 1. Título de Seção (Refrão:, Intro:, **Ponte**)
    const temAcordes = linha.includes('[');
    if (!temAcordes && (linhaTrim.endsWith(':') || (linhaTrim.startsWith('**') && linhaTrim.endsWith('**')))) {
      return {
        id: lineId,
        isSection: true,
        sectionText: linha,
        tokens: []
      };
    }

    // 2. Linha normal ou instrumental com acordes [Acorde]
    const partes = linha.split(/(\[.*?\])/g);
    const tokens: WordToken[] = [];
    let acordePendente: string | null = null;

    for (let i = 0; i < partes.length; i++) {
      const parte = partes[i];
      if (!parte) continue;

      if (parte.startsWith('[') && parte.endsWith(']')) {
        // Se tínhamos um acorde pendente anterior sem texto entre eles (ex: [Dm][G7] ou [Dm] [G7])
        if (acordePendente !== null) {
          tokens.push({
            id: getTokenId(),
            text: ' ',
            chord: acordePendente,
            isWord: false
          });
        }
        acordePendente = parte.slice(1, -1);
      } else {
        // Divide o texto da parte em palavras e espaços
        const subPartes = parte.split(/(\s+)/g);

        for (let j = 0; j < subPartes.length; j++) {
          const sub = subPartes[j];
          if (!sub) continue;

          const eEspaco = /^\s+$/.test(sub);

          if (eEspaco) {
            // Se tivermos um acorde pendente e não houver mais palavras à frente nesta parte
            let chordParaEspaco: string | null = null;
            if (acordePendente !== null) {
              const haPalavraDepois = subPartes.slice(j + 1).some(s => s.trim().length > 0);
              if (!haPalavraDepois) {
                chordParaEspaco = acordePendente;
                acordePendente = null;
              }
            }

            tokens.push({
              id: getTokenId(),
              text: sub,
              chord: chordParaEspaco,
              isWord: false
            });
          } else {
            // Se for palavra, quebra em pedaços de no máximo 2 caracteres
            for (let k = 0; k < sub.length; k += 2) {
              const pedaco = sub.slice(k, k + 2);
              let acordeDoToken: string | null = null;

              if (acordePendente !== null) {
                acordeDoToken = acordePendente;
                acordePendente = null;
              }

              tokens.push({
                id: getTokenId(),
                text: pedaco,
                chord: acordeDoToken,
                isWord: true
              });
            }
          }
        }
      }
    }

    // Se sobrou um acorde pendente no final da linha (ex: [G7] no final)
    if (acordePendente !== null) {
      tokens.push({
        id: getTokenId(),
        text: ' ',
        chord: acordePendente,
        isWord: false
      });
    }

    return {
      id: lineId,
      isSection: false,
      tokens
    };
  });
}

/**
 * Reconstrução bidirecional: Converte a estrutura de tokens de volta para a string [Acorde]Letra.
 */
export function buildBracketString(linhas: LineToken[]): string {
  return linhas
    .map((linha) => {
      if (linha.isSection) {
        return linha.sectionText || '';
      }

      return linha.tokens
        .map((tok) => {
          if (tok.chord && tok.chord.trim().length > 0) {
            return `[${tok.chord.trim()}]${tok.text}`;
          }
          return tok.text;
        })
        .join('');
    })
    .join('\n');
}

/**
 * Retorna uma lista de acordes populares do campo harmônico com base no tom da música.
 */
export function gerarAcordesDoTom(tom: string): string[] {
  if (!tom) return ["C", "D", "E", "F", "G", "A", "B", "Am", "Dm", "Em"];

  const tomLimpo = tom.trim();

  const mapaCampos: Record<string, string[]> = {
    // Maiores
    "C": ["C", "Dm", "Em", "F", "G", "G7", "Am", "Bdim", "Bb"],
    "C#": ["C#", "D#m", "E#m", "F#", "G#", "G#7", "A#m", "B#dim"],
    "Db": ["Db", "Ebm", "Fm", "Gb", "Ab", "Ab7", "Bbm", "Cdim", "B"],
    "D": ["D", "Em", "F#m", "G", "A", "A7", "Bm", "C#dim", "C"],
    "D#": ["D#", "E#m", "F##m", "G#", "A#", "A#7", "B#m", "C##dim"],
    "Eb": ["Eb", "Fm", "Gm", "Ab", "Bb", "Bb7", "Cm", "Ddim", "Db"],
    "E": ["E", "F#m", "G#m", "A", "B", "B7", "C#m", "D#dim", "D"],
    "F": ["F", "Gm", "Am", "Bb", "C", "C7", "Dm", "Edim", "Eb"],
    "F#": ["F#", "G#m", "A#m", "B", "C#", "C#7", "D#m", "E#dim", "E"],
    "Gb": ["Gb", "Abm", "Bbm", "Cb", "Db", "Db7", "Ebm", "Fdim"],
    "G": ["G", "Am", "Bm", "C", "D", "D7", "Em", "F#dim", "F"],
    "G#": ["G#", "A#m", "B#m", "C#", "D#", "D#7", "E#m", "F##dim"],
    "Ab": ["Ab", "Bbm", "Cm", "Db", "Eb", "Eb7", "Fm", "Gdim", "Gb"],
    "A": ["A", "Bm", "C#m", "D", "E", "E7", "F#m", "G#dim", "G"],
    "A#": ["A#", "B#m", "C##m", "D#", "E#", "E#7", "F##m", "G##dim"],
    "Bb": ["Bb", "Cm", "Dm", "Eb", "F", "F7", "Gm", "Adim", "Ab"],
    "B": ["B", "C#m", "D#m", "E", "F#", "F#7", "G#m", "A#dim", "A"],

    // Menores
    "Am": ["Am", "Bdim", "C", "Dm", "Em", "E", "E7", "F", "G"],
    "Bbm": ["Bbm", "Cdim", "Db", "Ebm", "Fm", "F", "F7", "Gb", "Ab"],
    "Bm": ["Bm", "C#dim", "D", "Em", "F#m", "F#", "F#7", "G", "A"],
    "Cm": ["Cm", "Ddim", "Eb", "Fm", "Gm", "G", "G7", "Ab", "Bb"],
    "C#m": ["C#m", "D#dim", "E", "F#m", "G#m", "G#", "G#7", "A", "B"],
    "Dm": ["Dm", "Edim", "F", "Gm", "Am", "A", "A7", "Bb", "C"],
    "Ebm": ["Ebm", "Fdim", "Gb", "Abm", "Bbm", "Bb", "Bb7", "Cb", "Db"],
    "Em": ["Em", "F#dim", "G", "Am", "Bm", "B", "B7", "C", "D"],
    "Fm": ["Fm", "Gdim", "Ab", "Bbm", "Cm", "C", "C7", "Db", "Eb"],
    "F#m": ["F#m", "G#dim", "A", "Bm", "C#m", "C#", "C#7", "D", "E"],
    "Gm": ["Gm", "Adim", "Bb", "Cm", "Dm", "D", "D7", "Eb", "F"],
    "G#m": ["G#m", "A#dim", "B", "C#m", "D#m", "D#", "D#7", "E", "F#"]
  };

  return mapaCampos[tomLimpo] || ["C", "D", "E", "F", "G", "A", "B", "Am", "Dm", "Em"];
}
