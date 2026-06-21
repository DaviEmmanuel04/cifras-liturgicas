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
      <div className="min-h-[50vh] flex items-center justify-center bg-[#f4f0e6]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 font-medium">Carregando cifra...</p>
        </div>
      </div>
    );
  }

  if (notFoundState || !musica) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center bg-[#f4f0e6]">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Cifra não encontrada</h1>
        <Link href="/" className="text-primary-700 hover:text-primary-800 font-semibold hover:underline">
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
          className="print:hidden inline-block mb-6 text-primary-700 hover:text-primary-900 font-semibold transition-colors"
        >
          &larr; Voltar para a lista
        </Link>

        <CifraViewer musica={musica} />
      </div>
    </main>
  );
}