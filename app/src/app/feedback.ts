import { useSyncExternalStore } from "react";
import type { Toast } from "@/ui/Toasts";
import { haptic } from "@/lib/haptics";
import { InvalidInput, ReadOnlyError } from "@/data/store";

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

export function toast(message: string, kind: Toast["kind"] = "success") {
  const id = nextId++;
  toasts = [...toasts, { id, message, kind }];
  listeners.forEach(fn => fn());
  haptic(kind === "success" ? "success" : "warn");
  setTimeout(() => { toasts = toasts.filter(t => t.id !== id); listeners.forEach(fn => fn()); }, 2800);
}

export function useToasts() {
  return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => toasts);
}

/** Run a save; toast the honest outcome. Resolves true only if it really saved. */
export async function runSave(action: () => Promise<void>, success = "Saved 💕"): Promise<boolean> {
  try {
    await action();
    toast(success);
    return true;
  } catch (err) {
    toast(err instanceof ReadOnlyError || err instanceof InvalidInput ? err.message : `Couldn't save: ${(err as Error)?.message || "unknown error"}`, "info");
    return false;
  }
}
