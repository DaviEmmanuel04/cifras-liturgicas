import React from "react";
import { transporAcorde } from "@/utils/transposicao";
import { removerFormatacao, segmentarLinha, TrechoFormatado } from "@/utils/formatacaoCifra";

function Trechos({ trechos }: { trechos: TrechoFormatado[] }) {
  return (
    <>
      {trechos.map((trecho, idx) => (
        <span
          key={idx}
          className={`${trecho.negrito ? "font-extrabold" : ""} ${trecho.italico ? "italic" : ""}`}
        >
          {trecho.texto}
        </span>
      ))}
    </>
  );
}

export function CifraRenderer({
  texto,
  semitons = 0,
  somenteLetra = false
}: {
  texto: string;
  semitons?: number;
  somenteLetra?: boolean;
}) {
  const linhas = texto.split('\n');

  return (
    <div className="font-sans">
      {/*
        Sem wrapper de colunas aqui de propósito: pra impressão em duas
        colunas balancear certo, o conteúdo de impressão que vem *depois*
        da letra (Diagramas de Acordes) precisa participar do mesmo fluxo
        de colunas — senão ele fica de fora, como um bloco à parte após a
        letra, e pode sobrar sozinho numa página nova quase em branco. Quem
        decide se entra em colunas é o chamador (CifraViewer), que envolve
        este componente junto com esse conteúdo extra.
      */}
      {linhas.map((linha, indexLinha) => {
        const linhaTrim = linha.trim();
        
        // 1. Linhas Vazias
        if (!linhaTrim && !linha.includes('[')) {
          return <div key={indexLinha} className="h-[1.5em] break-inside-avoid"></div>;
        }

        const temAcordes = linha.includes('[');
        
        // 2. Títulos de Seção (Refrão:, Intro:, **Ponte**)
        if (!temAcordes && (linhaTrim.endsWith(':') || (linhaTrim.startsWith('**') && linhaTrim.endsWith('**')))) {
          const textoLimpo = linhaTrim.replace(/\*\*/g, '');
          return (
            <h3 key={indexLinha} className="font-serif font-bold italic text-primary-700 mt-5 mb-1.5 text-[0.95em] break-inside-avoid tracking-wide">
              {textoLimpo}
            </h3>
          );
        }

        // 3. Verifica Modo Instrumental (só acordes e símbolos)
        const textWithoutChords = removerFormatacao(linha).replace(/\[.*?\]/g, '').trim();
        const isInstrumental = temAcordes && (textWithoutChords.length === 0 || /^[-|/\s]+$/.test(textWithoutChords));

        if (isInstrumental) {
          if (somenteLetra) return null;

          return (
            <div key={indexLinha} className="flex flex-wrap items-center min-h-[2em] mt-2 mb-2 break-inside-avoid">
              {segmentarLinha(linha).map((seg, idx) => (
                <React.Fragment key={idx}>
                  {seg.acorde !== null && (
                    <span className="text-primary-700 font-extrabold font-mono text-[1.125em] tracking-wider">
                      {transporAcorde(seg.acorde, semitons)}
                    </span>
                  )}
                  {seg.trechos.length > 0 && (
                    <span className="whitespace-pre text-gray-400 font-mono text-[1.125em]">
                      <Trechos trechos={seg.trechos} />
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          );
        }

        // 4. Modo Padrão (Acorde sobre a Letra)
        const segmentos = segmentarLinha(linha);

        if (somenteLetra) {
          return (
            <div key={indexLinha} className="whitespace-pre-wrap text-gray-850 print:text-black text-[1em] break-inside-avoid min-h-[1.5em] font-medium leading-relaxed">
              <Trechos trechos={segmentos.flatMap((seg) => seg.trechos)} />
            </div>
          );
        }

        return (
          <div key={indexLinha} className="flex flex-wrap items-start break-inside-avoid">
            {segmentos.map((seg, idx) => (
              <div key={idx} className="flex flex-col items-start">
                {temAcordes && (
                  <span className="text-primary-700 font-extrabold min-h-[1.5em] pr-1 font-mono text-[0.875em] leading-none tracking-wide select-none">
                    {seg.acorde !== null ? transporAcorde(seg.acorde, semitons) : '\u00A0'}
                  </span>
                )}
                <span className="whitespace-pre-wrap text-gray-850 print:text-black text-[1em] font-medium leading-relaxed">
                  {seg.trechos.length > 0 ? <Trechos trechos={seg.trechos} /> : (seg.acorde !== null ? '\u00A0' : '')}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
