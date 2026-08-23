import type { SecaoTablatura } from "@/types/tablatura";
import { transporTablatura } from "@/utils/transposicaoTablatura";
import { linhasSecao } from "@/utils/linhaTablatura";

type TablaturaViewerProps = {
  secoes: SecaoTablatura[];
  semitons: number;
};

/**
 * Exibição somente-leitura das Seções de Tablatura de uma Música, na ordem
 * cadastrada, no formato tradicional de tab (uma linha de texto por corda,
 * agudo no topo — ver `linhasSecao`). Transpõe as casas de cada Seção pelo
 * mesmo `semitons` que `CifraViewer` usa pra transpor os acordes,
 * reaproveitando o módulo puro `transporTablatura` — nada fica
 * pré-calculado/persistido transposto.
 */
export function TablaturaViewer({ secoes, semitons }: TablaturaViewerProps) {
  return (
    <div className="space-y-5">
      {secoes.map((secao) => (
        <SecaoTablaturaDisplay key={secao.id} secao={transporTablatura(secao, semitons)} />
      ))}
    </div>
  );
}

function SecaoTablaturaDisplay({ secao }: { secao: SecaoTablatura }) {
  return (
    <div className="break-inside-avoid">
      <h4 className="text-[11px] font-bold text-gray-600 print:text-black uppercase tracking-wider mb-1.5">
        {secao.nome}
      </h4>

      {secao.passos.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Nenhum passo cadastrado.</p>
      ) : (
        <pre className="font-mono text-[13px] leading-[1.6] text-gray-800 print:text-black whitespace-pre overflow-x-auto">
          {linhasSecao(secao).join("\n")}
        </pre>
      )}
    </div>
  );
}
