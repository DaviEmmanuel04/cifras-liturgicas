"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getLiturgicalDay } from "@/app/actions";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type LiturgicalColor = 'green' | 'violet' | 'red' | 'white' | 'rose' | 'black' | 'blue';

export type LiturgicalThemeMode = 'auto' | LiturgicalColor;

type LiturgicalContextType = {
  color: LiturgicalColor;
  mode: LiturgicalThemeMode;
  setMode: (mode: LiturgicalThemeMode) => void;
};

const LiturgicalThemeContext = createContext<LiturgicalContextType>({
  color: 'blue',
  mode: 'auto',
  setMode: () => {}
});

const colorPalettes: Record<LiturgicalColor, Record<string, string>> = {
  green: { // Verde Oliva/Floresta Litúrgico
    '50': '#f2f6f1',
    '100': '#e1ebe0',
    '200': '#c4d6c2',
    '300': '#9ebaa0',
    '400': '#739b78',
    '500': '#527e59',
    '600': '#3d6443',
    '700': '#325037',
    '800': '#263e2a',
    '900': '#1e3021',
  },
  violet: { // Violeta/Ameixa Imperial Litúrgico
    '50': '#f8f2fc',
    '100': '#efe1fa',
    '200': '#e0c7f5',
    '300': '#caa0eb',
    '400': '#ac6ede',
    '500': '#8f46c6',
    '600': '#722d9f',
    '700': '#5a217f',
    '800': '#481b65',
    '900': '#35124b',
  },
  red: { // Vermelho Carmesim Litúrgico
    '50': '#fdf2f2',
    '100': '#fbe3e3',
    '200': '#f8cdcd',
    '300': '#f2a7a7',
    '400': '#e77777',
    '500': '#d44c4c',
    '600': '#b02b2b',
    '700': '#901e1e',
    '800': '#731818',
    '900': '#5c1313',
  },
  white: { // Ouro Envelhecido/Champanhe Litúrgico (para Branco)
    '50': '#fbf9f2',
    '100': '#f4eecf',
    '200': '#ebd99f',
    '300': '#dfbe68',
    '400': '#cca03f',
    '500': '#b3832c',
    '600': '#956821',
    '700': '#78511a',
    '800': '#604015',
    '900': '#4c3210',
  },
  rose: { // Rosa Antigo/Dusky Litúrgico
    '50': '#fdf5f6',
    '100': '#fbe6eb',
    '200': '#f6c4cd',
    '300': '#ee9ba9',
    '400': '#e06b80',
    '500': '#cc4a64',
    '600': '#a83149',
    '700': '#8a253a',
    '800': '#6f1e2e',
    '900': '#581724',
  },
  black: { // Preto Carvão Premium
    '50': '#f5f5f5',
    '100': '#e9e9e9',
    '200': '#d4d4d4',
    '300': '#b5b5b5',
    '400': '#8f8f8f',
    '500': '#6c6c6c',
    '600': '#4f4f4f',
    '700': '#3b3b3b',
    '800': '#2b2b2b',
    '900': '#1f1f1f',
  },
  blue: { // Azul Mariano Celestial
    '50': '#f0f5fa',
    '100': '#ddebf5',
    '200': '#c0d9ed',
    '300': '#97bfdd',
    '400': '#659bc8',
    '500': '#467ead',
    '600': '#34628a',
    '700': '#2b5071',
    '800': '#23415c',
    '900': '#1b3247',
  }
};

export function LiturgicalThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<LiturgicalThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("liturgical-theme-mode") as LiturgicalThemeMode | null;
      return saved || 'auto';
    }
    return 'auto';
  });

  const [apiColor, setApiColor] = useState<LiturgicalColor>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("liturgical-theme-api-color") as LiturgicalColor | null;
      return saved || 'green';
    }
    return 'green';
  });

  const [activeColor, setActiveColor] = useState<LiturgicalColor>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("liturgical-theme-active-color") as LiturgicalColor | null;
      return saved || 'green';
    }
    return 'green';
  });

  // Executa uma paleta inicial o mais rápido possível no cliente
  useEffect(() => {
    applyPalette(activeColor);
  }, []);

  // Escuta a configuração do tema global no Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "theme"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.mode) {
          const newMode = data.mode as LiturgicalThemeMode;
          setModeState(newMode);
          localStorage.setItem("liturgical-theme-mode", newMode);
        }
      } else {
        setModeState('auto');
        localStorage.setItem("liturgical-theme-mode", 'auto');
      }
    }, (err) => {
      console.error("Erro ao escutar tema global do Firestore:", err);
      // Fallback local se falhar (ex: sem internet ou permissão antes do login)
      const savedMode = localStorage.getItem("liturgical-theme-mode") as LiturgicalThemeMode | null;
      if (savedMode) {
        setModeState(savedMode);
      }
    });

    return () => unsub();
  }, []);

  // Busca cor da API em background
  useEffect(() => {
    async function fetchColor() {
      try {
        const data = await getLiturgicalDay();
        let color = data?.celebrations?.[0]?.colour || 'green';
        if (color === 'white') color = 'white'; // Sincroniza nomenclatura
        
        if (colorPalettes[color as LiturgicalColor]) {
          const finalApiColor = color as LiturgicalColor;
          setApiColor(finalApiColor);
          localStorage.setItem("liturgical-theme-api-color", finalApiColor);
        } else {
          setApiColor('green');
          localStorage.setItem("liturgical-theme-api-color", 'green');
        }
      } catch (e) {
        console.error("Erro ao buscar tempo litúrgico, fallback para verde.", e);
        setApiColor('green');
      }
    }
    fetchColor();
  }, []);

  // Calcula a cor ativa baseada no modo e na cor da API
  useEffect(() => {
    const finalColor = mode === 'auto' ? apiColor : mode;
    setActiveColor(finalColor);
    localStorage.setItem("liturgical-theme-active-color", finalColor);
    applyPalette(finalColor);
  }, [mode, apiColor]);

  const applyPalette = (colorKey: LiturgicalColor) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const palette = colorPalettes[colorKey] || colorPalettes.blue;
    Object.entries(palette).forEach(([shade, hex]) => {
      root.style.setProperty(`--primary-${shade}`, hex);
    });
  };

  const setMode = async (newMode: LiturgicalThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("liturgical-theme-mode", newMode);
    try {
      await setDoc(doc(db, "config", "theme"), { mode: newMode }, { merge: true });
    } catch (e) {
      console.error("Erro ao salvar tema global no Firestore:", e);
    }
  };

  return (
    <LiturgicalThemeContext.Provider value={{ color: activeColor, mode, setMode }}>
      {children}
    </LiturgicalThemeContext.Provider>
  );
}

export const useLiturgicalTheme = () => useContext(LiturgicalThemeContext);
