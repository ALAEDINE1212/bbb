import { useSyncExternalStore } from "react";

export type Tab = "home" | "story" | "mood" | "places";
export type SubScreen = "movies" | "meetings" | "photos";
export type SheetKind = "log" | "story" | "mood" | "movie" | "meeting" | "place" | "photo" | "settings";

interface NavState { tab: Tab; sub: SubScreen | null; sheet: SheetKind | null; editId: string | null; sheetDate: string | null }

let state: NavState = { tab: initialTab(), sub: initialSub(), sheet: null, editId: null, sheetDate: null };
const listeners = new Set<() => void>();

function initialTab(): Tab {
  const h = location.hash.slice(1);
  return h === "story" || h === "mood" || h === "places" ? h : "home";
}
function initialSub(): SubScreen | null {
  const h = location.hash.slice(1);
  return h === "movies" || h === "meetings" || h === "photos" ? h : null;
}

function setState(patch: Partial<NavState>) {
  state = { ...state, ...patch };
  listeners.forEach(fn => fn());
}

export function useNav() {
  return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => state);
}

export const nav = {
  tab: (tab: Tab) => { setState({ tab, sub: null }); scrollTo({ top: 0 }); },
  sub: (sub: SubScreen | null) => { setState({ sub }); scrollTo({ top: 0 }); },
  open: (sheet: SheetKind, editId: string | null = null, sheetDate: string | null = null) => setState({ sheet, editId, sheetDate }),
  close: () => setState({ sheet: null })
};
