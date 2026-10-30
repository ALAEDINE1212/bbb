import type { ReactNode } from "react";
import { Sheet } from "./Sheet";
import { haptic } from "@/lib/haptics";

/** iOS action-sheet style confirmation for destructive actions (replaces window.confirm). */
export function Confirm({ open, title, message, confirmLabel, onConfirm, onClose }: {
  open: boolean; title: string; message?: ReactNode; confirmLabel: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title} subtitle={message}>
      <div className="space-y-2.5 pb-1">
        <button type="button" onClick={() => { haptic("warn"); onConfirm(); onClose(); }}
          className="h-[52px] w-full rounded-full bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[16px] font-semibold text-danger active:scale-[0.98]">
          {confirmLabel}
        </button>
        <button type="button" onClick={onClose} className="h-[52px] w-full rounded-full bg-card-2 text-[16px] font-semibold text-ink active:scale-[0.98]">Cancel</button>
      </div>
    </Sheet>
  );
}
