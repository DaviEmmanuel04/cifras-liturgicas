"use client";

import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CifraRenderer, Trechos } from "./CifraRenderer";
import { variaveisDaPaleta, type LiturgicalColor } from "./LiturgicalThemeProvider";
import { completarLivreto, imporLivreto, interpretarAvisos, paginar, type BlocoMedido, type LinhaAviso } from "@/utils/folheto";

export interface CanticoFolheto {
  musicaId: string;
  titulo: string;
  categoria: string;
  estrofes: string[];
}

interface FolhetoLivretoProps {
  comunidade: string;
  celebracao: string;
  dataPorExtenso: string;
  canticos: CanticoFolheto[];
  avisos: string;
  /** Cor litúrgica dos destaques (títulos, rótulos, filetes da capa). */
  cor: LiturgicalColor;
  /**
   * O que sai na impressão: `livreto` (folhas A4 impostas, para dobrar) ou
   * `digital` (páginas A5 em sequência, sem as brancas de enchimento — para
   * salvar como PDF e usar na tela).
   */
  modoImpressao: "livreto" | "digital";
}

// Página A5 (148 × 210 mm). A área útil desconta as margens e o rodapé com o
// número da página; é ela que limita quanto conteúdo cabe em cada página.
const MARGEM_MM = 11;
const RODAPE_MM = 7;
const LARGURA_UTIL = `${148 - 2 * MARGEM_MM}mm`;
const ALTURA_UTIL = `${210 - 2 * MARGEM_MM - RODAPE_MM}mm`;

type Bloco = BlocoMedido & {
  render: (paginaDoCantico: Record<string, number>) => React.ReactNode;
};

// Cada página impressa fica 1px menor que o papel: 210mm não é um número
// inteiro de pixels e o navegador arredonda para cima, então páginas com a
// altura exata do papel "transbordavam" e o PDF ganhava uma folha em branco no
// fim. O px cortado é margem inferior, sem conteúdo.
const folhaImpressa = (posicao: number, largura: string, altura: string): React.CSSProperties => ({
  width: largura,
  height: `calc(${altura} - 1px)`,
  overflow: "hidden",
  ...(posicao === 0 ? {} : { breakBefore: "page" }),
});

/** O espaço entre blocos fica dentro do bloco (padding), para entrar na medição. */
function Espacado({ children, depois }: { children: React.ReactNode; depois: string }) {
  return <div style={{ paddingBottom: depois }}>{children}</div>;
}

/** Um aviso (parágrafo) como sai no Folheto — usado também na prévia do editor de avisos. */
export function ParagrafoAviso({ linhas }: { linhas: LinhaAviso[] }) {
  return (
    <div className="text-[10pt] leading-relaxed">
      {linhas.map((linha, l) => {
        if (linha.tipo === "titulo") {
          return (
            <p key={l} className="font-serif font-bold text-[11.5pt] text-primary-800 mt-1 mb-0.5">
              <Trechos trechos={linha.trechos} />
            </p>
          );
        }
        if (linha.tipo === "texto") {
          return (
            <p key={l}>
              <Trechos trechos={linha.trechos} />
            </p>
          );
        }
        return (
          <div key={l} className="flex gap-1.5 pl-1">
            <span className="shrink-0 text-right min-w-[1em] text-primary-700">
              {linha.tipo === "numerado" ? `${linha.numero}.` : "•"}
            </span>
            <span>
              <Trechos trechos={linha.trechos} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function montarBlocos(canticos: CanticoFolheto[], avisos: string): { miolo: Bloco[]; finais: Bloco[] } {
  const miolo: Bloco[] = [
    {
      id: "indice",
      altura: 0,
      novaPagina: true,
      manterComProximo: true,
      render: () => (
        <Espacado depois="4mm">
          <h2 className="font-serif font-bold text-[14pt] text-center text-primary-800 border-b border-primary-300 pb-2">Cânticos</h2>
        </Espacado>
      ),
    },
    ...canticos.map((cantico, i): Bloco => ({
      id: `indice-${i}`,
      altura: 0,
      render: (paginaDoCantico) => (
        <Espacado depois="1.5mm">
          <div className="flex items-baseline gap-2 text-[10pt]">
            <span className="shrink-0 w-[24mm] uppercase tracking-wider text-[7pt] text-primary-700">{cantico.categoria}</span>
            <span className="font-medium">{cantico.titulo}</span>
            <span className="grow border-b border-dotted border-gray-400" />
            <span className="tabular-nums">{paginaDoCantico[cantico.musicaId] ?? "00"}</span>
          </div>
        </Espacado>
      ),
    })),
  ];

  canticos.forEach((cantico, i) => {
    miolo.push({
      id: `cantico-${i}`,
      altura: 0,
      novaPagina: i === 0,
      manterComProximo: true,
      render: () => (
        <Espacado depois="2mm">
          <div className={i === 0 ? "" : "pt-4"}>
            <p className="uppercase tracking-[0.2em] text-[7pt] font-semibold text-primary-700">{cantico.categoria}</p>
            <h3 className="font-serif font-bold text-[13pt] leading-tight text-primary-900">{cantico.titulo}</h3>
          </div>
        </Espacado>
      ),
    });
    cantico.estrofes.forEach((estrofe, j) => {
      miolo.push({
        id: `cantico-${i}-${j}`,
        altura: 0,
        render: () => (
          <Espacado depois="3mm">
            <CifraRenderer texto={estrofe} somenteLetra />
          </Espacado>
        ),
      });
    });
  });

  const paragrafosAvisos = interpretarAvisos(avisos);
  const finais: Bloco[] =
    paragrafosAvisos.length === 0
      ? []
      : [
          {
            id: "avisos",
            altura: 0,
            novaPagina: true,
            manterComProximo: true,
            render: () => (
              <Espacado depois="4mm">
                <h2 className="font-serif font-bold text-[14pt] text-center text-primary-800 border-b border-primary-300 pb-2">Avisos</h2>
              </Espacado>
            ),
          },
          ...paragrafosAvisos.map((paragrafo, k): Bloco => ({
            id: `avisos-${k}`,
            altura: 0,
            render: () => (
              <Espacado depois="3mm">
                <ParagrafoAviso linhas={paragrafo} />
              </Espacado>
            ),
          })),
        ];

  return { miolo, finais };
}

function Capa({ comunidade, celebracao, dataPorExtenso }: Omit<FolhetoLivretoProps, "canticos" | "avisos" | "cor" | "modoImpressao">) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-5">
      <Image src="/logo-principal.png" alt="" width={110} height={110} className="object-contain grayscale" priority />
      {comunidade && <p className="uppercase tracking-[0.25em] text-[8pt] font-semibold text-primary-700">{comunidade}</p>}
      <div className="w-16 border-t-2 border-primary-500" />
      <h1 className="font-serif font-bold text-[20pt] leading-tight px-4 text-primary-900">{celebracao}</h1>
      <p className="font-serif italic text-[11pt] text-gray-700">{dataPorExtenso}</p>
      <div className="w-16 border-t-2 border-primary-500" />
      <p className="uppercase tracking-[0.3em] text-[7pt] text-primary-700">Folheto de Cânticos</p>
    </div>
  );
}

function PaginaA5({ numero, children }: { numero: number | null; children: React.ReactNode }) {
  return (
    <div
      className="relative bg-white text-black overflow-hidden shrink-0"
      style={{ width: "148mm", height: "210mm", padding: `${MARGEM_MM}mm` }}
    >
      <div style={{ height: ALTURA_UTIL }} className="text-[10.5pt]">
        {children}
      </div>
      {numero !== null && (
        <div className="absolute left-0 right-0 text-center text-[8pt] text-gray-500" style={{ bottom: `${MARGEM_MM}mm` }}>
          {numero}
        </div>
      )}
    </div>
  );
}

/**
 * Folheto de Cânticos montado como livreto A5: mede a altura real de cada
 * bloco (título, estrofe, aviso) no navegador, distribui em páginas sem
 * quebrar estrofes e, na impressão, impõe as páginas em folhas A4 paisagem
 * para imprimir frente e verso, dobrar ao meio e grampear — ou, no modo
 * digital, em páginas A5 na ordem de leitura.
 */
export function FolhetoLivreto({ comunidade, celebracao, dataPorExtenso, canticos, avisos, cor, modoImpressao }: FolhetoLivretoProps) {
  const { miolo, finais } = useMemo(() => montarBlocos(canticos, avisos), [canticos, avisos]);
  const medicaoRef = useRef<HTMLDivElement>(null);
  const alturaRef = useRef<HTMLDivElement>(null);
  const [paginacao, setPaginacao] = useState<{ miolo: string[][]; finais: string[][] } | null>(null);

  useLayoutEffect(() => {
    let cancelado = false;
    // Sem esperar as fontes, a medição sai com a fonte de fallback e erra a altura
    document.fonts.ready.then(() => {
      if (cancelado || !medicaoRef.current || !alturaRef.current) return;
      const alturas: Record<string, number> = {};
      medicaoRef.current.querySelectorAll<HTMLElement>("[data-bloco]").forEach((el) => {
        alturas[el.dataset.bloco!] = el.getBoundingClientRect().height;
      });
      const alturaPagina = alturaRef.current.getBoundingClientRect().height;
      const medir = (blocos: Bloco[]) => blocos.map((b) => ({ ...b, altura: alturas[b.id] ?? 0 }));
      setPaginacao({
        miolo: paginar(medir(miolo), alturaPagina),
        finais: paginar(medir(finais), alturaPagina),
      });
    });
    return () => {
      cancelado = true;
    };
  }, [miolo, finais]);

  const porId = useMemo(() => new Map([...miolo, ...finais].map((b) => [b.id, b])), [miolo, finais]);

  const paginas = useMemo(() => {
    if (!paginacao) return null;
    return completarLivreto<"capa" | string[]>(["capa", ...paginacao.miolo], paginacao.finais);
  }, [paginacao]);

  const paginaDoCantico = useMemo(() => {
    const mapa: Record<string, number> = {};
    paginas?.forEach((pagina, indice) => {
      if (!Array.isArray(pagina)) return;
      canticos.forEach((cantico, i) => {
        if (pagina.includes(`cantico-${i}`)) mapa[cantico.musicaId] = indice + 1;
      });
    });
    return mapa;
  }, [paginas, canticos]);

  // `numero` sobrescreve a numeração do livreto (no digital as brancas somem)
  const renderPagina = (indice: number, numero = indice + 1) => {
    const pagina = paginas![indice];
    if (pagina === "capa") {
      return (
        <PaginaA5 key={indice} numero={null}>
          <Capa comunidade={comunidade} celebracao={celebracao} dataPorExtenso={dataPorExtenso} />
        </PaginaA5>
      );
    }
    return (
      <PaginaA5 key={indice} numero={pagina === null ? null : numero}>
        {pagina?.map((id) => (
          <React.Fragment key={id}>{porId.get(id)?.render(paginaDoCantico)}</React.Fragment>
        ))}
      </PaginaA5>
    );
  };

  return (
    // As variáveis da paleta valem só aqui dentro: o resto do app segue o tema
    // global, e a impressão não cai no azul padrão forçado no :root
    <div style={variaveisDaPaleta(cor)}>
      {/* Área de medição: fora da tela, com a mesma largura útil da página */}
      <div
        ref={medicaoRef}
        aria-hidden
        className="print:hidden fixed top-0 left-[-10000px] invisible text-[10.5pt]"
        style={{ width: LARGURA_UTIL }}
      >
        <div ref={alturaRef} style={{ height: ALTURA_UTIL }} />
        {[...miolo, ...finais].map((bloco) => (
          <div key={bloco.id} data-bloco={bloco.id}>
            {bloco.render({})}
          </div>
        ))}
      </div>

      {!paginas ? (
        <p className="text-sm text-gray-500 text-center py-10">Montando o folheto…</p>
      ) : (
        <>
          {/* Tela: páginas na ordem de leitura */}
          <div className="print:hidden flex flex-wrap justify-center gap-6">
            {paginas.map((_, indice) => (
              <div key={indice} className="shadow-md border border-gray-200">
                {renderPagina(indice)}
              </div>
            ))}
          </div>

          {modoImpressao === "digital" ? (
            <>
              {/* PDF digital: páginas A5 na ordem de leitura, sem as brancas */}
              <style>{`@media print { @page { size: A5 portrait; margin: 0; } }`}</style>
              <div className="hidden print:block">
                {paginas
                  .map((pagina, indice) => ({ pagina, indice }))
                  .filter(({ pagina }) => pagina !== null)
                  .map(({ indice }, posicao) => (
                    <div key={indice} style={folhaImpressa(posicao, "148mm", "210mm")}>
                      {renderPagina(indice, posicao + 1)}
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <>
              {/* Livreto: folhas A4 paisagem com as páginas na ordem de dobrar */}
              <style>{`@media print { @page { size: A4 landscape; margin: 0; } }`}</style>
              <div className="hidden print:block">
                {imporLivreto(paginas.length).flatMap((folha, i) =>
                  [folha.frente, folha.verso].map(([esquerda, direita], lado) => (
                    <div
                      key={`${i}-${lado}`}
                      className="flex"
                      style={folhaImpressa(2 * i + lado, "297mm", "210mm")}
                    >
                      {renderPagina(esquerda)}
                      {renderPagina(direita)}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
