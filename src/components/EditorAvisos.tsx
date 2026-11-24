"use client";

import { useEffect, useMemo, useRef } from "react";
import { Bold, Check, Heading, Italic, List, ListOrdered, X } from "lucide-react";
import { ParagrafoAviso } from "./FolhetoLivreto";
import { variaveisDaPaleta, type LiturgicalColor } from "./LiturgicalThemeProvider";
import { interpretarAvisos } from "@/utils/folheto";
import { alternarPrefixoLinhas, envolverSelecao, type TextoComSelecao, type TipoLinha } from "@/utils/formatarSelecao";

const BOTOES: { titulo: string; icone: React.ReactNode; comando: { envolver: string } | { prefixar: TipoLinha } }[] = [
  { titulo: "Negrito (Ctrl+B)", icone: <Bold size={16} />, comando: { envolver: "**" } },
  { titulo: "Itálico (Ctrl+I)", icone: <Italic size={16} />, comando: { envolver: "*" } },
  { titulo: "Subtítulo", icone: <Heading size={16} />, comando: { prefixar: "titulo" } },
  { titulo: "Lista", icone: <List size={16} />, comando: { prefixar: "item" } },
  { titulo: "Lista numerada", icone: <ListOrdered size={16} />, comando: { prefixar: "numerado" } },
];

/**
 * Modal de edição dos Avisos do Folheto: campo grande com barra de formatação
 * (que só escreve a mesma sintaxe de texto — `**`, `*`, `- `, `1. `, `# `) e a
 * prévia como sai no folheto. Em telas pequenas ocupa a tela inteira.
 */
export function EditorAvisos({
  valor,
  onChange,
  onFechar,
  cor,
}: {
  valor: string;
  onChange: (valor: string) => void;
  onFechar: () => void;
  cor: LiturgicalColor;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const paragrafos = useMemo(() => interpretarAvisos(valor), [valor]);

  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
    // Trava a rolagem da página atrás do modal
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const fecharComEsc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", fecharComEsc);
    return () => {
      document.body.style.overflow = overflowOriginal;
      window.removeEventListener("keydown", fecharComEsc);
    };
  }, [onFechar]);

  const aplicar = (transformar: (atual: TextoComSelecao) => TextoComSelecao) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const scrollTop = textarea.scrollTop;
    const novo = transformar({ texto: valor, inicio: textarea.selectionStart, fim: textarea.selectionEnd });
    onChange(novo.texto);
    setTimeout(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(novo.inicio, novo.fim);
      textarea.scrollTop = scrollTop;
    }, 0);
  };

  const envolver = (marcador: string) => aplicar((atual) => envolverSelecao(atual, marcador));
  const prefixar = (tipo: TipoLinha) => aplicar((atual) => alternarPrefixoLinhas(atual, tipo));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const tecla = e.key.toLowerCase();
    if (tecla === "b") {
      e.preventDefault();
      envolver("**");
    } else if (tecla === "i") {
      e.preventDefault();
      envolver("*");
    }
  };

  type Comando = { envolver: string } | { prefixar: TipoLinha };
  const executar = (comando: Comando) => ("envolver" in comando ? envolver(comando.envolver) : prefixar(comando.prefixar));

  return (
    <div
      className="print:hidden fixed inset-0 z-[60] bg-black/40 flex items-center justify-center md:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Editar avisos do folheto"
        className="bg-[#fcfaf2] w-full h-full md:h-[85vh] md:max-w-5xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#e4ded0] pt-[calc(0.75rem+env(safe-area-inset-top,0px))] md:pt-3">
          <h2 className="font-bold text-gray-800">Avisos do folheto</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onFechar}
              className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <Check size={15} />
              Concluir
            </button>
            <button onClick={onFechar} title="Fechar (Esc)" className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 px-4 py-2 border-b border-[#e4ded0] bg-white">
          {BOTOES.map(({ titulo, icone, comando }) => (
            <button
              key={titulo}
              type="button"
              title={titulo}
              aria-label={titulo}
              // Sem isto o clique tira o foco do campo e perde a seleção
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executar(comando)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {icone}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-gray-400 hidden sm:inline">Linha em branco separa um aviso do outro</span>
        </div>

        <div className="grow min-h-0 grid grid-rows-2 md:grid-rows-1 md:grid-cols-2">
          <textarea
            ref={textareaRef}
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={"# Agenda da semana\n- Terço na **quarta**, às 19h\n- Reunião da *Pastoral*\n\nSepare os avisos com uma linha em branco."}
            className="w-full h-full p-4 bg-white text-gray-900 text-sm font-mono leading-relaxed outline-none resize-none border-b md:border-b-0 md:border-r border-[#e4ded0]"
          />
          <div className="overflow-y-auto p-4 md:p-6 bg-[#f4f0e6]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Prévia</p>
            <div style={variaveisDaPaleta(cor)} className="bg-white text-black shadow-sm rounded-md p-5 max-w-[126mm] mx-auto">
              <h3 className="font-serif font-bold text-[14pt] text-center text-primary-800 border-b border-primary-300 pb-2 mb-3">Avisos</h3>
              {paragrafos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum aviso.</p>
              ) : (
                <div className="space-y-[3mm]">
                  {paragrafos.map((linhas, i) => (
                    <ParagrafoAviso key={i} linhas={linhas} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
