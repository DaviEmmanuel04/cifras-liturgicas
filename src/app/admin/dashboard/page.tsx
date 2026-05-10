"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import Link from "next/link";
import { Plus, Edit2, Trash2, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { RepertorioManager } from "@/components/RepertorioManager";

type Musica = {
  id: string;
  titulo: string;
  categoria: string;
  tempo: string;
  tom: string;
};

export default function DashboardPage() {
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMusicas = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "musicas"));
      const lista: Musica[] = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() } as Musica);
      });
      setMusicas(lista);
    } catch (error) {
      console.error("Erro ao buscar músicas", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMusicas();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta cifra?")) {
      try {
        await deleteDoc(doc(db, "musicas", id));
        setMusicas(musicas.filter((m) => m.id !== id));
      } catch (error) {
        console.error("Erro ao excluir", error);
        alert("Erro ao excluir a música.");
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Painel de Cifras</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie o repertório do aplicativo</p>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/admin/musica/nova"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nova Cifra</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      {!loading && musicas.length > 0 && (
        <RepertorioManager musicas={musicas} />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-12">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Carregando cifras...</div>
        ) : musicas.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Nenhuma cifra cadastrada ainda. Clique em "Nova Cifra" para começar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                  <th className="p-4 font-medium">Título</th>
                  <th className="p-4 font-medium">Categoria</th>
                  <th className="p-4 font-medium">Tempo Litúrgico</th>
                  <th className="p-4 font-medium">Tom</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {musicas.map((musica) => (
                  <tr key={musica.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{musica.titulo}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">{musica.categoria}</span>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">{musica.tempo}</span>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400 font-mono">{musica.tom}</td>
                    <td className="p-4 flex justify-end gap-3">
                      <Link 
                        href={`/admin/musica/${musica.id}/editar`}
                        className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(musica.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
