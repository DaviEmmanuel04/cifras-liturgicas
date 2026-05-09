"use server";

export async function getLiturgicalDay() {
  try {
    // Fazemos a requisição HTTP no lado do servidor (Next.js Node)
    // Assim não há bloqueio de "Mixed Content" pelo navegador do usuário
    const res = await fetch("http://calapi.inadiutorium.cz/api/v0/en/calendars/default/today", {
      // Revalida a cada 1 hora para economizar recursos e acelerar a resposta
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) {
      throw new Error(`Erro na API: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Falha no fetch do servidor para o calapi:", error);
    return null;
  }
}
