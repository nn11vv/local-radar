import type { EstadoContacto } from "@/lib/types";

const LABELS: Record<EstadoContacto, string> = {
  sin_contactar: "Sin contactar",
  contactado: "Contactado",
  en_negociacion: "En negociación",
  cerrado: "Cerrado",
  descartado: "Descartado",
};

const COLORS: Record<EstadoContacto, string> = {
  sin_contactar: "#8888aa",
  contactado: "#00d4ff",
  en_negociacion: "#eab308",
  cerrado: "#00ff88",
  descartado: "#ff0099",
};

interface Props {
  estado: EstadoContacto;
}

export function EstadoBadge({ estado }: Props) {
  const color = COLORS[estado] ?? "#8888aa";
  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        border: `1px solid ${color}55`,
        background: `${color}18`,
        color,
      }}
    >
      {LABELS[estado] ?? estado}
    </span>
  );
}
