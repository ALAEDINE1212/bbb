import { useSyncExternalStore } from "react";

// Per-device settings kept in localStorage under the SAME keys the legacy app used
// ("nextMeetingDate", "wxCities", …), so nothing is lost when the new app takes over the domain.
const listeners = new Set<() => void>();

export function readLocal(key: string): string {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
}

export function writeLocal(key: string, value: string | null) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* storage blocked: the setting just won't stick */ }
  listeners.forEach(fn => fn());
}

export function useLocal(key: string): string {
  return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => readLocal(key));
}
