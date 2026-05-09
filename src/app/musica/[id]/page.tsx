"use client";

import Link from 'next/link';
import { CifraViewer } from '@/components/CifraViewer';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState, useEffect, use } from 'react';

export default function MusicaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [musica, setMusica] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    async function fetchMusica() {
      try {
        const docRef = doc(db, 'musicas', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setNotFoundState(true);
        } else {
          setMusica({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Erro ao buscar música:", error);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    }
    fetchMusica();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Carregando cifra...</p>
        </div>
      </div>
    );
  }

  if (notFoundState || !musica) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Cifra não encontrada</h1>
        <Link href="/" className="text-primary-600 dark:text-primary-400 hover:underline">
          &larr; Voltar para a lista
        </Link>
      </div>
    );
  }

  return (
    <main className="p-6">
      <div className="max-w-3xl mx-auto">
        <Link 
          href="/" 
          className="print:hidden inline-block mb-6 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium transition-colors"
        >
          &larr; Voltar para a lista
        </Link>

        <CifraViewer musica={musica} />
      </div>
    </main>
  );
}