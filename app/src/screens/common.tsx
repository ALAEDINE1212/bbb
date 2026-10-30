import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { nav } from "@/app/nav";
import { haptic } from "@/lib/haptics";

export function ScreenTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 mt-1 flex items-center justify-between gap-3">
      <h1 className="font-display text-[27px] font-semibold tracking-tight text-ink">{children}</h1>
      {action}
    </div>
  );
}

/** Black "+ Add" pill used at the right of a screen title. */
export function AddPill({ onClick, children = "Add" }: { onClick: () => void; children?: ReactNode }) {
  return (
    <button
      onClick={() => { haptic("tap"); onClick(); }}
      className="shrink-0 rounded-full bg-[var(--button)] px-3.5 py-1.5 text-[14px] font-semibold text-[var(--button-ink)] active:scale-95"
    >
      + {children}
    </button>
  );
}

export function BackLink({ label = "Home" }: { label?: string }) {
  return (
    <button onClick={() => { haptic("tap"); nav.sub(null); }} className="-ml-1 mb-1 flex items-center gap-0.5 text-[16px] font-medium text-accent-1">
      <ChevronLeft className="size-5" /> {label}
    </button>
  );
}

export function Empty({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-[14px] text-ink-2 [&>svg]:size-8 [&>svg]:text-ink-3">
      {icon}
      {children}
    </div>
  );
}

export function monthLabel(isoDate: string): string {
  return isoDate ? new Date(isoDate + "T00:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "Undated";
}
