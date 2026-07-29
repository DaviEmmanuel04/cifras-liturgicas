"use client";

import { useState, useEffect, useRef, useMemo, use } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { CifraRenderer } from "@/components/CifraRenderer";
import { InteractiveCifraEditor } from "@/components/InteractiveCifraEditor";
import { convertPdfAction } from "@/app/actions";
import { obterEstiloTempoLiturgico } from "@/utils/tempoLiturgico";

const categorias = ["Entrada", "Ato Penitencial", "Glória", "Salmo", "Aclamação ao Evangelho", "Ofertório", "Santo", "Comunhão", "Ação de Graças", "Final", "Adoração", "Terço", "Festa de Santo Antônio", "Festa do Sagrado Coração de Jesus", "Outros"];
const tempos = ["Tempo Comum", "Advento", "Natal", "Quaresma", "Páscoa", "Festa de Santo Antônio", "Festa do Sagrado Coração de Jesus", "Outros"];

export default function EditarMusicaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [mostrarAvisoPdf, setMostrarAvisoPdf] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    titulo: "",
    artista: "",
    categoria: "",
    tempo: "",
    tom: "",
    letraCifra: "",
    criadoEm: "",
    criadoPor: "",
    atualizadoEm: "",
    atualizadoPor: ""
  });

  useEffect(() => {
    async function carregarMusica() {
      try {
        const docRef = doc(db, "musicas", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            titulo: data.titulo || "",
            artista: data.artista || "",
            categoria: data.categoria || "",
            tempo: data.tempo || "",
            tom: data.tom || "",
            letraCifra: data.letraCifra || "",
            criadoEm: data.criadoEm || "",
            criadoPor: data.criadoPor || "",
            atualizadoEm: data.atualizadoEm || "",
            atualizadoPor: data.atualizadoPor || ""
          });
        } else {
          alert("Música não encontrada.");
          router.push("/admin/dashboard");
        }
      } catch (error) {
        console.error("Erro ao carregar música:", error);
        alert("Erro ao carregar dados da música.");
      } finally {
        setLoading(false);
      }
    }

    carregarMusica();
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
          letraCifra: result.text || ""
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

  const inserirColchetes = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.letraCifra;

    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    const novoTexto = before + "[" + selected + "]" + after;
    
    setFormData({ ...formData, letraCifra: novoTexto });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, end + 1);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const docRef = doc(db, "musicas", id);
      await updateDoc(docRef, {
        titulo: formData.titulo,
        artista: formData.artista,
        categoria: formData.categoria,
        tempo: formData.tempo,
        tom: formData.tom,
        letraCifra: formData.letraCifra,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: auth.currentUser?.email || "Anônimo"
      });

      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Erro ao atualizar música:", error);
      alert("Erro ao salvar alterações. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  // Heurística visual simples para acordes com notação inválida
  const acordesInvalidos = useMemo(() => {
    const regexAcordes = /\[(.*?)\]/g;
    const invalidos: string[] = [];
    let match;

    while ((match = regexAcordes.exec(formData.letraCifra)) !== null) {
      const acorde = match[1].trim();
      if (!acorde) continue;

      const eInstrumental = /^[-|/\s]+$/.test(acorde);
      if (eInstrumental) continue;

      const notaValida = /^[A-G][#b]?(m|M|maj|min|dim|aug|sus)?([0-9])*(?:\[\/[A-G][#b]?\]|\/[A-G][#b]?)?$/;
      
      if (!notaValida.test(acorde)) {
        if (!invalidos.includes(acorde)) {
          invalidos.push(acorde);
        }
      }
    }

    return invalidos;
  }, [formData.letraCifra]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/dashboard" 
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-900">Editar Música</h1>
            <p className="text-sm text-gray-500">Altere os dados ou cifras do canto litúrgico</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-[#e4ded0] shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título da Música</label>
              <input
                type="text"
                name="titulo"
                required
                value={formData.titulo}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Artista / Compositor</label>
              <input
                type="text"
                name="artista"
                value={formData.artista}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria (Momento)</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempo Litúrgico</label>
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
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Letra e Cifras</label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Alterne entre o <strong>Editor Visual Interativo</strong> (clique nas palavras) e o <strong>Modo Texto</strong>.
                </p>
              </div>

              {mostrarAvisoPdf && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-xs flex justify-between items-center animate-pulse-once">
                  <span>
                    <strong>Atenção:</strong> A conversão automática de PDF não é 100% perfeita. Por favor, revise o alinhamento dos acordes e a letra antes de salvar.
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setMostrarAvisoPdf(false)}
                    className="text-yellow-600 hover:text-yellow-800 font-bold ml-2 cursor-pointer"
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

              <InteractiveCifraEditor
                value={formData.letraCifra}
                onChange={(newVal) => setFormData(prev => ({ ...prev, letraCifra: newVal }))}
                tom={formData.tom}
                textareaRef={textareaRef}
                extraHeaderActions={
                  <>
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
                      disabled={importing}
                      className="bg-primary-50 hover:bg-primary-100 text-primary-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border border-primary-200 cursor-pointer"
                    >
                      <Upload size={13} />
                      <span>{importing ? "Lendo..." : "Importar PDF"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={inserirColchetes}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Inserir <span className="font-mono font-bold">[ ]</span>
                    </button>
                  </>
                }
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
            </button>
          </div>
        </form>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <h2 className="font-serif text-lg font-bold text-gray-900">Pré-visualização da Cifra</h2>
          <div className="bg-white p-6 rounded-xl border border-[#e4ded0] shadow-sm space-y-4 sticky top-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">{formData.titulo || "Título da Música"}</h3>
              {formData.artista && <p className="text-gray-600 text-sm">{formData.artista}</p>}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {formData.categoria && (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">{formData.categoria}</span>
              )}
              {formData.tempo && (
                <span className={`px-2 py-1 rounded font-medium inline-flex items-center gap-1.5 ${obterEstiloTempoLiturgico(formData.tempo).badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${obterEstiloTempoLiturgico(formData.tempo).dot}`} />
                  {formData.tempo}
                </span>
              )}
              {formData.tom && (
                <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded font-mono font-bold">Tom: {formData.tom}</span>
              )}
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded border border-[#e4ded0] overflow-x-auto">
              <CifraRenderer texto={formData.letraCifra || "Nenhuma cifra inserida."} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
