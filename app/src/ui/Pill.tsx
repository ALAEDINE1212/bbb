import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptics";

interface StatusPillProps {
  icon: ReactNode;
  /** Background of the round icon badge. */
  tint?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  className?: string;
}

/** Bevel's "Active · Until changed" capsule: round icon badge, two lines of text, optional chevron. */
export function StatusPill({ icon, tint, title, subtitle, chevron, onClick, className }: StatusPillProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick ? () => { haptic("tap"); onClick(); } : undefined}
      className={cn(
        "flex min-w-0 items-center gap-2.5 rounded-full bg-card py-1.5 pl-1.5 pr-3.5 text-left shadow-card",
        onClick && "transition-transform active:scale-[0.97]",
        className
      )}
    >
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full text-on-accent"
        style={{ background: tint ?? "var(--card-2)", boxShadow: tint ? `inset 0 1px 0 var(--sheen), 0 4px 10px -4px ${tint}` : undefined }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[14px] font-semibold text-ink">{title}</span>
        {subtitle && <span className="block truncate text-[12px] text-ink-2">{subtitle}</span>}
      </span>
      {chevron && <ChevronDown className="size-4 shrink-0 text-ink-2" />}
    </Tag>
  );
}
