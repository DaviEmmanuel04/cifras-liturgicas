const ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extrai o id de 11 caracteres de um vídeo do YouTube a partir de uma URL em
 * qualquer formato comum (watch, youtu.be, shorts, embed, live — com ou sem
 * `www.`/`m.`), ou do próprio id colado diretamente. `undefined` se o texto
 * não for reconhecível como um vídeo do YouTube. Pura.
 */
export function extrairIdYoutube(entrada: string): string | undefined {
  const texto = entrada.trim();
  if (!texto) return undefined;

  if (ID_REGEX.test(texto)) return texto;

  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return undefined;
  }

  const host = url.hostname.replace(/^(www\.|m\.)/, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return ID_REGEX.test(id) ? id : undefined;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id && ID_REGEX.test(id) ? id : undefined;
    }
    const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }

  return undefined;
}

/** URL canônica de assistir, a partir do id — usada pra popular o campo de edição com um link válido. */
export function urlAssistirYoutube(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** URL de embed, a partir do id — usada pelo player público (Vídeo de Referência). */
export function urlEmbedYoutube(id: string): string {
  return `https://www.youtube.com/embed/${id}`;
}
