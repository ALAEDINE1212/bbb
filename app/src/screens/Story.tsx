import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { deleteStory, useData } from "@/data/store";
import { ndIso } from "@/data/dates";
import { nav } from "@/app/nav";
import { runSave } from "@/app/feedback";
import { Card, SectionTitle } from "@/ui/Card";
import { Confirm } from "@/ui/Confirm";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptics";
import { AddPill, Empty, ScreenTitle } from "./common";

export function Story() {
  const events = useData(s => s.storyEvents);
  const [open, setOpen] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const sorted = Object.entries(events).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""));
  const byYear = new Map<string, typeof sorted>();
  for (const e of sorted) {
    const y = (e[1].date || "").slice(0, 4) || "Undated";
    byYear.set(y, [...(byYear.get(y) || []), e]);
  }

  return (
    <div>
      <ScreenTitle action={<AddPill onClick={() => nav.open("story")}>Moment</AddPill>}>Our Story</ScreenTitle>
      {!sorted.length && <Card><Empty icon={<BookOpen />}>No moments yet — add your first one.</Empty></Card>}

      {[...byYear].map(([year, list], i) => (
        <div key={year}>
          {i > 0 || byYear.size > 1 ? <SectionTitle>{year}</SectionTitle> : null}
          <Card className="divide-y divide-line overflow-hidden">
            {list.map(([id, e]) => {
              const isOpen = open === id;
              return (
                <div key={id}>
                  <button aria-expanded={isOpen} onClick={() => { haptic("tap"); setOpen(isOpen ? null : id); }} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-card-2">
                    {e.photoUrl
                      ? <img src={e.photoUrl} alt="" loading="lazy" className="size-[34px] shrink-0 rounded-[10px] object-cover" />
                      : <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-accent-1 text-on-accent"><BookOpen className="size-[18px]" /></span>}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">{e.title}</span>
                      <span className="block truncate text-[12px] text-ink-2">{ndIso(e.date)}</span>
                    </span>
                    <ChevronRight className={cn("size-4 text-ink-3 transition-transform duration-300", isOpen && "rotate-90")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4">
                          {e.photoUrl && <img src={e.photoUrl} alt={e.photoCaption || ""} className="mb-3 max-h-[420px] w-full rounded-2xl object-cover" />}
                          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{e.text}</p>
                          <div className="mt-3 flex gap-2">
                            <button onClick={() => nav.open("story", id)} className="flex items-center gap-1.5 rounded-full bg-card-2 px-3.5 py-1.5 text-[13px] font-semibold text-ink"><Pencil className="size-3.5" />Edit</button>
                            <button onClick={() => setDeleting(id)} className="flex items-center gap-1.5 rounded-full bg-card-2 px-3.5 py-1.5 text-[13px] font-semibold text-danger"><Trash2 className="size-3.5" />Delete</button>
                          </div>
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

      <Confirm
        open={deleting != null}
        title="Delete this moment?"
        message={deleting ? `"${events[deleting]?.title}" will be removed for both of you.` : undefined}
        confirmLabel="Delete moment"
        onClose={() => setDeleting(null)}
        onConfirm={async () => { const id = deleting!; setDeleting(null); if (await runSave(() => deleteStory(id), "Moment deleted")) setOpen(null); }}
      />
    </div>
  );
}
