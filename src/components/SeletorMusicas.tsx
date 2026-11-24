"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { useCategorias } from "@/lib/categorias";
import { ordenarPorCategorias } from "@/utils/categorias";
import { buscarMusicasParaRepertorio } from "@/utils/seletorMusicas";
import type { Musica } from "@/types/musica";

/**
 * Escolha de músicas para um Repertório: busca (título, artista ou trecho da
 * letra), filtro pelo momento da missa e clique para adicionar ou tirar.
 * Enter adiciona o primeiro resultado que ainda não está no Repertório.
 */
export function SeletorMusicas({
  musicas,
  selecionadas,
  onAdicionar,
  onRemover,
}: {
  musicas: Musica[];
  selecionadas: string[];
  onAdicionar: (id: string) => void;
  onRemover: (id: string) => void;
}) {
  const ordemCategorias = useCategorias();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);

  const categoriasComMusicas = useMemo(
    () => ordenarPorCategorias(Array.from(new Set(musicas.map((m) => m.categoria))), ordemCategorias),
    [musicas, ordemCategorias]
  );

  const resultados = useMemo(
    () => buscarMusicasParaRepertorio(musicas, { busca, categoria }, ordemCategorias),
    [musicas, busca, categoria, ordemCategorias]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const primeira = resultados.find((m) => !selecionadas.includes(m.id));
      if (primeira) {
        onAdicionar(primeira.id);
        setBusca("");
      }
    } else if (e.key === "Escape") {
      setBusca("");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#e4ded0] shadow-sm overflow-hidden">
      <div className="p-3 space-y-2.5 border-b border-[#e4ded0]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por título, artista ou trecho da letra..."
            className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              title="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[null, ...categoriasComMusicas].map((cat) => {
            const ativo = categoria === cat;
            return (
              <button
                key={cat ?? "todas"}
                type="button"
                onClick={() => setCategoria(cat)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                  ativo
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-700"
                }`}
              >
                {cat ?? "Todas"}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
        {resultados.length === 0 ? (
          <li className="p-6 text-center text-sm text-gray-500">Nenhuma música encontrada.</li>
        ) : (
          resultados.map((musica) => {
            const adicionada = selecionadas.includes(musica.id);
            return (
              <li key={musica.id}>
                <button
                  type="button"
                  onClick={() => (adicionada ? onRemover(musica.id) : onAdicionar(musica.id))}
                  title={adicionada ? "Tirar do repertório" : "Adicionar ao repertório"}
                  className={`group w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors ${
                    adicionada ? "bg-primary-50/60 hover:bg-red-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{musica.titulo}</p>
                    <p className="text-[11px] text-gray-500 truncate">
                      <span className="text-primary-700 font-semibold">{musica.categoria}</span>
                      {musica.tempo && <> • {musica.tempo}</>}
                      {musica.artista && <> • {musica.artista}</>}
                    </p>
                  </div>
                  {adicionada ? (
                    <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-primary-700 group-hover:text-red-600">
                      <Check size={14} className="group-hover:hidden" />
                      <X size={14} className="hidden group-hover:block" />
                      <span className="group-hover:hidden">No repertório</span>
                      <span className="hidden group-hover:inline">Tirar</span>
                    </span>
                  ) : (
                    <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-500 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                      <Plus size={15} />
                    </span>
                  )}
                </button>
              </li>
            );
          })
        )}
      </ul>

      <div className="px-3 py-2 border-t border-[#e4ded0] bg-[#fbf9f4] text-[11px] text-gray-500 flex justify-between">
        <span>
          {resultados.length} música{resultados.length === 1 ? "" : "s"}
        </span>
        <span>
          <kbd className="font-mono bg-white px-1 rounded border">Enter</kbd> adiciona a primeira
        </span>
      </div>
    </div>
  );
}
