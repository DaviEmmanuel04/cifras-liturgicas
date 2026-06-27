"use client";

import { useState, useEffect, useRef, useMemo, use } from "react";
import { createPortal } from "react-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, Sparkles, X } from "lucide-react";
import { CifraRenderer } from "@/components/CifraRenderer";
import { convertPdfAction, convertTextWithAiAction } from "@/app/actions";
import { obterEstiloTempoLiturgico } from "@/utils/tempoLiturgico";

const categorias = ["Entrada", "Ato Penitencial", "Glória", "Salmo", "Aclamação ao Evangelho", "Ofertório", "Santo", "Comunhão", "Ação de Graças", "Final", "Adoração", "Festa de Santo Antônio", "Festa do Sagrado Coração de Jesus", "Outros"];
const tempos = ["Tempo Comum", "Advento", "Natal", "Quaresma", "Páscoa", "Festa de Santo Antônio", "Festa do Sagrado Coração de Jesus", "Outros"];

export default function EditarMusicaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [mostrarAvisoPdf, setMostrarAvisoPdf] = useState(false);
  const [mostrarModalAi, setMostrarModalAi] = useState(false);
  const [textoBrutoAi, setTextoBrutoAi] = useState("");
  const [convertendoAi, setConvertendoAi] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    titulo: "",
    artista: "",
    categoria: "",
    tempo: "",
    tom: "",
    letraCifra: ""
  });

  useEffect(() => {
    async function loadMusica() {
      try {
        const docRef = doc(db, "musicas", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data() as any);
        } else {
          alert("Música não encontrada!");
          router.push("/admin/dashboard");
        }
      } catch (error) {
        console.error("Erro ao carregar", error);
        alert("Erro ao carregar os dados.");
      } finally {
        setFetching(false);
      }
    }
    loadMusica();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const result = await convertPdfAction(data);
      if (result.success && result.text) {
        setFormData(prev => ({
          ...prev,
          letraCifra: result.text || "",
          titulo: prev.titulo === "" ? file.name.replace(/\.pdf$/i, "") : prev.titulo
        }));
        setMostrarAvisoPdf(true);
      } else {
        alert("Erro na conversão: " + (result.error || "Formato desconhecido"));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao converter o arquivo PDF.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAiConversion = async () => {
    if (!textoBrutoAi.trim()) return;
    setConvertendoAi(true);
    try {
      const result = await convertTextWithAiAction(textoBrutoAi);
      if (result.success && result.text) {
        setFormData(prev => ({
          ...prev,
          letraCifra: result.text || ""
        }));
        setMostrarModalAi(false);
        setTextoBrutoAi("");
        setMostrarAvisoPdf(true);
      } else {
        alert("Erro na conversão com IA: " + (result.error || "Erro desconhecido"));
      }
    } catch (err) {
      console.error(err);
      alert("Erro de comunicação ao converter com IA.");
    } finally {
      setConvertendoAi(false);
    }
  };

  const inserirColchetes = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentScroll = textarea.scrollTop;
    const text = formData.letraCifra;

    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    const novoTexto = before + "[" + selected + "]" + after;
    
    setFormData({ ...formData, letraCifra: novoTexto });

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start === end ? start + 1 : start + selected.length + 2;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.scrollTop = currentScroll;
    }, 0);
  };

  // Validar acordes na letra em tempo real
  const acordesInvalidos = useMemo(() => {
    const regexAcorde = /\[(.*?)\]/g;
    let match;
    const invalidos = new Set<string>();
    while ((match = regexAcorde.exec(formData.letraCifra)) !== null) {
      const acorde = match[1].trim();
      if (acorde) {
        const partes = acorde.split('/');
        let valido = partes.length <= 2;
        
        if (valido) {
          for (const parte of partes) {
            const parteLimpa = parte.replace(/[\(\)]/g, "").trim();
            const m = parteLimpa.match(/^([CDEFGAB][#b]?)(.*)$/);
            if (!m) {
              valido = false;
              break;
            }
            const resto = m[2];
            if (resto && !/^[a-zA-Z0-9+\-]*$/.test(resto)) {
              valido = false;
              break;
            }
          }
        }
        
        if (!valido) {
          invalidos.add(acorde);
        }
      }
    }
    return Array.from(invalidos);
  }, [formData.letraCifra]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (acordesInvalidos.length > 0) {
      const confirmou = window.confirm(
        `Atenção: Os seguintes acordes possuem grafia não-padrão ou incorreta:\n${acordesInvalidos.join(", ")}\n\nDeseja salvar a cifra mesmo assim?`
      );
      if (!confirmou) {
        setLoading(false);
        return;
      }
    }

    try {
      const emailUsuario = auth.currentUser?.email || "admin";
      const payload = {
        ...formData,
        modificadoPor: emailUsuario,
        modificadoEm: new Date().toISOString()
      };
      await updateDoc(doc(db, "musicas", id), payload);
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Erro ao salvar", error);
      alert("Erro ao atualizar a música.");
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center text-gray-500">
        Carregando dados da música...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link 
          href="/admin/dashboard" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Voltar ao painel</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lado Esquerdo: Formulário */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e4ded0] p-8 h-fit">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar Cifra</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Título da Música</label>
                <input
                  type="text"
                  name="titulo"
                  required
                  value={formData.titulo}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Artista / Ministério (Opcional)</label>
                <input
                  type="text"
                  name="artista"
                  value={formData.artista || ""}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Ex: Comunidade Shalom, Padre Zezinho, Tradicional..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria / Momento</label>
                <select
                  name="categoria"
                  required
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="" disabled>Selecione uma categoria</option>
                  {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tempo Litúrgico</label>
                <select
                  name="tempo"
                  required
                  value={formData.tempo}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="" disabled>Selecione um tempo</option>
                  {tempos.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tom Original</label>
                <input
                  type="text"
                  name="tom"
                  required
                  value={formData.tom}
                  onChange={handleChange}
                  className="w-full md:w-1/3 p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Letra e Cifras</label>
                    <p className="text-xs text-gray-500 mt-1">
                      Use colchetes para os acordes. Ex: <code>[C]Senhor</code>
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePdfUpload} 
                      accept=".pdf" 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing || convertendoAi}
                      className="bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 border border-primary-200 cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>{importing ? "Lendo PDF..." : "Importar PDF"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMostrarModalAi(true)}
                      disabled={importing || convertendoAi}
                      className="bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 border border-primary-200 cursor-pointer"
                    >
                      <Sparkles size={14} />
                      <span>Converter com IA</span>
                    </button>
                    <button
                      type="button"
                      onClick={inserirColchetes}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Inserir <span className="font-mono font-bold">[ ]</span>
                    </button>
                  </div>
                </div>
                {mostrarAvisoPdf && (
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-xs flex justify-between items-center animate-pulse-once">
                    <span>
                      <strong>Atenção:</strong> A conversão automática de PDF não é 100% perfeita. Por favor, revise o alinhamento dos acordes e a letra antes de salvar.
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setMostrarAvisoPdf(false)}
                      className="text-yellow-600 hover:text-yellow-800 font-bold ml-2"
                    >
                      Fechar
                    </button>
                  </div>
                )}
                {acordesInvalidos.length > 0 && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-start gap-2 animate-fade-in">
                    <span className="mt-0.5 font-bold">⚠️</span>
                    <div>
                      <strong>Aviso:</strong> Acorde(s) com grafia possivelmente incorreta detectado(s):{" "}
                      <span className="font-mono font-bold bg-red-100 px-1 py-0.5 rounded text-red-700">
                        {acordesInvalidos.join(", ")}
                      </span>.
                      <p className="mt-1 text-gray-500">
                        Certifique-se de usar a notação padrão (A-G), ex: [C#m] em vez de [C# menor], ou [Bm] em vez de [Bmenor].
                      </p>
                    </div>
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  name="letraCifra"
                  required
                  rows={15}
                  value={formData.letraCifra}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Atualizar Cifra</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Lado Direito: Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e4ded0] p-8 h-fit sticky top-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">
            Pré-visualização
          </h2>
          {formData.titulo || formData.letraCifra ? (
            <div>
              <h3 className="text-2xl font-bold text-gray-805 mb-0.5">
                {formData.titulo || "Título da Música"}
              </h3>
              {formData.artista && (
                <p className="text-sm text-gray-500 italic mb-4">de {formData.artista}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-6 text-xs">
                {formData.categoria && (
                  <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{formData.categoria}</span>
                )}
                {formData.tempo && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 border rounded-full text-xs font-semibold uppercase tracking-wider ${obterEstiloTempoLiturgico(formData.tempo).badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${obterEstiloTempoLiturgico(formData.tempo).dot}`} />
                    {formData.tempo}
                  </span>
                )}
                {formData.tom && (
                  <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded font-mono font-bold">Tom: {formData.tom}</span>
                )}
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded border border-[#e4ded0] overflow-x-auto">
                <CifraRenderer texto={formData.letraCifra || "Comece a digitar a letra..."} />
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">
              O preview aparecerá aqui conforme você preenche o formulário.
            </p>
          )}
        </div>
      </div>
      {/* Modal de Conversão com IA */}
      {mostrarModalAi && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-150 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600 animate-pulse" />
                <h3 className="font-serif font-bold text-lg text-gray-800">Converter Cifra com IA</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setMostrarModalAi(false)}
                className="text-gray-400 hover:text-gray-655 p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Cole a cifra bruta abaixo (com acordes escritos acima das palavras ou em linhas separadas). A inteligência artificial do <strong>DeepSeek</strong> irá alinhar e embutir os acordes em colchetes <code>[ ]</code> automaticamente no texto, além de formatar os títulos de seções.
              </p>
              
              <textarea
                value={textoBrutoAi}
                onChange={(e) => setTextoBrutoAi(e.target.value)}
                placeholder="Cole a cifra aqui...&#10;Exemplo:&#10;   Dm               G&#10;O amor do Senhor Deus por quem o teme..."
                className="w-full h-80 p-3 border border-gray-200 rounded-xl bg-gray-50 font-mono text-xs focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none resize-none"
              />
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMostrarModalAi(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-550 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAiConversion}
                disabled={convertendoAi || !textoBrutoAi.trim()}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {convertendoAi ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    <span>Convertendo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Converter com IA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
