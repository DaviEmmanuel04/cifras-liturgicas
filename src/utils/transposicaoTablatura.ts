import { ehNotaAbafada, type Nota, type Passo, type SecaoTablatura } from "@/types/tablatura";

const CASA_MIN = 0;
const CASA_MAX = 20;

function envolverPorOitava(casa: number): number {
  let resultado = casa;
  while (resultado < CASA_MIN) resultado += 12;
  while (resultado > CASA_MAX) resultado -= 12;
  return resultado;
}

function transporNota(nota: Nota, semitons: number): Nota {
  // Nota abafada não tem `casa` pra deslocar — passa intocada (ver ADR 0002).
  if (ehNotaAbafada(nota)) return nota;

  return { ...nota, casa: envolverPorOitava(nota.casa + semitons) };
}

function transporPasso(passo: Passo, semitons: number): Passo {
  return passo.map(nota => transporNota(nota, semitons));
}

function transporPassos(passos: Passo[], semitons: number): Passo[] {
  return passos.map(passo => transporPasso(passo, semitons));
}

/**
 * Desloca cada `casa` de uma SecaoTablatura (ou de um array de Passos) por
 * `semitons`, envolvendo por oitava (±12) quando o resultado sai do
 * intervalo tocável (0–20). Função pura — sem I/O, sem Firestore, sem React.
 * Espelha `transporAcorde`, mas opera sobre casas numéricas em vez de nomes
 * de nota.
 */
export function transporTablatura(secao: SecaoTablatura, semitons: number): SecaoTablatura;
export function transporTablatura(passos: Passo[], semitons: number): Passo[];
export function transporTablatura(
  entrada: SecaoTablatura | Passo[],
  semitons: number,
): SecaoTablatura | Passo[] {
  if (Array.isArray(entrada)) {
    return transporPassos(entrada, semitons);
  }

  return { ...entrada, passos: transporPassos(entrada.passos, semitons) };
}
