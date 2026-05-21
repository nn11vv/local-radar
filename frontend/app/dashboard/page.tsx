"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getStats, startScraper, getScraperStatus } from "@/lib/api";
import type { Stats, ScraperStatus } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreBadge } from "@/components/score-badge";
import { EstadoBadge } from "@/components/estado-badge";
import { RadarAnimation } from "@/components/RadarAnimation";
import { C } from "@/lib/colors";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Users, TrendingUp, Phone, CheckCircle, Scan } from "lucide-react";
import Link from "next/link";

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

const PIE_COLORS = [C.neonGreen, C.neonCyan, "#eab308", C.neonMagenta, "#a855f7"];

function GradientText({ children, gradient = C.gradientPrimary }: { children: React.ReactNode; gradient?: string }) {
  return (
    <span
      style={{
        background: gradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient?: string;
  suffix?: string;
}

function MetricCard({ title, value, icon, gradient = C.gradientPrimary, suffix = "" }: MetricCardProps) {
  const animated = useCountUp(value);
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3 transition-all duration-300 hover:translate-y-[-2px]"
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        boxShadow: `0 0 0 1px ${C.border}`,
      }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ background: `${C.neonGreen}18`, color: C.neonGreen }}
      >
        {icon}
      </div>
      <div>
        <div className="text-4xl font-bold leading-none">
          <GradientText gradient={gradient}>
            {animated}{suffix}
          </GradientText>
        </div>
        <div className="mt-1.5 text-sm" style={{ color: C.textMuted }}>
          {title}
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{value: number}>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-sm"
      style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
    >
      <div style={{ color: C.textMuted }}>{label}</div>
      <div className="font-bold" style={{ color: C.neonGreen }}>{payload[0].value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannerStatus, setScannerStatus] = useState<ScraperStatus | null>(null);
  const [showRadar, setShowRadar] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStats = useCallback(() => {
    getStats()
      .then(setStats)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const s = await getScraperStatus();
        setScannerStatus(s);
        if (s.status === "completed") {
          stopPolling();
          setShowRadar(false);
          toast.success(`Escaneo completado — ${s.leads_nuevos} leads nuevos encontrados`);
          loadStats();
        } else if (s.status === "error") {
          stopPolling();
          setShowRadar(false);
          toast.error("Error durante el escaneo");
        }
      } catch {
        stopPolling();
      }
    }, 2000);
  }

  useEffect(() => {
    return () => stopPolling();
  }, []);

  async function handleScan() {
    try {
      const res = await startScraper();
      if (res.status === "already_running") {
        toast.info("El scraper ya está corriendo");
        setShowRadar(true);
        startPolling();
        return;
      }
      setShowRadar(true);
      setScannerStatus(null);
      startPolling();
    } catch {
      toast.error("Error al iniciar el escaneo");
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-16" style={{ color: C.neonMagenta }}>
        {error} — ¿El backend está corriendo en localhost:8000?
      </div>
    );
  }

  const categoriaData = stats
    ? Object.entries(stats.por_categoria)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    : [];

  const estadoData = stats
    ? Object.entries(stats.por_estado).map(([name, value]) => ({
        name: name.replace(/_/g, " "),
        value,
      }))
    : [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">

      {/* Radar overlay */}
      {showRadar && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
          style={{ background: `${C.bg}ee`, backdropFilter: "blur(4px)" }}
        >
          <RadarAnimation
            categoriaActual={scannerStatus?.progress.categoria_actual ?? null}
            procesados={scannerStatus?.progress.procesados ?? 0}
            totalEstimado={scannerStatus?.progress.total_estimado ?? 300}
          />
          <p className="text-sm" style={{ color: C.textMuted }}>
            No cierres esta ventana mientras el escaneo está en progreso
          </p>
        </div>
      )}

      {/* Hero */}
      <div className="rounded-2xl p-8 text-center space-y-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <h1 className="text-5xl font-bold tracking-tight">
          <GradientText gradient={C.gradientPrimary}>Local Radar</GradientText>
        </h1>
        <p className="text-base" style={{ color: C.textMuted }}>
          Escaneando San Juan Playa · Alicante
        </p>
        <button
          onClick={handleScan}
          className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: C.gradientSecondary,
            color: "#ffffff",
            boxShadow: C.glowOrange,
          }}
        >
          <Scan className="h-5 w-5" />
          Iniciar Escaneo
        </button>
      </div>

      {/* Metric cards */}
      {!stats ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
              <Skeleton className="mb-2 h-9 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard
            title="Total leads"
            value={stats.total_leads}
            icon={<Users className="h-5 w-5" />}
            gradient={C.gradientPrimary}
          />
          <MetricCard
            title="Score promedio"
            value={parseFloat(stats.score_promedio.toFixed(1))}
            icon={<TrendingUp className="h-5 w-5" />}
            gradient={`linear-gradient(135deg, ${C.neonCyan}, #a855f7)`}
          />
          <MetricCard
            title="Sin contactar"
            value={stats.por_estado["sin_contactar"] ?? 0}
            icon={<Phone className="h-5 w-5" />}
            gradient={C.gradientSecondary}
          />
          <MetricCard
            title="Cerrados"
            value={stats.por_estado["cerrado"] ?? 0}
            icon={<CheckCircle className="h-5 w-5" />}
            gradient={`linear-gradient(135deg, ${C.neonGreen}, #22c55e)`}
          />
        </div>
      )}

      {/* Charts */}
      {!stats ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <Skeleton className="mb-4 h-6 w-40" />
              <Skeleton className="h-64 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <h2 className="mb-4 text-base font-semibold" style={{ color: C.text }}>Leads por categoría</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoriaData} margin={{ top: 0, right: 0, left: -20, bottom: 60 }}>
                <XAxis
                  dataKey="name"
                  angle={-35}
                  textAnchor="end"
                  tick={{ fontSize: 11, fill: C.textMuted }}
                  interval={0}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.textMuted }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {categoriaData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={`url(#bar-gradient-${i})`}
                    />
                  ))}
                  <defs>
                    {categoriaData.map((_, i) => (
                      <linearGradient key={i} id={`bar-gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.neonGreen} />
                        <stop offset="100%" stopColor={C.neonCyan} />
                      </linearGradient>
                    ))}
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <h2 className="mb-4 text-base font-semibold" style={{ color: C.text }}>Estado de contacto</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={estadoData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={85}
                  innerRadius={40}
                >
                  {estadoData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: C.textMuted, fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top 5 leads */}
      {stats && (
        <div className="rounded-xl p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <h2 className="mb-5 text-base font-semibold" style={{ color: C.text }}>Top 5 leads por score</h2>
          <div className="space-y-3">
            {stats.top_leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center gap-4 rounded-xl p-4 transition-all duration-200 hover:translate-x-1"
                style={{
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${C.neonGreen}55`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px ${C.neonGreen}22`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = C.border;
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{lead.nombre}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>{lead.categoria}</p>
                </div>
                <ScoreBadge score={lead.score} />
                <EstadoBadge estado={lead.estado_contacto} />
                <Link
                  href="/dashboard/leads"
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: C.neonGreen, border: `1px solid ${C.neonGreen}44`, background: `${C.neonGreen}0f` }}
                >
                  Ver
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
