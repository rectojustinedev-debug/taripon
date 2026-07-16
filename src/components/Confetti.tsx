import { useEffect, useMemo, useState } from "react";

const COLORS = [
  "var(--color-primary)",
  "var(--color-primary-glow)",
  "var(--color-accent-gold)",
  "var(--color-success)",
  "var(--color-accent-gold-soft)",
];

type Piece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  drift: number;
  rotate: number;
};

/**
 * A small, dependency-free confetti burst. Mount with `active` true to play
 * once; unmounts itself (calls onDone) after the animation finishes.
 */
export function Confetti({
  active,
  onDone,
  count = 60,
}: {
  active: boolean;
  onDone?: () => void;
  count?: number;
}) {
  const [playing, setPlaying] = useState(active);

  useEffect(() => {
    if (!active) return;
    setPlaying(true);
    const t = setTimeout(() => {
      setPlaying(false);
      onDone?.();
    }, 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const pieces = useMemo<Piece[]>(() => {
    if (!playing) return [];
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 1.6 + Math.random() * 0.9,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 6,
      drift: (Math.random() - 0.5) * 120,
      rotate: Math.random() * 360,
    }));
  }, [playing, count]);

  if (!playing) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            left: `${p.left}%`,
            top: "-5%",
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            // @ts-expect-error custom property used by keyframes
            "--drift": `${p.drift}px`,
            "--rotate": `${p.rotate}deg`,
          }}
          className="confetti-piece absolute rounded-[2px]"
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--drift), 105vh) rotate(var(--rotate)); opacity: 0; }
        }
        .confetti-piece {
          animation-name: confetti-fall;
          animation-timing-function: cubic-bezier(0.2, 0.6, 0.4, 1);
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
