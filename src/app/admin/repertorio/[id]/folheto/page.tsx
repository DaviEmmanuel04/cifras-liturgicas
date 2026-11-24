"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { deleteField, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ArrowLeft, FileDown, Pencil, Printer, Save } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { FolhetoLivreto, type CanticoFolheto } from "@/components/FolhetoLivreto";
import { EditorAvisos } from "@/components/EditorAvisos";
import { coresLiturgicas, variaveisDaPaleta, type LiturgicalColor } from "@/components/LiturgicalThemeProvider";
import { getLiturgicalDayByDate } from "@/app/actions";
import { estrofesDaLetra, interpretarAvisos } from "@/utils/folheto";
import { resolverConteudoVersao } from "@/utils/resolverVersao";
import { tablaturasDeFirestore } from "@/utils/tablaturaFirestore";
import { versoesDeFirestore } from "@/utils/versaoFirestore";
import type { Musica } from "@/types/musica";

type RepertorioFolheto = {
  nome: string;
  data: string;
  musicasIds: string[];
  versoesFixadas?: Record<string, string>;
  avisosFolheto?: string;
  /** Cor dos destaques do Folheto; ausente = automática (cor litúrgica da data). */
  corFolheto?: LiturgicalColor;
};

const nomeDaCor = (cor: LiturgicalColor) => coresLiturgicas.find((c) => c.cor === cor)?.nome ?? cor;

function dataPorExtenso(data: string): string {
  // Meio-dia evita que o fuso horário empurre a data para o dia anterior
  const texto = new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function FolhetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [repertorio, setRepertorio] = useState<RepertorioFolheto | null>(null);
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [comunidade, setComunidade] = useState("");
  const [avisos, setAvisos] = useState("");
  const [corEscolhida, setCorEscolhida] = useState<LiturgicalColor | "auto">("auto");
  const [corDoDia, setCorDoDia] = useState<LiturgicalColor | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sujo, setSujo] = useState(false);
  const [modoImpressao, setModoImpressao] = useState<"livreto" | "digital">("livreto");
  const corEfetiva: LiturgicalColor = corEscolhida === "auto" ? corDoDia ?? "green" : corEscolhida;
  const [editandoAvisos, setEditandoAvisos] = useState(false);
  const fecharEditorAvisos = useCallback(() => setEditandoAvisos(false), []);

  // Resumo para a barra lateral: quantos avisos e as primeiras linhas, sem marcação
  const resumoAvisos = useMemo(() => {
    const paragrafos = interpretarAvisos(avisos);
    const linhas = paragrafos.flat().map((linha) => linha.trechos.map((t) => t.texto).join(""));
    return { total: paragrafos.length, linhas: linhas.slice(0, 3) };
  }, [avisos]);

  useEffect(() => {
    async function carregar() {
      try {
        const [repSnap, configSnap] = await Promise.all([
          getDoc(doc(db, "repertorios", id)),
          getDoc(doc(db, "config", "folheto")),
        ]);
        if (!repSnap.exists()) return;
        const rep = repSnap.data() as RepertorioFolheto;
        setRepertorio(rep);
        setAvisos(rep.avisosFolheto ?? "");
        setCorEscolhida(rep.corFolheto ?? "auto");
        // O folheto costuma ser impresso antes: a cor é a do dia da celebração, não a de hoje
        getLiturgicalDayByDate(rep.data).then((dia) => {
          const cor = dia?.celebrations?.[0]?.colour;
          setCorDoDia(coresLiturgicas.some((c) => c.cor === cor) ? cor : "green");
        });
        setComunidade(configSnap.exists() ? configSnap.data().comunidade ?? "" : "");

        const snaps = await Promise.all((rep.musicasIds ?? []).map((musicaId) => getDoc(doc(db, "musicas", musicaId))));
        setMusicas(
          snaps
            .filter((snap) => snap.exists())
            .map((snap) => {
              const data = snap.data()!;
              return {
                id: snap.id,
                ...data,
                tablaturas: tablaturasDeFirestore(data.tablaturas),
                versoes: data.versoes ? versoesDeFirestore(data.versoes) : undefined,
              } as Musica;
            })
        );
      } catch (error) {
        console.error("Erro ao carregar o folheto:", error);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [id]);

  const canticos = useMemo<CanticoFolheto[]>(
    () =>
      musicas.map((musica) => ({
        musicaId: musica.id,
        titulo: musica.titulo,
        categoria: musica.categoria,
        estrofes: estrofesDaLetra(
          resolverConteudoVersao(musica, repertorio?.versoesFixadas?.[musica.id]).letraCifra ?? ""
        ),
      })),
    [musicas, repertorio]
  );

  const salvar = async () => {
    setSalvando(true);
    try {
      const emailUsuario = auth.currentUser?.email || "admin";
      await Promise.all([
        updateDoc(doc(db, "repertorios", id), {
          avisosFolheto: avisos,
          corFolheto: corEscolhida === "auto" ? deleteField() : corEscolhida,
          modificadoPor: emailUsuario,
          modificadoEm: new Date().toISOString(),
        }),
        setDoc(doc(db, "config", "folheto"), { comunidade: comunidade.trim() }, { merge: true }),
      ]);
      setSujo(false);
    } catch (error) {
      console.error("Erro ao salvar o folheto:", error);
      alert("Erro ao salvar o folheto.");
    } finally {
      setSalvando(false);
    }
  };

  // A impressão sai do mesmo layout; o modo só troca o que vai para o papel/PDF
  const imprimir = (modo: "livreto" | "digital") => {
    flushSync(() => setModoImpressao(modo));
    // O navegador sugere o título da aba como nome do arquivo PDF
    const tituloOriginal = document.title;
    document.title = `Folheto - ${repertorio?.nome ?? ""} - ${repertorio?.data ?? ""}`;
    window.addEventListener("afterprint", () => (document.title = tituloOriginal), { once: true });
    window.print();
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!repertorio) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center text-gray-600">
        <p>Repertório não encontrado.</p>
        <Link href="/admin/dashboard" className="text-primary-700 font-semibold">Voltar ao painel</Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 lg:flex lg:items-start lg:gap-6 print:p-0">
      <aside className="print:hidden lg:sticky lg:top-24 lg:w-80 shrink-0 bg-[#fcfaf2] p-5 rounded-xl border border-[#e4ded0] mb-6 space-y-4">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar ao painel
        </Link>

        <div>
          <h1 className="font-bold text-gray-800">Folheto de Cânticos</h1>
          <p className="text-xs text-gray-500">{repertorio.nome}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Comunidade</label>
          <input
            type="text"
            value={comunidade}
            onChange={(e) => {
              setComunidade(e.target.value);
              setSujo(true);
            }}
            placeholder="Ex: Comunidade Muquém"
            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <p className="text-[10px] text-gray-400 mt-1">Vale para todos os folhetos.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Cor</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setCorEscolhida("auto");
                setSujo(true);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                corEscolhida === "auto" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Automática
            </button>
            {coresLiturgicas.map(({ cor, nome }) => (
              <button
                key={cor}
                type="button"
                title={nome}
                aria-label={nome}
                onClick={() => {
                  setCorEscolhida(cor);
                  setSujo(true);
                }}
                style={variaveisDaPaleta(cor)}
                className={`w-7 h-7 rounded-full bg-primary-600 border-2 transition-all ${
                  corEscolhida === cor ? "border-gray-900 ring-2 ring-offset-1 ring-gray-400" : "border-white shadow-sm"
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {corDoDia
              ? `Automática: cor do dia da celebração (${nomeDaCor(corDoDia)}).`
              : "Automática: buscando a cor do dia da celebração…"}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Avisos</label>
          <button
            type="button"
            onClick={() => setEditandoAvisos(true)}
            className="w-full text-left p-3 border border-gray-300 hover:border-primary-400 rounded-lg bg-white transition-colors group"
          >
            {resumoAvisos.linhas.length === 0 ? (
              <span className="text-sm text-gray-400">Nenhum aviso. Saem na contracapa.</span>
            ) : (
              <>
                <span className="block text-[11px] font-semibold text-gray-500 mb-1">
                  {resumoAvisos.total} aviso{resumoAvisos.total === 1 ? "" : "s"}
                </span>
                {resumoAvisos.linhas.map((linha, i) => (
                  <span key={i} className="block text-sm text-gray-700 truncate">{linha}</span>
                ))}
              </>
            )}
            <span className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-primary-700 group-hover:text-primary-900">
              <Pencil size={13} />
              Editar avisos
            </span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={salvar}
            disabled={salvando || !sujo}
            className="flex items-center justify-center gap-1.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Save size={15} />
            {salvando ? "Salvando..." : sujo ? "Salvar" : "Salvo"}
          </button>
          <button
            onClick={() => imprimir("livreto")}
            className="flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Printer size={15} />
            Imprimir
          </button>
          <button
            onClick={() => imprimir("digital")}
            title="Páginas A5 em sequência, para ler no celular ou enviar"
            className="col-span-2 flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <FileDown size={15} />
            Baixar PDF (digital)
          </button>
        </div>

        <div className="text-xs text-gray-600 bg-white border border-[#e4ded0] rounded-lg p-3 space-y-1">
          <p className="font-semibold text-gray-700">Na janela de impressão:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Papel <strong>A4</strong>, orientação <strong>paisagem</strong></li>
            <li><strong>Frente e verso</strong>, virando na <strong>borda curta</strong></li>
            <li>Margens: <strong>nenhuma</strong>; escala: <strong>100%</strong></li>
          </ul>
          <p className="pt-1">Depois é só empilhar as folhas na ordem, dobrar ao meio e grampear.</p>
          <p className="pt-1 border-t border-[#e4ded0] mt-2">
            <strong>PDF digital:</strong> no destino, escolha <strong>Salvar como PDF</strong> e deixe as margens em <strong>nenhuma</strong>.
          </p>
        </div>

        <p className="text-[10px] text-gray-400">
          Os cânticos, a ordem e as Versões vêm do Repertório salvo.
        </p>
      </aside>

      <div className="grow min-w-0">
        {canticos.length === 0 && (
          <div className="print:hidden max-w-xl mx-auto mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
            Este Repertório ainda não tem cânticos salvos. Adicione as músicas no Repertório e salve.
          </div>
        )}
        <FolhetoLivreto
          comunidade={comunidade}
          celebracao={repertorio.nome}
          dataPorExtenso={dataPorExtenso(repertorio.data)}
          canticos={canticos}
          avisos={avisos}
          cor={corEfetiva}
          modoImpressao={modoImpressao}
        />
      </div>

      {editandoAvisos && (
        <EditorAvisos
          valor={avisos}
          onChange={(novo) => {
            setAvisos(novo);
            setSujo(true);
          }}
          onFechar={fecharEditorAvisos}
          cor={corEfetiva}
        />
      )}
    </div>
  );
}
