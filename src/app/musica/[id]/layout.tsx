import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Props {
  children: React.ReactNode;
}

async function getMusica(id: string) {
  try {
    const docRef = doc(db, 'musicas', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Erro ao buscar música para metadados no servidor:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const musica = await getMusica(id);

  if (!musica) {
    return {
      title: 'Cifra não encontrada',
    };
  }

  const { titulo, artista, categoria, tempo, tom } = musica as any;
  const pageTitle = `${titulo}${artista ? ` - ${artista}` : ''}`;
  const description = `${categoria || 'Cifra'} • Tempo: ${tempo || 'Comum'} • Tom Original: ${tom || 'N/A'}. Acesse a cifra litúrgica completa, altere o tom, ative a rolagem automática e veja os diagramas.`;

  return {
    title: pageTitle,
    description: description,
    openGraph: {
      title: pageTitle,
      description: description,
      type: 'music.song',
      images: [
        {
          url: '/logo-principal.png',
          width: 512,
          height: 512,
          alt: `Cifra de ${titulo}`,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: pageTitle,
      description: description,
      images: ['/logo-principal.png'],
    },
  };
}

export default function MusicaLayout({ children }: Props) {
  return <>{children}</>;
}
