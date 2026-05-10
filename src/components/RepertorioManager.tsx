"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Save } from "lucide-react";

type Musica = {
  id: string;
  titulo: string;
  categoria: string;
  tempo: string;
  tom: string;
};

// Componente individual arrastável
function SortableItem({ id, musica, onRemove }: { id: string, musica: Musica, onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-2 shadow-sm z-10 relative">
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <GripVertical size={20} />
        </button>
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">{musica.titulo}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{musica.categoria} • {musica.tom}</p>
        </div>
      </div>
      <button onClick={() => onRemove(id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors">
        <X size={18} />
      </button>
    </div>
  );
}

export function RepertorioManager({ musicas }: { musicas: Musica[] }) {
  const [repertorioIds, setRepertorioIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMusicId, setSelectedMusicId] = useState<string>("");

  useEffect(() => {
    async function fetchRepertorio() {
      try {
        const docRef = doc(db, "config", "repertorio");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().musicasIds) {
          setRepertorioIds(docSnap.data().musicasIds);
        }
      } catch (e) {
        console.error("Erro ao carregar repertório", e);
      } finally {
        setLoading(false);
      }
    }
    fetchRepertorio();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRepertorioIds((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAdd = () => {
    if (selectedMusicId && !repertorioIds.includes(selectedMusicId)) {
      setRepertorioIds([...repertorioIds, selectedMusicId]);
      setSelectedMusicId("");
    }
  };

  const handleRemove = (id: string) => {
    setRepertorioIds(repertorioIds.filter(i => i !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "config", "repertorio"), { musicasIds: repertorioIds });
      alert("Repertório salvo com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar", e);
      alert("Erro ao salvar o repertório.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4 text-gray-500">Carregando repertório...</div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span>🎵</span> Repertório de Hoje
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Selecione e arraste as músicas na ordem desejada. Elas aparecerão em destaque na tela inicial.
          </p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors w-full md:w-auto"
        >
          <Save size={18} />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <select 
          value={selectedMusicId} 
          onChange={(e) => setSelectedMusicId(e.target.value)}
          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">Selecione uma música do acervo...</option>
          {musicas.map(m => (
            <option key={m.id} value={m.id} disabled={repertorioIds.includes(m.id)}>
              {m.titulo} ({m.categoria})
            </option>
          ))}
        </select>
        <button 
          onClick={handleAdd}
          disabled={!selectedMusicId}
          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-800 dark:text-gray-200 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Adicionar
        </button>
      </div>

      {repertorioIds.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          Nenhuma música adicionada ao repertório ainda.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={repertorioIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {repertorioIds.map(id => {
                const musica = musicas.find(m => m.id === id);
                if (!musica) return null;
                return <SortableItem key={id} id={id} musica={musica} onRemove={handleRemove} />;
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
