import { type ReactNode, useState } from "react";
import { BellRing, ChevronLeft, X } from "lucide-react";
import { useData } from "@/data/store";
import { iso } from "@/data/dates";
import { Card } from "@/ui/Card";
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

/** legacy checkMoodReminder(): nudge when today has no mood yet, unless dismissed today. */
export function MoodReminder() {
  const moods = useData(s => s.moods);
  const loaded = useData(s => s.loaded);
  const today = iso();
  const [dismissed, setDismissed] = useState(() => { try { return localStorage.getItem("moodReminderDismissed") === today; } catch { return false; } });
  if (!loaded || moods[today] || dismissed) return null;
  return (
    <Card className="mb-2.5 flex items-center gap-3 p-3.5" style={{ background: "linear-gradient(120deg, var(--card) 40%, color-mix(in srgb, var(--accent-3) 18%, var(--card)))" }}>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-3 text-on-accent"><BellRing className="size-[18px]" /></span>
      <span className="min-w-0 flex-1 text-[13px] leading-snug text-ink"><b>Don't forget today's mood!</b><br /><span className="text-ink-2">How are you feeling?</span></span>
      <button onClick={() => { haptic("tap"); nav.open("mood", null, today); }} className="shrink-0 rounded-full bg-[var(--button)] px-3 py-1.5 text-[13px] font-semibold text-[var(--button-ink)]">Log</button>
      <button aria-label="Remind me later" onClick={() => { haptic("tap"); try { localStorage.setItem("moodReminderDismissed", today); } catch { /* device-only */ } setDismissed(true); }} className="shrink-0 text-ink-3"><X className="size-4" /></button>
    </Card>
  );
}
