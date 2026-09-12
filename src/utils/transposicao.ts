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

/**
 * A forma de um acorde já no tom atual (Tom salvo, considerando `semitons`
 * da transposição ao vivo se houver) depois de aplicar `capotraste` casas —
 * uma segunda chamada em cadeia sobre `transporAcorde`, reaproveitando a
 * mesma lógica de transposição, não um sistema novo. Rebaixa a forma pelo
 * tanto de casas do capotraste (um capo levanta o som, então a forma
 * precisa ser mais grave pra soar igual); `capotraste` 0 é no-op. Ver
 * CONTEXT.md, "Capotraste", e
 * docs/adr/0005-capotraste-como-camada-independente-de-exibicao.md.
 */
export function transporAcordeComCapotraste(acordeAtual: string, capotraste: number): string {
  return transporAcorde(acordeAtual, -capotraste);
}

/** Equivalente a `transporAcordeComCapotraste`, mas pra uma Cifra (`letraCifra`) inteira. */
export function transporCifraComCapotraste(cifraAtual: string, capotraste: number): string {
  return transporCifra(cifraAtual, -capotraste);
}

/**
 * A forma efetivamente exibida de um acorde: `semitons` (Tom atual) e
 * `capotraste` compostos em cadeia sobre `acordeCru` — a mesma composição
 * usada tanto no texto da Cifra (`CifraRenderer`) quanto no painel de
 * diagramas (`CifraViewer`), pra nunca divergir entre os dois.
 */
export function acordeExibido(acordeCru: string, semitons: number, capotraste: number): string {
  return transporAcordeComCapotraste(transporAcorde(acordeCru, semitons), capotraste);
}

/** Maior casa de Capotraste aceita pelos seletores (ver `spec.md`, Out of Scope). */
export const CAPOTRASTE_MAXIMO = 7;

export type OpcaoCapotraste = { valor: number; label: string };

/**
 * As opções de Capotraste (0 = "Sem capotraste", até `CAPOTRASTE_MAXIMO`) pro
 * seletor padrão da Versão (formulário do admin) e pro seletor ao vivo da
 * visualização pública — a mesma lista, reaproveitada pelos dois.
 */
export function opcoesCapotraste(): OpcaoCapotraste[] {
  const opcoes: OpcaoCapotraste[] = [{ valor: 0, label: "Sem capotraste" }];
  for (let casa = 1; casa <= CAPOTRASTE_MAXIMO; casa++) {
    opcoes.push({ valor: casa, label: `${casa}ª casa` });
  }
  return opcoes;
}
