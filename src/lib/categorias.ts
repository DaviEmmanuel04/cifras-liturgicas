"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CATEGORIAS_PADRAO, categoriasDeFirestore } from "@/utils/categorias";

const categoriasRef = () => doc(db, "config", "categorias");

/**
 * Lista ordenada de categorias cadastradas, ao vivo. `onSnapshot` entrega
 * primeiro o que está no cache offline do Firestore (IndexedDB) e depois o
 * servidor, então funciona sem conexão; se o documento nunca foi baixado
 * neste aparelho, cai em CATEGORIAS_PADRAO.
 */
export function useCategorias(): string[] {
  const [categorias, setCategorias] = useState<string[]>([...CATEGORIAS_PADRAO]);

  useEffect(() => {
    const unsub = onSnapshot(
      categoriasRef(),
      (snap) => setCategorias(categoriasDeFirestore(snap.data())),
      (err) => console.error("Erro ao escutar categorias do Firestore:", err),
    );
    return () => unsub();
  }, []);

  return categorias;
}

/**
 * Grava a lista. Offline, a escrita entra na fila do Firestore e já aparece
 * no cache local (e em useCategorias) na hora; a promise só resolve quando o
 * servidor confirma, por isso quem chama não deve bloquear a interface nela.
 */
export function salvarCategorias(lista: string[]): Promise<void> {
  return setDoc(categoriasRef(), { lista });
}
