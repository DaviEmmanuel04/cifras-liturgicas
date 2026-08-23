"use client";

import Link from 'next/link';
import { CifraViewer } from '@/components/CifraViewer';
import { VersaoSelector } from '@/components/VersaoSelector';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Suspense, useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Musica } from '@/types/musica';
import { tablaturasDeFirestore } from '@/utils/tablaturaFirestore';
import { versoesDeFirestore } from '@/utils/versaoFirestore';
import { resolverConteudoVersao, resolverVersaoIdEfetivo } from '@/utils/resolverVersao';

export default function MusicaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <Suspense fallback={null}>
      <MusicaPageConteudo id={id} />
    </Suspense>
  );
}

/**
 * `useSearchParams` (o parâmetro `versao` da URL) exige uma fronteira de
 * Suspense própria — daí este componente separado do wrapper acima, que só
 * resolve `params`.
 */
function MusicaPageConteudo({ id }: { id: string }) {
  const [musica, setMusica] = useState<Musica | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const versaoIdNaUrl = searchParams.get('versao') ?? undefined;

  useEffect(() => {
    async function fetchMusica() {
      try {
        const docRef = doc(db, 'musicas', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setNotFoundState(true);
        } else {
          const data = docSnap.data();
          setMusica({
            id: docSnap.id,
            ...data,
            tablaturas: tablaturasDeFirestore(data.tablaturas),
            versoes: data.versoes ? versoesDeFirestore(data.versoes) : undefined,
          } as Musica);
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

  // Normaliza a URL quando `versaoIdNaUrl` aponta pra uma Versão que não
  // existe mais (ex. link salvo pra uma já apagada): o conteúdo já cai pra
  // Principal via resolverConteudoVersao, mas sem isto o endereço na barra —
  // e qualquer cópia dele — continuaria carregando o id morto pra sempre.
  useEffect(() => {
    if (!musica) return;

    const versaoIdResolvido = resolverVersaoIdEfetivo(musica, versaoIdNaUrl);
    if (versaoIdNaUrl && versaoIdNaUrl !== versaoIdResolvido) {
      const params = new URLSearchParams(searchParams.toString());
      if (versaoIdResolvido) {
        params.set('versao', versaoIdResolvido);
      } else {
        params.delete('versao');
      }
      const query = params.toString();
      router.replace(`/musica/${id}${query ? `?${query}` : ''}`, { scroll: false });
    }
  }, [musica, versaoIdNaUrl, id, router, searchParams]);

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

  const conteudo = resolverConteudoVersao(musica, versaoIdNaUrl);
  const versaoSelecionadaId = resolverVersaoIdEfetivo(musica, versaoIdNaUrl);
  const musicaExibida: Musica = { ...musica, ...conteudo };
  // `versoes` só existe a partir da segunda Versão criada (ADR 0003) — sua
  // mera presença já implica 2+, mesmo padrão de `versoesExistentes.length >
  // 0` usado na tela de admin.
  const temMultiplasVersoes = (musica.versoes?.length ?? 0) > 0;

  const handleSelecionarVersao = (novoVersaoId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('versao', novoVersaoId);
    router.push(`/musica/${id}?${params.toString()}`, { scroll: false });
  };

  return (
    <main className="p-3 md:p-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="print:hidden inline-block mb-6 text-primary-700 hover:text-primary-900 font-semibold transition-colors"
        >
          &larr; Voltar para a lista
        </Link>

        {temMultiplasVersoes && (
          <VersaoSelector
            versoes={musica.versoes!}
            versaoPrincipalId={musica.versaoPrincipalId}
            versaoSelecionadaId={versaoSelecionadaId}
            onSelecionar={handleSelecionarVersao}
          />
        )}

        {/* `key` força remontar ao trocar de Versão: o Tom transposto ao vivo
            (estado interno do CifraViewer) é sempre relativo à Versão atual —
            sem isto, o offset de uma Versão vazaria pro Tom salvo da próxima. */}
        <CifraViewer key={versaoSelecionadaId ?? musica.id} musica={musicaExibida} />
      </div>
    </main>
  );
}
