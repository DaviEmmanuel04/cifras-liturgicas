"use client";

import { useState, useEffect, useRef } from "react";
import { transporAcorde } from "@/utils/transposicao";
import { Minus, Plus, RotateCcw, Play, Pause, Printer, Download } from "lucide-react";
import { CifraRenderer } from "./CifraRenderer";

type Musica = {
  id: string;
  titulo: string;
  categoria: string;
  tempo: string;
  tom: string;
  letraCifra: string;
};

export function CifraViewer({ musica }: { musica: Musica }) {
  const [semitons, setSemitons] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
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

  const handleDownloadPDF = () => {
    // Como o Tailwind v4 usa o novo padrão de cores LAB/OKLCH e o html2canvas não suporta,
    // usamos o print nativo do navegador que permite "Salvar como PDF" perfeitamente e em alta qualidade.
    window.print();
  };

  return (
    <div className="pb-32">
      <div id="cifra-content">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-t-lg border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{musica.titulo}</h1>
        <div className="flex flex-wrap gap-2 mt-4 text-sm">
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">{musica.categoria}</span>
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">{musica.tempo}</span>
          <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-mono font-bold transition-colors">
            Tom: {tomAtual}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-sm transition-colors">
        <CifraRenderer texto={musica.letraCifra} semitons={semitons} />
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
              ? 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600' 
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
