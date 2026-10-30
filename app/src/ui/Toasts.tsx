import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info } from "lucide-react";

export interface Toast { id: number; message: string; kind: "success" | "info" }

/**
 * Glass toasts stacked above the floating tab bar. Feed it from your store; play
 * haptic(kind === "success" ? "success" : "warn") when a new one arrives.
 * Any failed save MUST surface here — never fail silently.
 */
export function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[104px] z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="glass flex max-w-[420px] items-center gap-2.5 rounded-full px-4 py-2.5 text-[14px] font-medium text-ink"
          >
            {toast.kind === "success" ? <CheckCircle2 className="size-4 shrink-0 text-positive" /> : <Info className="size-4 shrink-0 text-caution" />}
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
