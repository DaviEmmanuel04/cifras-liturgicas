const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

// Regex para identificar acordes válidos
const chordRegexStr = "^[A-G][#b]?(m|M|maj|min|dim|aug|sus)?([0-9])*(?:\\/[A-G][#b]?)?$";
const exactChordRegex = new RegExp(chordRegexStr);
const searchChordRegex = new RegExp("(\\(?[A-G][#b]?(?:m|M|maj|min|dim|aug|sus)?(?:[0-9])*(?:\\/[A-G][#b]?)?\\)?)", "g");

function isChordLine(line) {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;
  
  // Algumas linhas podem ter marcadores como "Intro:", "Refrão", etc.
  // Vamos remover palavras comuns de estrutura antes de testar
  let cleanLine = trimmed.replace(/(Intro|Refrão|Refrao|Estrofe|Ponte|Final|Vocal|Banda)[\:\-]?/gi, '').trim();
  if (cleanLine.length === 0) return false; // Era apenas "Intro:"

  const parts = cleanLine.split(/\s+/);
  
  // Para ser uma linha de cifra, a grande maioria (ex: 80%) das "palavras" devem ser acordes
  let validChords = 0;
  for (const part of parts) {
    // Remover parênteses de acordes como (C) ou (D)
    const p = part.replace(/[\(\)]/g, '');
    if (exactChordRegex.test(p)) {
      validChords++;
    }
  }
  
  return (validChords / parts.length) >= 0.7; // 70% das palavras são acordes
}

async function convertPdfToCifra(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    // Preservar layout na extração ajuda com os índices de coluna
    const data = await pdf(dataBuffer);
    
    const lines = data.text.split('\n');
    const resultLines = [];
    
    let pendingChords = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].replace(/\r/g, ''); // Limpar quebras

      if (isChordLine(line)) {
        // Encontramos uma linha de acordes
        let match;
        // Limpar possíveis estruturas para não dar match falso
        const lineWithoutStructure = line.replace(/(Intro|Refrão|Refrao|Estrofe|Ponte|Final|Vocal|Banda)[\:\-]?/gi, match => ' '.repeat(match.length));
        
        while ((match = searchChordRegex.exec(lineWithoutStructure)) !== null) {
          // Só adicionamos se for um match válido isolado (para evitar pegar "D" no meio de uma palavra, embora a regex do isChordLine evite isso)
          // Vamos checar se o match está cercado por espaços ou bordas
          const before = match.index === 0 ? ' ' : lineWithoutStructure[match.index - 1];
          const after = (match.index + match[0].length === lineWithoutStructure.length) ? ' ' : lineWithoutStructure[match.index + match[0].length];
          
          if (/[\s\(\)]/.test(before) && /[\s\(\)]/.test(after)) {
            const cleanChord = match[0].replace(/[\(\)]/g, '');
            pendingChords.push({ chord: cleanChord, index: match.index });
          }
        }
      } else {
        // Não é linha de acorde
        let currentLine = line;
        
        if (pendingChords.length > 0) {
          if (currentLine.trim() === '') {
            // Se a linha de baixo é vazia, então a linha de acordes não tinha letra (ex: Intro)
            // Vamos apenas imprimir os acordes seguidos de espaço na linha
            let blankLine = "";
            for (const { chord, index } of pendingChords) {
              if (index > blankLine.length) {
                blankLine = blankLine.padEnd(index, ' ');
              }
              blankLine += `[${chord}]`;
            }
            resultLines.push(blankLine.trim());
          } else {
            // Tem acordes pendentes e essa é a letra
            // Aplicar de trás pra frente para não bagunçar os índices!
            for (let j = pendingChords.length - 1; j >= 0; j--) {
              const { chord, index } = pendingChords[j];
              
              if (index > currentLine.length) {
                currentLine = currentLine.padEnd(index, ' ');
              }
              
              currentLine = currentLine.substring(0, index) + `[${chord}]` + currentLine.substring(index);
            }
            resultLines.push(currentLine.trimEnd());
          }
          pendingChords = []; // Reseta
        } else {
          // Texto normal
          resultLines.push(currentLine.trimEnd());
        }
      }
    }

    // Se sobrou algum acorde no final (Intro no final da música)
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

    // Limpar múltiplas linhas vazias seguidas
    const cleanOutput = resultLines.join('\n').replace(/\n{3,}/g, '\n\n');
    
    const outputPath = path.resolve(path.dirname(pdfPath), path.basename(pdfPath, '.pdf') + '_cifra.txt');
    fs.writeFileSync(outputPath, cleanOutput, 'utf-8');
    
    console.log(`\n✅ Cifra convertida com sucesso!`);
    console.log(`📁 Arquivo salvo em: ${outputPath}\n`);

  } catch (err) {
    console.error("Erro ao converter PDF:", err);
  }
}

async function processPath(inputPath) {
  try {
    const stat = fs.statSync(inputPath);
    if (stat.isDirectory()) {
      const files = fs.readdirSync(inputPath).filter(f => f.toLowerCase().endsWith('.pdf'));
      if (files.length === 0) {
        console.log(`Nenhum arquivo PDF encontrado na pasta: ${inputPath}`);
        return;
      }
      console.log(`Encontrados ${files.length} arquivos PDF. Iniciando conversão em lote...`);
      for (const file of files) {
        await convertPdfToCifra(path.join(inputPath, file));
      }
      console.log(`\n🎉 Conversão em lote finalizada com sucesso!`);
    } else {
      await convertPdfToCifra(inputPath);
    }
  } catch (err) {
    console.error(`Erro ao acessar o caminho ${inputPath}:`, err.message);
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Uso: node scripts/pdf-converter/index.js <caminho_para_o_pdf_ou_pasta>");
  process.exit(1);
}

processPath(args[0]);
