import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarHeart, Camera, ChevronRight, Clapperboard, Pencil, X } from "lucide-react";
import { useData } from "@/data/store";
import { ndIso } from "@/data/dates";
import { nav } from "@/app/nav";
import { Card, SectionTitle } from "@/ui/Card";
import { Squircle } from "@/ui/Field";
import { Segmented } from "@/ui/Segmented";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptics";
import { AddPill, BackLink, Empty, monthLabel, ScreenTitle } from "./common";

export function Movies() {
  const movies = useData(s => s.movies);
  const [open, setOpen] = useState<string | null>(null);
  const [sort, setSort] = useState<"date" | "rating">("date");
  const list = Object.entries(movies).sort((a, b) =>
    sort === "date" ? (b[1].date || "").localeCompare(a[1].date || "")
      : (b[1].ratingA || 0) + (b[1].ratingI || 0) - ((a[1].ratingA || 0) + (a[1].ratingI || 0)));
  const rated = list.filter(([, m]) => m.ratingA || m.ratingI);
  const avg = (k: "ratingA" | "ratingI") => rated.length ? (rated.reduce((s, [, m]) => s + (m[k] || 0), 0) / rated.length).toFixed(1) : "–";

  const groups = new Map<string, typeof list>();
  for (const e of list) {
    const key = sort === "date" ? monthLabel(e[1].date) : "All";
    groups.set(key, [...(groups.get(key) || []), e]);
  }

  return (
    <div>
      <BackLink />
      <ScreenTitle action={<AddPill onClick={() => nav.open("movie")}>Movie</AddPill>}>Movies</ScreenTitle>

      <Card className="grid grid-cols-3 divide-x divide-line py-4 text-center">
        <Stat value={String(list.length)} label="watched" />
        <Stat value={avg("ratingA")} label="his avg" />
        <Stat value={avg("ratingI")} label="Ines avg" />
      </Card>

      <Segmented className="mt-3" value={sort} onChange={k => setSort(k)} options={[{ key: "date", label: "By date" }, { key: "rating", label: "By rating" }]} />
      {!list.length && <Card className="mt-3"><Empty icon={<Clapperboard />}>No movies yet.</Empty></Card>}

      {[...groups].map(([label, rows]) => (
        <div key={label}>
          {sort === "date" ? <div className="mb-1.5 mt-5 px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{label}</div> : <div className="h-3" />}
          <Card className="divide-y divide-line overflow-hidden">
            {rows.map(([id, m]) => {
              const isOpen = open === id;
              return (
                <div key={id}>
                  <button aria-expanded={isOpen} onClick={() => { haptic("tap"); setOpen(isOpen ? null : id); }} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-card-2">
                    {m.poster ? <img src={m.poster} alt="" loading="lazy" className="h-[46px] w-[32px] shrink-0 rounded-md object-cover" /> : <Squircle color="var(--accent-2)"><Clapperboard /></Squircle>}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">{m.title}</span>
                      <span className="block truncate text-[12px] text-ink-2">{[ndIso(m.date), m.year, m.type].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-accent-2">{m.ratingA}·{m.ratingI}</span>
                    <ChevronRight className={cn("size-4 text-ink-3 transition-transform duration-300", isOpen && "rotate-90")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 pl-[60px]">
                          <div className="grid grid-cols-3 gap-2">
                            <Tile value={`${m.ratingA}/10`} label="Him" />
                            <Tile value={`${m.ratingI}/10`} label="Ines" />
                            <Tile value={m.tmdbRating ? `★ ${m.tmdbRating}` : "–"} label="TMDB" />
                          </div>
                          {m.place && <p className="mt-2.5 text-[13px] text-ink-2">📍 {m.place}</p>}
                          {m.note && <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-snug text-ink">{m.note}</p>}
                          {m.overview && <p className="mt-2 text-[12px] leading-snug text-ink-3">{m.overview}</p>}
                          <button onClick={() => nav.open("movie", id)} className="mt-3 flex items-center gap-1.5 rounded-full bg-card-2 px-3.5 py-1.5 text-[13px] font-semibold text-ink"><Pencil className="size-3.5" />Edit</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </Card>
        </div>
      ))}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div><div className="font-display text-[24px] font-semibold tabular text-ink">{value}</div><div className="text-[12px] text-ink-3">{label}</div></div>;
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl px-2.5 py-2" style={{ background: "color-mix(in srgb, var(--accent-2) 14%, transparent)" }}>
      <div className="font-mono text-[13px] font-bold text-accent-2">{value}</div>
      <div className="text-[11px] text-ink-2">{label}</div>
    </div>
  );
}

export function Meetings() {
  const meetings = useData(s => s.meetings);
  const list = Object.entries(meetings).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""));
  return (
    <div>
      <BackLink />
      <ScreenTitle action={<AddPill onClick={() => nav.open("meeting")}>Meeting</AddPill>}>Meetings</ScreenTitle>
      <Card className="divide-y divide-line overflow-hidden">
        {!list.length && <Empty icon={<CalendarHeart />}>No meetings yet.</Empty>}
        {list.map(([id, m]) => (
          <div key={id} className="flex gap-3 px-4 py-3">
            <Squircle color="var(--accent-1)"><CalendarHeart /></Squircle>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-ink">{m.where || "Somewhere"}</div>
              <div className="text-[12px] text-ink-2">{m.date ? new Date(m.date).toLocaleDateString() : "?"}</div>
              {m.how && <p className="mt-1 whitespace-pre-wrap text-[14px] leading-snug text-ink">{m.how}</p>}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function Photos() {
  const photos = useData(s => s.photos);
  const [view, setView] = useState<string | null>(null);
  const list = Object.entries(photos).reverse();
  const current = view ? photos[view] : null;
  return (
    <div>
      <BackLink />
      <ScreenTitle action={<AddPill onClick={() => nav.open("photo")}>Photo</AddPill>}>Photos</ScreenTitle>
      {!list.length && <Card><Empty icon={<Camera />}>No photos yet.</Empty></Card>}
      <div className="grid grid-cols-3 gap-1.5">
        {list.map(([id, p]) => (
          <button key={id} onClick={() => { haptic("tap"); setView(id); }} className="aspect-square overflow-hidden rounded-[14px] bg-card-2">
            <img src={p.url} alt={p.caption} loading="lazy" className="size-full object-cover" />
          </button>
        ))}
      </div>
      {list.length > 0 && <SectionTitle>{list.length} photo{list.length === 1 ? "" : "s"}</SectionTitle>}

      <AnimatePresence>
        {current && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4" onClick={() => setView(null)}>
            <button aria-label="Close" className="glass absolute right-4 top-[max(16px,env(safe-area-inset-top))] grid size-10 place-items-center rounded-full text-ink"><X className="size-5" /></button>
            <img src={current.url} alt={current.caption} className="max-h-[80dvh] max-w-full rounded-2xl object-contain" />
            {current.caption && <p className="mt-3 text-center text-[15px] text-white">{current.caption}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
