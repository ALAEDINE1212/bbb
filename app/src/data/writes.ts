// Every write the app can make, ported from the legacy index.html handlers line for line:
// same paths, same key order, same trimming/parsing, same "do nothing" cases.
// No imports with side effects so tests/parity.test.ts can run this file under plain Node.
import type { Snapshot } from "./types.ts";
import { CYCLE_DEFAULT_LEN, CYCLE_DEFAULT_PERIOD } from "./cycle.ts";

/** What a write needs from the outside world. Firebase in the app, a recorder in tests. */
export interface Backend {
  push(path: string, data: object): Promise<void>;
  update(path: string, data: object): Promise<void>;
  set(path: string, data: object | number): Promise<void>;
  remove(path: string): Promise<void>;
  /** Legacy toDisplayableImage + compressImage: returns the file that gets uploaded. */
  prepare(file: File): Promise<File>;
  /** uploadBytes + getDownloadURL. */
  upload(path: string, file: File): Promise<string>;
  now(): number;
}

/** Input the legacy handler would have refused (it returned early / alerted, writing nothing). */
export class InvalidInput extends Error {}

export interface TmdbPick { id: number; title: string; poster: string; overview: string; year: string; rating: string; type: string }

export interface TmdbRaw {
  id: number; media_type?: string; title?: string; name?: string; release_date?: string; first_air_date?: string;
  poster_path?: string | null; vote_average?: number; overview?: string;
}

/** legacy selectMovie() / mvEditSugg mapping. */
export function mapTmdb(r: TmdbRaw, imgBase: string): TmdbPick {
  return {
    id: r.id,
    title: r.title || r.name || "",
    poster: r.poster_path ? imgBase + r.poster_path : "",
    overview: (r.overview || "").slice(0, 220),
    year: (r.release_date || r.first_air_date || "").slice(0, 4),
    rating: r.vote_average ? r.vote_average.toFixed(1) : "",
    type: r.media_type === "tv" ? "Series" : "Movie"
  };
}

export function createWrites(be: Backend, snap: () => Snapshot) {
  let cycMigrated = false;
  return {
    /** legacy saveStory() */
    async saveStory(input: { editId: string; date: string; title: string; text: string; file?: File | null }) {
      const { editId, date } = input;
      const title = input.title.trim();
      const text = input.text.trim();
      const file = input.file;
      if (!date || !title || !text) throw new InvalidInput("Please fill in date, title, and text.");

      let photoUrl: string | null = null;
      let photoCaption = title;
      const events = snap().storyEvents;
      if (file) {
        const uploadFile = await be.prepare(file);
        const ts = be.now();
        photoUrl = await be.upload(`storyPhotos/${ts}_${uploadFile.name}`, uploadFile);
      } else if (editId && events[editId]?.photoUrl) {
        photoUrl = events[editId].photoUrl ?? null;
        photoCaption = events[editId].photoCaption || title;
      }

      const data = { date, title, text, photoUrl, photoCaption };
      if (editId) await be.update("storyEvents/" + editId, data);
      else await be.push("storyEvents", data);
    },

    /** legacy storyTimeline delete action (after confirm) */
    async deleteStory(id: string) {
      if (!id) return;
      await be.remove("storyEvents/" + id);
    },

    /** legacy meSub click */
    async addMeeting(input: { date: string; where: string; how: string }) {
      const d = input.date, w = input.where.trim(), h = input.how.trim();
      if (!d || !w || !h) throw new InvalidInput("Fill in date, where and how.");
      await be.push("meetings", { date: d, where: w, how: h });
    },

    /** legacy newMoSub */
    async setMood(input: { date: string; color: string; text: string }) {
      const d = input.date, tx = input.text.trim();
      if (!d) throw new InvalidInput("Pick a date.");
      await be.set("moods/" + d, { color: input.color, text: tx });
    },

    /** legacy mvSub click. Ratings arrive as the raw input strings, parsed like the old sliders. */
    async addMovie(input: { title: string; date: string; place: string; note: string; ratingA: string; ratingI: string }, pick: TmdbPick | null) {
      const t = input.title.trim(), d = input.date, p = input.place.trim(), n = input.note.trim();
      if (!t || !d) throw new InvalidInput("Add a title and a date.");
      const ra = parseInt(input.ratingA) || 0;
      const ri = parseInt(input.ratingI) || 0;
      const entry: Record<string, unknown> = { title: t, date: d, place: p, note: n, ratingA: ra, ratingI: ri };
      if (pick) {
        entry.poster = pick.poster;
        entry.overview = pick.overview;
        entry.year = pick.year;
        entry.tmdbRating = pick.rating;
        entry.type = pick.type;
        entry.tmdbId = pick.id;
      }
      await be.push("movies", entry);
    },

    /** legacy mvEditSave click */
    async editMovie(id: string, input: { title: string; date: string; place: string; note: string; ratingA: string; ratingI: string }, pick: TmdbPick | null) {
      if (!id) return;
      const upd: Record<string, unknown> = {
        title: input.title.trim() || snap().movies[id]?.title || "",
        date: input.date,
        place: input.place.trim(),
        note: input.note.trim(),
        ratingA: parseInt(input.ratingA) || 0,
        ratingI: parseInt(input.ratingI) || 0
      };
      if (pick) {
        upd.poster = pick.poster;
        upd.overview = pick.overview;
        upd.year = pick.year;
        upd.type = pick.type;
        upd.tmdbRating = pick.rating;
        upd.tmdbId = pick.id;
      }
      await be.update("movies/" + id, upd);
    },

    /** legacy plSub click. Coordinates arrive as raw strings; `gallery` is the "pick from uploaded photos" choice. */
    async addPlace(input: { name: string; date: string; lat: string; lng: string; note: string }, file?: File | null, gallery?: { url: string; caption: string } | null) {
      const n = input.name.trim(), d = input.date;
      const la = parseFloat(input.lat), lo = parseFloat(input.lng);
      const no = input.note.trim();
      if (!n || !d || isNaN(la) || isNaN(lo)) throw new InvalidInput("Please enter name, date, and valid coordinates.");
      let pu = "", pc = "";
      if (file) {
        const uploadFile = await be.prepare(file);
        pu = await be.upload(`placePhotos/${be.now()}_${uploadFile.name}`, uploadFile);
        pc = `Photo from ${n}`;
      } else if (gallery?.url) {
        pu = gallery.url;
        pc = gallery.caption || "";
      }
      await be.push("places", { name: n, date: d, lat: la, lng: lo, note: no, photoUrl: pu, photoCaption: pc });
    },

    /** legacy placeList edit action. The old prompts were not trimmed, so neither is this. */
    async editPlace(id: string, input: { name: string; date: string; lat: string; lng: string; note: string }) {
      if (!snap().places[id]) return;
      const la = parseFloat(input.lat), lo = parseFloat(input.lng);
      if (!input.name || !input.date || isNaN(la) || isNaN(lo)) throw new InvalidInput("Invalid values.");
      await be.update("places/" + id, { name: input.name, date: input.date, lat: la, lng: lo, note: input.note });
    },

    /** legacy placeList delete action (after confirm) */
    async deletePlace(id: string) {
      if (!snap().places[id]) return;
      await be.remove("places/" + id);
    },

    /** legacy phSub click */
    async addPhoto(file: File | null | undefined, caption: string) {
      if (!file) throw new InvalidInput("Please choose a photo.");
      const c = caption.trim();
      const f = await be.prepare(file);
      const ts = be.now();
      const url = await be.upload(`photos/${ts}_${f.name}`, f);
      await be.push("photos", { url, caption: c, path: `photos/${ts}_${f.name}` });
    },

    /** legacy cycleTracking listener: copy the old flat-root shape into config, once per session. */
    async migrateCycle() {
      const raw = snap().cycleTracking;
      const legacy = raw && !raw.config && raw.startDate ? raw : null;
      if (!legacy || cycMigrated) return;
      cycMigrated = true;
      await be.set("cycleTracking/config", {
        startDate: legacy.startDate,
        cycleLength: legacy.cycleLength || CYCLE_DEFAULT_LEN,
        periodLength: legacy.periodLength || CYCLE_DEFAULT_PERIOD,
        updatedAt: legacy.updatedAt || be.now()
      });
    },

    /** legacy cycleLogToday click (the UI confirms before removing). */
    async togglePeriodStart(date: string) {
      const history = snap().cycleTracking?.history || {};
      if (history[date]) await be.remove("cycleTracking/history/" + date);
      else await be.set("cycleTracking/history/" + date, be.now());
    },

    /** legacy cycleSave click. Inputs are the raw field strings. */
    async saveCycleSettings(input: { startDate: string; cycleLength: string; periodLength: string }) {
      const startDate = input.startDate;
      if (!startDate) throw new InvalidInput("Pick the first day of the last period.");
      const cycleLength = Math.min(45, Math.max(20, parseInt(input.cycleLength, 10) || CYCLE_DEFAULT_LEN));
      const periodLength = Math.min(10, cycleLength - 10, Math.max(1, parseInt(input.periodLength, 10) || CYCLE_DEFAULT_PERIOD));
      /* set() on config only — the logs node sits beside it and must survive. */
      await be.set("cycleTracking/config", { startDate, cycleLength, periodLength, updatedAt: be.now() });
    },

    /** legacy cycleClear click (the UI confirms first). Logs and history are kept. */
    async clearCycleSettings() {
      await be.remove("cycleTracking/config");
      /* Legacy installs also have the fields loose on the root; clear those one by one. */
      await be.update("cycleTracking", { startDate: null, cycleLength: null, periodLength: null, updatedAt: null }).catch(() => {});
      cycMigrated = false;
    },

    /** legacy symGrid click: toggle one symptom for a day; an empty day is removed. */
    async toggleSymptom(date: string, id: string) {
      const cur = (snap().cycleTracking?.logs?.[date] || []).slice();
      const at = cur.indexOf(id);
      if (at === -1) cur.push(id); else cur.splice(at, 1);
      if (cur.length) await be.set("cycleTracking/logs/" + date, cur);
      else await be.remove("cycleTracking/logs/" + date);
    }
  };
}

export type Writes = ReturnType<typeof createWrites>;
