"use client";

import { useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { getLeads } from "@/lib/api";
import type { Lead, LeadFilters } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LeadModal } from "@/components/lead-modal";
import { X } from "lucide-react";
import { C } from "@/lib/colors";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const CENTER = { lat: 38.3956, lng: -0.4189 };

function markerColor(score: number): string {
  if (score >= 6) return C.neonGreen;
  if (score >= 3) return "#eab308";
  return C.textMuted;
}

function markerGlow(score: number): string {
  if (score >= 6) return `0 0 8px ${C.neonGreen}99`;
  if (score >= 3) return "0 0 8px rgba(234,179,8,0.6)";
  return "none";
}

export default function MapaPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [categoria, setCategoria] = useState("");
  const [scoreMin, setScoreMin] = useState("");

  useEffect(() => {
    const filters: LeadFilters = {
      page_size: 500,
      ...(categoria && { categoria }),
      ...(scoreMin && { score_min: parseInt(scoreMin) }),
    };
    getLeads(filters)
      .then((d) => setLeads(d.results))
      .catch(() => {});
  }, [categoria, scoreMin]);

  function handleLeadSaved(updated: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setEditLead(null);
    setSelected(updated);
  }

  const withCoords = leads.filter((l) => l.lat !== null && l.lng !== null);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Filters bar */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          borderBottom: `1px solid ${C.border}`,
          background: C.card,
        }}
      >
        <Input
          placeholder="Filtrar por categoría"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-48"
          style={{ borderColor: C.border, background: C.bg, color: C.text }}
        />
        <Input
          type="number"
          placeholder="Score mínimo"
          value={scoreMin}
          onChange={(e) => setScoreMin(e.target.value)}
          className="w-36"
          min={0}
          max={10}
          style={{ borderColor: C.border, background: C.bg, color: C.text }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCategoria("");
            setScoreMin("");
          }}
          style={{ borderColor: C.border, color: C.textMuted }}
        >
          <X className="mr-1 h-4 w-4" />
          Limpiar
        </Button>
        <span className="ml-auto text-sm" style={{ color: C.textMuted }}>
          {withCoords.length} leads en mapa
        </span>
      </div>

      {/* Map area */}
      {!API_KEY ? (
        <div className="flex flex-1 items-center justify-center" style={{ color: C.textMuted }}>
          Configura{" "}
          <code
            className="mx-1 rounded px-1 py-0.5 text-xs"
            style={{ background: C.card, color: C.neonGreen }}
          >
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          </code>{" "}
          en{" "}
          <code
            className="ml-1 rounded px-1 py-0.5 text-xs"
            style={{ background: C.card, color: C.neonGreen }}
          >
            .env.local
          </code>{" "}
          para ver el mapa
        </div>
      ) : (
        <APIProvider apiKey={API_KEY}>
          <Map
            defaultCenter={CENTER}
            defaultZoom={13}
            mapId="local-radar-map"
            style={{ flex: 1 }}
          >
            {withCoords.map((lead) => (
              <AdvancedMarker
                key={lead.id}
                position={{ lat: lead.lat!, lng: lead.lng! }}
                onClick={() => setSelected(lead)}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: markerColor(lead.score),
                    border: `2px solid ${C.bg}`,
                    boxShadow: markerGlow(lead.score),
                    cursor: "pointer",
                  }}
                />
              </AdvancedMarker>
            ))}

            {selected && selected.lat && selected.lng && (
              <InfoWindow
                position={{ lat: selected.lat, lng: selected.lng }}
                onCloseClick={() => setSelected(null)}
              >
                <div
                  className="min-w-[200px] space-y-1.5 text-sm"
                  style={{ background: C.card, color: C.text, padding: "4px" }}
                >
                  <div className="font-bold" style={{ color: C.text }}>{selected.nombre}</div>
                  <div style={{ color: C.textMuted }}>{selected.categoria}</div>
                  {selected.telefono && (
                    <div>
                      <a href={`tel:${selected.telefono}`} style={{ color: C.neonCyan }}>
                        {selected.telefono}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: C.textMuted }}>Score:</span>
                    <span
                      className="font-bold text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        color: markerColor(selected.score),
                        border: `1px solid ${markerColor(selected.score)}55`,
                        background: `${markerColor(selected.score)}18`,
                      }}
                    >
                      {selected.score}
                    </span>
                  </div>
                  <div style={{ color: C.textMuted }}>
                    {selected.estado_contacto.replace(/_/g, " ")}
                  </div>
                  <button
                    onClick={() => setEditLead(selected)}
                    className="mt-2 w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      background: C.gradientPrimary,
                      color: C.bg,
                      border: "none",
                    }}
                  >
                    Editar lead
                  </button>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      )}

      <LeadModal lead={editLead} onClose={() => setEditLead(null)} onSaved={handleLeadSaved} />
    </div>
  );
}
