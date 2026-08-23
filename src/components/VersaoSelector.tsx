import { Layers } from "lucide-react";
import type { Versao } from "@/types/versao";

type VersaoSelectorProps = {
  versoes: Versao[];
  versaoPrincipalId?: string;
  versaoSelecionadaId?: string;
  onSelecionar: (versaoId: string) => void;
};

/**
 * Seletor público de Versão — visível só quando a Música tem 2+ Versões (o
 * chamador decide isso; este componente sempre renderiza o que recebe). A
 * escolha do visitante é reportada via `onSelecionar`; quem chama é
 * responsável por refletir isso na URL (ver [[resolverVersaoIdEfetivo]]).
 */
export function VersaoSelector({ versoes, versaoPrincipalId, versaoSelecionadaId, onSelecionar }: VersaoSelectorProps) {
  return (
    <div className="print:hidden flex items-center gap-2.5 bg-white border border-gray-200/80 rounded-xl px-4 py-2.5 shadow-sm mb-4">
      <Layers size={15} className="text-gray-500 shrink-0" />
      <label htmlFor="versao-selector" className="text-xs font-bold text-gray-500 shrink-0">
        Versão:
      </label>
      <select
        id="versao-selector"
        value={versaoSelecionadaId ?? ""}
        onChange={(e) => onSelecionar(e.target.value)}
        className="flex-1 bg-transparent text-sm font-semibold text-gray-800 border-none outline-none cursor-pointer"
      >
        {versoes.map((versao) => (
          <option key={versao.id} value={versao.id}>
            {versao.rotulo}
            {versao.id === versaoPrincipalId ? " (Principal)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
