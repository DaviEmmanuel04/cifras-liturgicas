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
