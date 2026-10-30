import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

interface RingProps {
  /** 0..1, or null for "no data yet" (renders the muted "–%" state). */
  value: number | null;
  /** Accent colour and its lighter partner for the arc gradient (CSS colours or var(--x)). */
  color: string;
  color2?: string;
  size?: number;
  stroke?: number;
  /** Centre text; defaults to the value as a percentage. */
  display?: string;
  /** Small caption under the centre text, inside the ring. */
  caption?: string;
  className?: string;
}

/** Thin progress ring with a round-capped gradient arc that sweeps in on mount. */
export function Ring({ value, color, color2, size = 92, stroke = 7, display, caption, className }: RingProps) {
  const id = useId();
  const reduce = useReducedMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const empty = value == null;
  const progress = empty ? 0 : Math.max(0, Math.min(1, value));
  const text = display ?? (empty ? "–%" : `${Math.round(progress * 100)}%`);

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color2 ?? color} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        {progress > 0 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: reduce ? circumference * (1 - progress) : circumference }}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ type: "spring", stiffness: 60, damping: 18, mass: 1 }}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div
            className={cn("font-display font-semibold tracking-tight tabular leading-none", empty ? "text-ink-3" : "text-ink")}
            style={{ fontSize: size * 0.24 }}
          >
            {text}
          </div>
          {caption && <div className="mt-1 text-[10px] font-medium text-ink-3">{caption}</div>}
        </div>
      </div>
    </div>
  );
}

interface DialProps {
  value: number | null;
  color: string;
  color2?: string;
  size?: number;
  ticks?: number;
  display?: string;
}

/** Ticked dial (Bevel's stress gauge): a ring of short ticks, the first `value` share coloured. */
export function Dial({ value, color, color2, size = 96, ticks = 60, display }: DialProps) {
  const id = useId();
  const progress = value == null ? 0 : Math.max(0, Math.min(1, value));
  const lit = Math.round(progress * ticks);
  const center = size / 2;
  const outer = size / 2 - 2;
  const inner = outer - 9;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color2 ?? color} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        {Array.from({ length: ticks }, (_, index) => {
          const angle = (index / ticks) * Math.PI * 2 - Math.PI / 2;
          const on = index < lit;
          return (
            <motion.line
              key={index}
              x1={center + Math.cos(angle) * inner}
              y1={center + Math.sin(angle) * inner}
              x2={center + Math.cos(angle) * outer}
              y2={center + Math.sin(angle) * outer}
              stroke={on ? `url(#${id})` : "var(--track)"}
              strokeWidth={2}
              strokeLinecap="round"
              initial={{ opacity: on ? 0 : 1 }}
              animate={{ opacity: 1 }}
              transition={{ delay: on ? index * 0.012 : 0 }}
            />
          );
        })}
      </svg>
      <div
        className={cn("absolute font-display font-semibold tabular tracking-tight", value == null ? "text-ink-3" : "text-ink")}
        style={{ fontSize: size * 0.22 }}
      >
        {display ?? (value == null ? "–" : Math.round(progress * 100))}
      </div>
    </div>
  );
}
