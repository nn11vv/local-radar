export type EstadoContacto =
  | "sin_contactar"
  | "contactado"
  | "en_negociacion"
  | "cerrado"
  | "descartado";

export interface Lead {
  id: string;
  place_id: string;
  nombre: string;
  direccion: string;
  telefono: string | null;
  website: string | null;
  fotos_count: number;
  resenas_count: number;
  rating: number | null;
  tiene_horarios: boolean;
  categoria: string;
  zona: string;
  lat: number | null;
  lng: number | null;
  score: number;
  estado_contacto: EstadoContacto;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadUpdate {
  estado_contacto?: EstadoContacto;
  notas?: string;
}

export interface Stats {
  total_leads: number;
  score_promedio: number;
  por_categoria: Record<string, number>;
  por_estado: Record<string, number>;
  por_zona: Record<string, number>;
  top_leads: Lead[];
}

export interface PaginatedLeads {
  total: number;
  page: number;
  page_size: number;
  results: Lead[];
}

export interface LeadFilters {
  categoria?: string;
  zona?: string;
  estado?: string;
  score_min?: number;
  page?: number;
  page_size?: number;
}

export interface ScraperProgress {
  categoria_actual: string | null;
  procesados: number;
  total_estimado: number;
}

export interface ScraperStatus {
  status: "idle" | "running" | "completed" | "error";
  progress: ScraperProgress;
  started_at: string | null;
  finished_at: string | null;
  leads_nuevos: number;
}
