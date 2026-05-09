import { transporAcorde } from "@/utils/transposicao";

export function CifraRenderer({ texto, semitons = 0 }: { texto: string; semitons?: number }) {
  const linhas = texto.split('\n');

  return (
    <div className="font-sans">
      {linhas.map((linha, indexLinha) => {
        if (!linha.trim() && !linha.includes('[')) {
          return <div key={indexLinha} className="h-6"></div>;
        }

        const temAcordes = linha.includes('[');
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
          <div key={indexLinha} className="flex flex-wrap items-start">
            {segmentos.map((seg, idx) => (
              <div key={idx} className="flex flex-col items-start">
                {temAcordes && (
                  <span className="text-primary-600 dark:text-primary-400 font-bold min-h-[1.5rem] pr-1 font-mono text-base">
                    {seg.acorde || '\u00A0'}
                  </span>
                )}
                <span className="whitespace-pre text-gray-800 dark:text-gray-200 text-lg">
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
