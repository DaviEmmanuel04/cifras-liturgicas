"use server";

export async function getLiturgicalDay() {
  try {
    // Fazemos a requisição HTTP no lado do servidor (Next.js Node)
    // Assim não há bloqueio de "Mixed Content" pelo navegador do usuário
    const res = await fetch("http://calapi.inadiutorium.cz/api/v0/en/calendars/default/today", {
      // Revalida a cada 1 hora para economizar recursos e acelerar a resposta
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) {
      throw new Error(`Erro na API: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Falha no fetch do servidor para o calapi:", error);
    return null;
  }
}

export async function convertPdfAction(formData: FormData): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "Nenhum arquivo enviado" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Importação dinâmica para rodar somente no lado do servidor
    const pdfParser = require("pdf-parse");
    const data = await pdfParser(buffer);
    const rawText = data.text;

    const lines: string[] = rawText.split('\n');
    const resultLines: string[] = [];
    
    let pendingChords: { chord: string; index: number }[] = [];

    const chordRegexStr = "^[A-G][#b]?(m|M|maj|min|dim|aug|sus)?([0-9])*(?:\\/[A-G][#b]?)?$";
    const exactChordRegex = new RegExp(chordRegexStr);
    const searchChordRegex = new RegExp("(\\(?[A-G][#b]?(?:m|M|maj|min|dim|aug|sus)?(?:[0-9])*(?:\\/[A-G][#b]?)?\\)?)", "g");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        if (pendingChords.length > 0) {
          resultLines.push(pendingChords.map(c => `[${c.chord}]`).join(' '));
          pendingChords = [];
        }
        resultLines.push('');
        continue;
      }

      const tokens = trimmedLine.split(/\s+/);
      const isAllChords = tokens.every(token => {
        const cleanToken = token.replace(/[()]/g, '');
        return exactChordRegex.test(cleanToken);
      });

      if (isAllChords) {
        if (pendingChords.length > 0) {
          resultLines.push(pendingChords.map(c => `[${c.chord}]`).join(' '));
          pendingChords = [];
        }

        let match;
        searchChordRegex.lastIndex = 0;
        while ((match = searchChordRegex.exec(line)) !== null) {
          const rawChord = match[0].replace(/[()]/g, '');
          pendingChords.push({
            chord: rawChord,
            index: match.index
          });
        }
      } else {
        if (pendingChords.length > 0) {
          let lineChars = line.split('');
          
          pendingChords.sort((a, b) => b.index - a.index);

          for (const pc of pendingChords) {
            const chordTag = `[${pc.chord}]`;
            if (pc.index < lineChars.length) {
              lineChars.splice(pc.index, 0, chordTag);
            } else {
              lineChars.push(' ' + chordTag);
            }
          }

          resultLines.push(lineChars.join(''));
          pendingChords = [];
        } else {
          resultLines.push(line);
        }
      }
    }

    if (pendingChords.length > 0) {
      resultLines.push(pendingChords.map(c => `[${c.chord}]`).join(' '));
    }

    const cleanOutput = resultLines.join('\n').replace(/\n{3,}/g, '\n\n');
    return { success: true, text: cleanOutput };

  } catch (error: any) {
    console.error("Erro na conversão do PDF:", error);
    return { success: false, error: error?.message || "Erro desconhecido ao converter o PDF." };
  }
}
