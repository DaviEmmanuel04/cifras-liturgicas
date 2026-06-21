"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Save, Plus, ArrowLeft, Calendar, FileText, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

type Musica = {
  id: string;
  titulo: string;
  categoria: string;
  tempo: string;
  tom: string;
};

type Repertorio = {
  id: string;
  nome: string;
  data: string;
  ativo: boolean;
  musicasIds: string[];
  criadoPor?: string;
  criadoEm?: string;
  modificadoPor?: string;
  modificadoEm?: string;
};

// Componente individual arrastável
function SortableItem({ id, musica, onRemove }: { id: string; musica: Musica; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#e4ded0] mb-2 shadow-sm z-10 relative">
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
          <GripVertical size={18} />
        </button>
        <div>
          <p className="font-medium text-gray-800 text-sm">{musica.titulo}</p>
          <p className="text-[10px] text-gray-500">{musica.categoria} • {musica.tom}</p>
        </div>
      </div>
      <button onClick={() => onRemove(id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
        <X size={16} />
      </button>
    </div>
  );
}

export function RepertorioManager({ musicas }: { musicas: Musica[] }) {
  const [repertorios, setRepertorios] = useState<Repertorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados de criação de novo repertório
  const [nomeNovo, setNomeNovo] = useState("");
  const [dataNova, setDataNova] = useState("");

  // Estados de edição do repertório selecionado
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [dataEdicao, setDataEdicao] = useState("");
  const [ativoEdicao, setAtivoEdicao] = useState(false);
  const [musicasIds, setMusicasIds] = useState<string[]>([]);
  const [selectedMusicId, setSelectedMusicId] = useState("");

  // Inicializar data padrão como a data atual local
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setDataNova(`${yyyy}-${mm}-${dd}`);
  }, []);

  const fetchRepertorios = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "repertorios"));
      const lista: Repertorio[] = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() } as Repertorio);
      });
      // Ordenar por data mais recente
      lista.sort((a, b) => b.data.localeCompare(a.data));
      setRepertorios(lista);
    } catch (e) {
      console.error("Erro ao carregar repertórios:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepertorios();
  }, []);

  // Selecionar um repertório para carregar no editor
  const handleSelectRepertorio = (rep: Repertorio) => {
    setSelectedRepId(rep.id);
    setNomeEdicao(rep.nome);
    setDataEdicao(rep.data);
    setAtivoEdicao(rep.ativo);
    setMusicasIds(rep.musicasIds || []);
    setSelectedMusicId("");
  };

  // Cadastrar novo repertório
  const handleCreateRepertorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeNovo.trim() || !dataNova) return;

    setSaving(true);
    try {
      const emailUsuario = auth.currentUser?.email || "admin";
      const novoRep = {
        nome: nomeNovo.trim(),
        data: dataNova,
        ativo: false, // Por padrão inicia inativo
        musicasIds: [],
        criadoPor: emailUsuario,
        criadoEm: new Date().toISOString(),
        modificadoPor: emailUsuario,
        modificadoEm: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "repertorios"), novoRep);
      const repCriado = { id: docRef.id, ...novoRep };
      
      setRepertorios(prev => [repCriado, ...prev].sort((a, b) => b.data.localeCompare(a.data)));
      setNomeNovo("");
      
      // Abre automaticamente o novo repertório para edição
      handleSelectRepertorio(repCriado);
    } catch (err) {
      console.error("Erro ao criar repertório:", err);
      alert("Erro ao criar o repertório.");
    } finally {
      setSaving(false);
    }
  };

  // Excluir um repertório
  const handleDeleteRepertorio = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita selecionar ao clicar em excluir
    if (!confirm("Deseja realmente excluir este repertório permanentemente?")) return;

    try {
      await deleteDoc(doc(db, "repertorios", id));
      setRepertorios(prev => prev.filter(r => r.id !== id));
      if (selectedRepId === id) {
        setSelectedRepId(null);
      }
    } catch (err) {
      console.error("Erro ao excluir:", err);
      alert("Erro ao excluir o repertório.");
    }
  };

  // Drag and Drop sensores
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMusicasIds((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddMusic = () => {
    if (selectedMusicId && !musicasIds.includes(selectedMusicId)) {
      setMusicasIds([...musicasIds, selectedMusicId]);
      setSelectedMusicId("");
    }
  };

  const handleRemoveMusic = (id: string) => {
    setMusicasIds(musicasIds.filter((i) => i !== id));
  };

  // Salvar alterações do repertório selecionado (incluindo metadados)
  const handleSaveRepertorio = async () => {
    if (!selectedRepId) return;
    setSaving(true);
    try {
      const emailUsuario = auth.currentUser?.email || "admin";
      const payload = {
        nome: nomeEdicao.trim(),
        data: dataEdicao,
        ativo: ativoEdicao,
        musicasIds: musicasIds,
        modificadoPor: emailUsuario,
        modificadoEm: new Date().toISOString()
      };

      await updateDoc(doc(db, "repertorios", selectedRepId), payload);
      
      // Atualizar lista local
      setRepertorios(prev =>
        prev.map(r => (r.id === selectedRepId ? { ...r, ...payload } : r))
            .sort((a, b) => b.data.localeCompare(a.data))
      );
      
      alert("Repertório atualizado com sucesso!");
    } catch (e) {
      console.error("Erro ao atualizar o repertório:", e);
      alert("Erro ao salvar as alterações do repertório.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#fcfaf2] p-8 rounded-xl border border-[#e4ded0] mb-8 text-center text-gray-600">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600 mb-2"></div>
        <p className="text-sm">Carregando gerenciador de repertórios...</p>
      </div>
    );
  }

  // Se houver um repertório selecionado, exibe o Editor Detalhado
  if (selectedRepId) {
    const repSelecionado = repertorios.find(r => r.id === selectedRepId);

    return (
      <div className="bg-[#fcfaf2] p-6 rounded-xl border border-[#e4ded0] mb-8 transition-all animate-fade-in">
        {/* Cabeçalho do Editor */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#e4ded0]">
          <button
            onClick={() => setSelectedRepId(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para os Repertórios
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={handleSaveRepertorio}
              disabled={saving || !nomeEdicao.trim() || !dataEdicao}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Save size={16} />
              {saving ? "Salvando..." : "Salvar Repertório"}
            </button>
          </div>
        </div>

        {/* Formulário de Metadados do Evento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Nome do Evento / Celebração</label>
            <input
              type="text"
              required
              value={nomeEdicao}
              onChange={(e) => setNomeEdicao(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
              placeholder="Ex: Missa de Domingo - 10:00"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Data da Celebração</label>
            <input
              type="date"
              required
              value={dataEdicao}
              onChange={(e) => setDataEdicao(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={ativoEdicao}
                onChange={(e) => setAtivoEdicao(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-5 h-5 bg-white transition-colors cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                Exibir na Página Inicial (Repertório Ativo)
              </span>
            </label>
          </div>
        </div>

        {/* Adicionar Músicas */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <select
            value={selectedMusicId}
            onChange={(e) => setSelectedMusicId(e.target.value)}
            className="flex-1 p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">Selecione uma música para adicionar ao repertório...</option>
            {musicas.map((m) => (
              <option key={m.id} value={m.id} disabled={musicasIds.includes(m.id)}>
                {m.titulo} ({m.categoria})
              </option>
            ))}
          </select>
          <button
            onClick={handleAddMusic}
            disabled={!selectedMusicId}
            className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Adicionar
          </button>
        </div>

        {/* Lista Arrastável */}
        <div className="bg-[#fbf9f4] p-4 rounded-xl border border-[#e4ded0]/80">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Ordem de Execução</h3>
          {musicasIds.length === 0 ? (
            <div className="text-center py-10 text-gray-500 border-2 border-dashed border-[#e4ded0] rounded-lg text-sm">
              <FileText className="mx-auto text-gray-400 mb-2" size={32} />
              Nenhuma música selecionada para este repertório.
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={musicasIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {musicasIds.map((id) => {
                    const musica = musicas.find((m) => m.id === id);
                    if (!musica) return null;
                    return <SortableItem key={id} id={id} musica={musica} onRemove={handleRemoveMusic} />;
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
        
        {/* Rodapé do Editor */}
        <div className="mt-6 pt-4 border-t border-[#e4ded0] flex justify-between items-center text-xs text-gray-400">
          <div>
            {repSelecionado?.criadoPor && (
              <p>Criado por {repSelecionado.criadoPor} em {new Date(repSelecionado.criadoEm || "").toLocaleDateString()}</p>
            )}
          </div>
          <button
            onClick={(e) => handleDeleteRepertorio(selectedRepId, e)}
            className="flex items-center gap-1.5 text-red-600 hover:text-red-800 font-semibold transition-colors"
          >
            <Trash2 size={14} />
            Excluir Repertório
          </button>
        </div>
      </div>
    );
  }

  // Caso contrário, exibe o painel de listagem e criação de repertórios
  return (
    <div className="bg-[#fcfaf2] p-6 rounded-xl border border-[#e4ded0] mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Painel Esquerdo: Lista de Repertórios */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-1">
            <span>📅</span> Repertórios e Eventos
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Selecione uma celebração abaixo para gerenciar a lista de cânticos ou crie uma nova à direita.
          </p>

          {repertorios.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-[#e4ded0] rounded-lg">
              <Calendar className="mx-auto text-gray-400 mb-2" size={40} />
              Nenhum repertório cadastrado no momento.
            </div>
          ) : (
            <div className="grid gap-3 max-h-[450px] overflow-y-auto pr-1">
              {repertorios.map((rep) => {
                // Formatar data local
                let dataFormatada = rep.data;
                try {
                  const [ano, mes, dia] = rep.data.split("-");
                  if (ano && mes && dia) {
                    dataFormatada = `${dia}/${mes}/${ano}`;
                  }
                } catch {}

                return (
                  <div
                    key={rep.id}
                    onClick={() => handleSelectRepertorio(rep)}
                    className="bg-white p-4 rounded-xl border border-[#e4ded0] hover:border-primary-500 shadow-sm hover:shadow transition-all duration-150 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 text-sm group-hover:text-primary-600 transition-colors">
                          {rep.nome}
                        </h3>
                        {rep.ativo ? (
                          <span className="flex items-center gap-0.5 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[9px] font-bold">
                            <CheckCircle2 size={8} /> Ativo
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[9px] font-bold">
                            Rascunho
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {dataFormatada}
                        </span>
                        <span>•</span>
                        <span>{rep.musicasIds?.length || 0} música(s)</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteRepertorio(rep.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Painel Direito: Formulário de Criação */}
        <div className="bg-white p-6 rounded-xl border border-[#e4ded0] shadow-sm h-fit">
          <h3 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-1.5">
            <Plus size={18} className="text-primary-500" />
            Novo Repertório
          </h3>
          <form onSubmit={handleCreateRepertorio} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Nome da Celebração</label>
              <input
                type="text"
                required
                value={nomeNovo}
                onChange={(e) => setNomeNovo(e.target.value)}
                placeholder="Ex: Missa de Domingo - 19:00"
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Data</label>
              <input
                type="date"
                required
                value={dataNova}
                onChange={(e) => setDataNova(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !nomeNovo.trim() || !dataNova}
              className="w-full flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white p-2.5 rounded-lg text-sm font-semibold transition-colors mt-2"
            >
              <Plus size={16} />
              Criar e Editar Cifras
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
