export type ChordShape = {
  frets: (number | 'x')[]; // Do E grave (índice 0) ao E agudo (índice 5)
  baseFret: number;        // Traste de partida para desenhar o diagrama (geralmente 1)
};

export const dicionarioAcordes: Record<string, ChordShape> = {
  // C (Dó)
  "C": { frets: ["x", 3, 2, 0, 1, 0], baseFret: 1 },
  "Cm": { frets: ["x", 3, 5, 5, 4, 3], baseFret: 3 },
  "C7": { frets: ["x", 3, 2, 3, 1, 0], baseFret: 1 },
  "C9": { frets: ["x", 3, 2, 3, 3, "x"], baseFret: 1 },
  "C7+": { frets: ["x", 3, 2, 0, 0, 0], baseFret: 1 },
  "Cmaj7": { frets: ["x", 3, 2, 0, 0, 0], baseFret: 1 },
  "Cadd9": { frets: ["x", 3, 2, 0, 3, 0], baseFret: 1 },
  "C4": { frets: ["x", 3, 3, 0, 1, 1], baseFret: 1 },
  "Csus4": { frets: ["x", 3, 3, 0, 1, 1], baseFret: 1 },

  // C# / Db
  "C#": { frets: ["x", 4, 6, 6, 6, 4], baseFret: 4 },
  "Db": { frets: ["x", 4, 6, 6, 6, 4], baseFret: 4 },
  "C#m": { frets: ["x", 4, 6, 6, 5, 4], baseFret: 4 },
  "Dbm": { frets: ["x", 4, 6, 6, 5, 4], baseFret: 4 },
  "C#7": { frets: ["x", 4, 6, 4, 6, 4], baseFret: 4 },
  "Db7": { frets: ["x", 4, 6, 4, 6, 4], baseFret: 4 },
  "C#m7": { frets: ["x", 4, 6, 4, 5, 4], baseFret: 4 },
  "Dbm7": { frets: ["x", 4, 6, 4, 5, 4], baseFret: 4 },
  "C#7+": { frets: ["x", 4, 6, 5, 6, 4], baseFret: 4 },

  // D (Ré)
  "D": { frets: ["x", "x", 0, 2, 3, 2], baseFret: 1 },
  "Dm": { frets: ["x", "x", 0, 2, 3, 1], baseFret: 1 },
  "D7": { frets: ["x", "x", 0, 2, 1, 2], baseFret: 1 },
  "D9": { frets: ["x", "x", 0, 2, 1, 0], baseFret: 1 },
  "D7+": { frets: ["x", "x", 0, 2, 2, 2], baseFret: 1 },
  "Dmaj7": { frets: ["x", "x", 0, 2, 2, 2], baseFret: 1 },
  "D4": { frets: ["x", "x", 0, 2, 3, 3], baseFret: 1 },
  "Dsus4": { frets: ["x", "x", 0, 2, 3, 3], baseFret: 1 },
  "D/F#": { frets: [2, "x", 0, 2, 3, 2], baseFret: 1 },
  "D/A": { frets: ["x", 0, 0, 2, 3, 2], baseFret: 1 },

  // D# / Eb
  "D#": { frets: ["x", "x", 1, 3, 4, 3], baseFret: 1 },
  "Eb": { frets: ["x", "x", 1, 3, 4, 3], baseFret: 1 },
  "D#m": { frets: ["x", "x", 1, 3, 4, 2], baseFret: 1 },
  "Ebm": { frets: ["x", "x", 1, 3, 4, 2], baseFret: 1 },
  "D#7": { frets: ["x", "x", 1, 3, 2, 3], baseFret: 1 },
  "Eb7": { frets: ["x", "x", 1, 3, 2, 3], baseFret: 1 },

  // E (Mi)
  "E": { frets: [0, 2, 2, 1, 0, 0], baseFret: 1 },
  "Em": { frets: [0, 2, 2, 0, 0, 0], baseFret: 1 },
  "E7": { frets: [0, 2, 0, 1, 0, 0], baseFret: 1 },
  "Em7": { frets: [0, 2, 0, 0, 0, 0], baseFret: 1 },
  "E7+": { frets: [0, 2, 1, 1, 0, 0], baseFret: 1 },
  "Emaj7": { frets: [0, 2, 1, 1, 0, 0], baseFret: 1 },
  "E4": { frets: [0, 2, 2, 2, 0, 0], baseFret: 1 },
  "Esus4": { frets: [0, 2, 2, 2, 0, 0], baseFret: 1 },
  "E/G#": { frets: [4, "x", 2, 1, 0, 0], baseFret: 1 },

  // F (Fá)
  "F": { frets: [1, 3, 3, 2, 1, 1], baseFret: 1 },
  "Fm": { frets: [1, 3, 3, 1, 1, 1], baseFret: 1 },
  "F7": { frets: [1, 3, 1, 2, 1, 1], baseFret: 1 },
  "F7+": { frets: ["x", "x", 3, 2, 1, 0], baseFret: 1 },
  "Fmaj7": { frets: ["x", "x", 3, 2, 1, 0], baseFret: 1 },
  "F9": { frets: ["x", "x", 3, 2, 1, 3], baseFret: 1 },
  "F/A": { frets: ["x", 0, 3, 2, 1, 1], baseFret: 1 },
  "F4": { frets: [1, 3, 3, 3, 1, 1], baseFret: 1 },
  "Fsus4": { frets: [1, 3, 3, 3, 1, 1], baseFret: 1 },

  // F# / Gb
  "F#": { frets: [2, 4, 4, 3, 2, 2], baseFret: 2 },
  "Gb": { frets: [2, 4, 4, 3, 2, 2], baseFret: 2 },
  "F#m": { frets: [2, 4, 4, 2, 2, 2], baseFret: 2 },
  "Gbm": { frets: [2, 4, 4, 2, 2, 2], baseFret: 2 },
  "F#7": { frets: [2, 4, 2, 3, 2, 2], baseFret: 2 },
  "Gb7": { frets: [2, 4, 2, 3, 2, 2], baseFret: 2 },
  "F#m7": { frets: [2, 4, 2, 2, 2, 2], baseFret: 2 },
  "Gbm7": { frets: [2, 4, 2, 2, 2, 2], baseFret: 2 },
  "F#7+": { frets: [2, 4, 3, 3, 2, 2], baseFret: 2 },

  // G (Sol)
  "G": { frets: [3, 2, 0, 0, 0, 3], baseFret: 1 },
  "Gm": { frets: [3, 5, 5, 3, 3, 3], baseFret: 3 },
  "G7": { frets: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  "G9": { frets: [3, "x", 0, 2, 0, 3], baseFret: 1 },
  "G7+": { frets: [3, 2, 0, 0, 0, 2], baseFret: 1 },
  "Gmaj7": { frets: [3, 2, 0, 0, 0, 2], baseFret: 1 },
  "G/B": { frets: ["x", 2, 0, 0, 3, 3], baseFret: 1 },
  "G/D": { frets: ["x", "x", 0, 0, 0, 3], baseFret: 1 },
  "Gsus4": { frets: [3, "x", 0, 0, 1, 3], baseFret: 1 },
  "G4": { frets: [3, "x", 0, 0, 1, 3], baseFret: 1 },

  // G# / Ab
  "G#": { frets: [4, 6, 6, 5, 4, 4], baseFret: 4 },
  "Ab": { frets: [4, 6, 6, 5, 4, 4], baseFret: 4 },
  "G#m": { frets: [4, 6, 6, 4, 4, 4], baseFret: 4 },
  "Abm": { frets: [4, 6, 6, 4, 4, 4], baseFret: 4 },
  "G#7": { frets: [4, 6, 4, 5, 4, 4], baseFret: 4 },
  "Ab7": { frets: [4, 6, 4, 5, 4, 4], baseFret: 4 },

  // A (Lá)
  "A": { frets: ["x", 0, 2, 2, 2, 0], baseFret: 1 },
  "Am": { frets: ["x", 0, 2, 2, 1, 0], baseFret: 1 },
  "A7": { frets: ["x", 0, 2, 0, 2, 0], baseFret: 1 },
  "Am7": { frets: ["x", 0, 2, 0, 1, 0], baseFret: 1 },
  "A9": { frets: ["x", 0, 2, 4, 2, 0], baseFret: 1 },
  "A7+": { frets: ["x", 0, 2, 1, 2, 0], baseFret: 1 },
  "Amaj7": { frets: ["x", 0, 2, 1, 2, 0], baseFret: 1 },
  "A4": { frets: ["x", 0, 2, 2, 3, 0], baseFret: 1 },
  "Asus4": { frets: ["x", 0, 2, 2, 3, 0], baseFret: 1 },
  "A/C#": { frets: ["x", 4, 2, 2, 2, "x"], baseFret: 2 },
  "Am/G": { frets: [3, 0, 2, 2, 1, 0], baseFret: 1 },

  // A# / Bb
  "A#": { frets: ["x", 1, 3, 3, 3, 1], baseFret: 1 },
  "Bb": { frets: ["x", 1, 3, 3, 3, 1], baseFret: 1 },
  "A#m": { frets: ["x", 1, 3, 3, 2, 1], baseFret: 1 },
  "Bbm": { frets: ["x", 1, 3, 3, 2, 1], baseFret: 1 },
  "A#7": { frets: ["x", 1, 3, 1, 3, 1], baseFret: 1 },
  "Bb7": { frets: ["x", 1, 3, 1, 3, 1], baseFret: 1 },
  "Bb7+": { frets: ["x", 1, 3, 2, 3, 1], baseFret: 1 },
  "Bbmaj7": { frets: ["x", 1, 3, 2, 3, 1], baseFret: 1 },

  // B (Si)
  "B": { frets: ["x", 2, 4, 4, 4, 2], baseFret: 2 },
  "Bm": { frets: ["x", 2, 4, 4, 3, 2], baseFret: 2 },
  "B7": { frets: ["x", 2, 1, 2, 0, 2], baseFret: 1 },
  "Bm7": { frets: ["x", 2, 4, 2, 3, 2], baseFret: 2 },
  "B7+": { frets: ["x", 2, 4, 3, 4, 2], baseFret: 2 },
  "Bmaj7": { frets: ["x", 2, 4, 3, 4, 2], baseFret: 2 },
  "Bsus4": { frets: ["x", 2, 4, 4, 5, 2], baseFret: 2 },
  "B4": { frets: ["x", 2, 4, 4, 5, 2], baseFret: 2 }
};

export function obterDiagrama(nomeAcorde: string): ChordShape | null {
  // Limpar espaços e parênteses
  let nome = nomeAcorde.trim().replace(/[\(\)]/g, "");

  // Tentar encontrar o exato
  if (dicionarioAcordes[nome]) {
    return dicionarioAcordes[nome];
  }

  // Tentar tratar barra (ex: D/F#)
  if (nome.includes("/")) {
    if (dicionarioAcordes[nome]) return dicionarioAcordes[nome];
    const base = nome.split("/")[0];
    if (dicionarioAcordes[base]) return dicionarioAcordes[base];
  }

  // Tentar simplificar variações comuns (ex: Am7 -> Am, C9 -> C)
  // Remove 7, 9, sus4, add9 mantendo o 'm' (menor) ou '#'/'b'
  let simplificado = nome
    .replace(/(?:maj|min|aug|dim|sus|add|4|5|6|7|9|11|13|\+)/g, "")
    .trim();
  
  if (dicionarioAcordes[simplificado]) {
    return dicionarioAcordes[simplificado];
  }

  // Se for ex: C#m e não achamos, tentar apenas C# ou C
  let raiz = nome.match(/^[A-G][#b]?m?/)?.[0];
  if (raiz && dicionarioAcordes[raiz]) {
    return dicionarioAcordes[raiz];
  }
  
  let raizSemTom = nome.match(/^[A-G][#b]?/)?.[0];
  if (raizSemTom && dicionarioAcordes[raizSemTom]) {
    return dicionarioAcordes[raizSemTom];
  }

  return null;
}
