"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { transporAcorde } from "@/utils/transposicao";
import { Minus, Plus, RotateCcw, Play, Pause, Printer, ChevronDown, ChevronUp } from "lucide-react";
import { CifraRenderer } from "./CifraRenderer";
import { ChordDiagram } from "./ChordDiagram";
import Image from "next/image";
import { obterEstiloTempoLiturgico } from "@/utils/tempoLiturgico";

type Musica = {
  id: string;
  titulo: string;
  artista?: string;
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
  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cifras-liturgicas:font-size");
      return saved ? parseInt(saved, 10) : 16;
    }
    return 16;
  });

  useEffect(() => {
    localStorage.setItem("cifras-liturgicas:font-size", fontSize.toString());
  }, [fontSize]);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(30);
  const [showDiagrams, setShowDiagrams] = useState(true);
  const [printDiagrams, setPrintDiagrams] = useState(false);
  const [printTwoColumns, setPrintTwoColumns] = useState(true);
  const [somenteLetra, setSomenteLetra] = useState(false);
  
  const lastTimeRef = useRef<number>(0);
  const scrollAccumulatorRef = useRef<number>(0);

  useEffect(() => {
    let animationFrameId: number;
    lastTimeRef.current = 0;
    scrollAccumulatorRef.current = 0;

    const scroll = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const elapsed = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Calcula os pixels a rolar com base no tempo real decorrido (delta-time)
      // scrollSpeed é ms/pixel -> pixels/segundo = 1000 / scrollSpeed
      const pixelsPerSecond = 1000 / scrollSpeed;
      const pixelsToScroll = (pixelsPerSecond * elapsed) / 1000;

      scrollAccumulatorRef.current += pixelsToScroll;

      if (scrollAccumulatorRef.current >= 1) {
        const scrollAmount = Math.floor(scrollAccumulatorRef.current);
        window.scrollBy(0, scrollAmount);
        scrollAccumulatorRef.current -= scrollAmount;
      }

      animationFrameId = requestAnimationFrame(scroll);
    };

    if (isScrolling) {
      animationFrameId = requestAnimationFrame(scroll);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isScrolling, scrollSpeed]);

  const tomAtual = transporAcorde(musica.tom, semitons);

  const opcoesTom = useMemo(() => {
    if (!musica.tom) return [];
    const match = musica.tom.match(/^([CDEFGAB][#b]?)(.*)$/);
    if (!match) return [{ semitons: 0, label: musica.tom }];
    
    const root = match[1];
    
    const notasSustenido = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const notasBemol = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    
    let originalRootIndex = notasSustenido.indexOf(root);
    let usouBemol = false;
    
    if (originalRootIndex === -1) {
      originalRootIndex = notasBemol.indexOf(root);
      usouBemol = true;
    }
    
    if (originalRootIndex === -1) {
      return [{ semitons: 0, label: musica.tom }];
    }
    
    const options = [];
    
    for (let i = 0; i < 12; i++) {
      let offset = i - originalRootIndex;
      if (offset > 5) offset -= 12;
      if (offset <= -6) offset += 12;
      
      const tomTransposto = transporAcorde(musica.tom, offset);
      options.push({
        semitons: offset,
        label: offset === 0 ? `⭐ ${tomTransposto}` : tomTransposto
      });
    }
    
    return options;
  }, [musica.tom]);

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
  return (
    <div className="pb-20 md:pb-32">
      <div id="cifra-content" className="relative">
        <div className="relative z-10 bg-white p-4 md:p-8 rounded-t-2xl border-b border-gray-250/60 shadow-sm print-clean">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-800 leading-tight">{musica.titulo}</h1>
              {musica.artista && (
                <p className="text-sm md:text-base text-gray-500 italic mt-1.5">de {musica.artista}</p>
              )}
            </div>
            {/* Logo da Paróquia apenas para identificação visual na impressão */}
            <div className="hidden print:block w-12 h-12 md:w-14 md:h-14 relative shrink-0">
              <Image 
                src="/logo-principal.png" 
                alt="Logo Paróquia" 
                width={56} 
                height={56} 
                className="object-contain filter grayscale"
                priority
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 text-[10px] font-semibold">
            <span className="bg-gray-100 text-gray-650 px-3 py-1.5 rounded-full">{musica.categoria}</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border uppercase tracking-wider ${obterEstiloTempoLiturgico(musica.tempo).badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${obterEstiloTempoLiturgico(musica.tempo).dot}`} />
              {musica.tempo}
            </span>
            <span className="bg-primary-50 text-primary-750 px-3 py-1.5 rounded-full font-mono font-bold transition-all">
              Tom: {tomAtual}
            </span>
          </div>
        </div>
        {/* Painel de Controle de Visualização e Impressão (Sempre visível na tela) */}
        <div className="print:hidden border-b border-gray-150/70 bg-gray-50/40 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {/* Ajuste de Fonte */}
            <div className="flex items-center gap-1.5 select-none mr-2">
              <span className="text-[10px] font-bold text-gray-500">Fonte:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFontSize(size => Math.max(12, size - 1))}
                  className="w-6 h-6 flex items-center justify-center bg-white border border-gray-250 hover:bg-gray-50 rounded-md text-gray-600 font-bold text-xs shadow-sm transition-colors cursor-pointer active:bg-gray-100"
                  title="Diminuir fonte"
                >
                  A-
                </button>
                <span className="text-[11px] font-bold text-gray-600 font-mono px-1 min-w-[32px] text-center">
                  {fontSize}px
                </span>
                <button
                  onClick={() => setFontSize(size => Math.min(24, size + 1))}
                  className="w-6 h-6 flex items-center justify-center bg-white border border-gray-250 hover:bg-gray-50 rounded-md text-gray-600 font-bold text-xs shadow-sm transition-colors cursor-pointer active:bg-gray-100"
                  title="Aumentar fonte"
                >
                  A+
                </button>
              </div>
            </div>

            {!somenteLetra && uniqueChordsTransposed.length > 0 && (
              <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={printDiagrams}
                  onChange={(e) => setPrintDiagrams(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 bg-white"
                />
                <span>Incluir diagramas na impressão</span>
              </label>
            )}
            
            <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={printTwoColumns}
                onChange={(e) => setPrintTwoColumns(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 bg-white"
              />
              <span>Imprimir em duas colunas</span>
            </label>

            <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={somenteLetra}
                onChange={(e) => setSomenteLetra(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 bg-white"
              />
              <span>Imprimir apenas a letra</span>
            </label>
          </div>

          <div>
            {/* Botão de Imprimir */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-250 hover:bg-gray-50 text-gray-700 rounded-lg text-[10px] font-bold shadow-sm transition-colors cursor-pointer active:bg-gray-100"
              title="Imprimir / Salvar PDF"
            >
              <Printer size={13} />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Seção de Diagramas de Acordes */}
        {!somenteLetra && uniqueChordsTransposed.length > 0 && (
          <div className="print:hidden border-b border-gray-150/70 bg-white">
            {/* Header / Barra de Título e Toggle dos Diagramas */}
            <div className="px-5 py-2.5 bg-gray-50/50 flex items-center justify-between border-b border-gray-100">
              <button
                onClick={() => setShowDiagrams(!showDiagrams)}
                className="text-xs font-bold text-gray-600 hover:text-primary-750 transition-colors flex items-center gap-1"
              >
                {showDiagrams ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>{showDiagrams ? "Ocultar" : "Mostrar"} Diagramas de Acordes ({uniqueChordsTransposed.length})</span>
              </button>
            </div>

            {/* Conteúdo dos Diagramas */}
            {showDiagrams && (
              <div className="py-4 px-6 shadow-inner overflow-x-auto bg-[#fbfaf7]/30">
                <div className="flex gap-4 min-w-max pb-1">
                  {uniqueChordsTransposed.map((acorde) => (
                    <div key={acorde} className="bg-[#fbfaf7] border border-gray-200/80 p-3 rounded-xl shadow-sm transition-all duration-200 hover:border-primary-300">
                      <ChordDiagram nome={acorde} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div 
          className="bg-white p-4 md:p-8 rounded-b-2xl shadow-sm print-clean"
          style={{ fontSize: `${fontSize}px` }}
        >
          <CifraRenderer 
            texto={musica.letraCifra} 
            semitons={semitons} 
            somenteLetra={somenteLetra} 
            printTwoColumns={printTwoColumns}
          />

          {/* Diagramas no final para impressão */}
          {printDiagrams && !somenteLetra && uniqueChordsTransposed.length > 0 && (
            <div className="hidden print:block mt-12 border-t border-gray-300 pt-6">
              <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider text-center">
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
      <div className="print:hidden fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] left-1/2 transform -translate-x-1/2 backdrop-blur-md bg-gray-900/90 text-white px-6 py-2.5 rounded-full shadow-xl flex items-center gap-4 md:gap-6 z-50 transition-all duration-300 border border-white/10 max-w-[95vw] overflow-x-auto select-none">
        <div className="flex items-center gap-1 md:gap-1.5">
          <button 
            onClick={() => setSemitons(s => s - 1)}
            className="p-2 hover:bg-white/10 active:bg-white/20 rounded-full transition-colors"
            title="Abaixar meio tom"
          >
            <Minus size={16} />
          </button>

          {opcoesTom.length > 0 ? (
            <div className={`flex items-center gap-1 bg-white/10 rounded-full px-1.5 py-0.5 border transition-all duration-200 ${
              semitons === 0 ? 'border-amber-400/40 bg-amber-500/10' : 'border-white/10'
            }`}>
              <select
                value={semitons}
                onChange={(e) => setSemitons(Number(e.target.value))}
                className={`bg-transparent font-mono font-bold text-[10px] md:text-[11px] py-1 pl-1.5 pr-4 border-none outline-none cursor-pointer appearance-none relative select-none w-[58px] transition-colors ${
                  semitons === 0 ? 'text-amber-400' : 'text-white'
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${semitons === 0 ? '%23fbbf24' : 'white'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 2px center',
                  backgroundSize: '8px',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {opcoesTom.map(opt => (
                  <option key={opt.semitons} value={opt.semitons} className="bg-gray-950 text-white font-mono text-xs">
                    {opt.label}
                  </option>
                ))}
              </select>
              
              {semitons !== 0 && (
                <button
                  onClick={() => setSemitons(0)}
                  className="mr-1 p-1 hover:bg-white/20 active:bg-white/30 rounded-full transition-colors text-gray-300 hover:text-white"
                  title="Voltar para o Tom Original"
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setSemitons(0)}
              className="px-2.5 py-1.5 hover:bg-white/10 active:bg-white/20 rounded-full transition-colors flex items-center justify-center font-mono font-bold text-[10px] tracking-wider"
              title="Tom Original"
            >
              <RotateCcw size={13} className="mr-1" />
              <span>ORIGINAL</span>
            </button>
          )}

          <button 
            onClick={() => setSemitons(s => s + 1)}
            className="p-2 hover:bg-white/10 active:bg-white/20 rounded-full transition-colors"
            title="Subir meio tom"
          >
            <Plus size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsScrolling(!isScrolling)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-[10px] tracking-wider uppercase transition-all duration-200 ${
              isScrolling 
                ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md' 
                : 'hover:bg-white/10 active:bg-white/20'
            }`}
          >
            {isScrolling ? <Pause size={13} /> : <Play size={13} />}
            <span>{isScrolling ? 'Pausar' : 'Rolar'}</span>
          </button>

          <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5 border border-white/5">
            <select
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(Number(e.target.value))}
              className="bg-transparent text-white font-sans font-bold text-[10px] py-1 pl-1 pr-4.5 border-none outline-none cursor-pointer appearance-none relative select-none text-center"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0px center',
                backgroundSize: '8px',
                backgroundRepeat: 'no-repeat'
              }}
              title="Velocidade da rolagem"
            >
              <option value={75} className="bg-gray-950 text-white text-xs">0.5x</option>
              <option value={50} className="bg-gray-950 text-white text-xs">0.75x</option>
              <option value={30} className="bg-gray-950 text-white text-xs">1.0x</option>
              <option value={20} className="bg-gray-950 text-white text-xs">1.5x</option>
              <option value={12} className="bg-gray-950 text-white text-xs">2.0x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
