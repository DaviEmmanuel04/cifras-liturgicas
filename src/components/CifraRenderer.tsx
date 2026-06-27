import { transporAcorde } from "@/utils/transposicao";

export function CifraRenderer({ 
  texto, 
  semitons = 0,
  somenteLetra = false,
  printTwoColumns = false
}: { 
  texto: string; 
  semitons?: number;
  somenteLetra?: boolean;
  printTwoColumns?: boolean;
}) {
  const linhas = texto.split('\n');

  return (
    <div className={`font-sans ${printTwoColumns ? "print-columns-2" : ""}`}>
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
        const textWithoutChords = linha.replace(/\[.*?\]/g, '').trim();
        const isInstrumental = temAcordes && (textWithoutChords.length === 0 || /^[-|/\s]+$/.test(textWithoutChords));

        if (isInstrumental) {
          if (somenteLetra) return null;

          const partes = linha.split(/(\[.*?\])/g);
          return (
            <div key={indexLinha} className="flex flex-wrap items-center min-h-[2em] mt-2 mb-2 break-inside-avoid">
              {partes.map((parte, idx) => {
                if (parte.startsWith('[') && parte.endsWith(']')) {
                  const acordeCru = parte.slice(1, -1);
                  const acorde = transporAcorde(acordeCru, semitons);
                  return (
                    <span key={idx} className="text-primary-700 font-extrabold font-mono text-[1.125em] tracking-wider">
                      {acorde}
                    </span>
                  );
                } else if (parte.length > 0) {
                  return (
                    <span key={idx} className="whitespace-pre text-gray-400 font-mono text-[1.125em]">
                      {parte}
                    </span>
                  );
                }
                return null;
              })}
            </div>
          );
        }

        // 4. Modo Padrão (Acorde sobre a Letra)
        if (somenteLetra) {
          const linhaSemAcordes = linha.replace(/\[.*?\]/g, '');
          return (
            <div key={indexLinha} className="whitespace-pre-wrap text-gray-850 print:text-black text-[1em] break-inside-avoid min-h-[1.5em] font-medium leading-relaxed">
              {linhaSemAcordes}
            </div>
          );
        }

        const partes = linha.split(/(\[.*?\])/g);
        const segmentos: { acorde: string | null; texto: string }[] = [];
        let acordeAtual: string | null = null;

        for (let i = 0; i < partes.length; i++) {
          const parte = partes[i];
          if (parte.startsWith('[') && parte.endsWith(']')) {
            const acordeCru = parte.slice(1, -1);
            acordeAtual = transporAcorde(acordeCru, semitons);
          } else {
            segmentos.push({ acorde: acordeAtual, texto: parte });
            acordeAtual = null; // Reseta para o próximo trecho
          }
        }

        return (
          <div key={indexLinha} className="flex flex-wrap items-start break-inside-avoid">
            {segmentos.map((seg, idx) => (
              <div key={idx} className="flex flex-col items-start">
                {temAcordes && (
                  <span className="text-primary-700 font-extrabold min-h-[1.5em] pr-1 font-mono text-[0.875em] leading-none tracking-wide select-none">
                    {seg.acorde || '\u00A0'}
                  </span>
                )}
                <span className="whitespace-pre-wrap text-gray-850 print:text-black text-[1em] font-medium leading-relaxed">
                  {seg.texto || (seg.acorde ? '\u00A0' : '')}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
