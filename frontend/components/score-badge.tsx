import { C } from "@/lib/colors";

interface Props {
  score: number;
}

export function ScoreBadge({ score }: Props) {
  let color: string;
  let glow: string;

  if (score >= 6) {
    color = C.neonGreen;
    glow = `0 0 8px ${C.neonGreen}66`;
  } else if (score >= 3) {
    color = "#eab308";
    glow = "0 0 8px rgba(234,179,8,0.4)";
  } else {
    color = C.textMuted;
    glow = "none";
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold"
      style={{
        border: `1px solid ${color}55`,
        background: `${color}18`,
        color,
        boxShadow: glow,
      }}
    >
      {score}
    </span>
  );
}
