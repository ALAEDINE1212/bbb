// Cycle tracking, ported line for line from the legacy index.html ("Cycle tracking" block).
// Firebase node cycleTracking:
//   config        { startDate, cycleLength, periodLength, updatedAt }
//   logs/{date}   ["cramps", "cravings", …]
//   history/{date} <timestamp>   — confirmed period start dates
// Older builds wrote { startDate, cycleLength } straight onto the root; that shape is still read.

export interface CycleSettings { startDate: string; cycleLength?: number | string; periodLength?: number | string; updatedAt?: number }

export interface CycleRoot extends Partial<CycleSettings> {
  config?: CycleSettings;
  logs?: Record<string, string[]>;
  history?: Record<string, number>;
}

export const CYCLE_DEFAULT_LEN = 28;
export const CYCLE_DEFAULT_PERIOD = 5;
/* A gap between two logged starts outside this range is almost certainly a mis-tap, not a real
   short/long cycle, so it is dropped from the average rather than skewing it. */
const HIST_GAP_MIN = 15;
const HIST_GAP_MAX = 60;
/* How many of the most recent gaps feed the average. */
const HIST_GAP_WINDOW = 6;

export const SYMPTOMS = [
  { id: "cramps", e: "🩸", label: "Cramps" },
  { id: "headache", e: "🤕", label: "Headache" },
  { id: "cravings", e: "🍫", label: "Cravings" },
  { id: "lowEnergy", e: "😴", label: "Tired" },
  { id: "bloating", e: "🌊", label: "Bloated" },
  { id: "tender", e: "💗", label: "Tender" },
  { id: "irritable", e: "😤", label: "Irritable" },
  { id: "anxious", e: "🌧️", label: "Anxious" },
  { id: "glowing", e: "✨", label: "Glowing" },
  { id: "cozy", e: "🛌", label: "Cozy" },
  { id: "energised", e: "⚡", label: "Energy" },
  { id: "calm", e: "🌿", label: "Calm" }
] as const;

export const SYM_LABEL: Record<string, string> = {};
SYMPTOMS.forEach(s => { SYM_LABEL[s.id] = s.e + " " + s.label; });

export type Phase = "Menstrual" | "Follicular" | "Ovulatory" | "Luteal";

export const PHASE_NOTE: Record<Phase, string> = {
  Menstrual: "Rest is the whole job right now — warmth, water, nothing demanding.",
  Follicular: "Energy climbs through this stretch. Good days to start things.",
  Ovulatory: "Usually the brightest, most social few days of the cycle.",
  Luteal: "Energy winds down and moods get louder. Be generous with yourself."
};

/** Settings (manual or from history) resolved by cycleConfig(). */
export interface EffectiveCycle {
  startDate: string; cycleLength: number | string | undefined; periodLength: number | string;
  source: "manual" | "history"; historyCount: number; cycleLens: number[];
}

export type CycleInfo = NonNullable<ReturnType<typeof cycleInfo>>;

/** legacy cycleInfo(): every date-related number, computed once. */
export function cycleInfo(d: { startDate?: string; cycleLength?: number | string; periodLength?: number | string } | null | undefined, today?: string | Date) {
  if (!d || !d.startDate) return null;
  const len = Math.min(45, Math.max(20, parseInt(String(d.cycleLength), 10) || CYCLE_DEFAULT_LEN));
  const ovulation = len - 14; // luteal phase is the stable ~14 days
  /* The period is capped so it can never reach the ovulation day. */
  const plen = Math.min(10, len - 10, ovulation - 1, Math.max(1, parseInt(String(d.periodLength), 10) || CYCLE_DEFAULT_PERIOD));
  const start = new Date(d.startDate + "T00:00:00");
  if (isNaN(start.getTime())) return null;
  const now = today ? new Date(today) : new Date();
  now.setHours(0, 0, 0, 0);
  /* Compare calendar days via UTC so a daylight-saving change can't knock the day off by one. */
  const utcDay = (x: Date) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  const elapsed = Math.round((utcDay(now) - utcDay(start)) / 86400000);
  if (!isFinite(elapsed) || elapsed < 0) return null;

  const day = (elapsed % len) + 1;
  /* Fertile window: the five days before ovulation, plus the day after. */
  const fertileStart = Math.max(1, ovulation - 5);
  const fertileEnd = Math.min(len, ovulation + 1);

  let phase: Phase;
  if (day <= plen) phase = "Menstrual";
  else if (day < ovulation - 1) phase = "Follicular";
  else if (day <= ovulation + 1) phase = "Ovulatory";
  else phase = "Luteal";

  const addDays = (d0: Date, n: number) => { const x = new Date(d0); x.setDate(x.getDate() + n); return x; };
  /* A day-of-cycle as a real date in the cycle currently running… */
  const dayToDate = (n: number) => { const x = new Date(now); x.setDate(x.getDate() + (n - day)); return x; };
  /* …and as the next occurrence from today, wrapping to next cycle. */
  const nextOccurrence = (n: number) => { const x = new Date(now); x.setDate(x.getDate() + (n - day) + (n < day ? len : 0)); return x; };

  const daysToNext = len - day + 1;
  const next = new Date(now);
  next.setDate(next.getDate() + daysToNext);

  return {
    day, len, plen, phase,
    startDate: d.startDate,
    progress: day / len,
    periodEndDay: plen,
    periodEndDate: dayToDate(plen),
    ovulationDay: ovulation,
    ovulationDate: dayToDate(ovulation),
    nextOvulationDate: nextOccurrence(ovulation),
    daysToOvulation: (ovulation - day + (ovulation < day ? len : 0)),
    fertileStartDay: fertileStart,
    fertileEndDay: fertileEnd,
    fertileStartDate: dayToDate(fertileStart),
    fertileEndDate: dayToDate(fertileEnd),
    nextFertileStartDate: nextOccurrence(fertileStart),
    nextFertileEndDate: addDays(nextOccurrence(fertileStart), fertileEnd - fertileStart),
    daysToFertile: (fertileStart - day + (fertileStart < day ? len : 0)),
    inFertileWindow: day >= fertileStart && day <= fertileEnd,
    daysToNext, nextDate: next,
    daysLeftOfPeriod: day <= plen ? plen - day + 1 : 0
  };
}

/** legacy listener: config node, falling back to the old flat-root shape. */
export function cycleSettings(root: CycleRoot | null | undefined): CycleSettings | null {
  const raw = root || null;
  const legacy = raw && !raw.config && raw.startDate ? (raw as CycleSettings) : null;
  return raw ? (raw.config || legacy) : null;
}

/** legacy cycleConfig(): turn logged period starts into the cycle length actually running. */
export function cycleConfig(cycData: CycleSettings | null, cycHistory: Record<string, unknown> | null | undefined): EffectiveCycle | null {
  const manual = cycData && cycData.startDate ? cycData : null;
  const periodLength = (manual && manual.periodLength) || CYCLE_DEFAULT_PERIOD;

  const dates = Object.keys(cycHistory || {}).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();

  if (dates.length < 2) {
    return manual ? { startDate: manual.startDate, cycleLength: manual.cycleLength, periodLength, source: "manual", historyCount: dates.length, cycleLens: [] } :
      (dates.length === 1 ? { startDate: dates[0], cycleLength: CYCLE_DEFAULT_LEN, periodLength, source: "manual", historyCount: 1, cycleLens: [] } : null);
  }

  const recent = dates.slice(-(HIST_GAP_WINDOW + 1));
  const gaps: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    const a = new Date(recent[i - 1] + "T00:00:00");
    const b = new Date(recent[i] + "T00:00:00");
    const g = Math.round((b.getTime() - a.getTime()) / 86400000);
    if (g >= HIST_GAP_MIN && g <= HIST_GAP_MAX) gaps.push(g);
  }

  if (!gaps.length) {
    return manual ? { startDate: dates[dates.length - 1], cycleLength: manual.cycleLength, periodLength, source: "manual", historyCount: dates.length, cycleLens: [] } :
      { startDate: dates[dates.length - 1], cycleLength: CYCLE_DEFAULT_LEN, periodLength, source: "manual", historyCount: dates.length, cycleLens: [] };
  }

  const avgLen = Math.min(45, Math.max(20, Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)));
  return { startDate: dates[dates.length - 1], cycleLength: avgLen, periodLength, source: "history", historyCount: dates.length, cycleLens: gaps };
}

/** "in 0 days" reads like a bug; say it the way a person would. */
export const inDays = (n: number) => n === 0 ? "today" : n === 1 ? "tomorrow" : "in " + n + " days";

/** [28, 30, 29] -> "28, 30 and 29". */
export const joinList = (arr: (string | number)[]): string | number => arr.length <= 1 ? (arr[0] || "") : arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1];

/** legacy renderCycle() headline: whichever milestone is genuinely next. */
export function cycleHeadline(info: CycleInfo): { icon: "droplet" | "sparkles" | "calendar-heart"; main: string } {
  if (info.daysLeftOfPeriod > 0) {
    return { icon: "droplet", main: info.daysLeftOfPeriod === 1 ? "Last day of your period" : info.daysLeftOfPeriod + " days of your period left" };
  }
  if (info.inFertileWindow) {
    return { icon: "sparkles", main: info.day === info.ovulationDay ? "Ovulation day" : "Fertile window · ends " + inDays(info.fertileEndDay - info.day) };
  }
  if (info.daysToFertile < info.daysToNext) return { icon: "sparkles", main: "Fertile window starts " + inDays(info.daysToFertile) };
  return { icon: "calendar-heart", main: "Next period " + inDays(info.daysToNext) };
}

/** legacy renderCycle() source note. */
export function cycleSourceNote(eff: EffectiveCycle): string {
  return eff.source === "history"
    ? "Based on your last " + eff.cycleLens.length + " logged cycle" + (eff.cycleLens.length === 1 ? "" : "s") + " (" + joinList(eff.cycleLens) + " days)"
    : "Based on your saved settings — log a period start to switch to your real average";
}
