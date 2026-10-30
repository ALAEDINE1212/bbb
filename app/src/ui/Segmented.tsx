import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptics";

interface SegmentedProps<K extends string> {
  options: { key: K; label: string; disabled?: boolean }[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
  size?: "sm" | "md";
}

/** iOS segmented control with a sliding thumb. */
export function Segmented<K extends string>({ options, value, onChange, className, size = "md" }: SegmentedProps<K>) {
  const id = useId();
  return (
    <div role="tablist" className={cn("flex rounded-[12px] bg-track/70 p-[3px]", className)}>
      {options.map(option => {
        const on = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={on}
            disabled={option.disabled}
            onClick={() => { if (!on) { haptic("select"); onChange(option.key); } }}
            className={cn(
              "relative flex-1 rounded-[9px] font-semibold transition-colors disabled:opacity-35",
              size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]",
              on ? "text-ink" : "text-ink-2"
            )}
          >
            {on && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-[9px] bg-card shadow-card" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative whitespace-nowrap">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
