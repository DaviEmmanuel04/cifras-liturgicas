import { CORDAS_TABLATURA, ORDEM_EXIBICAO_TABLATURA, type SecaoTablatura } from "@/types/tablatura";
import { simboloNota } from "./execucaoTablatura";

/**
 * Gera as 6 linhas de texto de uma Seção de Tablatura no formato tradicional
 * de tab (ex. `"e|--3-----5h--7---|"`), uma por corda, na ordem de
 * `ORDEM_EXIBICAO_TABLATURA` (agudo no topo). Cada Passo vira uma coluna cuja
 * largura é a do maior símbolo entre as 6 cordas naquele Passo (mínimo 1
 * caractere) mais um traço de respiro à direita; uma corda sem Nota naquele
 * Passo mostra só traços. Módulo puro: sem I/O, sem React — só compõe texto a
 * partir de `simboloNota`, já responsável por resolver cada símbolo.
 */
export function linhasSecao(secao: SecaoTablatura): string[] {
  const larguras = secao.passos.map((passo, passoIdx) => {
    const passoSeguinte = secao.passos[passoIdx + 1];
    const maiorSimbolo = Math.max(
      1,
      ...CORDAS_TABLATURA.map((_, corda) => {
        const nota = passo.find((n) => n.corda === corda);
        return nota ? simboloNota(nota, passoSeguinte).length : 0;
      })
    );
    return maiorSimbolo + 1;
  });

  return ORDEM_EXIBICAO_TABLATURA.map((corda) => {
    const celulas = secao.passos.map((passo, passoIdx) => {
      const nota = passo.find((n) => n.corda === corda);
      const simbolo = nota ? simboloNota(nota, secao.passos[passoIdx + 1]) : "";
      return simbolo.padEnd(larguras[passoIdx], "-");
    });
    return `${CORDAS_TABLATURA[corda]}|${celulas.join("")}|`;
  });
}
