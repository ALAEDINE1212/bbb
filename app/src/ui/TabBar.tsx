import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptics";

export interface TabItem<K extends string> { key: K; label: string; icon: ReactNode }

interface TabBarProps<K extends string> {
  items: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  onAdd?: () => void;
}

/** Floating frosted tab bar with a sliding highlight, plus Bevel's separate round "+" button. */
export function TabBar<K extends string>({ items, active, onChange, onAdd }: TabBarProps<K>) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-center gap-2.5 px-4 pb-[max(14px,env(safe-area-inset-bottom))]">
      <nav className="glass pointer-events-auto flex rounded-full p-1.5" aria-label="Sections">
        {items.map(item => {
          const on = item.key === active;
          return (
            <button
              key={item.key}
              type="button"
              aria-current={on ? "page" : undefined}
              onClick={() => { if (!on) { haptic("select"); onChange(item.key); } }}
              className={cn("relative flex w-[66px] flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-semibold transition-colors", on ? "text-ink" : "text-ink-2")}
            >
              {on && (
                <motion.span
                  layoutId="tab-highlight"
                  className="absolute inset-0 rounded-full bg-card shadow-card"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative [&>svg]:size-[21px]">{item.icon}</span>
              <span className="relative">{item.label}</span>
            </button>
          );
        })}
      </nav>
      {onAdd && (
        <button
          type="button"
          aria-label="Log something"
          onClick={() => { haptic("select"); onAdd(); }}
          className="glass pointer-events-auto grid size-[58px] place-items-center rounded-full text-ink transition-transform active:scale-90"
        >
          <Plus className="size-6" strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}
