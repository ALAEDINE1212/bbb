import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** White rounded card on the grey canvas - the base surface of every screen. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[22px] bg-card shadow-card", className)} {...props} />;
}

/** Section title above a group of cards ("Stress & Energy" in Bevel). */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mt-7 mb-2.5 flex items-center justify-between px-1">
      <h2 className="font-display text-[19px] font-semibold tracking-tight text-ink">{children}</h2>
      {action}
    </div>
  );
}

/** Small uppercase label used inside cards. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3", className)}>{children}</div>;
}
