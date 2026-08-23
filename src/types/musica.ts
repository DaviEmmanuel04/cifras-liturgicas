import type { SecaoTablatura } from "@/types/tablatura";

export type Musica = {
  id: string;
  titulo: string;
  artista?: string;
  categoria: string;
  tempo: string;
  tom: string;
  letraCifra: string;
  tablaturas?: SecaoTablatura[];
  criadoPor?: string;
  criadoEm?: string;
  modificadoPor?: string;
  modificadoEm?: string;
};
