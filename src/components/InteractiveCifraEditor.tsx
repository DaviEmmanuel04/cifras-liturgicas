"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  parseBracketString, 
  buildBracketString, 
  gerarAcordesDoTom, 
  LineToken, 
  WordToken 
} from "@/utils/cifraParser";
import { Sparkles, Edit3, Type, Check, Trash2, Music, X, ChevronRight } from "lucide-react";

interface InteractiveCifraEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  tom?: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  extraHeaderActions?: React.ReactNode;
}

export function InteractiveCifraEditor({
  value,
  onChange,
  tom = "",
  textareaRef,
  extraHeaderActions
}: InteractiveCifraEditorProps) {
  const [mode, setMode] = useState<"visual" | "texto">("visual");
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [inputChord, setInputChord] = useState<string>("");
  const popoverInputRef = useRef<HTMLInputElement>(null);

  // Parsing da string atual em tokens
  const lineTokens = useMemo(() => {
    return parseBracketString(value);
  }, [value]);

  // Acordes sugeridos para o tom
  const acordesSugeridos = useMemo(() => {
    return gerarAcordesDoTom(tom);
  }, [tom]);

  // Foco automático no campo do Popover ao ativar um token
  useEffect(() => {
    if (activeTokenId && popoverInputRef.current) {
      popoverInputRef.current.focus();
      popoverInputRef.current.select();
    }
  }, [activeTokenId]);

  // Função para encontrar e selecionar um token pelo ID
  const handleTokenClick = (lineIndex: number, token: WordToken) => {
    setActiveLineIndex(lineIndex);
    setActiveTokenId(token.id);
    setInputChord(token.chord || "");
  };

  // Salvar acorde do token atual
  const updateActiveTokenChord = (newChord: string | null) => {
    if (activeTokenId === null || activeLineIndex === null) return;

    const newLines = lineTokens.map((line, lIdx) => {
      if (lIdx !== activeLineIndex) return line;
      return {
        ...line,
        tokens: line.tokens.map((tok) => {
          if (tok.id !== activeTokenId) return tok;
          return { ...tok, chord: newChord ? newChord.trim() : null };
        })
      };
    });

    const newString = buildBracketString(newLines);
    onChange(newString);
  };

  // Confirmar acorde e fechar popover
  const handleConfirmChord = (chordOverride?: string | React.MouseEvent) => {
    const chordToSave = typeof chordOverride === "string" ? chordOverride : (inputChord.trim() ? inputChord : null);
    updateActiveTokenChord(chordToSave);
    setActiveTokenId(null);
    setActiveLineIndex(null);
  };

  // Remover acorde do token atual
  const handleRemoveChord = () => {
    updateActiveTokenChord(null);
    setActiveTokenId(null);
    setActiveLineIndex(null);
  };

  // Navegar para o próximo token útil (Atalhos de teclado: TAB)
  const handleNextToken = (chordOverride?: string) => {
    // 1. Salva o acorde atual (ou o acorde fornecido no clique)
    const chordToSave = chordOverride !== undefined ? chordOverride : (inputChord.trim() ? inputChord : null);
    updateActiveTokenChord(chordToSave);

    // 2. Busca o próximo token elegível
    let foundCurrent = false;
    let nextToken: { lineIndex: number; token: WordToken } | null = null;

    for (let lIdx = 0; lIdx < lineTokens.length; lIdx++) {
      const line = lineTokens[lIdx];
      if (line.isSection) continue;

      for (let tIdx = 0; tIdx < line.tokens.length; tIdx++) {
        const tok = line.tokens[tIdx];
        if (foundCurrent) {
          // Aceita qualquer palavra útil ou próximo elemento
          if (tok.isWord || tok.text.trim().length > 0) {
            nextToken = { lineIndex: lIdx, token: tok };
            break;
          }
        }
        if (tok.id === activeTokenId) {
          foundCurrent = true;
        }
      }
      if (nextToken) break;
    }

    if (nextToken) {
      setActiveLineIndex(nextToken.lineIndex);
      setActiveTokenId(nextToken.token.id);
      setInputChord(nextToken.token.chord || "");
    } else {
      setActiveTokenId(null);
      setActiveLineIndex(null);
    }
  };

  // Tratamento de teclas no Popover (Enter, Tab, Esc)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirmChord();
    } else if (e.key === "Tab") {
      e.preventDefault();
      handleNextToken();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActiveTokenId(null);
      setActiveLineIndex(null);
    } else if (e.key === "Backspace" && inputChord === "") {
      e.preventDefault();
      handleRemoveChord();
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Barra de Seleção de Modo & Ações de Importação */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-100/80 p-1.5 rounded-xl border border-gray-200">
        <div className="flex gap-1 bg-white p-1 rounded-lg shadow-xs border border-gray-200">
          <button
            type="button"
            onClick={() => setMode("visual")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === "visual"
                ? "bg-primary-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Sparkles size={14} />
            <span>Editor Visual Interativo</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("texto")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === "texto"
                ? "bg-primary-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Type size={14} />
            <span>Modo Texto (Código)</span>
          </button>
        </div>

        {/* Botões de Ação Extras (Importar PDF, Converter com IA, etc.) */}
        {extraHeaderActions && (
          <div className="flex items-center gap-2">
            {extraHeaderActions}
          </div>
        )}
      </div>

      {/* Dica do Modo Visual */}
      {mode === "visual" && (
        <div className="p-2.5 bg-primary-50/70 border border-primary-200/60 rounded-xl text-primary-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Music size={14} className="text-primary-600 shrink-0" />
            <span>
              <strong>Dica:</strong> Clique em qualquer letra/sílaba (slots de 2 letras com <code>+</code>) para posicionar o acorde no ponto exato. Use <kbd className="bg-white border border-primary-300 px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">Tab</kbd> para avançar rápido!
            </span>
          </div>
        </div>
      )}

      {/* ÁREA DO EDITOR */}
      {mode === "texto" ? (
        /* MODO TEXTO TRADICIONAL */
        <textarea
          ref={textareaRef}
          name="letraCifra"
          required
          rows={14}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Digite ou cole a letra e cifra aqui...\nExemplo:\nIntro:\n[Dm] [G7]\n\n[C]Senhor, tende pi[G]edade de nós`}
          className="w-full p-4 border border-gray-300 rounded-xl bg-white font-mono text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-y leading-relaxed"
        />
      ) : (
        /* MODO VISUAL INTERATIVO */
        <div className="relative min-h-[380px] p-6 pt-8 border border-gray-250 rounded-2xl bg-white shadow-xs space-y-5 select-none">
          {lineTokens.length === 0 || (lineTokens.length === 1 && lineTokens[0].tokens.length === 0) ? (
            <div className="text-center py-16 text-gray-400 space-y-3">
              <Type size={36} className="mx-auto text-gray-300 opacity-60" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Nenhum texto inserido ainda.</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Alterne para o <strong>Modo Texto</strong> para digitar/colar a letra da música.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setMode("texto")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Type size={14} />
                  <span>Digitar / Colar Letra (Modo Texto)</span>
                </button>
              </div>
            </div>
          ) : (
            lineTokens.map((linha, lIdx) => {
              // 1. Linhas vazias
              if (!linha.isSection && linha.tokens.length === 0) {
                return <div key={linha.id} className="h-6" />;
              }

              // 2. Linhas de Seção (Intro:, Refrão:, etc)
              if (linha.isSection) {
                return (
                  <div key={linha.id} className="pt-3 pb-1">
                    <span className="font-serif font-bold italic text-primary-700 text-sm tracking-wide bg-primary-50/70 border border-primary-200/50 px-2.5 py-1 rounded-md">
                      {linha.sectionText}
                    </span>
                  </div>
                );
              }

              // Determina se a linha está no topo (linhas 0 ou 1) para posicionar o popover para baixo
              const isTopLine = lIdx <= 1;

              // 3. Linhas com Palavras Interativas
              return (
                <div key={linha.id} className="flex flex-wrap items-end gap-y-3 leading-none">
                  {linha.tokens.map((token) => {
                    const isActive = activeTokenId === token.id;
                    const hasChord = Boolean(token.chord);

                    if (!token.isWord && token.text.trim().length === 0) {
                      // Espaço em branco entre palavras
                      return (
                        <span key={token.id} className="whitespace-pre font-sans text-transparent text-base">
                          {token.text}
                        </span>
                      );
                    }

                    return (
                      <div key={token.id} className="relative group inline-flex flex-col items-start">
                        {/* Exibição do Acorde acima da Sílaba/Letras */}
                        <div
                          onClick={() => handleTokenClick(lIdx, token)}
                          className={`min-h-[1.25em] px-1 py-0.2 rounded text-[11px] font-mono font-extrabold cursor-pointer transition-all flex items-center justify-center ${
                            hasChord
                              ? "bg-primary-100 text-primary-800 border border-primary-300/80 shadow-2xs group-hover:bg-primary-200"
                              : "text-gray-300 hover:text-primary-600 hover:bg-primary-50 border border-transparent hover:border-primary-200"
                          } ${isActive ? "ring-2 ring-primary-500 bg-primary-200 text-primary-900" : ""}`}
                          title="Clique para adicionar/editar o acorde"
                        >
                          {token.chord || "+"}
                        </div>

                        {/* Pedaço da Palavra (1-2 letras) Clicável */}
                        <span
                          onClick={() => handleTokenClick(lIdx, token)}
                          className={`font-sans text-base font-medium px-0.5 py-0.2 rounded transition-colors cursor-pointer border ${
                            isActive
                              ? "bg-primary-50 border-primary-400 text-primary-900 font-semibold"
                              : "border-transparent hover:bg-gray-100 text-gray-850"
                          }`}
                        >
                          {token.text}
                        </span>

                        {/* POPOVER FLUTUANTE DE EDIÇÃO DE ACORDE */}
                        {isActive && (
                          <div
                            className={`absolute z-50 min-w-[240px] max-w-[280px] bg-white rounded-xl shadow-2xl border border-gray-200 p-3 space-y-2.5 animate-fade-in ${
                              isTopLine
                                ? "top-full mt-2 left-0"
                                : "bottom-full mb-2 left-0"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold pb-1 border-b border-gray-100">
                              <span>Acorde em: <strong className="text-gray-900 font-bold">&quot;{token.text.trim()}&quot;</strong></span>
                              <button
                                type="button"
                                onClick={() => setActiveTokenId(null)}
                                className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            {/* Campo de Entrada com Atalhos */}
                            <div className="flex gap-1.5">
                              <input
                                ref={popoverInputRef}
                                type="text"
                                value={inputChord}
                                onChange={(e) => setInputChord(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ex: Dm, G7, Bb..."
                                className="flex-1 p-2 text-xs font-mono font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white"
                              />
                              <button
                                type="button"
                                onClick={handleConfirmChord}
                                className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors cursor-pointer"
                                title="Confirmar (Enter)"
                              >
                                <Check size={14} />
                              </button>
                              {hasChord && (
                                <button
                                  type="button"
                                  onClick={handleRemoveChord}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg border border-red-200 transition-colors cursor-pointer"
                                  title="Remover Acorde"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>

                            {/* Botões Rápidos do Campo Harmônico do Tom */}
                            <div>
                              <div className="text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1">
                                Acordes do Tom {tom ? `(${tom})` : ""}:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {acordesSugeridos.map((ac) => (
                                  <button
                                    key={ac}
                                    type="button"
                                    onClick={() => {
                                      setInputChord(ac);
                                      handleNextToken(ac);
                                    }}
                                    className="px-2 py-1 bg-gray-100 hover:bg-primary-100 hover:text-primary-800 border border-gray-200 rounded font-mono text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    {ac}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Rodapé de Dica de Atalhos */}
                            <div className="pt-1 text-[10px] text-gray-400 flex items-center justify-between border-t border-gray-100">
                              <span><kbd className="font-mono bg-gray-100 px-1 rounded border">Tab</kbd> Próxima palavra</span>
                              <span><kbd className="font-mono bg-gray-100 px-1 rounded border">Enter</kbd> Salvar</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
