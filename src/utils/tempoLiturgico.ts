export function obterEstiloTempoLiturgico(tempo: string): { badge: string; dot: string } {
  switch (tempo) {
    case "Tempo Comum":
      return {
        badge: "bg-green-50/70 border-green-200/60 text-green-800",
        dot: "bg-[#527e59]"
      };
    case "Advento":
    case "Quaresma":
      return {
        badge: "bg-violet-50/70 border-violet-200/60 text-violet-800",
        dot: "bg-[#8f46c6]"
      };
    case "Natal":
    case "Páscoa":
    case "Festa de Santo Antônio":
    case "Festa do Sagrado Coração de Jesus":
      return {
        badge: "bg-amber-50/70 border-amber-200/60 text-amber-800",
        dot: "bg-[#b3832c]"
      };
    default:
      return {
        badge: "bg-gray-50 border-gray-200 text-gray-600",
        dot: "bg-gray-400"
      };
  }
}
