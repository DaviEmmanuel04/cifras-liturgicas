"use client";

import { useState, useEffect, useRef, useMemo, use } from "react";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Layers, Minus, Pencil, Plus, RotateCcw, Save, Star, Trash2, Upload, X, Youtube } from "lucide-react";
import { CifraRenderer } from "@/components/CifraRenderer";
import { InteractiveCifraEditor } from "@/components/InteractiveCifraEditor";
import { TablaturaEditor } from "@/components/TablaturaEditor";
import { convertPdfAction } from "@/app/actions";
import { obterEstiloTempoLiturgico } from "@/utils/tempoLiturgico";
import type { SecaoTablatura } from "@/types/tablatura";
import { tablaturasDeFirestore, tablaturasParaFirestore } from "@/utils/tablaturaFirestore";
import { versoesDeFirestore, versoesParaFirestore } from "@/utils/versaoFirestore";
import { conteudoVersaoTransposta, criarSegundaVersao } from "@/utils/criarSegundaVersao";
import { opcoesCapotraste, opcoesTransposicao, transporAcorde } from "@/utils/transposicao";
import {
  adicionarVersao,
  atualizarVersao,
  avaliarExclusaoVersao,
  promoverVersaoPrincipal,
  repertoriosComVersaoFixada,
  type RepertorioComVersoesFixadas,
} from "@/utils/gerenciarVersoes";
import type { ConteudoVersao } from "@/utils/resolverVersao";
import type { Versao } from "@/types/versao";
import { extrairIdYoutube, urlAssistirYoutube } from "@/utils/youtube";

/** Sugestão inicial (editável) pro rótulo da Versão que já existia, ao criar a segunda Versão de uma Música. */
const ROTULO_SUGERIDO_VERSAO_EXISTENTE = "Original";

/**
 * Interpreta o texto de um campo de Vídeo de Referência (URL colada, ou o id
 * puro): vazio é válido (nenhum vídeo); texto não-vazio só é válido quando
 * reconhecível como link do YouTube. Usada tanto no campo próprio da Versão
 * quanto no Vídeo de Referência Padrão da Música — ver CONTEXT.md.
 */
const processarCampoVideo = (texto: string): { id?: string; valido: boolean } => {
  const limpo = texto.trim();
  if (!limpo) return { id: undefined, valido: true };
  const id = extrairIdYoutube(limpo);
  return { id, valido: id !== undefined };
};

const categorias = ["Entrada", "Ato Penitencial", "Glória", "Salmo", "Aclamação ao Evangelho", "Ofertório", "Santo", "Comunhão", "Ação de Graças", "Final", "Adoração", "Terço", "Festa de Santo Antônio", "Festa do Sagrado Coração de Jesus", "Outros"];
const tempos = ["Tempo Comum", "Advento", "Natal", "Quaresma", "Páscoa", "Festa de Santo Antônio", "Festa do Sagrado Coração de Jesus", "Outros"];

export default function EditarMusicaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [mostrarAvisoPdf, setMostrarAvisoPdf] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    titulo: "",
    artista: "",
    categoria: "",
    tempo: "",
    tom: "",
    // Capotraste padrão desta Versão (0 = "Sem capotraste" — ausência no
    // Firestore é tratada como 0, nunca um terceiro estado). Ver
    // CONTEXT.md, "Capotraste".
    capotraste: 0,
    letraCifra: "",
    // Vídeo de Referência da Versão em edição (texto livre do campo — URL
    // colada ou id — validado e convertido em id só no momento de salvar).
    videoReferencia: "",
    // Suprime explicitamente o Vídeo de Referência Padrão nesta Versão,
    // mesmo sem um vídeo próprio (ver CONTEXT.md, "Vídeo de Referência").
    videoReferenciaSuprimida: false,
    // Vídeo de Referência Padrão da Música — independente de qual Versão
    // está sendo editada, nunca troca ao usar o seletor "Editando".
    videoReferenciaPadrao: "",
    criadoEm: "",
    criadoPor: "",
    atualizadoEm: "",
    atualizadoPor: ""
  });
  const [tablaturas, setTablaturas] = useState<SecaoTablatura[]>([]);
  // Trava assim que existe conteúdo de Tablatura (já carregado ou recém
  // adicionado), pra o Tom exibido no editor de Tablatura parar de seguir o
  // campo "Tom Original" ao vivo — evita ambiguidade sobre a partir de qual
  // Tom as casas foram digitadas.
  const [tomTravado, setTomTravado] = useState("");

  // Versões (ver CONTEXT.md, entradas "Versão" e "Versão Principal").
  // `versoesExistentes` só é não-vazio numa Música em que este fluxo já foi
  // usado antes — nesse caso a ação de duplicar (que só cobre single→duas
  // Versões) fica escondida.
  const [versoesExistentes, setVersoesExistentes] = useState<Versao[]>([]);
  // `id` da Versão marcada como Principal dentro de `versoesExistentes`. Só
  // relevante quando a coleção existe (ver types/musica.ts).
  const [versaoPrincipalId, setVersaoPrincipalId] = useState<string | undefined>(undefined);
  // `id` da Versão cujo conteúdo está carregado em `formData`/`tablaturas`
  // agora — o formulário sempre edita esta Versão, e Salvar sempre grava
  // nela. Espelha `versaoPrincipalId` ao carregar a Música e após promover;
  // trocar no seletor "Editando" muda só este estado, sem tocar em qual é a
  // Principal. `undefined` enquanto `versoesExistentes` está vazio — aí o
  // formulário edita os campos de topo da Música diretamente, como sempre.
  const [versaoEmEdicaoId, setVersaoEmEdicaoId] = useState<string | undefined>(undefined);
  // Rastreia edição não salva pra bloquear "Duplicar Versão" enquanto há
  // pendência no formulário principal (duplicar sempre parte de conteúdo já
  // salvo, nunca de edição pendente).
  const [sujo, setSujo] = useState(false);
  // true enquanto o formulário está editando a cópia livre que vai virar a
  // Versão nova — nesse modo, o Salvar normal fica desabilitado em favor de
  // "Salvar como Nova Versão", que pede os dois rótulos antes de confirmar.
  const [modoNovaVersao, setModoNovaVersao] = useState(false);
  const [conteudoVersaoOriginal, setConteudoVersaoOriginal] = useState<ConteudoVersao | null>(null);
  const [criandoVersao, setCriandoVersao] = useState(false);
  // Semitons aplicados só ao preview (mesmos controles da visualização
  // pública) — não altera formData; "Salvar Tom Transposto como Nova Versão"
  // é o único jeito de persistir o resultado.
  const [previewSemitons, setPreviewSemitons] = useState(0);
  const [salvandoVersaoTransposta, setSalvandoVersaoTransposta] = useState(false);
  // Desabilita as ações de renomear/promover/apagar da lista de Versões
  // enquanto uma delas está em andamento — evita disparos concorrentes.
  const [processandoVersao, setProcessandoVersao] = useState(false);

  useEffect(() => {
    async function carregarMusica() {
      try {
        const docRef = doc(db, "musicas", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            titulo: data.titulo || "",
            artista: data.artista || "",
            categoria: data.categoria || "",
            tempo: data.tempo || "",
            tom: data.tom || "",
            capotraste: typeof data.capotraste === "number" ? data.capotraste : 0,
            letraCifra: data.letraCifra || "",
            videoReferencia: data.videoReferencia ? urlAssistirYoutube(data.videoReferencia) : "",
            videoReferenciaSuprimida: !!data.videoReferenciaSuprimida,
            videoReferenciaPadrao: data.videoReferenciaPadrao ? urlAssistirYoutube(data.videoReferenciaPadrao) : "",
            criadoEm: data.criadoEm || "",
            criadoPor: data.criadoPor || "",
            atualizadoEm: data.atualizadoEm || "",
            atualizadoPor: data.atualizadoPor || ""
          });
          const secoesCarregadas: SecaoTablatura[] = tablaturasDeFirestore(data.tablaturas);
          setTablaturas(secoesCarregadas);
          if (secoesCarregadas.length > 0) {
            setTomTravado(data.tom || "");
          }
          const versoesCarregadas = versoesDeFirestore(data.versoes);
          setVersoesExistentes(versoesCarregadas);
          setVersaoPrincipalId(data.versaoPrincipalId || undefined);
          setVersaoEmEdicaoId(
            versoesCarregadas.length > 0
              ? (versoesCarregadas.find((v) => v.id === data.versaoPrincipalId) ?? versoesCarregadas[0]).id
              : undefined
          );
        } else {
          alert("Música não encontrada.");
          router.push("/admin/dashboard");
        }
      } catch (error) {
        console.error("Erro ao carregar música:", error);
        alert("Erro ao carregar dados da música.");
      } finally {
        setLoading(false);
      }
    }

    carregarMusica();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSujo(true);
  };

  const handleChangeCapotraste = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, capotraste: Number(e.target.value) }));
    setSujo(true);
  };

  /**
   * Alterna a supressão do Vídeo de Referência Padrão nesta Versão. Os dois
   * estados (vídeo próprio / suprimido) são mutuamente exclusivos na UI:
   * suprimir limpa o campo de texto; digitar um vídeo próprio desmarca a
   * supressão — ver CONTEXT.md, "Vídeo de Referência".
   */
  const handleToggleVideoReferenciaSuprimida = (suprimida: boolean) => {
    setFormData((prev) => ({ ...prev, videoReferenciaSuprimida: suprimida, videoReferencia: suprimida ? "" : prev.videoReferencia }));
    setSujo(true);
  };

  const handleChangeVideoReferencia = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, videoReferencia: e.target.value, videoReferenciaSuprimida: false }));
    setSujo(true);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const result = await convertPdfAction(data);
      if (result.success && result.text) {
        setFormData(prev => ({
          ...prev,
          letraCifra: result.text || ""
        }));
        setSujo(true);
        setMostrarAvisoPdf(true);
      } else {
        alert("Erro na conversão: " + (result.error || "Formato desconhecido"));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao converter o arquivo PDF.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleTablaturasChange = (novasSecoes: typeof tablaturas) => {
    if (tomTravado === "" && novasSecoes.length > 0) {
      setTomTravado(formData.tom);
    }
    setTablaturas(novasSecoes);
    setSujo(true);
  };

  const inserirColchetes = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.letraCifra;

    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    const novoTexto = before + "[" + selected + "]" + after;

    setFormData({ ...formData, letraCifra: novoTexto });
    setSujo(true);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, end + 1);
    }, 0);
  };

  /** `autor`/`agora` da operação atual — os dois valores de auditoria que toda escrita em Versão carrega junto. */
  const autoriaAtual = () => ({
    autor: auth.currentUser?.email || "Anônimo",
    agora: new Date().toISOString()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modoNovaVersao) return; // salvar aqui é só via "Salvar como Nova Versão"

    if (videoReferenciaInvalida || videoReferenciaPadraoInvalida) {
      alert("Um dos links de Vídeo de Referência não foi reconhecido como um vídeo do YouTube. Verifique e tente novamente.");
      return;
    }

    setSaving(true);

    try {
      const { autor, agora } = autoriaAtual();
      const videoProprio = formData.videoReferenciaSuprimida ? undefined : videoReferenciaProcessada.id;

      const payload: Record<string, unknown> = {
        titulo: formData.titulo,
        artista: formData.artista,
        categoria: formData.categoria,
        tempo: formData.tempo,
        // Vídeo de Referência Padrão é sempre da Música, não importa qual
        // Versão está carregada — nunca muda com o seletor "Editando".
        videoReferenciaPadrao: videoReferenciaPadraoProcessada.id ?? "",
        atualizadoEm: agora,
        atualizadoPor: autor
      };

      // Título/Artista/Categoria/Tempo/Vídeo Padrão são sempre da Música, não
      // importa qual Versão está carregada. Tom/Cifra/Tablatura/Vídeo de
      // Referência próprio, porém, pertencem à Versão selecionada no seletor
      // "Editando" (`versaoEmEdicaoId`) — os campos de topo da Música só
      // espelham a Principal (ADR 0003), então só mudam quando é ela que
      // está sendo editada agora.
      const editandoPrincipal = versoesExistentes.length === 0 || versaoEmEdicaoId === versaoPrincipalId;
      if (editandoPrincipal) {
        payload.tom = formData.tom;
        payload.capotraste = formData.capotraste;
        payload.letraCifra = formData.letraCifra;
        payload.tablaturas = tablaturasParaFirestore(tablaturas);
        payload.videoReferencia = videoProprio ?? "";
        payload.videoReferenciaSuprimida = formData.videoReferenciaSuprimida;
      }

      // A partir do momento em que a coleção de Versões existe, toda edição
      // atualiza o registro correspondente dentro de `versoes` — senão
      // qualquer leitura por `versaoId` (a resolução pública, um Repertório)
      // enxergaria conteúdo desatualizado.
      let versoesAtualizadas = versoesExistentes;
      if (versoesExistentes.length > 0 && versaoEmEdicaoId) {
        versoesAtualizadas = atualizarVersao(
          versoesExistentes,
          versaoEmEdicaoId,
          {
            tom: formData.tom,
            capotraste: formData.capotraste,
            letraCifra: formData.letraCifra,
            tablaturas,
            videoReferencia: videoProprio ?? "",
            videoReferenciaSuprimida: formData.videoReferenciaSuprimida
          },
          autor,
          agora
        );
        payload.versoes = versoesParaFirestore(versoesAtualizadas);
      }

      const docRef = doc(db, "musicas", id);
      await updateDoc(docRef, payload);

      setVersoesExistentes(versoesAtualizadas);
      setSujo(false);
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Erro ao atualizar música:", error);
      alert("Erro ao salvar alterações. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const conteudoVersaoDoFormulario = (): ConteudoVersao => ({
    tom: formData.tom,
    capotraste: formData.capotraste,
    letraCifra: formData.letraCifra,
    tablaturas,
    videoReferencia: formData.videoReferenciaSuprimida ? undefined : videoReferenciaProcessada.id,
    videoReferenciaSuprimida: formData.videoReferenciaSuprimida
  });

  const iniciarDuplicacao = () => {
    setConteudoVersaoOriginal(conteudoVersaoDoFormulario());
    setModoNovaVersao(true);
    setPreviewSemitons(0);
  };

  const cancelarDuplicacao = () => {
    if (!conteudoVersaoOriginal) return;
    setFormData(prev => ({
      ...prev,
      tom: conteudoVersaoOriginal.tom,
      capotraste: conteudoVersaoOriginal.capotraste ?? 0,
      letraCifra: conteudoVersaoOriginal.letraCifra,
      videoReferencia: conteudoVersaoOriginal.videoReferencia ? urlAssistirYoutube(conteudoVersaoOriginal.videoReferencia) : "",
      videoReferenciaSuprimida: !!conteudoVersaoOriginal.videoReferenciaSuprimida
    }));
    setTablaturas(conteudoVersaoOriginal.tablaturas ?? []);
    setConteudoVersaoOriginal(null);
    setModoNovaVersao(false);
    setSujo(false);
    setPreviewSemitons(0);
  };

  /**
   * Pede os dois rótulos exigidos por [[criarSegundaVersao]] — o da Versão
   * nova (`mensagemRotuloNovo` ajusta o texto do prompt conforme a origem:
   * cópia livre ou transposição) e, com sugestão pronta, o da Versão que já
   * existia. `null` se o admin cancelar/deixar vazio qualquer um dos dois.
   */
  const pedirRotulosNovaVersao = (mensagemRotuloNovo: string): { rotuloVersaoNova: string; rotuloVersaoExistente: string } | null => {
    const rotuloVersaoNova = prompt(mensagemRotuloNovo)?.trim();
    if (!rotuloVersaoNova) return null;

    const rotuloVersaoExistente = prompt(
      "Rótulo pra Versão que já existia:",
      ROTULO_SUGERIDO_VERSAO_EXISTENTE
    )?.trim();
    if (!rotuloVersaoExistente) return null;

    return { rotuloVersaoNova, rotuloVersaoExistente };
  };

  /**
   * Transforma a Música de Versão única em duas ([[criarSegundaVersao]]) e
   * grava: `conteudoAtual` vira a Versão Principal (espelhada nos campos de
   * topo, como hoje), `conteudoNovo` vira a segunda Versão. Reaproveitada
   * tanto por "Duplicar Versão" (cópia editada livremente) quanto por
   * "Salvar Tom Transposto" (conteúdo gerado por [[transporCifra]]) — as
   * duas origens de uma Versão nova descritas no spec.
   */
  const persistirSegundaVersao = async (
    conteudoAtual: ConteudoVersao,
    conteudoNovo: ConteudoVersao,
    rotulos: { rotuloVersaoNova: string; rotuloVersaoExistente: string }
  ) => {
    const { autor, agora } = autoriaAtual();

    const resultado = criarSegundaVersao({
      conteudoAtual,
      conteudoNovo,
      rotuloVersaoExistente: rotulos.rotuloVersaoExistente,
      rotuloVersaoNova: rotulos.rotuloVersaoNova,
      autor,
      agora
    });

    const docRef = doc(db, "musicas", id);
    await updateDoc(docRef, {
      tom: conteudoAtual.tom,
      capotraste: conteudoAtual.capotraste ?? 0,
      letraCifra: conteudoAtual.letraCifra,
      tablaturas: tablaturasParaFirestore(conteudoAtual.tablaturas ?? []),
      videoReferencia: conteudoAtual.videoReferencia ?? "",
      videoReferenciaSuprimida: conteudoAtual.videoReferenciaSuprimida ?? false,
      versoes: versoesParaFirestore(resultado.versoes),
      versaoPrincipalId: resultado.versaoPrincipalId,
      atualizadoEm: agora,
      atualizadoPor: autor
    });
  };

  /**
   * Confirma a cópia editada em `modoNovaVersao` como Versão nova. Quando é
   * a segunda Versão da Música, reaproveita o fluxo de dois rótulos do
   * ticket 2 ([[criarSegundaVersao]]) e leva de volta ao dashboard; daí em
   * diante, [[adicionarVersao]] só pede o rótulo da cópia — as demais já têm
   * o seu — e o formulário volta a mostrar a Versão que estava sendo
   * editada antes de duplicar, igual a `cancelarDuplicacao`.
   */
  const salvarComoNovaVersao = async () => {
    if (!conteudoVersaoOriginal) return;

    if (videoReferenciaInvalida) {
      alert("O link de Vídeo de Referência não foi reconhecido como um vídeo do YouTube. Verifique e tente novamente.");
      return;
    }

    if (versoesExistentes.length === 0) {
      const rotulos = pedirRotulosNovaVersao("Rótulo da nova Versão:");
      if (!rotulos) return;

      setCriandoVersao(true);
      try {
        await persistirSegundaVersao(conteudoVersaoOriginal, conteudoVersaoDoFormulario(), rotulos);
        router.push("/admin/dashboard");
      } catch (error) {
        console.error("Erro ao criar nova Versão:", error);
        alert("Erro ao salvar a nova Versão. Tente novamente.");
      } finally {
        setCriandoVersao(false);
      }
      return;
    }

    const rotulo = prompt("Rótulo da nova Versão:")?.trim();
    if (!rotulo) return;

    setCriandoVersao(true);
    try {
      const { autor, agora } = autoriaAtual();
      const atualizadas = adicionarVersao(versoesExistentes, conteudoVersaoDoFormulario(), rotulo, autor, agora);

      await updateDoc(doc(db, "musicas", id), {
        versoes: versoesParaFirestore(atualizadas),
        atualizadoEm: agora,
        atualizadoPor: autor
      });

      setVersoesExistentes(atualizadas);
      setFormData(prev => ({
        ...prev,
        tom: conteudoVersaoOriginal.tom,
        letraCifra: conteudoVersaoOriginal.letraCifra,
        videoReferencia: conteudoVersaoOriginal.videoReferencia ? urlAssistirYoutube(conteudoVersaoOriginal.videoReferencia) : "",
        videoReferenciaSuprimida: !!conteudoVersaoOriginal.videoReferenciaSuprimida
      }));
      setTablaturas(conteudoVersaoOriginal.tablaturas ?? []);
      setConteudoVersaoOriginal(null);
      setModoNovaVersao(false);
      setSujo(false);
    } catch (error) {
      console.error("Erro ao criar nova Versão:", error);
      alert("Erro ao salvar a nova Versão. Tente novamente.");
    } finally {
      setCriandoVersao(false);
    }
  };

  /**
   * Salva o resultado do preview transposto (`previewSemitons`) como uma
   * Versão nova, com a Cifra reescrita no Tom transposto ([[transporCifra]])
   * e a Tablatura copiada sem nenhuma alteração de casa — a Versão atual
   * (conteúdo do formulário, intocado) não muda. Quando é a segunda Versão
   * da Música, reaproveita o fluxo de nomeação de dois rótulos do ticket 2
   * ([[criarSegundaVersao]]); daí em diante, [[adicionarVersao]] só pede o
   * rótulo da Versão nova, já que as demais mantêm o que já tinham.
   */
  const salvarComoVersaoTransposta = async () => {
    if (previewSemitons === 0) return;

    if (videoReferenciaInvalida) {
      alert("O link de Vídeo de Referência não foi reconhecido como um vídeo do YouTube. Verifique e tente novamente.");
      return;
    }

    const conteudoAtual = conteudoVersaoDoFormulario();
    const conteudoTransposto = conteudoVersaoTransposta(conteudoAtual, previewSemitons);

    if (versoesExistentes.length === 0) {
      const rotulos = pedirRotulosNovaVersao("Rótulo da nova Versão (neste Tom transposto):");
      if (!rotulos) return;

      setSalvandoVersaoTransposta(true);
      try {
        await persistirSegundaVersao(conteudoAtual, conteudoTransposto, rotulos);
        router.push("/admin/dashboard");
      } catch (error) {
        console.error("Erro ao salvar a Versão transposta:", error);
        alert("Erro ao salvar a nova Versão. Tente novamente.");
      } finally {
        setSalvandoVersaoTransposta(false);
      }
      return;
    }

    const rotulo = prompt("Rótulo da nova Versão (neste Tom transposto):")?.trim();
    if (!rotulo) return;

    setSalvandoVersaoTransposta(true);
    try {
      const { autor, agora } = autoriaAtual();
      const atualizadas = adicionarVersao(versoesExistentes, conteudoTransposto, rotulo, autor, agora);

      await updateDoc(doc(db, "musicas", id), {
        versoes: versoesParaFirestore(atualizadas),
        atualizadoEm: agora,
        atualizadoPor: autor
      });

      setVersoesExistentes(atualizadas);
      setPreviewSemitons(0);
    } catch (error) {
      console.error("Erro ao salvar a Versão transposta:", error);
      alert("Erro ao salvar a nova Versão. Tente novamente.");
    } finally {
      setSalvandoVersaoTransposta(false);
    }
  };

  /**
   * Substitui o Tom/Cifra/Tablatura no formulário por `conteudo`, mais o
   * resto do estado que sempre acompanha essa troca (`tomTravado`, `sujo`,
   * `previewSemitons`) — Título/Artista/Categoria/Tempo não fazem parte,
   * são da Música, não de uma Versão. Reaproveitada por toda ação que muda
   * qual conteúdo está carregado: trocar no seletor "Editando", e o
   * fallback pra Principal quando a Versão aberta é apagada.
   */
  const carregarConteudoNoFormulario = (conteudo: ConteudoVersao) => {
    setFormData((prev) => ({
      ...prev,
      tom: conteudo.tom,
      capotraste: conteudo.capotraste ?? 0,
      letraCifra: conteudo.letraCifra,
      videoReferencia: conteudo.videoReferencia ? urlAssistirYoutube(conteudo.videoReferencia) : "",
      videoReferenciaSuprimida: !!conteudo.videoReferenciaSuprimida
    }));
    const novasTablaturas = conteudo.tablaturas ?? [];
    setTablaturas(novasTablaturas);
    setTomTravado(novasTablaturas.length > 0 ? conteudo.tom : "");
    setSujo(false);
    setPreviewSemitons(0);
  };

  /**
   * Troca qual Versão está carregada no formulário — chamada pelo seletor
   * "Editando" no topo da tela. Bloqueada enquanto há edição pendente
   * (`sujo`), mesma regra de "Duplicar Versão"/"Promover a Principal" — ver
   * o `disabled` do seletor.
   */
  const handleSelecionarVersaoParaEditar = (versaoId: string) => {
    const versao = versoesExistentes.find((v) => v.id === versaoId);
    if (!versao) return;

    setVersaoEmEdicaoId(versao.id);
    carregarConteudoNoFormulario(versao);
  };

  /** Nomes dos repertórios que hoje fixam `versaoId` — usado pra bloquear a exclusão dessa Versão. */
  const buscarRepertoriosComVersaoFixada = async (versaoId: string): Promise<string[]> => {
    const snapshot = await getDocs(collection(db, "repertorios"));
    const repertorios = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as RepertorioComVersoesFixadas
    );
    return repertoriosComVersaoFixada(repertorios, versaoId);
  };

  const handleRenomearVersao = async (versaoId: string, rotuloAtual: string) => {
    const novoRotulo = prompt("Novo rótulo da Versão:", rotuloAtual)?.trim();
    if (!novoRotulo || novoRotulo === rotuloAtual) return;

    setProcessandoVersao(true);
    try {
      const { autor, agora } = autoriaAtual();
      const atualizadas = atualizarVersao(versoesExistentes, versaoId, { rotulo: novoRotulo }, autor, agora);

      await updateDoc(doc(db, "musicas", id), {
        versoes: versoesParaFirestore(atualizadas),
        atualizadoEm: agora,
        atualizadoPor: autor
      });

      setVersoesExistentes(atualizadas);
    } catch (error) {
      console.error("Erro ao renomear Versão:", error);
      alert("Erro ao renomear a Versão. Tente novamente.");
    } finally {
      setProcessandoVersao(false);
    }
  };

  const handlePromoverVersao = async (versaoId: string) => {
    if (!confirm("Promover esta Versão a Principal? O conteúdo dela passa a ser o exibido por padrão.")) return;

    setProcessandoVersao(true);
    try {
      const conteudo = promoverVersaoPrincipal(versoesExistentes, versaoId);
      const { autor, agora } = autoriaAtual();

      await updateDoc(doc(db, "musicas", id), {
        versaoPrincipalId: versaoId,
        tom: conteudo.tom,
        capotraste: conteudo.capotraste ?? 0,
        letraCifra: conteudo.letraCifra,
        tablaturas: tablaturasParaFirestore(conteudo.tablaturas ?? []),
        videoReferencia: conteudo.videoReferencia ?? "",
        videoReferenciaSuprimida: conteudo.videoReferenciaSuprimida ?? false,
        atualizadoEm: agora,
        atualizadoPor: autor
      });

      setVersaoPrincipalId(versaoId);
      // O formulário continua editando a Versão que estava aberta antes de
      // promover (`versaoEmEdicaoId` não muda) — promover só troca qual é a
      // Principal, sem sequestrar o que o admin está editando no momento.
      // `handleSubmit` já decide sozinho, via `editandoPrincipal`, se uma
      // próxima edição salva mexe nos campos de topo da Música ou só dentro
      // de `versoes` — não depende de `formData` refletir a Principal aqui.
    } catch (error) {
      console.error("Erro ao promover Versão:", error);
      alert("Erro ao promover a Versão. Tente novamente.");
    } finally {
      setProcessandoVersao(false);
    }
  };

  const handleApagarVersao = async (versaoId: string, rotulo: string) => {
    setProcessandoVersao(true);
    try {
      const repertorios = await buscarRepertoriosComVersaoFixada(versaoId);
      const avaliacao = avaliarExclusaoVersao(versaoPrincipalId, versaoId, versoesExistentes.length, repertorios);

      if (!avaliacao.permitido) {
        alert(avaliacao.motivo);
        return;
      }

      if (!confirm(`Apagar a Versão "${rotulo}"? Esta ação não pode ser desfeita.`)) return;

      const restantes = versoesExistentes.filter((versao) => versao.id !== versaoId);
      const { autor, agora } = autoriaAtual();

      await updateDoc(doc(db, "musicas", id), {
        versoes: versoesParaFirestore(restantes),
        atualizadoEm: agora,
        atualizadoPor: autor
      });

      setVersoesExistentes(restantes);

      if (restantes.length === 0) {
        // Coleção esvaziou — volta pro modo implícito de versão única; o
        // formulário já mostra o conteúdo certo (o da própria Versão
        // restante), só o rótulo de "qual Versão" deixa de fazer sentido.
        setVersaoEmEdicaoId(undefined);
      } else if (versaoEmEdicaoId === versaoId) {
        // A Versão apagada era a que estava aberta no formulário — devolve a
        // edição pra Principal em vez de deixar o formulário apontando pra
        // uma Versão que não existe mais.
        const principal = restantes.find((v) => v.id === versaoPrincipalId) ?? restantes[0];
        setVersaoEmEdicaoId(principal.id);
        carregarConteudoNoFormulario(principal);
      }
    } catch (error) {
      console.error("Erro ao apagar Versão:", error);
      alert("Erro ao apagar a Versão. Tente novamente.");
    } finally {
      setProcessandoVersao(false);
    }
  };

  // Heurística visual simples para acordes com notação inválida
  const acordesInvalidos = useMemo(() => {
    const regexAcordes = /\[(.*?)\]/g;
    const invalidos: string[] = [];
    let match;

    while ((match = regexAcordes.exec(formData.letraCifra)) !== null) {
      const acorde = match[1].trim();
      if (!acorde) continue;

      const eInstrumental = /^[-|/\s]+$/.test(acorde);
      if (eInstrumental) continue;

      const notaValida = /^[A-G][#b]?(m|M|maj|min|dim|aug|sus)?([0-9])*(?:\[\/[A-G][#b]?\]|\/[A-G][#b]?)?$/;
      
      if (!notaValida.test(acorde)) {
        if (!invalidos.includes(acorde)) {
          invalidos.push(acorde);
        }
      }
    }

    return invalidos;
  }, [formData.letraCifra]);

  // Validação dos dois campos de Vídeo de Referência (próprio da Versão e
  // Padrão da Música) — vazio é válido, texto não-vazio precisa ser
  // reconhecível como link do YouTube. Suprimida ignora o campo de texto.
  // Parsing de string curta — barato o bastante pra não precisar de useMemo
  // (mesmo critério de `tomPreviewAtual` logo abaixo).
  const videoReferenciaProcessada = processarCampoVideo(formData.videoReferencia);
  const videoReferenciaPadraoProcessada = processarCampoVideo(formData.videoReferenciaPadrao);
  const videoReferenciaInvalida = !formData.videoReferenciaSuprimida && !videoReferenciaProcessada.valido;
  const videoReferenciaPadraoInvalida = !videoReferenciaPadraoProcessada.valido;

  const opcoesTomPreview = useMemo(() => opcoesTransposicao(formData.tom), [formData.tom]);
  const tomPreviewAtual = transporAcorde(formData.tom, previewSemitons);
  // "Duplicar Versão" só cobre a transição de Versão única pra duas — ver
  // [[criarSegundaVersao]]. Não há (ainda) um fluxo de duplicar pra uma
  // terceira Versão em diante.
  const podeCriarSegundaVersao = versoesExistentes.length === 0 && !modoNovaVersao;
  // "Salvar Tom Transposto", ao contrário, funciona em qualquer quantidade
  // de Versões já existentes — [[salvarComoVersaoTransposta]] escolhe entre
  // [[criarSegundaVersao]] (a primeira vez) e [[adicionarVersao]] (daí em
  // diante). Só fica indisponível durante a edição de uma cópia livre
  // (`modoNovaVersao`), que já é a própria forma de criar uma Versão nova.
  const podeSalvarVersaoTransposta = !modoNovaVersao;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/dashboard" 
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-900">Editar Música</h1>
            <p className="text-sm text-gray-500">Altere os dados ou cifras do canto litúrgico</p>
          </div>
        </div>
      </div>

      {versoesExistentes.length > 0 && !modoNovaVersao && (
        <div className="bg-white p-4 rounded-xl border border-[#e4ded0] shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Layers size={16} className="text-gray-400 shrink-0" />
            <label htmlFor="versao-em-edicao" className="text-sm font-medium text-gray-700 shrink-0">
              Editando:
            </label>
            <select
              id="versao-em-edicao"
              value={versaoEmEdicaoId ?? ""}
              onChange={(e) => handleSelecionarVersaoParaEditar(e.target.value)}
              disabled={sujo}
              title={sujo ? "Salve as alterações pendentes antes de trocar de Versão" : undefined}
              className="p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed max-w-[240px] truncate cursor-pointer"
            >
              {versoesExistentes.map((versao) => (
                <option key={versao.id} value={versao.id}>
                  {versao.rotulo}
                  {versao.id === versaoPrincipalId ? " (Principal)" : ""}
                </option>
              ))}
            </select>
          </div>
          {sujo && <p className="text-xs text-amber-700">Salve as alterações pendentes antes de trocar de Versão.</p>}
        </div>
      )}

      {podeCriarSegundaVersao && (
        <div className="bg-white p-4 rounded-xl border border-[#e4ded0] shadow-sm flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-sm font-bold text-gray-900">Versões</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Duplique o conteúdo atual pra criar uma segunda Versão desta Música (ex. uma letra alternativa, ou uma versão simplificada).
            </p>
            {sujo && (
              <p className="text-xs text-amber-700 mt-1">Salve as alterações pendentes antes de duplicar.</p>
            )}
          </div>
          <button
            type="button"
            onClick={iniciarDuplicacao}
            disabled={sujo}
            className="shrink-0 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Copy size={15} />
            Duplicar Versão
          </button>
        </div>
      )}

      {versoesExistentes.length > 0 && !modoNovaVersao && (
        <div className="bg-white p-4 rounded-xl border border-[#e4ded0] shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="font-serif text-sm font-bold text-gray-900">Versões</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Cada Versão tem seu próprio Tom, Cifra e Tablatura. A Principal é a exibida por padrão pra quem visita a Música. Use o seletor &ldquo;Editando&rdquo; acima pra editar o conteúdo de qualquer uma.
              </p>
            </div>
            <button
              type="button"
              onClick={iniciarDuplicacao}
              disabled={sujo}
              className="shrink-0 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Copy size={15} />
              Duplicar Versão
            </button>
          </div>
          {sujo && (
            <p className="text-xs text-amber-700 mb-3">Salve as alterações pendentes antes de duplicar ou promover uma Versão a Principal.</p>
          )}
          <ul className="space-y-2">
            {versoesExistentes.map((versao) => {
              const principal = versao.id === versaoPrincipalId;
              return (
                <li
                  key={versao.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-[#e4ded0] bg-[#fbf9f4]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">{versao.rotulo}</span>
                      {principal && (
                        <span className="shrink-0 bg-primary-50 text-primary-700 border border-primary-200 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                          Principal
                        </span>
                      )}
                      {versao.id === versaoEmEdicaoId && (
                        <span className="shrink-0 bg-gray-100 text-gray-600 border border-gray-250 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                          Editando
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 font-mono">Tom: {versao.tom}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRenomearVersao(versao.id, versao.rotulo)}
                      disabled={processandoVersao}
                      title="Renomear Versão"
                      className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    {!principal && (
                      <button
                        type="button"
                        onClick={() => handlePromoverVersao(versao.id)}
                        disabled={processandoVersao || sujo}
                        title="Promover a Principal"
                        className="p-1.5 text-gray-500 hover:text-primary-700 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                      >
                        <Star size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleApagarVersao(versao.id, versao.rotulo)}
                      // Apagar a própria Versão aberta no formulário descarta
                      // o conteúdo carregado nela (handleApagarVersao devolve
                      // a edição pra Principal) — bloqueia só esse caso
                      // enquanto há edição pendente, pra não perder trabalho
                      // sem aviso; apagar uma Versão não-aberta não mexe no
                      // formulário, então não precisa dessa trava.
                      disabled={processandoVersao || (sujo && versao.id === versaoEmEdicaoId)}
                      title={
                        sujo && versao.id === versaoEmEdicaoId
                          ? "Salve ou descarte as alterações pendentes antes de apagar a Versão aberta no formulário"
                          : "Apagar Versão"
                      }
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {modoNovaVersao && (
        <div className="bg-primary-50 p-4 rounded-xl border border-primary-200 shadow-sm flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-sm font-bold text-primary-900">Editando uma cópia</h2>
            <p className="text-xs text-primary-700 mt-0.5">
              Tom, Cifra e Tablatura abaixo vão virar uma nova Versão — Título, Artista, Categoria e Tempo Litúrgico são da Música e continuam bloqueados aqui. A Versão atual só muda quando você confirmar.
            </p>
          </div>
          <button
            type="button"
            onClick={cancelarDuplicacao}
            disabled={criandoVersao}
            className="shrink-0 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 border border-gray-300 cursor-pointer"
          >
            <X size={15} />
            Cancelar Cópia
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-[#e4ded0] shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título da Música</label>
              <input
                type="text"
                name="titulo"
                required
                value={formData.titulo}
                onChange={handleChange}
                disabled={modoNovaVersao}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Artista / Compositor</label>
              <input
                type="text"
                name="artista"
                value={formData.artista}
                onChange={handleChange}
                disabled={modoNovaVersao}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria (Momento)</label>
              <select
                name="categoria"
                required
                value={formData.categoria}
                onChange={handleChange}
                disabled={modoNovaVersao}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="" disabled>Selecione uma categoria</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempo Litúrgico</label>
              <select
                name="tempo"
                required
                value={formData.tempo}
                onChange={handleChange}
                disabled={modoNovaVersao}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="" disabled>Selecione um tempo</option>
                {tempos.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Youtube size={15} className="text-gray-400" />
                Vídeo de Referência Padrão <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Vídeo do YouTube usado como referência por qualquer Versão desta Música que não tenha (nem tenha suprimido) um vídeo próprio. Independe de qual Versão é a Principal.
              </p>
              <input
                type="text"
                name="videoReferenciaPadrao"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.videoReferenciaPadrao}
                onChange={handleChange}
                disabled={modoNovaVersao}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {videoReferenciaPadraoInvalida && (
                <p className="text-xs text-red-600 mt-1">Link do YouTube não reconhecido.</p>
              )}
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tom Original</label>
                <input
                  type="text"
                  name="tom"
                  required
                  value={formData.tom}
                  onChange={handleChange}
                  className="w-full md:w-40 p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capotraste padrão</label>
                <select
                  name="capotraste"
                  value={formData.capotraste}
                  onChange={handleChangeCapotraste}
                  className="w-full md:w-44 p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
                >
                  {opcoesCapotraste().map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>{opcao.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Youtube size={15} className="text-gray-400" />
                Vídeo de Referência desta Versão <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                {formData.videoReferenciaSuprimida
                  ? "Esta Versão não vai mostrar nenhum vídeo, mesmo que a Música tenha um Vídeo de Referência Padrão."
                  : "Sem um vídeo próprio aqui, esta Versão mostra o Vídeo de Referência Padrão da Música (se houver)."}
              </p>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.videoReferencia}
                onChange={handleChangeVideoReferencia}
                disabled={formData.videoReferenciaSuprimida}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {videoReferenciaInvalida && (
                <p className="text-xs text-red-600 mt-1">Link do YouTube não reconhecido.</p>
              )}
              <label className="mt-2 flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.videoReferenciaSuprimida}
                  onChange={(e) => handleToggleVideoReferenciaSuprimida(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 bg-white"
                />
                Não mostrar nenhum vídeo nesta Versão (ignora o Padrão da Música)
              </label>
            </div>

            <div className="md:col-span-2">
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Letra e Cifras</label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Alterne entre o <strong>Editor Visual Interativo</strong> (clique nas palavras) e o <strong>Modo Texto</strong>.
                </p>
              </div>

              {mostrarAvisoPdf && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-xs flex justify-between items-center animate-pulse-once">
                  <span>
                    <strong>Atenção:</strong> A conversão automática de PDF não é 100% perfeita. Por favor, revise o alinhamento dos acordes e a letra antes de salvar.
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setMostrarAvisoPdf(false)}
                    className="text-yellow-600 hover:text-yellow-800 font-bold ml-2 cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              )}
              {acordesInvalidos.length > 0 && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-start gap-2 animate-fade-in">
                  <span className="mt-0.5 font-bold">⚠️</span>
                  <div>
                    <strong>Aviso:</strong> Acorde(s) com grafia possivelmente incorreta detectado(s):{" "}
                    <span className="font-mono font-bold bg-red-100 px-1 py-0.5 rounded text-red-700">
                      {acordesInvalidos.join(", ")}
                    </span>.
                    <p className="mt-1 text-gray-500">
                      Certifique-se de usar a notação padrão (A-G), ex: [C#m] em vez de [C# menor], ou [Bm] em vez de [Bmenor].
                    </p>
                  </div>
                </div>
              )}

              <InteractiveCifraEditor
                value={formData.letraCifra}
                onChange={(newVal) => {
                  setFormData(prev => ({ ...prev, letraCifra: newVal }));
                  setSujo(true);
                }}
                tom={formData.tom}
                textareaRef={textareaRef}
                extraHeaderActions={
                  <>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePdfUpload} 
                      accept=".pdf" 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                      className="bg-primary-50 hover:bg-primary-100 text-primary-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border border-primary-200 cursor-pointer"
                    >
                      <Upload size={13} />
                      <span>{importing ? "Lendo..." : "Importar PDF"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={inserirColchetes}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Inserir <span className="font-mono font-bold">[ ]</span>
                    </button>
                  </>
                }
              />
            </div>

            <div className="md:col-span-2">
              <TablaturaEditor secoes={tablaturas} onChange={handleTablaturasChange} tom={tomTravado || formData.tom} />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            {modoNovaVersao ? (
              <button
                type="button"
                onClick={salvarComoNovaVersao}
                disabled={criandoVersao || videoReferenciaInvalida}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                <span>{criandoVersao ? "Salvando..." : "Salvar como Nova Versão"}</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving || videoReferenciaInvalida || videoReferenciaPadraoInvalida}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
              </button>
            )}
          </div>
        </form>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <h2 className="font-serif text-lg font-bold text-gray-900">Pré-visualização da Cifra</h2>
          <div className="bg-white p-6 rounded-xl border border-[#e4ded0] shadow-sm space-y-4 sticky top-6">
            <div>
              <h3 className="font-serif text-2xl font-bold text-gray-900">{formData.titulo || "Título da Música"}</h3>
              {formData.artista && <p className="text-gray-600 text-sm">{formData.artista}</p>}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {formData.categoria && (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">{formData.categoria}</span>
              )}
              {formData.tempo && (
                <span className={`px-2 py-1 rounded font-medium inline-flex items-center gap-1.5 ${obterEstiloTempoLiturgico(formData.tempo).badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${obterEstiloTempoLiturgico(formData.tempo).dot}`} />
                  {formData.tempo}
                </span>
              )}
              {formData.tom && (
                <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded font-mono font-bold">Tom: {tomPreviewAtual}</span>
              )}
            </div>

            {formData.tom && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#e4ded0]">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewSemitons(s => s - 1)}
                    title="Abaixar meio tom"
                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>

                  {opcoesTomPreview.length > 0 ? (
                    <select
                      value={previewSemitons}
                      onChange={(e) => setPreviewSemitons(Number(e.target.value))}
                      className="bg-gray-50 border border-gray-300 rounded-md font-mono font-bold text-xs py-1 px-1.5 outline-none cursor-pointer"
                    >
                      {opcoesTomPreview.map((opt) => (
                        <option key={opt.semitons} value={opt.semitons}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-mono font-bold text-gray-700 px-1.5">{tomPreviewAtual}</span>
                  )}

                  <button
                    type="button"
                    onClick={() => setPreviewSemitons(s => s + 1)}
                    title="Subir meio tom"
                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>

                  {previewSemitons !== 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewSemitons(0)}
                      title="Voltar para o Tom Original"
                      className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                </div>

                {podeSalvarVersaoTransposta && (
                  <button
                    type="button"
                    onClick={salvarComoVersaoTransposta}
                    disabled={sujo || previewSemitons === 0 || salvandoVersaoTransposta || videoReferenciaInvalida}
                    title={
                      sujo
                        ? "Salve as alterações pendentes antes"
                        : previewSemitons === 0
                          ? "Transponha o preview pra um Tom diferente antes de salvar"
                          : videoReferenciaInvalida
                            ? "Corrija o link de Vídeo de Referência antes de salvar"
                            : "Salvar o resultado transposto como uma nova Versão"
                    }
                    className="shrink-0 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={13} />
                    {salvandoVersaoTransposta ? "Salvando..." : "Salvar Tom Transposto como Nova Versão"}
                  </button>
                )}
              </div>
            )}
            {podeSalvarVersaoTransposta && sujo && (
              <p className="text-[10px] text-amber-700 -mt-2">Salve as alterações pendentes antes de salvar como nova Versão.</p>
            )}

            <div className="mt-4 p-4 bg-gray-50 rounded border border-[#e4ded0] overflow-x-auto">
              <CifraRenderer texto={formData.letraCifra || "Nenhuma cifra inserida."} semitons={previewSemitons} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
