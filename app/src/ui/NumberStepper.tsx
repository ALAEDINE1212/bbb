import { useEffect, useRef } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptics";

interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  /** Step used after holding for a while. */
  bigStep?: number;
  min?: number;
  max?: number;
  unit?: string;
  size?: "sm" | "lg";
  format?: (value: number) => string;
}

/** − value + with press-and-hold repeat that speeds up; clamps to [min, max] with a warning haptic. */
export function NumberStepper({ label, value, onChange, step = 1, bigStep, min = 0, max = Infinity, unit, size = "sm", format }: NumberStepperProps) {
  const latest = useRef(value);
  latest.current = value;
  const timers = useRef<{ delay?: ReturnType<typeof setTimeout>; repeat?: ReturnType<typeof setInterval> }>({});
  const decimals = (String(step).split(".")[1] || "").length;

  const apply = (direction: number, multiplier = 1) => {
    const raw = latest.current + direction * step * multiplier;
    const next = Number(Math.min(max, Math.max(min, raw)).toFixed(decimals));
    if (next === latest.current) { haptic("warn"); return false; }
    latest.current = next;
    onChange(next);
    haptic("tap");
    return true;
  };
  const stop = () => { clearTimeout(timers.current.delay); clearInterval(timers.current.repeat); };
  const start = (direction: number) => {
    stop();
    apply(direction);
    let ticks = 0;
    timers.current.delay = setTimeout(() => {
      timers.current.repeat = setInterval(() => {
        ticks += 1;
        const multiplier = ticks > 12 ? (bigStep ? bigStep / step : 5) : 1;
        if (!apply(direction, multiplier)) stop();
      }, 90);
    }, 380);
  };
  useEffect(() => stop, []);

  const big = size === "lg";
  const button = cn("grid shrink-0 place-items-center rounded-full bg-card-2 text-ink transition-transform active:scale-90 select-none touch-none", big ? "size-14 [&>svg]:size-6" : "size-9 [&>svg]:size-4");
  const handlers = (direction: number) => ({
    onPointerDown: (event: React.PointerEvent) => { event.preventDefault(); start(direction); },
    onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop,
    onKeyDown: (event: React.KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); apply(direction); } }
  });

  return (
    <div className={cn("flex items-center", big ? "justify-between gap-4" : "gap-2")}>
      <button type="button" aria-label={`Decrease ${label}`} className={button} {...handlers(-1)}><Minus /></button>
      <div className={cn("min-w-0 flex-1 text-center", !big && "min-w-[44px]")}>
        <div className={cn("font-display font-semibold tabular tracking-tight text-ink", big ? "text-[52px] leading-none" : "text-[17px]")} aria-live="polite">
          {format ? format(value) : value.toFixed(decimals)}
        </div>
        {unit && <div className={cn("font-medium text-ink-2", big ? "mt-2 text-[13px]" : "text-[11px]")}>{unit}</div>}
      </div>
      <button type="button" aria-label={`Increase ${label}`} className={button} {...handlers(1)}><Plus /></button>
    </div>
  );
}
