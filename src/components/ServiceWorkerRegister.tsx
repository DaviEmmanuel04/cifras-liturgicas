"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Só registra em produção: em dev, o SW cacheia respostas de
    // `/_next/static/` (stale-while-revalidate com CACHE_NAME fixo) e o
    // Next serve conteúdo atualizado no mesmo caminho a cada edição — o SW
    // acaba servindo a versão antiga na primeira carga após uma mudança de
    // código, revalidando só em segundo plano. Isso mascara o estado real
    // do código durante o desenvolvimento (só some com um reload manual).
    if (
      process.env.NODE_ENV === "production" &&
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      // Registra o Service Worker após o carregamento completo da página
      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registrado com sucesso. Escopo:", reg.scope);
          })
          .catch((err) => {
            console.error("Falha ao registrar o Service Worker:", err);
          });
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
        return () => window.removeEventListener("load", registerSW);
      }
    }
  }, []);

  return null;
}
