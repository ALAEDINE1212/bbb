import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarHeart, ChevronRight, Droplet, Moon, Settings2, Sparkles } from "lucide-react";
import { clearCycleSettings, saveCycleSettings, toggleSymptom, togglePeriodStart, useData } from "@/data/store";
import { CYCLE_DEFAULT_LEN, CYCLE_DEFAULT_PERIOD, PHASE_NOTE, SYMPTOMS, cycleConfig, cycleHeadline, cycleInfo, cycleSettings, cycleSourceNote, inDays, type CycleInfo, type Phase } from "@/data/cycle";
import { iso, nd } from "@/data/dates";
import { nav } from "@/app/nav";
import { runSave } from "@/app/feedback";
import { Card, SectionTitle } from "@/ui/Card";
import { Sheet } from "@/ui/Sheet";
import { Confirm } from "@/ui/Confirm";
import { PrimaryButton } from "@/ui/Controls";
import { NumberStepper } from "@/ui/NumberStepper";
import { DateInput, InlineField } from "@/ui/Field";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptics";

export const PHASE_COLOR: Record<Phase, string> = {
  Menstrual: "var(--accent-1)",
  Follicular: "var(--positive)",
  Ovulatory: "var(--accent-3)",
  Luteal: "var(--accent-2)"
};

const HEAD_ICON = { droplet: <Droplet />, sparkles: <Sparkles />, "calendar-heart": <CalendarHeart /> };

/** Cycle state derived exactly like the legacy renderCycle(). */
export function useCycle() {
  const root = useData(s => s.cycleTracking);
  const settings = cycleSettings(root);
  const history = root?.history || {};
  const eff = cycleConfig(settings, history);
  const info = cycleInfo(eff);
  return { root, settings, history, logs: root?.logs || {}, eff, info };
}

/** The phase dial: progress arc, period + fertile bands on an outer ring, and a dot for today. */
export function CycleDial({ info, size = 200 }: { info: CycleInfo | null; size?: number }) {
  const reduce = useReducedMotion();
  const R = 84, BAND = 97, C = 2 * Math.PI * R, BC = 2 * Math.PI * BAND;
  const arc = (a: number, b: number, c: number) => {
    const span = Math.max(0, Math.min(1, b) - Math.max(0, a));
    return { strokeDasharray: `${(span * c).toFixed(2)} ${c.toFixed(2)}`, strokeDashoffset: (-a * c).toFixed(2) };
  };
  const color = info ? PHASE_COLOR[info.phase] : "var(--ink-3)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" width={size} height={size} className="-rotate-90" role="img" aria-label={info ? `Day ${info.day} of ${info.len}, ${info.phase}` : "Cycle not set"}>
        <circle cx="100" cy="100" r={R} fill="none" stroke="var(--track)" strokeWidth="10" />
        {info && (
          <>
            <circle cx="100" cy="100" r={BAND} fill="none" stroke="var(--accent-1)" strokeWidth="5" strokeLinecap="round" {...arc(0, info.plen / info.len, BC)} />
            <circle cx="100" cy="100" r={BAND} fill="none" stroke="var(--accent-3)" strokeWidth="5" strokeLinecap="round" {...arc((info.fertileStartDay - 1) / info.len, info.fertileEndDay / info.len, BC)} />
            <motion.circle cx="100" cy="100" r={R} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${C} ${C}`}
              initial={{ strokeDashoffset: reduce ? C * (1 - info.progress) : C }} animate={{ strokeDashoffset: C * (1 - info.progress) }}
              transition={{ type: "spring", stiffness: 60, damping: 18 }} />
            <g style={{ transform: `rotate(${(info.progress * 360).toFixed(2)}deg)`, transformOrigin: "100px 100px" }}>
              <circle cx="184" cy="100" r="7" fill="var(--card)" stroke={color} strokeWidth="4" />
            </g>
          </>
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {info ? (
          size >= 150 ? (
            <div>
              <div className="text-[12px] font-medium text-ink-3">Day</div>
              <div className="font-display text-[52px] font-semibold leading-none tracking-tight tabular text-ink">{info.day}</div>
              <div className="mt-1 text-[14px] font-semibold" style={{ color }}>{info.phase}</div>
              <div className="text-[12px] text-ink-3">of {info.len} days</div>
            </div>
          ) : (
            <div className="font-display font-semibold leading-none tabular text-ink" style={{ fontSize: size * 0.3 }}>{info.day}</div>
          )
        ) : (
          <div className="px-8 text-[13px] leading-snug text-ink-2"><Moon className="mx-auto mb-1.5 size-6 text-ink-3" />Set the first day of the last period to start the dial.</div>
        )}
      </div>
    </div>
  );
}

/** Mood screen hero: dial, what's next, predictions, "Period started today". */
export function CycleCard() {
  const { info, eff, history } = useCycle();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const today = iso();
  const loggedToday = !!history[today];
  const head = info ? cycleHeadline(info) : null;

  const tapLog = () => {
    haptic("tap");
    if (loggedToday) setConfirmRemove(true);
    else void runSave(() => togglePeriodStart(today), "Period start logged 🩸");
  };

  return (
    <>
      <Card className="relative overflow-hidden p-4">
        <div className="flex items-center justify-between">
          <button onClick={tapLog} aria-pressed={loggedToday}
            className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold active:scale-95",
              loggedToday ? "bg-accent-1 text-on-accent" : "bg-card-2 text-accent-1")}>
            <Droplet className={cn("size-4", loggedToday && "fill-current")} />{loggedToday ? "Logged for today" : "Period started today"}
          </button>
          <button aria-label="Cycle settings" onClick={() => setSettingsOpen(true)} className="grid size-9 place-items-center rounded-full bg-card-2 text-ink-2"><Settings2 className="size-4" /></button>
        </div>

        <div className="mt-2 flex justify-center"><CycleDial info={info} size={220} /></div>

        {info && head && eff ? (
          <div className="mt-2">
            <div className="flex items-center justify-center gap-1.5 text-center text-[17px] font-semibold text-ink [&>svg]:size-[18px]" style={{ color: PHASE_COLOR[info.phase] }}>
              {HEAD_ICON[head.icon]}<span className="text-ink">{head.main}</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Prediction label="Next period" value={inDays(info.daysToNext)} sub={nd(info.nextDate)} color="var(--accent-1)" />
              <Prediction label="Ovulation" value={inDays(info.daysToOvulation)} sub={nd(info.daysToOvulation === 0 ? info.ovulationDate : info.nextOvulationDate)} color="var(--accent-3)" />
              <Prediction label="Fertile" value={info.inFertileWindow ? "now" : inDays(info.daysToFertile)}
                sub={`${nd(info.inFertileWindow ? info.fertileStartDate : info.nextFertileStartDate).replace(/,? \d{4}$/, "")} – ${nd(info.inFertileWindow ? info.fertileEndDate : info.nextFertileEndDate).replace(/,? \d{4}$/, "")}`} color="var(--accent-3)" />
            </div>
            <p className="mt-3 text-center text-[13px] leading-snug text-ink-2">{PHASE_NOTE[info.phase]}</p>
            <div className="mt-3 flex items-center justify-center gap-4 text-[11px] font-medium text-ink-3">
              <span className="flex items-center gap-1.5"><i className="h-1.5 w-4 rounded-full bg-accent-1" />Period days</span>
              <span className="flex items-center gap-1.5"><i className="h-1.5 w-4 rounded-full bg-accent-3" />Fertile window</span>
            </div>
            <p className="mt-2 text-center text-[11px] text-ink-3">{cycleSourceNote(eff)}</p>
          </div>
        ) : (
          <div className="mt-3 text-center">
            <button onClick={() => setSettingsOpen(true)} className="rounded-full bg-[var(--button)] px-4 py-2 text-[14px] font-semibold text-[var(--button-ink)]">Set up the cycle</button>
          </div>
        )}
      </Card>

      <SymptomCard />
      <CycleSettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Confirm open={confirmRemove} title="Remove today?" message="Remove today as a logged period start?" confirmLabel="Remove"
        onClose={() => setConfirmRemove(false)} onConfirm={() => { setConfirmRemove(false); void runSave(() => togglePeriodStart(today), "Removed"); }} />
    </>
  );
}

function Prediction({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-2xl px-2.5 py-2.5 text-center" style={{ background: `color-mix(in srgb, ${color} 13%, transparent)` }}>
      <div className="text-[11px] font-medium text-ink-2">{label}</div>
      <div className="text-[15px] font-semibold" style={{ color }}>{value.charAt(0).toUpperCase() + value.slice(1)}</div>
      <div className="text-[11px] text-ink-3">{sub}</div>
    </div>
  );
}

function SymptomCard() {
  const { logs } = useCycle();
  const [date, setDate] = useState(iso());
  const on = logs[date] || [];
  return (
    <>
      <SectionTitle>How does your body feel?</SectionTitle>
      <Card className="p-4">
        <InlineField label="Logging for"><DateInput value={date} onChange={e => setDate(e.target.value || iso())} /></InlineField>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {SYMPTOMS.map(s => {
            const sel = on.includes(s.id);
            return (
              <button key={s.id} aria-pressed={sel} onClick={() => { haptic("select"); void runSave(() => toggleSymptom(date, s.id), sel ? "Removed" : "Saved"); }}
                className={cn("flex items-center justify-center gap-1.5 rounded-full border px-2 py-2 text-[13px] font-semibold transition-colors",
                  sel ? "border-transparent bg-accent-1 text-on-accent" : "border-line bg-card text-ink-2")}>
                <span aria-hidden>{s.e}</span>{s.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2.5 text-center text-[12px] text-ink-3">{on.length ? `${on.length} logged for this day — tap to remove` : "Tap anything you are feeling. It saves on its own."}</p>
      </Card>
    </>
  );
}

function CycleSettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings } = useCycle();
  const [start, setStart] = useState("");
  const [len, setLen] = useState(CYCLE_DEFAULT_LEN);
  const [plen, setPlen] = useState(CYCLE_DEFAULT_PERIOD);
  const [clearing, setClearing] = useState(false);
  useEffect(() => {
    if (!open) return;
    setStart(settings?.startDate || "");
    setLen(Number(settings?.cycleLength) || CYCLE_DEFAULT_LEN);
    setPlen(Number(settings?.periodLength) || CYCLE_DEFAULT_PERIOD);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Cycle" subtitle="The starting point. After a couple of “Period started today” taps the dial uses your real average instead."
        footer={<PrimaryButton onClick={async () => { if (await runSave(() => saveCycleSettings({ startDate: start, cycleLength: String(len), periodLength: String(plen) }), "Cycle saved 🌙")) onClose(); }}>Save</PrimaryButton>}>
        <div className="space-y-3">
          <InlineField label="First day of last period"><DateInput value={start} onChange={e => setStart(e.target.value)} /></InlineField>
          <div className="rounded-2xl border border-line p-4"><NumberStepper label="Cycle length" value={len} onChange={setLen} min={20} max={45} unit="days" size="lg" /></div>
          <div className="rounded-2xl border border-line p-4"><NumberStepper label="Period length" value={plen} onChange={setPlen} min={1} max={10} unit="days" size="lg" /></div>
          <p className="px-1 text-[12px] leading-snug text-ink-3">Kept privately with the rest of your app data and used to make Lumi gentler. Not medical advice, and not contraception.</p>
          {settings && <button onClick={() => setClearing(true)} className="w-full rounded-2xl bg-card-2 py-3 text-[15px] font-semibold text-danger">Clear settings</button>}
        </div>
      </Sheet>
      <Confirm open={clearing} title="Clear the cycle settings?" confirmLabel="Clear settings"
        message="Logged symptoms and period-start history are kept, so predictions keep working from your history if you have any."
        onClose={() => setClearing(false)}
        onConfirm={async () => { setClearing(false); if (await runSave(() => clearCycleSettings(), "Settings cleared")) onClose(); }} />
    </>
  );
}

/** Compact cycle summary for Home. */
export function CycleHomeCard() {
  const { info } = useCycle();
  if (!info) return null;
  const head = cycleHeadline(info);
  return (
    <Card className="mt-2.5">
      <button onClick={() => nav.tab("mood")} className="flex w-full items-center gap-4 p-4 text-left">
        <CycleDial info={info} size={92} />
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] text-ink-2">Ines's cycle</span>
          <span className="block text-[17px] font-semibold text-ink">Day {info.day} · {info.phase}</span>
          <span className="block text-[13px] text-ink-2">{head.main}</span>
          <span className="block text-[12px] text-ink-3">{head.icon === "calendar-heart" ? "Around " + nd(info.nextDate) : `Next period ${inDays(info.daysToNext)} · ${nd(info.nextDate)}`}</span>
        </span>
        <ChevronRight className="size-4 text-ink-3" />
      </button>
    </Card>
  );
}
