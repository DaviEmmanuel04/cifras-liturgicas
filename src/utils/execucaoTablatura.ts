import { ehNotaAbafada, type Nota, type Passo, type Tecnica } from "@/types/tablatura";

/**
 * Sufixo digitado no campo de casa → Técnica de Execução correspondente. `h`
 * e `p` mapeiam pro mesmo Ligadura (direção é sempre derivada comparando
 * casas — nunca armazenada, ver ADR 0002); `/` e `\` idem pra Slide.
 */
const SUFIXO_PARA_TECNICA: Record<string, Tecnica> = {
  h: "ligadura",
  p: "ligadura",
  "/": "slide",
  "\\": "slide",
  "~": "vibrato",
};

const REGEX_CASA = /^\d+$/;
const REGEX_CASA_COM_SUFIXO = /^(\d+)([hp/\\~])$/;

/**
 * Parseia o texto digitado numa célula de casa do TablaturaEditor pra uma
 * Nota na `corda` dada. Gramática fechada: `""` → sem Nota (`undefined`,
 * quem chama decide se isso significa "limpar a célula"); `"x"` → Nota
 * abafada; um inteiro → Nota tocada sem técnica; inteiro + um sufixo de
 * `h`/`p`/`/`/`\`/`~` → Nota tocada com a Técnica de Execução correspondente.
 * Qualquer outra entrada (letra desconhecida, sufixo duplicado, negativo)
 * retorna `undefined` — quem chama decide não alterar a Nota da célula
 * nesse caso. Módulo puro: sem I/O, sem Firestore, sem React.
 */
export function parseNota(texto: string, corda: number): Nota | undefined {
  if (texto === "x") return { corda, tipo: "abafada" };

  if (REGEX_CASA.test(texto)) {
    return { corda, casa: Number(texto) };
  }

  const comSufixo = texto.match(REGEX_CASA_COM_SUFIXO);
  if (comSufixo) {
    const [, casaTexto, sufixo] = comSufixo;
    return { corda, casa: Number(casaTexto), tecnica: SUFIXO_PARA_TECNICA[sufixo] };
  }

  return undefined;
}

/**
 * Resolve o texto de exibição de uma Nota — o que aparece na célula, em tela
 * e impressão. Nota abafada mostra `x`. Nota tocada sem técnica mostra só a
 * casa. Vibrato anexa `~`, sem depender de outra Nota. Ligadura/Slide
 * comparam a casa de origem com a da Nota tocada no `passoSeguinte` na mesma
 * corda (só o Passo imediatamente seguinte — sem busca, ver ADR 0001) pra
 * derivar a direção (`h`/`p`, `/`/`\`); sem alvo válido ali (corda ausente
 * ou abafada no Passo seguinte), mostra só a casa, sem símbolo de conexão.
 */
export function simboloNota(nota: Nota, passoSeguinte: Passo | undefined): string {
  if (ehNotaAbafada(nota)) return "x";
  if (!nota.tecnica) return String(nota.casa);
  if (nota.tecnica === "vibrato") return `${nota.casa}~`;

  const notaAlvo = passoSeguinte?.find((n) => n.corda === nota.corda);
  if (!notaAlvo || ehNotaAbafada(notaAlvo)) return String(nota.casa);

  const ascendente = notaAlvo.casa >= nota.casa;
  const sufixo =
    nota.tecnica === "ligadura" ? (ascendente ? "h" : "p") : ascendente ? "/" : "\\";

  return `${nota.casa}${sufixo}`;
}
