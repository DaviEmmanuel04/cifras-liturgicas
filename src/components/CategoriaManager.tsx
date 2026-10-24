"use client";

import { useMemo, useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Plus, Tags, Trash2 } from "lucide-react";
import { salvarCategorias, useCategorias } from "@/lib/categorias";
import { adicionarCategoria, removerCategoria, type ResultadoCategorias } from "@/utils/categorias";
import type { Musica } from "@/types/musica";

function CategoriaItem({ nome, musicasUsando, onRemove }: { nome: string; musicasUsando: number; onRemove: (nome: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: nome });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-[#e4ded0] shadow-sm relative z-10"
    >
      <div className="flex items-center gap-2 min-w-0">
        <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 shrink-0" aria-label={`Reordenar ${nome}`}>
          <GripVertical size={16} />
        </button>
        <span className="text-sm font-medium text-gray-800 truncate">{nome}</span>
        <span className="text-[10px] text-gray-500 shrink-0">
          {musicasUsando === 1 ? "1 música" : `${musicasUsando} músicas`}
        </span>
      </div>
      <button
        onClick={() => onRemove(nome)}
        disabled={musicasUsando > 0}
        title={musicasUsando > 0 ? "Só é possível excluir categorias sem músicas" : "Excluir categoria"}
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed shrink-0"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export function CategoriaManager({ musicas }: { musicas: Musica[] }) {
  const categorias = useCategorias();
  const [aberto, setAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [erro, setErro] = useState("");

  const usoPorCategoria = useMemo(() => {
    const uso = new Map<string, number>();
    musicas.forEach(m => uso.set(m.categoria, (uso.get(m.categoria) ?? 0) + 1));
    return uso;
  }, [musicas]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Não espera a confirmação do servidor: offline a escrita fica na fila do
  // Firestore e o cache local (que alimenta useCategorias) já reflete a mudança.
  const aplicar = (resultado: ResultadoCategorias) => {
    if (!resultado.ok) {
      setErro(resultado.erro);
      return false;
    }
    setErro("");
    salvarCategorias(resultado.lista).catch((e) => {
      console.error("Erro ao salvar categorias:", e);
      setErro("Não foi possível salvar as categorias.");
    });
    return true;
  };

  const handleAdicionar = (e: React.FormEvent) => {
    e.preventDefault();
    if (aplicar(adicionarCategoria(categorias, novoNome))) setNovoNome("");
  };

  const handleRemover = (nome: string) => {
    if (confirm(`Excluir a categoria "${nome}"?`)) {
      aplicar(removerCategoria(categorias, nome, usoPorCategoria.get(nome) ?? 0));
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      const oldIndex = categorias.indexOf(active.id as string);
      const newIndex = categorias.indexOf(over.id as string);
      aplicar({ ok: true, lista: arrayMove(categorias, oldIndex, newIndex) });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#e4ded0] p-6 mb-8">
      <button onClick={() => setAberto(!aberto)} className="w-full flex items-center justify-between gap-2 text-left cursor-pointer">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Tags size={18} /> Categorias
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Crie categorias e arraste para definir a ordem em que aparecem no site.
          </p>
        </div>
        <ChevronDown size={20} className={`text-gray-500 transition-transform shrink-0 ${aberto ? "rotate-180" : ""}`} />
      </button>

      {aberto && (
        <div className="mt-5">
          <form onSubmit={handleAdicionar} className="flex gap-2 mb-3">
            <input
              type="text"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Nova categoria..."
              className="flex-1 min-w-0 p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <button
              type="submit"
              disabled={!novoNome.trim()}
              className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              <Plus size={16} /> Adicionar
            </button>
          </form>

          {erro && <p className="text-xs text-red-600 mb-3">{erro}</p>}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categorias} strategy={verticalListSortingStrategy}>
              <div className="grid gap-2">
                {categorias.map(nome => (
                  <CategoriaItem key={nome} nome={nome} musicasUsando={usoPorCategoria.get(nome) ?? 0} onRemove={handleRemover} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
