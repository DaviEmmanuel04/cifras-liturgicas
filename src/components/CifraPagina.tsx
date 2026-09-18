"use client";

import type { ReactNode } from "react";
import { CifraViewer } from "./CifraViewer";
import { VersaoSelector } from "./VersaoSelector";
import {
  resolverConteudoVersao,
  resolverVersaoIdEfetivo,
  resolverVideoReferencia,
} from "@/utils/resolverVersao";
import type { Musica } from "@/types/musica";

type CifraPaginaProps = {
  /**
   * A Música **original**, como veio do Firestore — nunca já resolvida pra
   * uma Versão. A resolução acontece aqui dentro porque `videoReferencia`
   * depende também de `videoReferenciaPadrao`, que é campo de topo da Música
   * e não conteúdo de Versão (ver CONTEXT.md, "Vídeo de Referência").
   */
  musica: Musica;
  /** Versão pedida (parâmetro `versao` da URL, ou fixada num Repertório). Pode já não existir. */
  versaoId?: string;
  onSelecionarVersao: (versaoId: string) => void;
  /** O "voltar": `Link` na rota própria, `button` no modo embutido na lista. */
  voltar: ReactNode;
};

/**
 * A tela de leitura de uma Cifra — seletor de Versão, Vídeo de Referência e
 * CifraViewer. Ponto único: tanto a rota `/musica/[id]` quanto a lista (que
 * abre a cifra sem navegar de fato) renderizam por aqui, senão uma das duas
 * fica pra trás a cada campo novo.
 */
export function CifraPagina({ musica, versaoId, onSelecionarVersao, voltar }: CifraPaginaProps) {
  const conteudo = resolverConteudoVersao(musica, versaoId);
  const versaoSelecionadaId = resolverVersaoIdEfetivo(musica, versaoId);
  const musicaExibida: Musica = { ...musica, ...conteudo };
  const videoReferenciaId = resolverVideoReferencia(musica, versaoId);
  // `versoes` só existe a partir da segunda Versão criada (ADR 0003) — sua
  // mera presença já implica 2+, mesmo padrão de `versoesExistentes.length >
  // 0` usado na tela de admin.
  const temMultiplasVersoes = (musica.versoes?.length ?? 0) > 0;

  return (
    <main className="p-3 md:p-6">
      <div className="max-w-3xl mx-auto">
        {voltar}

        {temMultiplasVersoes && (
          <VersaoSelector
            versoes={musica.versoes!}
            versaoPrincipalId={musica.versaoPrincipalId}
            versaoSelecionadaId={versaoSelecionadaId}
            onSelecionar={onSelecionarVersao}
          />
        )}

        {/* `key` força remontar ao trocar de Versão/Música: o Tom transposto
            ao vivo (estado interno do CifraViewer) é sempre relativo à Versão
            atual — sem isto, o offset de uma Versão vazaria pro Tom salvo da
            próxima. */}
        <CifraViewer
          key={versaoSelecionadaId ?? musica.id}
          musica={musicaExibida}
          videoReferenciaId={videoReferenciaId}
        />
      </div>
    </main>
  );
}
