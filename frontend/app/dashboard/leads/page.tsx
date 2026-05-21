"use client";

import { useEffect, useState, useCallback } from "react";
import { getLeads, getStats, exportCsvUrl } from "@/lib/api";
import type { Lead, PaginatedLeads, LeadFilters, EstadoContacto } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreBadge } from "@/components/score-badge";
import { EstadoBadge } from "@/components/estado-badge";
import { LeadModal } from "@/components/lead-modal";
import { Download, X } from "lucide-react";
import { C } from "@/lib/colors";

const ESTADOS: { value: EstadoContacto; label: string }[] = [
  { value: "sin_contactar", label: "Sin contactar" },
  { value: "contactado", label: "Contactado" },
  { value: "en_negociacion", label: "En negociación" },
  { value: "cerrado", label: "Cerrado" },
  { value: "descartado", label: "Descartado" },
];

const PAGE_SIZE = 20;

function safeHostname(url: string): string {
  try {
    const u = url.startsWith("http") ? url : `https://${url}`;
    return new URL(u).hostname;
  } catch {
    return url;
  }
}

export default function LeadsPage() {
  const [data, setData] = useState<PaginatedLeads | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");
  const [scoreMin, setScoreMin] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [categorias, setCategorias] = useState<string[]>([]);

  useEffect(() => {
    getStats()
      .then((s) => setCategorias(Object.keys(s.por_categoria).sort()))
      .catch(() => {});
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const filters: LeadFilters = {
        page,
        page_size: PAGE_SIZE,
        ...(categoria && { categoria }),
        ...(estado && { estado }),
        ...(scoreMin && { score_min: parseInt(scoreMin) }),
      };
      setData(await getLeads(filters));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, categoria, estado, scoreMin]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  function clearFilters() {
    setCategoria("");
    setEstado("");
    setScoreMin("");
    setPage(1);
  }

  function handleLeadSaved(updated: Lead) {
    setData((prev) =>
      prev
        ? { ...prev, results: prev.results.map((l) => (l.id === updated.id ? updated : l)) }
        : prev
    );
    setSelectedLead(null);
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const csvUrl = exportCsvUrl({
    ...(categoria && { categoria }),
    ...(estado && { estado }),
    ...(scoreMin && { score_min: parseInt(scoreMin) }),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-bold"
          style={{
            background: C.gradientPrimary,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Leads
        </h1>
        <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
          Base de datos de prospectos comerciales
        </p>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap items-center gap-3 rounded-xl p-4"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <Select
          value={categoria || "__all__"}
          onValueChange={(v) => {
            setCategoria((v ?? "") === "__all__" ? "" : (v ?? ""));
            setPage(1);
          }}
        >
          <SelectTrigger
            className="w-48"
            style={{ borderColor: C.border, background: C.bg }}
          >
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <SelectItem value="__all__">Todas las categorías</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={estado || "__all__"}
          onValueChange={(v) => {
            setEstado((v ?? "") === "__all__" ? "" : (v ?? ""));
            setPage(1);
          }}
        >
          <SelectTrigger
            className="w-44"
            style={{ borderColor: C.border, background: C.bg }}
          >
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <SelectItem value="__all__">Todos los estados</SelectItem>
            {ESTADOS.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Score mín."
          value={scoreMin}
          onChange={(e) => {
            setScoreMin(e.target.value);
            setPage(1);
          }}
          className="w-32"
          min={0}
          max={10}
          style={{ borderColor: C.border, background: C.bg, color: C.text }}
        />

        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          style={{ borderColor: C.border, color: C.textMuted }}
        >
          <X className="mr-1 h-4 w-4" />
          Limpiar
        </Button>

        <a href={csvUrl} download>
          <Button
            variant="outline"
            size="sm"
            style={{ borderColor: `${C.neonGreen}55`, color: C.neonGreen, background: `${C.neonGreen}0f` }}
          >
            <Download className="mr-1 h-4 w-4" />
            Exportar CSV
          </Button>
        </a>

        {data && (
          <span className="ml-auto text-sm" style={{ color: C.textMuted }}>
            {data.total} leads
          </span>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Nombre", "Categoría", "Dirección", "Teléfono", "Website", "Score", "Estado", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: C.textMuted }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.results.map((lead) => (
                  <tr
                    key={lead.id}
                    className="transition-all duration-150"
                    style={{ borderBottom: `1px solid ${C.border}44` }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${C.neonGreen}08`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <td className="px-4 py-3 font-semibold">{lead.nombre}</td>
                    <td className="px-4 py-3" style={{ color: C.textMuted }}>{lead.categoria}</td>
                    <td className="max-w-[160px] truncate px-4 py-3" style={{ color: C.textMuted }}>
                      {lead.direccion}
                    </td>
                    <td className="px-4 py-3">
                      {lead.telefono ? (
                        <a href={`tel:${lead.telefono}`} style={{ color: C.neonCyan }} className="hover:underline">
                          {lead.telefono}
                        </a>
                      ) : (
                        <span style={{ color: C.textMuted }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: C.neonCyan }}
                          className="hover:underline"
                        >
                          {safeHostname(lead.website)}
                        </a>
                      ) : (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                          style={{ color: C.textMuted, border: `1px solid ${C.border}`, background: `${C.border}66` }}
                        >
                          Sin web
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={lead.score} />
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={lead.estado_contacto} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                        style={{
                          color: C.neonGreen,
                          border: `1px solid ${C.neonGreen}33`,
                          background: `${C.neonGreen}0a`,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = `${C.neonGreen}20`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = `${C.neonGreen}0a`;
                        }}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data?.results.length === 0 && (
              <div className="p-10 text-center" style={{ color: C.textMuted }}>
                No hay leads con estos filtros
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-40"
            style={{
              border: `1px solid ${C.border}`,
              color: C.text,
              background: C.card,
            }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span className="text-sm" style={{ color: C.textMuted }}>
            {page} / {totalPages}
          </span>
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-40"
            style={{
              border: `1px solid ${C.border}`,
              color: C.text,
              background: C.card,
            }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Siguiente
          </button>
        </div>
      )}

      <LeadModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onSaved={handleLeadSaved}
      />
    </div>
  );
}
