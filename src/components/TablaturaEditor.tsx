"use client";

import { Plus, Trash2, X } from "lucide-react";
import { generateId } from "@/utils/cifraParser";
import { parseNota, simboloNota } from "@/utils/execucaoTablatura";
import { CORDAS_TABLATURA, type Passo, type SecaoTablatura } from "@/types/tablatura";

type TablaturaEditorProps = {
  secoes: SecaoTablatura[];
  onChange: (secoes: SecaoTablatura[]) => void;
  tom?: string;
};

/**
 * Seção do formulário admin pra gerenciar as Seções de Tablatura de uma
 * Música: adicionar/renomear/excluir Seções e, dentro de cada uma,
 * adicionar/remover Passos e preencher casas numa grade corda×casa. Apenas
 * exibe o `tom` recebido via prop — é responsabilidade de quem usa este
 * componente travar esse valor (sem segui-lo ao vivo) assim que já houver
 * conteúdo de Tablatura, pra não haver ambiguidade sobre a partir de qual
 * Tom as casas foram digitadas.
 */
export function TablaturaEditor({ secoes, onChange, tom }: TablaturaEditorProps) {
  function adicionarSecao() {
    const nova: SecaoTablatura = { id: generateId("secao"), nome: "Nova Seção", passos: [] };
    onChange([...secoes, nova]);
  }

  function atualizarSecao(id: string, atualizada: SecaoTablatura) {
    onChange(secoes.map((s) => (s.id === id ? atualizada : s)));
  }

  function removerSecao(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta Seção de Tablatura?")) return;
    onChange(secoes.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tablatura</label>
          <p className="text-xs text-gray-500 mt-0.5">
            {tom ? (
              <>Casas digitadas a partir do Tom original: <span className="font-mono font-bold">{tom}</span></>
            ) : (
              "Defina o Tom Original acima antes de cadastrar as casas."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={adicionarSecao}
          className="bg-primary-50 hover:bg-primary-100 text-primary-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border border-primary-200 cursor-pointer"
        >
          <Plus size={13} />
          <span>Nova Seção</span>
        </button>
      </div>

      {secoes.length === 0 && (
        <p className="text-sm text-gray-400 italic py-2">Nenhuma Seção de Tablatura cadastrada.</p>
      )}

      <div className="space-y-3">
        {secoes.map((secao) => (
          <SecaoTablaturaCard
            key={secao.id}
            secao={secao}
            onChange={(atualizada) => atualizarSecao(secao.id, atualizada)}
            onRemove={() => removerSecao(secao.id)}
          />
        ))}
      </div>
    </div>
  );
}

type SecaoTablaturaCardProps = {
  secao: SecaoTablatura;
  onChange: (secao: SecaoTablatura) => void;
  onRemove: () => void;
};

function SecaoTablaturaCard({ secao, onChange, onRemove }: SecaoTablaturaCardProps) {
  function renomear(nome: string) {
    onChange({ ...secao, nome });
  }

  function adicionarPasso() {
    onChange({ ...secao, passos: [...secao.passos, []] });
  }

  function removerPasso(passoIdx: number) {
    onChange({ ...secao, passos: secao.passos.filter((_, i) => i !== passoIdx) });
  }

  function definirCasa(passoIdx: number, corda: number, texto: string) {
    const passos = secao.passos.map((passo, i) => {
      if (i !== passoIdx) return passo;

      const semCorda = passo.filter((n) => n.corda !== corda);
      if (texto === "") return semCorda;

      // Entrada inválida (letra desconhecida, sufixo duplicado, negativo)
      // não altera a Nota da célula — nem remove a que já existia.
      const nota = parseNota(texto, corda);
      if (!nota) return passo;

      return [...semCorda, nota].sort((a, b) => a.corda - b.corda);
    });

    onChange({ ...secao, passos });
  }

  function textoDaCasa(passo: Passo, corda: number, passoSeguinte: Passo | undefined): string {
    const nota = passo.find((n) => n.corda === corda);
    return nota ? simboloNota(nota, passoSeguinte) : "";
  }

  return (
    <div className="border border-[#e4ded0] rounded-lg p-4 bg-gray-50 space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={secao.nome}
          onChange={(e) => renomear(e.target.value)}
          placeholder="Nome da seção (ex: Intro, Solo)"
          className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        />
        <button
          type="button"
          onClick={onRemove}
          title="Excluir seção"
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {secao.passos.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Nenhum passo ainda. Adicione o primeiro abaixo.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-collapse text-xs">
            <tbody>
              {CORDAS_TABLATURA.map((label, cordaIdx) => (
                <tr key={cordaIdx}>
                  <td className="pr-2 font-mono font-bold text-gray-500 text-center w-5">{label}</td>
                  {secao.passos.map((passo, passoIdx) => (
                    <td key={passoIdx} className="p-0.5">
                      <input
                        type="text"
                        value={textoDaCasa(passo, cordaIdx, secao.passos[passoIdx + 1])}
                        onChange={(e) => definirCasa(passoIdx, cordaIdx, e.target.value)}
                        placeholder="—"
                        title="Casa (ex: 5), abafada (x), ou casa+técnica (5h, 5p, 5/, 5\, 5~)"
                        className="w-11 text-center border border-gray-300 rounded p-1 bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td />
                {secao.passos.map((_, passoIdx) => (
                  <td key={passoIdx} className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => removerPasso(passoIdx)}
                      title="Remover passo"
                      className="text-gray-400 hover:text-red-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={adicionarPasso}
        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
      >
        <Plus size={12} />
        <span>Adicionar Passo</span>
      </button>
    </div>
  );
}
