import type { Lead, LeadUpdate, Stats, PaginatedLeads, LeadFilters, ScraperStatus } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function buildParams(filters: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(filters)) {
    if (val !== undefined && val !== "" && val !== null) {
      params.set(key, String(val));
    }
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}

export async function getLeads(filters: LeadFilters = {}): Promise<PaginatedLeads> {
  const res = await fetch(
    `${BASE}/api/leads${buildParams(filters as Record<string, string | number | undefined>)}`
  );
  if (!res.ok) throw new Error("Error al cargar leads");
  return res.json();
}

export async function getLead(id: string): Promise<Lead> {
  const res = await fetch(`${BASE}/api/leads/${id}`);
  if (!res.ok) throw new Error("Lead no encontrado");
  return res.json();
}

export async function updateLead(id: string, data: LeadUpdate): Promise<Lead> {
  const res = await fetch(`${BASE}/api/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al guardar cambios");
  return res.json();
}

export async function getStats(): Promise<Stats> {
  const res = await fetch(`${BASE}/api/stats`);
  if (!res.ok) throw new Error("Error al cargar estadísticas");
  return res.json();
}

export function exportCsvUrl(
  filters: Omit<LeadFilters, "page" | "page_size"> = {}
): string {
  return `${BASE}/api/leads/export/csv${buildParams(
    filters as Record<string, string | number | undefined>
  )}`;
}

export async function startScraper(): Promise<{ status: string; job_id?: string }> {
  const res = await fetch(`${BASE}/api/scraper/run`, { method: "POST" });
  if (!res.ok) throw new Error("Error al iniciar el scraper");
  return res.json();
}

export async function getScraperStatus(): Promise<ScraperStatus> {
  const res = await fetch(`${BASE}/api/scraper/status`);
  if (!res.ok) throw new Error("Error al consultar estado del scraper");
  return res.json();
}
