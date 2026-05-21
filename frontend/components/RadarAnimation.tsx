"use client";

import { useEffect, useRef } from "react";

interface Props {
  categoriaActual: string | null;
  procesados: number;
  totalEstimado: number;
}

interface Blip {
  x: number;
  y: number;
  opacity: number;
  radius: number;
}

export function RadarAnimation({ categoriaActual, procesados, totalEstimado }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const blipsRef = useRef<Blip[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SIZE = canvas.width;
    const CX = SIZE / 2;
    const CY = SIZE / 2;
    const R = SIZE / 2 - 8;

    function addBlip() {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * R * 0.9;
      blipsRef.current.push({
        x: CX + Math.cos(angle) * dist,
        y: CY + Math.sin(angle) * dist,
        opacity: 1,
        radius: 2 + Math.random() * 3,
      });
      if (blipsRef.current.length > 40) blipsRef.current.shift();
    }

    let frame = 0;

    function draw() {
      ctx!.clearRect(0, 0, SIZE, SIZE);

      // clip to circle
      ctx!.save();
      ctx!.beginPath();
      ctx!.arc(CX, CY, R, 0, Math.PI * 2);
      ctx!.clip();

      // background
      ctx!.fillStyle = "#080810";
      ctx!.fillRect(0, 0, SIZE, SIZE);

      // concentric circles
      for (let i = 1; i <= 4; i++) {
        ctx!.beginPath();
        ctx!.arc(CX, CY, (R * i) / 4, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(0, 255, 136, ${0.08 + i * 0.03})`;
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      // crosshairs
      ctx!.strokeStyle = "rgba(0, 255, 136, 0.08)";
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(CX - R, CY);
      ctx!.lineTo(CX + R, CY);
      ctx!.moveTo(CX, CY - R);
      ctx!.lineTo(CX, CY + R);
      ctx!.stroke();

      const angle = angleRef.current;
      // sweep sector (fan shape trailing behind line)
      ctx!.beginPath();
      ctx!.moveTo(CX, CY);
      const TRAIL = Math.PI * 0.5;
      ctx!.arc(CX, CY, R, angle - TRAIL, angle, false);
      ctx!.closePath();
      const sectorGrad = ctx!.createRadialGradient(CX, CY, 0, CX, CY, R);
      sectorGrad.addColorStop(0, "rgba(0, 255, 136, 0.05)");
      sectorGrad.addColorStop(1, "rgba(0, 255, 136, 0.0)");
      ctx!.fillStyle = sectorGrad;
      ctx!.fill();

      // sweep line
      ctx!.beginPath();
      ctx!.moveTo(CX, CY);
      ctx!.lineTo(CX + Math.cos(angle) * R, CY + Math.sin(angle) * R);
      ctx!.strokeStyle = "rgba(0, 255, 136, 0.9)";
      ctx!.lineWidth = 2;
      ctx!.shadowBlur = 8;
      ctx!.shadowColor = "#00ff88";
      ctx!.stroke();
      ctx!.shadowBlur = 0;

      // blips
      blipsRef.current = blipsRef.current.map((b) => ({ ...b, opacity: b.opacity - 0.008 }))
        .filter((b) => b.opacity > 0);

      for (const b of blipsRef.current) {
        ctx!.beginPath();
        ctx!.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(0, 255, 136, ${b.opacity})`;
        ctx!.shadowBlur = 6;
        ctx!.shadowColor = "#00ff88";
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      ctx!.restore();

      // outer ring
      ctx!.beginPath();
      ctx!.arc(CX, CY, R, 0, Math.PI * 2);
      ctx!.strokeStyle = "rgba(0, 255, 136, 0.3)";
      ctx!.lineWidth = 1.5;
      ctx!.stroke();

      // advance
      angleRef.current = (angleRef.current + 0.04) % (Math.PI * 2);
      frame++;
      if (frame % 8 === 0) addBlip();

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const pct = totalEstimado > 0 ? Math.round((procesados / totalEstimado) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <canvas
        ref={canvasRef}
        width={280}
        height={280}
        style={{ borderRadius: "50%" }}
      />
      <div className="text-center space-y-1">
        {categoriaActual && (
          <p className="text-sm font-medium" style={{ color: "#00ff88" }}>
            Escaneando {categoriaActual}...
          </p>
        )}
        <p className="text-xs" style={{ color: "#8888aa" }}>
          {procesados} procesados
          {totalEstimado > 0 && ` · ${pct}%`}
        </p>
      </div>
    </div>
  );
}
