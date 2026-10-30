import { type ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CloudOff, Eye, Loader } from "lucide-react";

export type SyncStatus = "syncing" | "synced" | "offline" | "readonly" | "idle";

const COPY: Record<Exclude<SyncStatus, "idle">, { label: string; icon: ReactNode; tone: string }> = {
  syncing: { label: "Syncing…", icon: <Loader className="size-4 animate-spin text-ink-2" />, tone: "text-ink" },
  synced: { label: "Sync Complete", icon: <CheckCircle2 className="size-4 fill-positive text-on-accent" />, tone: "text-positive" },
  offline: { label: "Saved on device only", icon: <CloudOff className="size-4 text-danger" />, tone: "text-danger" },
  readonly: { label: "Preview · read-only", icon: <Eye className="size-4 text-ink-2" />, tone: "text-ink" }
};

/**
 * Bevel's floating "Syncing… / Sync Complete" capsule. "synced" shows briefly then hides; the other
 * states stay up while they're true, so the user always knows whether their data reached the cloud.
 */
export function SyncCapsule({ status }: { status: SyncStatus }) {
  const [visible, setVisible] = useState(status !== "idle");
  useEffect(() => {
    setVisible(status !== "idle");
    if (status !== "synced") return;
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, [status]);
  const copy = status === "idle" ? null : COPY[status];
  // One capsule stays mounted while visible and morphs between states (layout animation), instead of
  // re-keying per status - re-keyed copies could linger mid-exit and stack up.
  return (
    <AnimatePresence>
      {visible && copy && (
        <motion.div
          key="sync-capsule"
          layout
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          className="glass flex items-center gap-2 rounded-full px-4 py-2"
        >
          <motion.span key={status} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            {copy.icon}
            <span className={`whitespace-nowrap text-[14px] font-semibold ${copy.tone}`}>{copy.label}</span>
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
