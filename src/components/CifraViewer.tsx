"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { transporAcorde } from "@/utils/transposicao";
import { Minus, Plus, RotateCcw, Play, Pause, Printer, Download, ChevronDown, ChevronUp } from "lucide-react";
import { CifraRenderer } from "./CifraRenderer";
import { ChordDiagram } from "./ChordDiagram";
import Image from "next/image";

type Musica = {
  id: string;
  titulo: string;
  categoria: string;
  tempo: string;
  tom: string;
  letraCifra: string;
  criadoPor?: string;
  criadoEm?: string;
  modificadoPor?: string;
  modificadoEm?: string;
};

export function CifraViewer({ musica }: { musica: Musica }) {
  const [semitons, setSemitons] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showDiagrams, setShowDiagrams] = useState(true);
  const [printDiagrams, setPrintDiagrams] = useState(false);
  const [printTwoColumns, setPrintTwoColumns] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isScrolling) {
      intervalRef.current = setInterval(() => {
        window.scrollBy(0, 1);
      }, 30); // 30ms = approx 33px per second, good reading speed
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isScrolling]);

  const tomAtual = transporAcorde(musica.tom, semitons);

  // Extrair acordes únicos originais
  const uniqueChords = useMemo(() => {
    const regexAcorde = /\[(.*?)\]/g;
    let match;
    const acordesBrutos = new Set<string>();
    while ((match = regexAcorde.exec(musica.letraCifra)) !== null) {
      const nome = match[1].trim();
      // Ignorar acordes vazios ou que pareçam marcadores
      if (nome && !nome.includes(":") && !nome.includes("*")) {
        acordesBrutos.add(nome);
      }
    }
    return Array.from(acordesBrutos);
  }, [musica.letraCifra]);

  // Transpor os acordes únicos conforme semitons
  const uniqueChordsTransposed = useMemo(() => {
    const transposed = uniqueChords.map(ac => transporAcorde(ac, semitons));
    return Array.from(new Set(transposed));
  }, [uniqueChords, semitons]);

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="pb-32">
      <div id="cifra-content" className="relative">
        {/* Marca d'água apenas para impressão */}
        <div 
          className="hidden print:flex fixed inset-0 items-center justify-center pointer-events-none opacity-[0.04] z-0 overflow-hidden"
          style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as any}
        >
          <Image 
            src="/logo.png" 
            alt="logo" 
            className="grayscale" 
            width={600} 
            height={600} 
            priority 
          />
        </div>
        
        <div className="relative z-10 bg-white dark:bg-gray-800 p-6 rounded-t-lg border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{musica.titulo}</h1>
          <div className="flex flex-wrap gap-2 mt-4 text-sm">
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">{musica.categoria}</span>
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">{musica.tempo}</span>
            <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full font-mono font-bold transition-colors">
              Tom: {tomAtual}
            </span>
          </div>
        </div>

        {/* Painel de Controle de Visualização e Impressão (Sempre visível na tela) */}
        <div className="print:hidden border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/10 p-6 transition-colors flex flex-wrap items-center justify-between gap-4">
          <div>
            {uniqueChordsTransposed.length > 0 && (
              <button
                onClick={() => setShowDiagrams(!showDiagrams)}
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5"
              >
                {showDiagrams ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span>{showDiagrams ? "Ocultar" : "Mostrar"} Diagramas de Acordes ({uniqueChordsTransposed.length})</span>
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4">
            {uniqueChordsTransposed.length > 0 && (
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={printDiagrams}
                  onChange={(e) => setPrintDiagrams(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 w-4 h-4 bg-white dark:bg-gray-700"
                />
                <span>Incluir diagramas no final da impressão</span>
              </label>
            )}
            
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={printTwoColumns}
                onChange={(e) => setPrintTwoColumns(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 w-4 h-4 bg-white dark:bg-gray-700"
              />
              <span>Imprimir em duas colunas</span>
            </label>
          </div>
        </div>

        {/* Bloco de Diagramas Expandido */}
        {showDiagrams && uniqueChordsTransposed.length > 0 && (
          <div className="print:hidden border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-inner overflow-x-auto">
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/10 rounded-xl border border-gray-200 dark:border-gray-700">
              {uniqueChordsTransposed.map((acorde) => (
                <ChordDiagram key={acorde} nome={acorde} />
              ))}
            </div>
          </div>
        )}

        <div className={`bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-sm transition-colors ${
          printTwoColumns ? "print:columns-2 print:gap-8" : ""
        }`}>
          <CifraRenderer texto={musica.letraCifra} semitons={semitons} />

          {/* Rodapé com autoria e modificação (oculto na impressão) */}
          {(musica.criadoPor || musica.modificadoPor) && (
            <div className="print:hidden mt-8 pt-4 border-t border-gray-150 dark:border-gray-700/50 text-[10px] text-gray-400 dark:text-gray-500 flex flex-wrap justify-between gap-x-4 gap-y-1">
              {musica.criadoPor && (
                <span>
                  Enviada por: <strong className="text-gray-500 dark:text-gray-400">{musica.criadoPor}</strong>
                  {musica.criadoEm && (() => {
                    try {
                      const d = new Date(musica.criadoEm);
                      return isNaN(d.getTime()) ? "" : ` em ${d.toLocaleDateString("pt-BR")}`;
                    } catch {
                      return "";
                    }
                  })()}
                </span>
              )}
              {musica.modificadoPor && (
                <span>
                  Última modificação: <strong className="text-gray-500 dark:text-gray-400">{musica.modificadoPor}</strong>
                  {musica.modificadoEm && (() => {
                    try {
                      const d = new Date(musica.modificadoEm);
                      return isNaN(d.getTime()) ? "" : ` em ${d.toLocaleDateString("pt-BR")}`;
                    } catch {
                      return "";
                    }
                  })()}
                </span>
              )}
            </div>
          )}

          {/* Diagramas no final para impressão */}
          {printDiagrams && uniqueChordsTransposed.length > 0 && (
            <div className="hidden print:block mt-12 border-t border-gray-300 dark:border-gray-700 pt-6">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider text-center">
                Diagramas dos Acordes
              </h4>
              <div className="flex flex-wrap justify-center gap-6">
                {uniqueChordsTransposed.map((acorde) => (
                  <ChordDiagram key={acorde} nome={acorde} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra flutuante de controles */}
      <div className="print:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-lg flex items-center gap-4 md:gap-6 z-50 transition-colors overflow-x-auto max-w-[95vw]">
        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={() => setSemitons(s => s - 1)}
            className="p-2 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full transition-colors"
            title="Abaixar meio tom"
          >
            <Minus size={20} />
          </button>
          <button 
            onClick={() => setSemitons(0)}
            className="p-2 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full transition-colors"
            title="Tom Original"
          >
            <RotateCcw size={20} />
          </button>
          <button 
            onClick={() => setSemitons(s => s + 1)}
            className="p-2 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full transition-colors"
            title="Subir meio tom"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="w-px h-6 bg-gray-700 dark:bg-gray-300"></div>
        
        <button 
          onClick={() => setIsScrolling(!isScrolling)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
            isScrolling 
              ? 'bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-500 dark:hover:bg-primary-600' 
              : 'hover:bg-gray-800 dark:hover:bg-gray-200'
          }`}
        >
          {isScrolling ? <Pause size={20} /> : <Play size={20} />}
          <span className="hidden md:inline">{isScrolling ? 'Pausar' : 'Rolar'}</span>
        </button>

        <div className="w-px h-6 bg-gray-700 dark:bg-gray-300"></div>

        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={() => window.print()}
            className="p-2 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full transition-colors"
            title="Imprimir cifra"
          >
            <Printer size={20} />
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="p-2 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full transition-colors"
            title="Baixar PDF"
          >
            <Download size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
