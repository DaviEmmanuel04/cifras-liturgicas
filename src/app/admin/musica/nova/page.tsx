"use client";

import { useState, useRef } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { CifraRenderer } from "@/components/CifraRenderer";

const categorias = ["Entrada", "Ato Penitencial", "Glória", "Salmo", "Aclamação ao Evangelho", "Ofertório", "Santo", "Comunhão", "Ação de Graças", "Final", "Adoração", "Outros"];
const tempos = ["Tempo Comum", "Advento", "Natal", "Quaresma", "Páscoa", "Outros"];

export default function NovaMusicaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    categoria: "",
    tempo: "",
    tom: "",
    letraCifra: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "musicas"), formData);
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Erro ao salvar", error);
      alert("Erro ao salvar a música.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link 
          href="/admin/dashboard" 
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Voltar ao painel</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lado Esquerdo: Formulário */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 h-fit">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Nova Cifra</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Título da Música</label>
                <input
                  type="text"
                  name="titulo"
                  required
                  value={formData.titulo}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Ex: Senhor, tende piedade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoria / Momento</label>
                <select
                  name="categoria"
                  required
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="" disabled>Selecione uma categoria</option>
                  {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tempo Litúrgico</label>
                <select
                  name="tempo"
                  required
                  value={formData.tempo}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="" disabled>Selecione um tempo</option>
                  {tempos.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tom Original</label>
                <input
                  type="text"
                  name="tom"
                  required
                  value={formData.tom}
                  onChange={handleChange}
                  className="w-full md:w-1/3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Ex: C, F#m, Bb..."
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Letra e Cifras</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Use colchetes para os acordes. Ex: <code>[C]Senhor</code>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={inserirColchetes}
                    className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    Inserir <span className="font-mono font-bold">[ ]</span>
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  name="letraCifra"
                  required
                  rows={15}
                  value={formData.letraCifra}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Cole a letra com cifras aqui..."
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
                    <span>Salvar Cifra</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Lado Direito: Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 h-fit sticky top-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
            Pré-visualização
          </h2>
          {formData.titulo || formData.letraCifra ? (
            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {formData.titulo || "Título da Música"}
              </h3>
              <div className="flex flex-wrap gap-2 mb-6 text-xs">
                {formData.categoria && (
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{formData.categoria}</span>
                )}
                {formData.tempo && (
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{formData.tempo}</span>
                )}
                {formData.tom && (
                  <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded font-mono font-bold">Tom: {formData.tom}</span>
                )}
              </div>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-700 overflow-x-auto">
                <CifraRenderer texto={formData.letraCifra || "Comece a digitar a letra..."} />
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-10">
              O preview aparecerá aqui conforme você preenche o formulário.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
