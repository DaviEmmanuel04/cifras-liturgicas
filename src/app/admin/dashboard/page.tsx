"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import Link from "next/link";
import { Plus, Edit2, Trash2, LogOut, Search, SlidersHorizontal, Eye } from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { RepertorioManager } from "@/components/RepertorioManager";
import { obterEstiloTempoLiturgico } from "@/utils/tempoLiturgico";
import { useLiturgicalTheme, LiturgicalThemeMode } from "@/components/LiturgicalThemeProvider";

const colorOptions = [
  { value: "auto", label: "Automático (API)", bgClass: "bg-[#e4ded0] hover:bg-[#d4cdbd] text-gray-800 border-[#d4cdbd] font-bold" },
  { value: "green", label: "Tempo Comum (Verde)", bgClass: "bg-[#3d6443] text-white border-transparent" },
  { value: "violet", label: "Quaresma / Advento (Roxo)", bgClass: "bg-[#722d9f] text-white border-transparent" },
  { value: "red", label: "Mártires / Pentecostes (Vermelho)", bgClass: "bg-[#b02b2b] text-white border-transparent" },
  { value: "white", label: "Páscoa / Natal / Solenidades (Ouro)", bgClass: "bg-[#b3832c] text-white border-transparent font-medium" },
  { value: "rose", label: "Gaudete / Laetare (Rosa)", bgClass: "bg-[#a83149] text-white border-transparent" },
  { value: "blue", label: "Festas Marianas (Azul)", bgClass: "bg-[#34628a] text-white border-transparent" },
  { value: "black", label: "Fiéis Defuntos (Preto)", bgClass: "bg-[#1f1f1f] text-white border-transparent" },
];

const categorias = ["Entrada", "Ato Penitencial", "Glória", "Salmo", "Aclamação ao Evangelho", "Ofertório", "Santo", "Comunhão", "Ação de Graças", "Final", "Adoração", "Festa de Santo Antônio", "Festa do Sagrado Coração de Jesus", "Outros"];
const tempos = ["Tempo Comum", "Advento", "Natal", "Quaresma", "Páscoa", "Festa de Santo Antônio", "Festa do Sagrado Coração de Jesus", "Outros"];

type Musica = {
  id: string;
  titulo: string;
  artista?: string;
  categoria: string;
  tempo: string;
  tom: string;
  criadoPor?: string;
  criadoEm?: string;
  modificadoPor?: string;
  modificadoEm?: string;
};

export default function DashboardPage() {
  const { mode, setMode } = useLiturgicalTheme();
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [tempoFilter, setTempoFilter] = useState("");
  const [ordenacao, setOrdenacao] = useState("titulo-asc");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    setCurrentPage(1);
  }, [busca, categoriaFilter, tempoFilter, ordenacao]);

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

  const musicasFiltradas = useMemo(() => {
    let filtradas = musicas.filter(m => {
      const matchBusca = m.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        (m.artista && m.artista.toLowerCase().includes(busca.toLowerCase())) ||
        m.categoria.toLowerCase().includes(busca.toLowerCase()) ||
        m.tempo.toLowerCase().includes(busca.toLowerCase());
      const matchCategoria = categoriaFilter ? m.categoria === categoriaFilter : true;
      const matchTempo = tempoFilter ? m.tempo === tempoFilter : true;
      return matchBusca && matchCategoria && matchTempo;
    });

    // Aplica a ordenação
    if (ordenacao === "titulo-asc") {
      filtradas.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
    } else if (ordenacao === "titulo-desc") {
      filtradas.sort((a, b) => b.titulo.localeCompare(a.titulo, "pt-BR"));
    } else if (ordenacao === "recentes") {
      filtradas.sort((a, b) => {
        const dataA = a.modificadoEm || a.criadoEm || "";
        const dataB = b.modificadoEm || b.criadoEm || "";
        return dataB.localeCompare(dataA); // Mais recente primeiro
      });
    } else if (ordenacao === "antigas") {
      filtradas.sort((a, b) => {
        const dataA = a.modificadoEm || a.criadoEm || "";
        const dataB = b.modificadoEm || b.criadoEm || "";
        return dataA.localeCompare(dataB); // Mais antiga primeiro
      });
    }

    return filtradas;
  }, [musicas, busca, categoriaFilter, tempoFilter, ordenacao]);

  const totalPages = Math.ceil(musicasFiltradas.length / itemsPerPage);

  const musicasPaginadas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return musicasFiltradas.slice(start, start + itemsPerPage);
  }, [musicasFiltradas, currentPage, itemsPerPage]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Painel de Cifras</h1>
          <p className="text-gray-500">Gerencie o repertório do aplicativo</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 shadow-sm transition-colors font-medium text-sm"
          >
            <Eye size={18} />
            <span>Ver Site</span>
          </Link>
          <Link
            href="/admin/musica/nova"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            <span>Nova Cifra</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-[#e4ded0] hover:bg-[#d4cdbd] text-gray-800 px-4 py-2 rounded-lg border border-gray-300/40 shadow-sm transition-colors font-medium text-sm"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Seletor de Tema Litúrgico Global */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e4ded0] p-6 mb-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>🎨</span> Tema Litúrgico Global
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Escolha o tema litúrgico que será aplicado globalmente para todos os visitantes do aplicativo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((option) => {
            const isSelected = mode === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setMode(option.value as LiturgicalThemeMode)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${isSelected
                    ? `${option.bgClass} shadow-md scale-105 ring-2 ring-offset-2 ring-primary-500`
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
              >
                {!isSelected && (
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    option.value === 'auto'
                      ? 'bg-gray-400 border border-gray-300'
                      : option.value === 'green'
                        ? 'bg-[#3d6443]'
                        : option.value === 'violet'
                          ? 'bg-[#722d9f]'
                          : option.value === 'red'
                            ? 'bg-[#b02b2b]'
                            : option.value === 'white'
                              ? 'bg-[#956821]'
                              : option.value === 'rose'
                                ? 'bg-[#a83149]'
                                : option.value === 'blue'
                                  ? 'bg-[#34628a]'
                                  : 'bg-[#1f1f1f]'
                    }`} />
                )}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!loading && musicas.length > 0 && (
        <RepertorioManager musicas={musicas} />
      )}

      {/* Barra de Busca e Filtros */}
      <div className="mt-8 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-serif font-bold text-gray-800">Cifras Cadastradas</h2>

          {!loading && musicas.length > 0 && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Busca Principal */}
              <div className="relative flex-1 sm:w-64 shadow-sm rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Search size={15} />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por título ou artista..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full p-2 pl-9 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                />
              </div>

              {/* Botão de Toggle Filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 border rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm select-none ${showFilters || categoriaFilter || tempoFilter || ordenacao !== "titulo-asc"
                    ? "bg-primary-50 border-primary-300 text-primary-750"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                title="Mostrar filtros e ordenação"
              >
                <SlidersHorizontal size={15} />
                <span className="hidden sm:inline">Filtros</span>
                {(categoriaFilter || tempoFilter || ordenacao !== "titulo-asc") && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600"></span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Filtros Expandidos */}
        {showFilters && !loading && musicas.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mt-3 p-4 bg-gray-50 rounded-xl border border-[#e4ded0] shadow-inner">
            {/* Filtro Categoria */}
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Categoria</span>
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer shadow-sm"
              >
                <option value="">Todas</option>
                {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Filtro Tempo */}
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tempo Litúrgico</span>
              <select
                value={tempoFilter}
                onChange={(e) => setTempoFilter(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer shadow-sm"
              >
                <option value="">Todos</option>
                {tempos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Ordenação */}
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Ordenação</span>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-xs focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer shadow-sm font-medium"
              >
                <option value="titulo-asc">Título (A-Z)</option>
                <option value="titulo-desc">Título (Z-A)</option>
                <option value="recentes">Mais Recentes</option>
                <option value="antigas">Mais Antigas</option>
              </select>
            </div>

            {/* Limpar Filtros */}
            {(categoriaFilter || tempoFilter || ordenacao !== "titulo-asc" || busca) && (
              <div className="flex items-end h-full pt-4">
                <button
                  onClick={() => {
                    setBusca("");
                    setCategoriaFilter("");
                    setTempoFilter("");
                    setOrdenacao("titulo-asc");
                  }}
                  className="p-2 text-xs font-semibold text-red-650 hover:text-red-750 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#e4ded0] overflow-hidden mb-12">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Carregando cifras...</div>
        ) : musicasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs font-semibold">
            {(busca || categoriaFilter || tempoFilter)
              ? "Nenhuma cifra encontrada para os filtros selecionados."
              : "Nenhuma cifra cadastrada ainda. Clique em 'Nova Cifra' para começar."}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#e4ded0] text-gray-600 text-sm">
                    <th className="p-4 font-medium">Título</th>
                    <th className="p-4 font-medium">Categoria</th>
                    <th className="p-4 font-medium">Tempo Litúrgico</th>
                    <th className="p-4 font-medium">Tom</th>
                    <th className="p-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {musicasPaginadas.map((musica) => (
                    <tr key={musica.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-gray-800">{musica.titulo}</div>
                        {musica.artista && (
                          <div className="text-xs text-gray-500 italic mt-0.5">de {musica.artista}</div>
                        )}
                        {(musica.criadoPor || musica.modificadoPor) && (
                          <div className="text-[10px] text-gray-400 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                            {musica.criadoPor && (
                              <span>Criada por: <span className="text-gray-500 font-medium">{musica.criadoPor}</span></span>
                            )}
                            {musica.modificadoPor && (
                              <span>• Modificada por: <span className="text-gray-500 font-medium">{musica.modificadoPor}</span></span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">{musica.categoria}</span>
                      </td>
                      <td className="p-4 text-gray-600">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 border rounded-full text-xs font-semibold uppercase tracking-wider ${obterEstiloTempoLiturgico(musica.tempo).badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${obterEstiloTempoLiturgico(musica.tempo).dot}`} />
                          {musica.tempo}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 font-mono">{musica.tom}</td>
                      <td className="p-4 flex justify-end gap-3">
                        <Link
                          href={`/admin/musica/${musica.id}/editar`}
                          className="p-2 text-primary-700 hover:bg-primary-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(musica.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
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

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="bg-gray-50/50 border-t border-[#e4ded0] px-4 py-3 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Mostrando <span className="font-semibold text-gray-700">{Math.min(musicasFiltradas.length, (currentPage - 1) * itemsPerPage + 1)}</span> a <span className="font-semibold text-gray-700">{Math.min(musicasFiltradas.length, currentPage * itemsPerPage)}</span> de <span className="font-semibold text-gray-700">{musicasFiltradas.length}</span> cifras
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    Anterior
                  </button>
                  <span className="text-xs text-gray-500 font-medium select-none px-1">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
