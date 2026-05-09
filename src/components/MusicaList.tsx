"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getLiturgicalDay } from "@/app/actions";

type Musica = {
  id: string;
  titulo: string;
  categoria: string;
  tempo: string;
  tom: string;
  letraCifra: string;
};

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

  useEffect(() => {
    async function fetchMusicas() {
      try {
        const querySnapshot = await getDocs(collection(db, "musicas"));
        const lista: Musica[] = [];
        querySnapshot.forEach((doc) => {
          lista.push({ id: doc.id, ...doc.data() } as Musica);
        });
        setMusicas(lista);
      } catch (error) {
        console.error("Erro ao buscar músicas do Firebase:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMusicas();
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
    return musicas.filter((m) => {
      const matchBusca = m.titulo.toLowerCase().includes(busca.toLowerCase());
      const matchCategoria = categoria ? m.categoria === categoria : true;
      const matchTempo = tempo ? m.tempo === tempo : true;
      return matchBusca && matchCategoria && matchTempo;
    });
  }, [musicas, busca, categoria, tempo]);

  return (
    <div>
      <div className="mb-8 space-y-4">
        {/* Input de Busca */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Buscar música..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
          />
        </div>

        {/* Filtros em Select */}
        <div className="flex gap-4">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
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
            className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
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

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Buscando cifras...</p>
          </div>
        ) : musicasFiltradas.length > 0 ? (
          musicasFiltradas.map((musica) => (
            <Link href={`/musica/${musica.id}`} key={musica.id}>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 border-primary-500 group">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {musica.titulo}
                </h2>
                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                    {musica.categoria}
                  </span>
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                    {musica.tempo}
                  </span>
                  <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-1 rounded font-mono font-bold">
                    Tom: {musica.tom}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            Nenhuma música encontrada com estes filtros.
          </div>
        )}
      </div>
    </div>
  );
}
