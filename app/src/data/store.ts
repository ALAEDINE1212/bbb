import { useSyncExternalStore } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, onValue, push, ref, remove, set, update } from "firebase/database";
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from "firebase/storage";
import { firebaseConfig, STORAGE_BUCKET, TMDB_IMG_LG, TMDB_KEY, WRITE_ENABLED } from "@/config";
import type { Snapshot } from "./types";
import { prepareImage } from "./images";
import { createWrites, InvalidInput, mapTmdb, type Backend, type TmdbPick, type TmdbRaw } from "./writes";

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
const storage = getStorage(app, STORAGE_BUCKET);

const PATHS = ["storyEvents", "meetings", "moods", "movies", "places", "photos", "cycleTracking"] as const;
type Path = (typeof PATHS)[number];

let snap: Snapshot = { loaded: false, storyEvents: {}, meetings: {}, moods: {}, movies: {}, places: {}, photos: {}, cycleTracking: null };
const seen = new Set<Path>();
const listeners = new Set<() => void>();
let started = false;

function emit() { listeners.forEach(fn => fn()); }

function start() {
  if (started) return;
  started = true;
  for (const path of PATHS) {
    onValue(ref(db, path), s => {
      seen.add(path);
      snap = { ...snap, [path]: s.val() || (path === "cycleTracking" ? null : {}), loaded: seen.size === PATHS.length };
      emit();
      if (path === "cycleTracking" && WRITE_ENABLED) void writes.migrateCycle().catch(() => {});
    }, () => { seen.add(path); snap = { ...snap, loaded: seen.size === PATHS.length }; emit(); });
  }
}

export function subscribe(fn: () => void) { start(); listeners.add(fn); return () => { listeners.delete(fn); }; }
export function getSnapshot() { return snap; }
export function useData<T>(select: (s: Snapshot) => T): T { return select(useSyncExternalStore(subscribe, getSnapshot)); }

/* ── Writes ──────────────────────────────────────────────────────────────
   The logic lives in writes.ts (parity-tested against the legacy code). This file only
   plugs in Firebase and refuses everything when the build is read-only, so screens only
   say "Saved" when something really was. */

export class ReadOnlyError extends Error { constructor() { super("Preview is read-only — nothing was saved."); } }
export { InvalidInput, type TmdbPick };

const firebase: Backend = {
  push: async (path, data) => { await push(ref(db, path), data); },
  update: (path, data) => update(ref(db, path), data),
  set: (path, data) => set(ref(db, path), data),
  remove: path => remove(ref(db, path)),
  prepare: file => prepareImage(file),
  upload: async (path, file) => { const r = storageRef(storage, path); await uploadBytes(r, file); return getDownloadURL(r); },
  now: () => Date.now()
};

const writes = createWrites(firebase, getSnapshot);

function guard() { if (!WRITE_ENABLED) throw new ReadOnlyError(); }

type W = typeof writes;
function guarded<K extends keyof W>(key: K): W[K] {
  return ((...args: unknown[]) => { guard(); return (writes[key] as (...a: unknown[]) => Promise<void>)(...args); }) as W[K];
}

export const saveStory = guarded("saveStory");
export const deleteStory = guarded("deleteStory");
export const addMeeting = guarded("addMeeting");
export const setMood = guarded("setMood");
export const addMovie = guarded("addMovie");
export const editMovie = guarded("editMovie");
export const addPlace = guarded("addPlace");
export const editPlace = guarded("editPlace");
export const deletePlace = guarded("deletePlace");
export const addPhoto = guarded("addPhoto");
export const togglePeriodStart = guarded("togglePeriodStart");
export const saveCycleSettings = guarded("saveCycleSettings");
export const clearCycleSettings = guarded("clearCycleSettings");
export const toggleSymptom = guarded("toggleSymptom");

export async function tmdbSearch(query: string): Promise<TmdbPick[]> {
  try {
    const r = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`);
    if (!r.ok) return [];
    const data = await r.json();
    return ((data.results || []) as TmdbRaw[]).filter(x => x.media_type === "movie" || x.media_type === "tv").slice(0, 7).map(x => mapTmdb(x, TMDB_IMG_LG));
  } catch { return []; }
}
