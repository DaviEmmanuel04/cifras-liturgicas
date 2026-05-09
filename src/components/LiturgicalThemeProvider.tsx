"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getLiturgicalDay } from "@/app/actions";

type LiturgicalColor = 'green' | 'violet' | 'red' | 'white' | 'rose' | 'black' | 'blue';

const LiturgicalThemeContext = createContext<{ color: LiturgicalColor }>({ color: 'blue' });

const colorPalettes: Record<LiturgicalColor, Record<string, string>> = {
  green: {
    '50': '#f0fdf4',
    '100': '#dcfce7',
    '200': '#bbf7d0',
    '300': '#86efac',
    '400': '#4ade80',
    '500': '#22c55e',
    '600': '#16a34a',
    '700': '#15803d',
    '800': '#166534',
    '900': '#14532d',
  },
  violet: {
    '50': '#faf5ff',
    '100': '#f3e8ff',
    '200': '#e9d5ff',
    '300': '#d8b4fe',
    '400': '#c084fc',
    '500': '#a855f7',
    '600': '#9333ea',
    '700': '#7e22ce',
    '800': '#6b21a8',
    '900': '#581c87',
  },
  red: {
    '50': '#fef2f2',
    '100': '#fee2e2',
    '200': '#fecaca',
    '300': '#fca5a5',
    '400': '#f87171',
    '500': '#ef4444',
    '600': '#dc2626',
    '700': '#b91c1c',
    '800': '#991b1b',
    '900': '#7f1d1d',
  },
  white: { // Dourado
    '50': '#fefce8',
    '100': '#fef9c3',
    '200': '#fef08a',
    '300': '#fde047',
    '400': '#facc15',
    '500': '#eab308',
    '600': '#ca8a04',
    '700': '#a16207',
    '800': '#854d0e',
    '900': '#713f12',
  },
  rose: {
    '50': '#fff1f2',
    '100': '#ffe4e6',
    '200': '#fecdd3',
    '300': '#fda4af',
    '400': '#fb7185',
    '500': '#f43f5e',
    '600': '#e11d48',
    '700': '#be123c',
    '800': '#9f1239',
    '900': '#881337',
  },
  black: {
    '50': '#f6f6f6',
    '100': '#e7e7e7',
    '200': '#d1d1d1',
    '300': '#b0b0b0',
    '400': '#888888',
    '500': '#6d6d6d',
    '600': '#5d5d5d',
    '700': '#4f4f4f',
    '800': '#454545',
    '900': '#3d3d3d',
  },
  blue: { // Fallback e padrão atual
    '50': '#eff6ff',
    '100': '#dbeafe',
    '200': '#bfdbfe',
    '300': '#93c5fd',
    '400': '#60a5fa',
    '500': '#3b82f6',
    '600': '#2563eb',
    '700': '#1d4ed8',
    '800': '#1e40af',
    '900': '#1e3a8a',
  }
};

export function LiturgicalThemeProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState<LiturgicalColor>('blue');
  
  useEffect(() => {
    async function fetchColor() {
      try {
        const data = await getLiturgicalDay();
        let apiColor = data?.celebrations?.[0]?.colour || 'green';
        
        if (!colorPalettes[apiColor as LiturgicalColor]) {
          apiColor = 'green'; // Fallback se a API retornar algo estranho
        }
        
        setColor(apiColor as LiturgicalColor);
        applyPalette(apiColor as LiturgicalColor);
      } catch (e) {
        console.error("Erro ao buscar cor litúrgica, mantendo o padrão.", e);
        applyPalette('blue');
      }
    }
    
    // Set default initially
    applyPalette('blue');
    fetchColor();
  }, []);

  const applyPalette = (colorKey: LiturgicalColor) => {
    const root = document.documentElement;
    const palette = colorPalettes[colorKey];
    Object.entries(palette).forEach(([shade, hex]) => {
      root.style.setProperty(`--primary-${shade}`, hex);
    });
  };

  return (
    <LiturgicalThemeContext.Provider value={{ color }}>
      {children}
    </LiturgicalThemeContext.Provider>
  );
}

export const useLiturgicalTheme = () => useContext(LiturgicalThemeContext);
