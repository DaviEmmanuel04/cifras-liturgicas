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

    // Se houver uma chave da API do DeepSeek configurada, tenta converter via Inteligência Artificial
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (apiKey && rawText && rawText.trim().length > 0) {
      try {
        const aiResult = await convertTextWithAiAction(rawText);
        if (aiResult.success && aiResult.text) {
          return { success: true, text: aiResult.text };
        }
        console.warn("Falha ao converter PDF usando DeepSeek. Usando o parser local de fallback:", aiResult.error);
      } catch (aiErr) {
        console.error("Erro inesperado na chamada do DeepSeek para o PDF. Usando parser local:", aiErr);
      }
    }

    const lines: string[] = rawText.split('\n');
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

export async function convertTextWithAiAction(rawText: string): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return { success: false, error: "API Key do DeepSeek não configurada no servidor." };
    }

    const SYSTEM_PROMPT = `Você é um assistente especialista em música, liturgia e cifras de paróquias católicas.
Sua tarefa é converter a cifra recebida do usuário (que pode estar em formato desordenado, com acordes escritos acima das linhas de texto ou misturados) para o formato inline estruturado do nosso leitor de cifras.

Regras importantes de formatação:
1. Insira os acordes exatamente no ponto da palavra/sílaba onde eles devem ser executados, delimitando-os com colchetes, por exemplo: [Dm]O amor do Senhor Deus.
2. Mantenha os acordes corretos e a harmonia idêntica ao texto fornecido.
3. Identifique as seções da música (ex: Intro, Refrão, Estrofe 1, Ponte, Solo, Final) e as rotule em linhas separadas terminando em dois pontos (ex: Intro:, Refrão:, Estrofe 1:).
4. Limpe qualquer cabeçalho irrelevante do PDF (como datas, links de URL, paginação) que não faça parte da música em si.
5. Retorne APENAS a cifra convertida final no formato solicitado. Não adicione saudações, explicações, nem blocos de código markdown (como \`\`\` ou \`\`\`txt). O resultado deve ser texto puro contendo a cifra.`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: rawText }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API do DeepSeek (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    let resultText = data.choices[0].message.content.trim();

    // Limpar possíveis blocos de código markdown que a IA coloque por engano
    if (resultText.startsWith("```")) {
      // Remove a linha inicial ``` ou ```txt ou ```markdown
      resultText = resultText.replace(/^```[a-zA-Z]*\n/, "");
      // Remove a linha final ```
      resultText = resultText.replace(/\n```$/, "");
    }

    return { success: true, text: resultText };
  } catch (error: any) {
    console.error("Erro na conversão com DeepSeek:", error);
    return { success: false, error: error?.message || "Erro desconhecido ao chamar a API da IA." };
  }
}
