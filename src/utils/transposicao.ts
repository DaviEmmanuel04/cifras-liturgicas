const notasSustenido = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const notasBemol = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function transporAcorde(acorde: string, semitons: number): string {
  if (!acorde) return acorde;
  if (semitons === 0) return acorde;

  const transporNota = (nota: string) => {
    let index = notasSustenido.indexOf(nota);
    let usouBemol = false;
    
    if (index === -1) {
      index = notasBemol.indexOf(nota);
      usouBemol = true;
    }
    
    if (index === -1) return nota;

    let novoIndex = (index + semitons) % 12;
    if (novoIndex < 0) novoIndex += 12;

    return usouBemol ? notasBemol[novoIndex] : notasSustenido[novoIndex];
  };

  // Divide o acorde por barra (se tiver baixo invertido, ex: C/E)
  return acorde.split('/').map(parte => {
    const match = parte.match(/^([CDEFGAB][#b]?)(.*)$/);
    if (!match) return parte;

    const nota = match[1];
    const resto = match[2];

    return transporNota(nota) + resto;
  }).join('/');
}

/**
 * Reescreve toda a Cifra (`letraCifra`) transpondo cada acorde entre
 * colchetes por `semitons`, via `transporAcorde` — que já devolve qualquer
 * token não reconhecido como acorde (ex. `[Solo]`) inalterado, então o texto
 * nunca quebra. Usada tanto pro preview de edição quanto pra gerar o
 * conteúdo salvo ao criar uma Versão nova a partir de uma transposição.
 */
export function transporCifra(letraCifra: string, semitons: number): string {
  if (!letraCifra) return letraCifra;
  return letraCifra.replace(/\[(.*?)\]/g, (_match, acorde: string) => `[${transporAcorde(acorde, semitons)}]`);
}

export type OpcaoTom = { semitons: number; label: string };

/**
 * As 12 transposições possíveis a partir de `tomOriginal`, pros seletores de
 * "Tom" tanto do preview público (`CifraViewer`) quanto do preview de
 * edição — a mesma lista, reaproveitada pelos dois. A opção de semitons 0 (o
 * Tom original) já sai marcada com uma estrela no `label`.
 */
export function opcoesTransposicao(tomOriginal: string): OpcaoTom[] {
  if (!tomOriginal) return [];

  const match = tomOriginal.match(/^([CDEFGAB][#b]?)(.*)$/);
  if (!match) return [{ semitons: 0, label: tomOriginal }];

  const root = match[1];
  let originalRootIndex = notasSustenido.indexOf(root);
  if (originalRootIndex === -1) originalRootIndex = notasBemol.indexOf(root);
  if (originalRootIndex === -1) return [{ semitons: 0, label: tomOriginal }];

  const opcoes: OpcaoTom[] = [];
  for (let i = 0; i < 12; i++) {
    let offset = i - originalRootIndex;
    if (offset > 5) offset -= 12;
    if (offset <= -6) offset += 12;

    const tomTransposto = transporAcorde(tomOriginal, offset);
    opcoes.push({ semitons: offset, label: offset === 0 ? `⭐ ${tomTransposto}` : tomTransposto });
  }

  return opcoes;
}
