import { CORDAS_TABLATURA, type SecaoTablatura } from "@/types/tablatura";
import { transporTablatura } from "@/utils/transposicaoTablatura";

type TablaturaViewerProps = {
  secoes: SecaoTablatura[];
  semitons: number;
};

/**
 * Exibição somente-leitura das Seções de Tablatura de uma Música, na ordem
 * cadastrada. Transpõe as casas de cada Seção pelo mesmo `semitons` que
 * `CifraViewer` usa pra transpor os acordes, reaproveitando o módulo puro
 * `transporTablatura` — nada fica pré-calculado/persistido transposto.
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
        <table className="border-collapse font-mono text-xs">
          <tbody>
            {CORDAS_TABLATURA.map((label, cordaIdx) => (
              <tr key={cordaIdx}>
                <td className="pr-2 font-bold text-gray-400 print:text-gray-600 text-center w-5 border-b border-gray-150">
                  {label}
                </td>
                {secao.passos.map((passo, passoIdx) => {
                  const nota = passo.find((n) => n.corda === cordaIdx);
                  return (
                    <td
                      key={passoIdx}
                      className="w-7 h-6 text-center border-b border-gray-150 text-gray-800 print:text-black"
                    >
                      {nota ? nota.casa : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
