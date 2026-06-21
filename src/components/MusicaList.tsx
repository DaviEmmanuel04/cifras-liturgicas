"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, Music } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getLiturgicalDay } from "@/app/actions";
import { obterEstiloTempoLiturgico } from "@/utils/tempoLiturgico";
import { CifraViewer } from "./CifraViewer";

type Musica = {
  id: string;
  titulo: string;
  artista?: string;
  categoria: string;
  tempo: string;
  tom: string;
  letraCifra: string;
};

type Repertorio = {
  id: string;
  nome: string;
  data: string;
  ativo: boolean;
  musicasIds: string[];
};

function obterTrechoLetra(letraCifra: string, maxLength = 90): string {
  if (!letraCifra) return "";
  const semAcordes = letraCifra.replace(/\[.*?\]/g, "");
  const linhasLimpas = semAcordes
    .split("\n")
    .map(linha => linha.trim())
    .filter(linha => {
      if (!linha) return false;
      if (linha.endsWith(":")) return false;
      if (linha.startsWith("**") && (linha.endsWith("**") || linha.includes("**"))) return false;
      return true;
    });
  const textoCorrido = linhasLimpas.join(" ");
  if (textoCorrido.length <= maxLength) return textoCorrido;
  return textoCorrido.substring(0, maxLength).trim() + "...";
}

const seasonMap: Record<string, string> = {
  ordinary: "Tempo Comum",
  easter: "Páscoa",
  lent: "Quaresma",
  advent: "Advento",
  christmas: "Natal",
};

export function MusicaList() {
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tempo, setTempo] = useState("");
  const [activeRepertorios, setActiveRepertorios] = useState<Repertorio[]>([]);
  const [selectedRepTabId, setSelectedRepTabId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedMusicaId, setSelectedMusicaId] = useState<string | null>(null);

  // Sincroniza a URL inicial, histórico de navegação e filtros salvos na URL
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/musica\/([a-zA-Z0-9_-]+)$/);
      if (match) {
        setSelectedMusicaId(match[1]);
      } else if (path === "/") {
        setSelectedMusicaId(null);
      }

      // Restaura filtros da URL
      const params = new URLSearchParams(window.location.search);
      setBusca(params.get("q") || "");
      setCategoria(params.get("cat") || "");
      setTempo(params.get("tempo") || "");
    };

    handleLocationChange();

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Atualiza parâmetros de busca na URL dinamicamente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentQ = params.get("q") || "";
    const currentCat = params.get("cat") || "";
    const currentTempo = params.get("tempo") || "";

    if (busca !== currentQ || categoria !== currentCat || tempo !== currentTempo) {
      const newParams = new URLSearchParams(window.location.search);
      
      if (busca) newParams.set("q", busca);
      else newParams.delete("q");

      if (categoria) newParams.set("cat", categoria);
      else newParams.delete("cat");

      if (tempo) newParams.set("tempo", tempo);
      else newParams.delete("tempo");

      const searchStr = newParams.toString();
      const newQuery = searchStr ? `?${searchStr}` : "";
      const path = window.location.pathname;

      window.history.replaceState(null, "", `${path}${newQuery}`);
    }
  }, [busca, categoria, tempo]);

  // Reseta o scroll ao abrir uma música ou voltar à lista
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedMusicaId]);

  const selectedMusica = useMemo(() => {
    return musicas.find(m => m.id === selectedMusicaId) || null;
  }, [musicas, selectedMusicaId]);

  const handleMusicaClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setSelectedMusicaId(id);
    
    // Preserva parâmetros de busca ao navegar
    const search = window.location.search;
    window.history.pushState(null, "", `/musica/${id}${search}`);
  };

  const handleBackToList = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setSelectedMusicaId(null);
    
    // Preserva parâmetros de busca ao retornar para a lista
    const search = window.location.search;
    window.history.pushState(null, "", `/${search}`);
  };

  useEffect(() => {
    setVisibleCount(12);
  }, [busca, categoria, tempo]);

  useEffect(() => {
    async function fetchDados() {
      try {
        const querySnapshot = await getDocs(collection(db, "musicas"));
        const lista: Musica[] = [];
        querySnapshot.forEach((doc) => {
          lista.push({ id: doc.id, ...doc.data() } as Musica);
        });
        setMusicas(lista);

        // Busca os repertórios ativos
        const repQuery = query(collection(db, "repertorios"), where("ativo", "==", true));
        const repSnapshot = await getDocs(repQuery);
        const listaReps: Repertorio[] = [];
        repSnapshot.forEach((doc) => {
          listaReps.push({ id: doc.id, ...doc.data() } as Repertorio);
        });
        // Ordena por data (mais recente primeiro)
        listaReps.sort((a, b) => b.data.localeCompare(a.data));
        setActiveRepertorios(listaReps);
        if (listaReps.length > 0) {
          setSelectedRepTabId(listaReps[0].id);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do Firebase:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDados();
  }, []);

  const categoriasUnicas = useMemo(() => {
    return Array.from(new Set(musicas.map((m) => m.categoria))).sort();
  }, [musicas]);

  const temposUnicos = useMemo(() => {
    return Array.from(new Set(musicas.map((m) => m.tempo))).sort();
  }, [musicas]);

  useEffect(() => {
    async function fetchLiturgicalTime() {
      try {
        const data = await getLiturgicalDay();
        if (!data) return;
        const translatedSeason = seasonMap[data.season];
        
        // If the API season is in our unique times, set it as default
        if (translatedSeason && temposUnicos.includes(translatedSeason)) {
          setTempo(translatedSeason);
        }
      } catch (error) {
        console.error("Erro ao buscar tempo litúrgico:", error);
      }
    }
    fetchLiturgicalTime();
  }, [temposUnicos]);

  const musicasFiltradas = useMemo(() => {
    const filtradas = musicas.filter((m) => {
      const matchBusca = m.titulo.toLowerCase().includes(busca.toLowerCase());
      const matchCategoria = categoria ? m.categoria === categoria : true;
      const matchTempo = tempo ? m.tempo === tempo : true;
      return matchBusca && matchCategoria && matchTempo;
    });
    return filtradas.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
  }, [musicas, busca, categoria, tempo]);

  const musicasExibidas = useMemo(() => {
    return musicasFiltradas.slice(0, visibleCount);
  }, [musicasFiltradas, visibleCount]);

  const selectedRepertorio = useMemo(() => {
    return activeRepertorios.find(r => r.id === selectedRepTabId);
  }, [activeRepertorios, selectedRepTabId]);

  const musicasDoDia = useMemo(() => {
    if (!selectedRepertorio || !selectedRepertorio.musicasIds) return [];
    return selectedRepertorio.musicasIds.map(id => musicas.find(m => m.id === id)).filter(Boolean) as Musica[];
  }, [selectedRepertorio, musicas]);

  // Ignoramos o "tempo" como filtro que esconde o repertório, pois ele é setado automaticamente pela API
  const hasFilters = busca || categoria;

  if (selectedMusicaId) {
    if (loading) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center bg-[#f4f0e6]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600 font-medium">Carregando cifra...</p>
          </div>
        </div>
      );
    }

    if (!selectedMusica) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center bg-[#f4f0e6]">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Cifra não encontrada</h1>
          <button 
            onClick={handleBackToList}
            className="text-primary-700 hover:text-primary-850 font-semibold hover:underline cursor-pointer"
          >
            &larr; Voltar para a lista
          </button>
        </div>
      );
    }

    return (
      <main className="p-6">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={handleBackToList}
            className="print:hidden inline-block mb-6 text-primary-700 hover:text-primary-950 font-semibold transition-colors cursor-pointer bg-transparent border-none outline-none"
          >
            &larr; Voltar para a lista
          </button>

          <CifraViewer musica={selectedMusica} />
        </div>
      </main>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50/60 via-white/50 to-transparent p-6 md:p-8 border border-primary-100/40 shadow-sm transition-all duration-300">
        <div className="relative z-10 max-w-xl">
          <div className="flex flex-wrap gap-2">
            <span className="text-[9px] font-bold tracking-widest text-primary-700 uppercase bg-primary-100/60 px-2.5 py-1 rounded-full">
              Paróquia de Santo Antônio
            </span>
            <span className="text-[9px] font-bold tracking-wider text-gray-500 uppercase bg-gray-200/50 px-2.5 py-1 rounded-full">
              Antônio Martins - RN
            </span>
          </div>
          <h1 className="font-serif font-bold text-2xl md:text-3xl text-gray-800 leading-tight mt-3">
            Prepare e acompanhe os cânticos da celebração
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-2 leading-relaxed">
            Acesse as cifras e letras organizadas por momento litúrgico, com transposição rápida e rolagem automática para execução no altar.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-48 h-48 rounded-full bg-primary-200/20 blur-3xl pointer-events-none" />
      </div>

      {/* Área de Filtros e Busca */}
      <div className="space-y-4">
        {/* Input de Busca */}
        <div className="relative shadow-sm rounded-xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Buscar música no acervo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full p-3.5 pl-11 border border-gray-200 rounded-xl bg-white text-gray-800 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-450"
          />
        </div>

        {/* Filtros em Select */}
        <div className="flex gap-3">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="flex-1 p-3 border border-gray-200 rounded-xl bg-white text-gray-700 text-xs font-semibold focus:ring-2 focus:ring-primary-500 outline-none transition-all cursor-pointer shadow-sm"
          >
            <option value="">Todas as Categorias</option>
            {categoriasUnicas.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
            className="flex-1 p-3 border border-gray-200 rounded-xl bg-white text-gray-700 text-xs font-semibold focus:ring-2 focus:ring-primary-500 outline-none transition-all cursor-pointer shadow-sm"
          >
            <option value="">Todos os Tempos</option>
            {temposUnicos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Músicas de Hoje (Repertórios Ativos) */}
      {!loading && activeRepertorios.length > 0 && !hasFilters && (
        <div className="mb-10 animate-fade-in">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Music className="text-primary-600" size={20} />
            Músicas de Hoje{activeRepertorios.length === 1 ? `: ${activeRepertorios[0].nome}` : ""}
          </h2>

          {/* Abas para alternar entre múltiplos repertórios ativos */}
          {activeRepertorios.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-3">
              {activeRepertorios.map((rep) => {
                const isSelected = rep.id === selectedRepTabId;
                return (
                  <button
                    key={rep.id}
                    onClick={() => setSelectedRepTabId(rep.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isSelected
                        ? "bg-primary-600 text-white shadow"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {rep.nome}
                  </button>
                );
              })}
            </div>
          )}

          {musicasDoDia.length > 0 ? (
            <div className="grid gap-4 border-l-4 border-primary-500 pl-4 py-2">
              {musicasDoDia.map((musica, index) => (
                <Link 
                  href={`/musica/${musica.id}`} 
                  onClick={(e) => handleMusicaClick(e, musica.id)}
                  key={`rep-${musica.id}-${index}`}
                  className="block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group relative"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500"></div>
                  <div className="p-5">
                    {/* Badges litúrgicos */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      <span className="inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-primary-100 bg-primary-50 text-primary-750 uppercase tracking-wider">
                        {musica.categoria}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${obterEstiloTempoLiturgico(musica.tempo).badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${obterEstiloTempoLiturgico(musica.tempo).dot}`} />
                        {musica.tempo}
                      </span>
                      <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-400">
                        {musica.tom}
                      </span>
                    </div>

                    {/* Título */}
                    <h3 className="text-lg font-bold text-gray-800 font-serif group-hover:text-primary-700 transition-colors leading-tight">
                      {index + 1}. {musica.titulo}
                    </h3>
                    {musica.artista && (
                      <p className="text-xs text-gray-500 italic mt-0.5">de {musica.artista}</p>
                    )}

                    {/* Preview */}
                    {musica.letraCifra && (
                      <p className="text-xs text-gray-450 leading-relaxed line-clamp-2 select-none italic mt-2">
                        "{obterTrechoLetra(musica.letraCifra)}"
                      </p>
                    )}

                    {/* Indicador */}
                    <div className="mt-3 text-xs text-primary-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                      Ver cifra completa &rarr;
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic bg-white p-4 rounded-xl border border-gray-250 text-center">Este repertório não possui músicas adicionadas.</p>
          )}
          
          <div className="mt-8 mb-4 border-b border-gray-200"></div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Acervo Completo</h2>
        </div>
      )}

      {/* Lista Principal de Cifras */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200/60 shadow-sm">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-xs text-gray-500 font-semibold">Buscando cifras litúrgicas...</p>
          </div>
        ) : musicasExibidas.length > 0 ? (
          musicasExibidas.map((musica) => (
            <Link 
              href={`/musica/${musica.id}`} 
              onClick={(e) => handleMusicaClick(e, musica.id)}
              key={musica.id}
              className="block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
            >
              <div className="p-5">
                {/* Badges litúrgicos */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span className="inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-primary-100 bg-primary-50 text-primary-750 uppercase tracking-wider">
                    {musica.categoria}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${obterEstiloTempoLiturgico(musica.tempo).badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${obterEstiloTempoLiturgico(musica.tempo).dot}`} />
                    {musica.tempo}
                  </span>
                  <span className="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-400">
                    {musica.tom}
                  </span>
                </div>

                {/* Título */}
                <h3 className="text-lg font-bold text-gray-800 font-serif group-hover:text-primary-700 transition-colors leading-tight">
                  {musica.titulo}
                </h3>
                {musica.artista && (
                  <p className="text-xs text-gray-500 italic mt-0.5">de {musica.artista}</p>
                )}

                {/* Preview */}
                {musica.letraCifra && (
                  <p className="text-xs text-gray-450 leading-relaxed line-clamp-2 select-none italic mt-2">
                    "{obterTrechoLetra(musica.letraCifra)}"
                  </p>
                )}

                {/* Indicador */}
                <div className="mt-3 text-xs text-primary-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                  Ver cifra completa &rarr;
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200/60 shadow-sm text-gray-400 text-xs">
            Nenhuma música encontrada com estes filtros no momento.
          </div>
        )}
      </div>

      {!loading && musicasFiltradas.length > visibleCount && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount(prev => prev + 12)}
            className="px-6 py-2.5 bg-white hover:bg-gray-50 active:bg-gray-100 text-primary-700 border border-primary-200 hover:border-primary-300 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all duration-200 shadow-sm cursor-pointer"
          >
            Carregar Mais Cifras
          </button>
        </div>
      )}
    </div>
  );
}
