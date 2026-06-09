import { transporAcorde } from "@/utils/transposicao";

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
      {linhas.map((linha, indexLinha) => {
        const linhaTrim = linha.trim();
        
        // 1. Linhas Vazias
        if (!linhaTrim && !linha.includes('[')) {
          return <div key={indexLinha} className="h-6 break-inside-avoid"></div>;
        }

        const temAcordes = linha.includes('[');
        
        // 2. Títulos de Seção (Refrão:, Intro:, **Ponte**)
        if (!temAcordes && (linhaTrim.endsWith(':') || (linhaTrim.startsWith('**') && linhaTrim.endsWith('**')))) {
          const textoLimpo = linhaTrim.replace(/\*\*/g, '');
          return (
            <h3 key={indexLinha} className="font-bold text-primary-600 dark:text-primary-400 mt-6 mb-2 text-xl break-inside-avoid">
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
            <div key={indexLinha} className="flex flex-wrap items-center min-h-[2rem] mt-2 mb-2 break-inside-avoid">
              {partes.map((parte, idx) => {
                if (parte.startsWith('[') && parte.endsWith(']')) {
                  const acordeCru = parte.slice(1, -1);
                  const acorde = transporAcorde(acordeCru, semitons);
                  return (
                    <span key={idx} className="text-primary-600 dark:text-primary-400 font-bold font-mono text-lg">
                      {acorde}
                    </span>
                  );
                } else if (parte.length > 0) {
                  return (
                    <span key={idx} className="whitespace-pre text-gray-500 dark:text-gray-400 font-mono text-lg">
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
            <div key={indexLinha} className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 print:text-black text-lg break-inside-avoid min-h-[1.5rem]">
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
                  <span className="text-primary-600 dark:text-primary-400 font-bold min-h-[1.5rem] pr-1 font-mono text-base">
                    {seg.acorde || '\u00A0'}
                  </span>
                )}
                <span className="whitespace-pre text-gray-800 dark:text-gray-200 print:text-black text-lg">
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
