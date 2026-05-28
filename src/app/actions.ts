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

    const lines: string[] = data.text.split('\n');
    const resultLines: string[] = [];
    
    let pendingChords: { chord: string; index: number }[] = [];

    const chordRegexStr = "^[A-G][#b]?(m|M|maj|min|dim|aug|sus)?([0-9])*(?:\\/[A-G][#b]?)?$";
    const exactChordRegex = new RegExp(chordRegexStr);
    const searchChordRegex = new RegExp("(\\(?[A-G][#b]?(?:m|M|maj|min|dim|aug|sus)?(?:[0-9])*(?:\\/[A-G][#b]?)?\\)?)", "g");

    const sectionRegex = /^\s*\[?(Intro|Refrão|Refrao|Estrofe|Ponte|Final|Vocal|Banda|Solo|Coro|Ministro|Todos)\]?[\:\-]?\s*$/i;
    const prefixRegex = /^\s*\[?(Intro|Refrão|Refrao|Estrofe|Ponte|Final|Vocal|Banda|Solo|Coro|Ministro|Todos)\]?[\:\-]?\s*/i;

    function isChordLine(line: string) {
      const trimmed = line.trim();
      if (trimmed.length === 0) return false;
      
      const cleanLine = trimmed.replace(/(Intro|Refrão|Refrao|Estrofe|Ponte|Final|Vocal|Banda|Solo|Coro|Ministro|Todos)[\:\-]?/gi, '').trim();
      if (cleanLine.length === 0) return false;

      const parts = cleanLine.split(/\s+/);
      
      let validChords = 0;
      for (const part of parts) {
        const p = part.replace(/[\(\)]/g, '');
        if (exactChordRegex.test(p)) {
          validChords++;
        }
      }
      
      return (validChords / parts.length) >= 0.7;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/\r/g, ''); // Limpar quebras

      // 1. Checar se é uma linha de seção isolada (ex: [Refrão], Intro:)
      const sectionMatch = line.match(sectionRegex);
      if (sectionMatch) {
        if (pendingChords.length > 0) {
          let blankLine = "";
          for (const { chord, index } of pendingChords) {
            if (index > blankLine.length) {
              blankLine = blankLine.padEnd(index, ' ');
            }
            blankLine += `[${chord}]`;
          }
          resultLines.push(blankLine.trim());
          pendingChords = [];
        }
        const sectionName = sectionMatch[1].charAt(0).toUpperCase() + sectionMatch[1].slice(1).toLowerCase();
        resultLines.push(`${sectionName}:`);
        continue;
      }

      if (isChordLine(line)) {
        const prefixMatch = line.match(prefixRegex);
        if (prefixMatch) {
          const sectionName = prefixMatch[1].charAt(0).toUpperCase() + prefixMatch[1].slice(1).toLowerCase();
          resultLines.push(`${sectionName}:`);
        }

        let match;
        const lineWithoutStructure = line.replace(/(Intro|Refrão|Refrao|Estrofe|Ponte|Final|Vocal|Banda|Solo|Coro|Ministro|Todos)[\:\-]?/gi, match => ' '.repeat(match.length));
        
        searchChordRegex.lastIndex = 0;
        while ((match = searchChordRegex.exec(lineWithoutStructure)) !== null) {
          const before = match.index === 0 ? ' ' : lineWithoutStructure[match.index - 1];
          const after = (match.index + match[0].length === lineWithoutStructure.length) ? ' ' : lineWithoutStructure[match.index + match[0].length];
          
          if (/[\s\(\)]/.test(before) && /[\s\(\)]/.test(after)) {
            const cleanChord = match[0].replace(/[\(\)]/g, '');
            pendingChords.push({ chord: cleanChord, index: match.index });
          }
        }
      } else {
        let currentLine = line;
        
        if (pendingChords.length > 0) {
          if (currentLine.trim() === '') {
            let blankLine = "";
            for (const { chord, index } of pendingChords) {
              if (index > blankLine.length) {
                blankLine = blankLine.padEnd(index, ' ');
              }
              blankLine += `[${chord}]`;
            }
            resultLines.push(blankLine.trim());
          } else {
            for (let j = pendingChords.length - 1; j >= 0; j--) {
              const { chord, index } = pendingChords[j];
              
              if (index > currentLine.length) {
                currentLine = currentLine.padEnd(index, ' ');
              }
              
              currentLine = currentLine.substring(0, index) + `[${chord}]` + currentLine.substring(index);
            }
            resultLines.push(currentLine.trimEnd());
          }
          pendingChords = [];
        } else {
          resultLines.push(currentLine.trimEnd());
        }
      }
    }

    if (pendingChords.length > 0) {
      let blankLine = "";
      for (const { chord, index } of pendingChords) {
        if (index > blankLine.length) {
          blankLine = blankLine.padEnd(index, ' ');
        }
        blankLine += `[${chord}]`;
      }
      resultLines.push(blankLine.trim());
    }

    const cleanOutput = resultLines.join('\n').replace(/\n{3,}/g, '\n\n');
    return { success: true, text: cleanOutput };

  } catch (error: any) {
    console.error("Erro na conversão do PDF:", error);
    return { success: false, error: error?.message || "Erro desconhecido ao converter o PDF." };
  }
}
