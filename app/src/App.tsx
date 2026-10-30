import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Heart, House, MapPin, Palette } from "lucide-react";
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
import { Sheets } from "@/sheets/Sheets";

const SCREENS: Record<Tab, () => React.ReactElement> = { home: Home, story: Story, mood: Mood, places: Places };
const SUBS = { movies: Movies, meetings: Meetings, photos: Photos };

export function App() {
  const { tab, sub } = useNav();
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
      <header className="relative flex h-14 items-center justify-end gap-2">
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

      <TabBar active={tab} onChange={nav.tab} onAdd={() => nav.open("log")} items={[
        { key: "home", label: "Home", icon: <House /> },
        { key: "story", label: "Story", icon: <BookOpen /> },
        { key: "mood", label: "Mood", icon: <Palette /> },
        { key: "places", label: "Places", icon: <MapPin /> }
      ]} />

      <Sheets />
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
      <Toasts toasts={toasts} />
    </div>
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
        <div className="rounded-2xl bg-card-2 p-3.5 text-[13px] leading-snug text-ink-2">
          {WRITE_ENABLED ? "Changes sync to both of you instantly." : "This is a read-only preview of the new app. It shows your real data but can't change anything — keep using the current app for now."}
        </div>
      </div>
    </Sheet>
  );
}
