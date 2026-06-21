import React from "react";
import { obterDiagrama, ChordShape } from "@/utils/dicionarioAcordes";

type ChordDiagramProps = {
  nome: string;
};

export function ChordDiagram({ nome }: ChordDiagramProps) {
  const shape = obterDiagrama(nome);

  if (!shape) {
    return (
      <div className="w-[80px] h-[100px] flex flex-col items-center justify-center border border-dashed border-gray-300 rounded text-[10px] text-gray-500 text-center p-1 bg-white shadow-sm">
        <span className="font-bold text-gray-700 block mb-1">{nome}</span>
        Sem diag.
      </div>
    );
  }

  const { frets, baseFret } = shape;
  
  // Definições de coordenadas
  const stringsX = [20, 28, 36, 44, 52, 60];
  const fretsY = [28, 40, 52, 64, 76, 88];

  // Algoritmo de detecção automática de pestana (barré)
  const detectarPestana = () => {
    const contagem: Record<number, number[]> = {};
    frets.forEach((f, idx) => {
      if (typeof f === 'number' && f > 0) {
        if (!contagem[f]) contagem[f] = [];
        contagem[f].push(idx);
      }
    });

    const candidatos = Object.entries(contagem)
      .map(([fret, idxs]) => ({ fret: Number(fret), idxs }))
      .filter(c => c.idxs.length >= 2);

    for (const candidato of candidatos) {
      const F = candidato.fret;
      const idxs = candidato.idxs;
      const start = idxs[0];
      const end = idxs[idxs.length - 1];

      let eValido = true;
      for (let i = start; i <= end; i++) {
        const val = frets[i];
        if (val === 'x') continue;
        if (typeof val === 'number') {
          if (val < F) {
            eValido = false;
            break;
          }
        } else {
          eValido = false;
          break;
        }
      }

      if (eValido) {
        return { fret: F, start, end };
      }
    }
    return null;
  };

  const pestana = detectarPestana();

  return (
    <div className="flex flex-col items-center select-none">
      <svg width="80" height="100" viewBox="0 0 80 100" className="overflow-visible">
        {/* Nome do Acorde */}
        <text 
          x="40" 
          y="12" 
          textAnchor="middle" 
          fontSize="12" 
          fill="var(--foreground)"
          className="font-bold font-sans"
        >
          {nome}
        </text>

        {/* Traste Base (se for maior que 1) */}
        {baseFret > 1 && (
          <text 
            x="12" 
            y="37" 
            textAnchor="end" 
            fontSize="9" 
            fill="var(--primary-600)"
            className="font-sans font-bold"
          >
            {baseFret}ª
          </text>
        )}

        {/* Linhas dos Trastes */}
        {fretsY.map((y, idx) => {
          const isNut = idx === 0 && baseFret === 1;
          return (
            <line
              key={idx}
              x1="20"
              y1={y}
              x2="60"
              y2={y}
              stroke={isNut ? "var(--foreground)" : "#9c998e"}
              strokeWidth={isNut ? 3 : 1.2}
            />
          );
        })}

        {/* Linhas das Cordas */}
        {stringsX.map((x, idx) => (
          <line
            key={idx}
            x1={x}
            y1="28"
            x2={x}
            y2="88"
            stroke="#9c998e"
            strokeWidth="1.2"
          />
        ))}

        {/* Símbolos no topo (X ou O) */}
        {frets.map((fretVal, stringIdx) => {
          const x = stringsX[stringIdx];
          if (fretVal === "x") {
            return (
              <text
                key={stringIdx}
                x={x}
                y="22"
                textAnchor="middle"
                fontSize="10"
                fill="#7c7a70"
                className="font-sans font-bold"
              >
                ×
              </text>
            );
          } else if (fretVal === 0) {
            return (
              <circle
                key={stringIdx}
                cx={x}
                cy={18}
                r="2.5"
                fill="none"
                stroke="#7c7a70"
                strokeWidth="1.2"
              />
            );
          }
          return null;
        })}

        {/* Desenhar Pestana (se detectada) */}
        {pestana && (() => {
          const relFret = pestana.fret - baseFret;
          if (relFret >= 0 && relFret < 5) {
            const x1 = stringsX[pestana.start];
            const x2 = stringsX[pestana.end];
            const y = 28 + relFret * 12 + 6;
            return (
              <line 
                x1={x1} 
                y1={y} 
                x2={x2} 
                y2={y} 
                stroke="var(--primary-600)" 
                strokeWidth="4.5" 
                strokeLinecap="round" 
                opacity="0.95" 
                className="transition-colors duration-250"
              />
            );
          }
          return null;
        })()}

        {/* Bolinhas nas Casas (outros dedos) */}
        {frets.map((fretVal, stringIdx) => {
          if (typeof fretVal === "number" && fretVal > 0) {
            // Se esta corda e casa fizerem parte da pestana, não desenha círculo individual
            if (pestana && fretVal === pestana.fret && stringIdx >= pestana.start && stringIdx <= pestana.end) {
              return null;
            }
            const relFret = fretVal - baseFret;
            if (relFret >= 0 && relFret < 5) {
              const x = stringsX[stringIdx];
              const y = 28 + relFret * 12 + 6;
              return (
                <circle
                  key={stringIdx}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="var(--primary-600)"
                  className="transition-colors duration-250"
                />
              );
            }
          }
          return null;
        })}
      </svg>
    </div>
  );
}
