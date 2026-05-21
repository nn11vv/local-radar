"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateLead } from "@/lib/api";
import type { Lead, EstadoContacto } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreBadge } from "@/components/score-badge";
import { C } from "@/lib/colors";

const ESTADOS: { value: EstadoContacto; label: string }[] = [
  { value: "sin_contactar", label: "Sin contactar" },
  { value: "contactado", label: "Contactado" },
  { value: "en_negociacion", label: "En negociación" },
  { value: "cerrado", label: "Cerrado" },
  { value: "descartado", label: "Descartado" },
];

interface Props {
  lead: Lead | null;
  onClose: () => void;
  onSaved: (lead: Lead) => void;
}

export function LeadModal({ lead, onClose, onSaved }: Props) {
  const [estado, setEstado] = useState<EstadoContacto>("sin_contactar");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setEstado(lead.estado_contacto);
      setNotas(lead.notas ?? "");
    }
  }, [lead]);

  async function handleSave() {
    if (!lead) return;
    setSaving(true);
    try {
      const updated = await updateLead(lead.id, { estado_contacto: estado, notas });
      toast.success("Lead guardado correctamente");
      onSaved(updated);
    } catch {
      toast.error("Error al guardar el lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-lg"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-lg font-bold"
            style={{
              background: C.gradientPrimary,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {lead?.nombre}
          </DialogTitle>
        </DialogHeader>

        {lead && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span style={{ color: C.textMuted }}>Categoría</span>
              <span>{lead.categoria}</span>

              <span style={{ color: C.textMuted }}>Zona</span>
              <span>{lead.zona}</span>

              <span style={{ color: C.textMuted }}>Dirección</span>
              <span className="text-sm">{lead.direccion}</span>

              {lead.telefono && (
                <>
                  <span style={{ color: C.textMuted }}>Teléfono</span>
                  <a href={`tel:${lead.telefono}`} style={{ color: C.neonCyan }} className="hover:underline">
                    {lead.telefono}
                  </a>
                </>
              )}

              {lead.website && (
                <>
                  <span style={{ color: C.textMuted }}>Website</span>
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: C.neonCyan }}
                    className="hover:underline truncate"
                  >
                    {lead.website}
                  </a>
                </>
              )}

              <span style={{ color: C.textMuted }}>Score</span>
              <ScoreBadge score={lead.score} />

              <span style={{ color: C.textMuted }}>Rating</span>
              <span>{lead.rating ?? "—"}</span>

              <span style={{ color: C.textMuted }}>Reseñas</span>
              <span>{lead.resenas_count}</span>

              <span style={{ color: C.textMuted }}>Fotos</span>
              <span>{lead.fotos_count}</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado de contacto</label>
              <Select value={estado} onValueChange={(v) => setEstado(v as EstadoContacto)}>
                <SelectTrigger
                  style={{ borderColor: C.border, background: `${C.bg}` }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas sobre este lead..."
                rows={3}
                style={{
                  borderColor: C.border,
                  background: C.bg,
                  color: C.text,
                }}
                className="focus:ring-1 focus:ring-[#00ff88] focus:border-[#00ff88]"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} style={{ borderColor: C.border }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: C.gradientPrimary,
              color: C.bg,
              border: "none",
              fontWeight: 700,
            }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
