import React from "react";
import { obterDiagrama, ChordShape } from "@/utils/dicionarioAcordes";

type ChordDiagramProps = {
  nome: string;
};

export function ChordDiagram({ nome }: ChordDiagramProps) {
  const shape = obterDiagrama(nome);

  if (!shape) {
    // Retorna null ou uma representação genérica se o acorde não for encontrado
    return (
      <div className="w-[80px] h-[100px] flex flex-col items-center justify-center border border-dashed border-gray-200 dark:border-gray-700 rounded text-[10px] text-gray-400 text-center p-1 bg-gray-50 dark:bg-gray-900/30">
        <span className="font-bold text-gray-600 dark:text-gray-400 block mb-1">{nome}</span>
        Sem diag.
      </div>
    );
  }

  const { frets, baseFret } = shape;
  
  // Definições de coordenadas
  const stringsX = [20, 28, 36, 44, 52, 60];
  const fretsY = [28, 40, 52, 64, 76, 88];

  return (
    <div className="flex flex-col items-center select-none">
      <svg width="80" height="100" viewBox="0 0 80 100" className="overflow-visible">
        {/* Nome do Acorde */}
        <text 
          x="40" 
          y="12" 
          textAnchor="middle" 
          fontSize="12" 
          className="fill-current text-gray-800 dark:text-gray-200 font-bold font-sans"
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
            className="fill-current text-primary-600 dark:text-primary-400 font-sans font-bold"
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
              stroke="currentColor"
              strokeWidth={isNut ? 3 : 1}
              className={isNut ? "text-gray-800 dark:text-gray-200" : "text-gray-300 dark:text-gray-700"}
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
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-400 dark:text-gray-600"
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
                className="fill-current text-gray-400 dark:text-gray-500 font-sans font-bold"
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
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-400 dark:text-gray-500"
              />
            );
          }
          return null;
        })}

        {/* Bolinhas nas Casas */}
        {frets.map((fretVal, stringIdx) => {
          if (typeof fretVal === "number" && fretVal > 0) {
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
                  className="fill-current text-primary-600 dark:text-primary-400 transition-colors"
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
