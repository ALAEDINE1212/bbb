import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MOOD_SWATCHES } from "@/config";
import { useData } from "@/data/store";
import { dk, iso } from "@/data/dates";
import { nav } from "@/app/nav";
import { Card, SectionTitle } from "@/ui/Card";
import { Ring } from "@/ui/Ring";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/cn";
import { AddPill, ScreenTitle } from "./common";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function moodName(color: string) {
  const s = MOOD_SWATCHES.find(x => x.color.toLowerCase() === (color || "").toLowerCase());
  return s ? `${s.label} ${s.emoji}` : "Custom";
}

export function Mood() {
  const moods = useData(s => s.moods);
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [picked, setPicked] = useState<string | null>(null);
  const today = iso();

  const first = new Date(ym.y, ym.m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const daysIn = new Date(ym.y, ym.m + 1, 0).getDate();
  const keys = Array.from({ length: daysIn }, (_, i) => dk(ym.y, ym.m, i + 1));
  const logged = keys.filter(k => moods[k]);
  const isCurrent = ym.y === now.getFullYear() && ym.m === now.getMonth();
  const elapsed = isCurrent ? now.getDate() : daysIn;

  const counts = new Map<string, number>();
  for (const k of logged) counts.set(moods[k].color, (counts.get(moods[k].color) || 0) + 1);
  const ranked = [...counts].sort((a, b) => b[1] - a[1]);
  const total = Object.keys(moods).length;

  const shift = (d: number) => { haptic("select"); setPicked(null); setYm(({ y, m }) => { const n = new Date(y, m + d, 1); return { y: n.getFullYear(), m: n.getMonth() }; }); };
  const pickedMood = picked ? moods[picked] : null;

  return (
    <div>
      <ScreenTitle action={<AddPill onClick={() => nav.open("mood", null, today)}>Log</AddPill>}>Mood</ScreenTitle>

      <Card className="flex items-center gap-4 p-4">
        <Ring value={logged.length / elapsed} color="var(--accent-3)" color2="var(--accent-3b)" size={88} caption="logged" />
        <div className="min-w-0 flex-1">
          <div className="text-[12px] text-ink-2">{first.toLocaleDateString(undefined, { month: "long" })}</div>
          <div className="font-display text-[22px] font-semibold tabular text-ink">{logged.length}<span className="text-[13px] text-ink-2"> / {elapsed} days</span></div>
          <div className="text-[12px] text-ink-3">{total} days coloured in all time</div>
        </div>
      </Card>

      <Card className="mt-2.5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button aria-label="Previous month" onClick={() => shift(-1)} className="grid size-8 place-items-center rounded-full bg-card-2 text-ink"><ChevronLeft className="size-4" /></button>
          <div className="text-[15px] font-semibold text-ink">{first.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
          <button aria-label="Next month" onClick={() => shift(1)} className="grid size-8 place-items-center rounded-full bg-card-2 text-ink"><ChevronRight className="size-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEKDAYS.map((w, i) => <div key={i} className="text-[11px] font-semibold text-ink-3">{w}</div>)}
          {Array.from({ length: lead }, (_, i) => <span key={"p" + i} />)}
          {keys.map((k, i) => {
            const mood = moods[k];
            return (
              <button
                key={k}
                onClick={() => { haptic("select"); setPicked(picked === k ? null : k); }}
                aria-label={`${k}${mood ? `: ${moodName(mood.color)}` : ""}`}
                className={cn("grid aspect-square place-items-center rounded-full text-[13px] font-medium tabular transition-transform active:scale-90",
                  mood ? "text-white" : "bg-card-2 text-ink-2",
                  k === today && "ring-2 ring-ink ring-offset-2 ring-offset-card",
                  picked === k && "scale-110")}
                style={mood ? { background: mood.color } : undefined}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        {picked && (
          <div className="mt-4 rounded-2xl bg-card-2 p-3.5">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold text-ink">
                {new Date(picked + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                {pickedMood && <span className="ml-1.5 font-normal text-ink-2">· {moodName(pickedMood.color)}</span>}
              </div>
              <button onClick={() => nav.open("mood", null, picked)} className="text-[13px] font-semibold text-accent-1">{pickedMood ? "Change" : "Log"}</button>
            </div>
            {pickedMood?.text ? <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-snug text-ink">{pickedMood.text}</p>
              : <p className="mt-1.5 text-[13px] text-ink-3">{pickedMood ? "No note." : "Nothing logged."}</p>}
          </div>
        )}
      </Card>

      {ranked.length > 0 && (
        <>
          <SectionTitle>This month</SectionTitle>
          <Card className="space-y-2.5 p-4">
            {ranked.map(([color, n]) => (
              <div key={color} className="flex items-center gap-3">
                <span className="w-[92px] shrink-0 truncate text-[13px] font-medium text-ink">{moodName(color)}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-track">
                  <div className="h-full rounded-full" style={{ width: `${(n / logged.length) * 100}%`, background: color }} />
                </div>
                <span className="w-6 text-right text-[12px] font-semibold tabular text-ink-2">{n}</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
