import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Heart, House, MapPin, Palette, Sparkles } from "lucide-react";
import { WRITE_ENABLED } from "@/config";
import { useData } from "@/data/store";
import { nav, useNav, type Tab } from "@/app/nav";
import { useToasts } from "@/app/feedback";
import { TabBar } from "@/ui/TabBar";
import { IconButton } from "@/ui/Controls";
import { SyncCapsule, type SyncStatus } from "@/ui/SyncCapsule";
import { Toasts } from "@/ui/Toasts";
import { Sheet } from "@/ui/Sheet";
import { Segmented } from "@/ui/Segmented";
import { Home } from "@/screens/Home";
import { Story } from "@/screens/Story";
import { Mood } from "@/screens/Mood";
import { Places } from "@/screens/Places";
import { Meetings, Movies, Photos } from "@/screens/Collections";
import { Together } from "@/screens/Together";
import { Lumi } from "@/lumi/Lumi";
import { Sheets } from "@/sheets/Sheets";
import { requestNotifications } from "@/lib/pwa";

const SCREENS: Record<Tab, () => React.ReactElement> = { home: Home, story: Story, mood: Mood, places: Places };
const SUBS = { movies: Movies, meetings: Meetings, photos: Photos, together: Together };

export function App() {
  const { tab, sub, sheet } = useNav();
  const loaded = useData(s => s.loaded);
  const toasts = useToasts();
  const [online, setOnline] = useState(navigator.onLine);
  const [settings, setSettings] = useState(false);

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    addEventListener("online", on); addEventListener("offline", off);
    return () => { removeEventListener("online", on); removeEventListener("offline", off); };
  }, []);

  const status: SyncStatus = !WRITE_ENABLED ? "readonly" : !online ? "offline" : loaded ? "synced" : "syncing";
  const Screen = sub ? SUBS[sub] : SCREENS[tab];

  return (
    <div className="mx-auto min-h-dvh max-w-[560px] px-4 pb-40 pt-[max(12px,env(safe-area-inset-top))]">
      <header className="relative flex h-14 items-center justify-between gap-2">
        <IconButton aria-label="Ask Lumi" onClick={() => nav.open("lumi")} className="text-accent-2"><Sparkles /></IconButton>
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
          <div className="pointer-events-auto"><SyncCapsule status={status} /></div>
        </div>
        <IconButton aria-label="Settings" onClick={() => setSettings(true)} className="text-accent-1"><Heart className="fill-current" /></IconButton>
      </header>

      <AnimatePresence mode="wait">
        <motion.div key={sub || tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          <Screen />
        </motion.div>
      </AnimatePresence>

      <TabBar active={sub ? ("" as Tab) : tab} onChange={k => { nav.tab(k); if (k === "mood") void requestNotifications(); }} onAdd={() => nav.open("log")} items={[
        { key: "home", label: "Home", icon: <House /> },
        { key: "story", label: "Story", icon: <BookOpen /> },
        { key: "mood", label: "Mood", icon: <Palette /> },
        { key: "places", label: "Places", icon: <MapPin /> }
      ]} />

      <Sheets />
      <Lumi open={sheet === "lumi"} onClose={nav.close} />
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
      <Toasts toasts={toasts} />
      <Welcome />
    </div>
  );
}

/** legacy #ov overlay: "welcome back, my Baby Ines" — tap to enter, or it leaves on its own. */
function Welcome() {
  const [show, setShow] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShow(false), 3500); return () => clearTimeout(t); }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button key="welcome" aria-label="Enter" onClick={() => setShow(false)} initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-bg text-center">
          <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="grid size-20 place-items-center rounded-[24px] bg-accent-1 text-on-accent" style={{ boxShadow: "inset 0 1px 0 var(--sheen), 0 16px 40px -12px var(--accent-1)" }}>
            <Heart className="size-9 fill-current" />
          </motion.span>
          <div className="mt-6 font-display text-[28px] font-semibold leading-tight tracking-tight text-ink">welcome back,<br /><span className="italic text-accent-1">my Baby Ines</span></div>
          <div className="mt-3 text-[13px] text-ink-3">tap anywhere to enter</div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

type Theme = "system" | "light" | "dark";

function readTheme(): Theme {
  try { const t = localStorage.getItem("olu-theme"); return t === "light" || t === "dark" ? t : "system"; } catch { return "system"; }
}

export function applyTheme(t: Theme = readTheme()) {
  if (t === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [theme, setTheme] = useState<Theme>(readTheme());
  const choose = (t: Theme) => {
    setTheme(t);
    try { localStorage.setItem("olu-theme", t); } catch { /* per-device convenience only */ }
    applyTheme(t);
  };
  return (
    <Sheet open={open} onClose={onClose} title="Our Little Universe" subtitle="A tiny place for us — Ines & Alaedine">
      <div className="space-y-3">
        <div className="text-[13px] font-semibold text-ink-2">Appearance</div>
        <Segmented value={theme} onChange={choose} options={[{ key: "system", label: "System" }, { key: "light", label: "Light" }, { key: "dark", label: "Dark" }]} />
        <NotificationRow />
        <div className="rounded-2xl bg-card-2 p-3.5 text-[13px] leading-snug text-ink-2">
          {WRITE_ENABLED ? "Changes sync to both of you instantly." : "This is a read-only preview of the new app. It shows your real data but can't change anything — keep using the current app for now."}
        </div>
      </div>
    </Sheet>
  );
}

function NotificationRow() {
  const supported = typeof Notification !== "undefined";
  const [perm, setPerm] = useState(supported ? Notification.permission : "denied");
  if (!supported) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-card-2 px-4 py-3">
      <span className="text-[15px] font-semibold text-ink">Notifications<span className="block text-[12px] font-normal text-ink-2">
        {perm === "granted" ? "On for this device" : perm === "denied" ? "Blocked — allow them in your browser settings" : "Mood reminders and messages"}</span></span>
      {perm === "default" && <button onClick={async () => { const p = await requestNotifications(); if (p !== "unsupported") setPerm(p); }}
        className="shrink-0 rounded-full bg-[var(--button)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--button-ink)]">Turn on</button>}
    </div>
  );
}
