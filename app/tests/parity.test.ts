// Parity: for every write, run the legacy handler (from ../index.html) and the new writes.ts on the
// same starting data and the same inputs, then require the recorded Firebase calls to be identical
// (paths, key order, values, upload paths). Starting data = the real backup + synthetic edge cases.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createWrites, InvalidInput, mapTmdb, type Backend, type TmdbRaw } from "../src/data/writes.ts";
import * as dates from "../src/data/dates.ts";
import type { Snapshot } from "../src/data/types.ts";
import { createLegacy, fakeCompress, frozenDate, type Op } from "./legacy.ts";

const NOW = Date.UTC(2026, 9, 30, 21, 15, 0); // a fixed "now" so ids/upload names are deterministic
const IMG = "https://image.tmdb.org/t/p/w342";

/* ── starting data ─────────────────────────────────────────────────── */

function loadBackup(): Record<string, any> | null {
  const explicit = process.env.UNIVERSE_BACKUP;
  const latest = join(homedir(), "universe-backups", "LATEST");
  const file = explicit || (existsSync(latest) ? join(readFileSync(latest, "utf8").trim(), "rtdb.json") : "");
  if (!file || !existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8"));
}

const backup = loadBackup();
if (!backup) console.warn("⚠ no backup found (UNIVERSE_BACKUP or ~/universe-backups/LATEST) — running synthetic cases only");

const synthetic = {
  storyEvents: {
    s_photo: { date: "2025-12-24", title: "Xmas", text: "Snow", photoUrl: "https://x/p.jpg", photoCaption: "Under the tree" },
    s_photo_nocap: { date: "2025-12-25", title: "Boxing", text: "Leftovers", photoUrl: "https://x/q.jpg" },
    s_plain: { date: "2026-01-01", title: "NYE", text: "Fireworks", photoUrl: null, photoCaption: "NYE" }
  },
  movies: {
    m_full: { title: "Dune", date: "2026-03-01", place: "Cinema", note: "wow", ratingA: 9, ratingI: 8, poster: IMG + "/d.jpg", overview: "Sand", year: "2021", tmdbRating: "7.8", type: "Movie", tmdbId: 438631 },
    m_bare: { title: "Home video", date: "2026-03-02", place: "", note: "", ratingA: 0, ratingI: 0 }
  },
  places: {
    p1: { name: "Paris", date: "2026-02-14", lat: 48.8566, lng: 2.3522, note: "Eiffel", photoUrl: "", photoCaption: "" },
    p2: { name: "Algiers", date: "2026-05-01", lat: 36.75, lng: 3.06, note: "", photoUrl: "https://x/a.jpg", photoCaption: "Photo from Algiers" }
  }
};

const state = {
  storyEvents: { ...(backup?.storyEvents || {}), ...synthetic.storyEvents },
  movies: { ...(backup?.movies || {}), ...synthetic.movies },
  places: { ...(backup?.places || {}), ...synthetic.places },
  meetings: backup?.meetings || {},
  moods: backup?.moods || {},
  photos: backup?.photos || {}
};

/* ── harness ───────────────────────────────────────────────────────── */

function newSide() {
  const ops: Op[] = [];
  const ser = (v: unknown) => JSON.parse(JSON.stringify(v, (_k, x) => (x === undefined ? "__undefined__" : x)));
  const be: Backend = {
    push: async (p, d) => { ops.push(["push", p, ser(d)]); },
    update: async (p, d) => { ops.push(["update", p, ser(d)]); },
    set: async (p, d) => { ops.push(["set", p, ser(d)]); },
    remove: async p => { ops.push(["remove", p]); },
    prepare: async f => fakeCompress(f),
    upload: async (p, f) => { ops.push(["upload", p, f.name]); return "https://fake.storage/" + p; },
    now: () => NOW
  };
  const snap: Snapshot = { loaded: true, ...structuredClone(state) } as Snapshot;
  return { ops, writes: createWrites(be, () => snap) };
}

function oldSide() {
  const legacy = createLegacy(NOW, frozenDate(NOW));
  legacy.setState({ sData: state.storyEvents, mvData: state.movies, plData: state.places, phData: state.photos, moods: state.moods });
  return legacy;
}

/** Runs one action on both sides; the recorded writes must match exactly. */
async function same(label: string, runOld: (o: ReturnType<typeof oldSide>) => Promise<unknown>, runNew: (n: ReturnType<typeof newSide>["writes"]) => Promise<unknown>) {
  const o = oldSide();
  const n = newSide();
  await runOld(o);
  let refused = false;
  try { await runNew(n.writes); } catch (err) {
    if (!(err instanceof InvalidInput)) throw err;
    refused = true;
  }
  assert.deepEqual(n.ops, o.ops, `${label}: writes differ`);
  // deepEqual ignores key order; whole-object writes must match byte for byte.
  assert.equal(JSON.stringify(n.ops), JSON.stringify(o.ops), `${label}: key order differs`);
  if (refused) assert.equal(o.ops.length, 0, `${label}: new refused but legacy wrote`);
  return o.ops.length;
}

const file = (name: string) => new File(["bytes"], name, { type: "image/png" });

/* ── tests ─────────────────────────────────────────────────────────── */

test("harness sanity: legacy handlers actually write", async () => {
  const o = oldSide();
  await o.addMeeting({ date: "2026-10-30", where: "Here", how: "Happy" });
  assert.deepEqual(o.ops, [["push", "meetings", { date: "2026-10-30", where: "Here", how: "Happy" }]]);
});

test("story: edit every existing moment (no new photo, new photo, padded text)", async () => {
  let wrote = 0;
  for (const [id, e] of Object.entries<any>(state.storyEvents)) {
    const base = { editId: id, date: e.date, title: e.title, text: e.text };
    wrote += await same(`edit ${id}`, o => o.saveStory(base), n => n.saveStory(base));
    const padded = { ...base, title: `  ${e.title}  `, text: `\n${e.text} ` };
    wrote += await same(`edit padded ${id}`, o => o.saveStory(padded), n => n.saveStory(padded));
    const withFile = { ...base, file: file("IMG 1.HEIC") };
    wrote += await same(`edit+photo ${id}`, o => o.saveStory(withFile), n => n.saveStory(withFile));
  }
  assert.ok(wrote >= Object.keys(state.storyEvents).length * 3);
});

test("story: new moments and refusals", async () => {
  const cases = [
    { editId: "", date: "2026-10-30", title: "New", text: "Body" },
    { editId: "", date: "2026-10-30", title: "New", text: "Body", file: file("a.png") },
    { editId: "", date: "2026-10-30", title: "x", text: "y", file: file("no-extension") },
    { editId: "missing-id", date: "2026-10-30", title: "Ghost", text: "edit of a deleted entry" },
    { editId: "", date: "", title: "No date", text: "x" },
    { editId: "", date: "2026-10-30", title: "   ", text: "x" },
    { editId: "", date: "2026-10-30", title: "x", text: "  \n " }
  ];
  for (const c of cases) await same(`story ${JSON.stringify(c.title)}`, o => o.saveStory(c), n => n.saveStory(c));
});

test("story: delete", async () => {
  for (const id of [...Object.keys(state.storyEvents), ""]) await same(`delete ${id}`, o => o.deleteStory(id), n => n.deleteStory(id));
});

test("meetings: re-add every real meeting, padding, refusals", async () => {
  const real = Object.values<any>(state.meetings).map(m => ({ date: m.date, where: m.where, how: m.how }));
  const cases = [...real, ...real.map(m => ({ ...m, where: ` ${m.where} `, how: `${m.how}\n` })),
    { date: "", where: "a", how: "b" }, { date: "2026-01-01", where: " ", how: "b" }, { date: "2026-01-01", where: "a", how: "" }];
  for (const c of cases) await same(`meeting ${c.where}`, o => o.addMeeting(c), n => n.addMeeting(c));
});

test("moods: set every real mood again (+ padded, empty, custom colour, no date)", async () => {
  const real = Object.entries<any>(state.moods).map(([date, m]) => ({ date, color: m.color, text: m.text ?? "" }));
  assert.ok(!backup || real.length === Object.keys(backup.moods).length);
  const cases = [...real, ...real.slice(0, 20).map(m => ({ ...m, text: `  ${m.text}  ` })),
    { date: "2026-10-30", color: "#123abc", text: "" }, { date: "2026-10-30", color: "#f4a5b5", text: "   " }, { date: "", color: "#f4a5b5", text: "x" }];
  for (const c of cases) await same(`mood ${c.date}`, o => o.setMood(c), n => n.setMood(c));
});

/** A TMDB search result reconstructed from a stored movie, so picks exercise real values. */
function rawFrom(m: any): TmdbRaw {
  return {
    id: m.tmdbId ?? 1, media_type: m.type === "Series" ? "tv" : "movie",
    ...(m.type === "Series" ? { name: m.title, first_air_date: `${m.year || ""}-01-01` } : { title: m.title, release_date: `${m.year || ""}-01-01` }),
    poster_path: m.poster ? m.poster.replace(/^.*\/w342/, "") : null,
    vote_average: m.tmdbRating ? Number(m.tmdbRating) : 0,
    overview: m.overview
  };
}

const rawEdge: TmdbRaw[] = [
  { id: 1, media_type: "movie", title: "A", release_date: "1999-03-31", poster_path: "/a.jpg", vote_average: 7.25, overview: "x".repeat(300) },
  { id: 2, media_type: "tv", name: "B", first_air_date: "2020-01-01", poster_path: null, vote_average: 0 },
  { id: 3, media_type: "movie" },
  { id: 4, media_type: "tv", title: "Has title", name: "And name", release_date: "", first_air_date: "2011-04-17", vote_average: 10 }
];

test("tmdb: pick mapping matches both legacy pickers", () => {
  const o = oldSide();
  const raws = [...rawEdge, ...Object.values<any>(state.movies).filter(m => m.tmdbId).map(rawFrom)];
  for (const r of raws) {
    const pick = mapTmdb(r, IMG);
    const add = o.selectMovie(r);
    assert.deepEqual({ id: pick.id, title: pick.title, poster: pick.poster, overview: pick.overview, year: pick.year, rating: pick.rating, type: pick.type }, add, `selectMovie ${r.id}`);
    const edit = o.editPick(r);
    assert.deepEqual({ title: pick.title, poster: pick.poster, overview: pick.overview, year: pick.year, type: pick.type, tmdbRating: pick.rating, tmdbId: pick.id }, edit, `edit pick ${r.id}`);
  }
});

test("movies: add every real movie (with and without a TMDB pick, odd ratings)", async () => {
  const ratings = [["7", "8"], ["", "abc"], ["10", "0"], ["3.9", " 5"]];
  let i = 0;
  for (const m of Object.values<any>(state.movies)) {
    const [ra, ri] = ratings[i++ % ratings.length];
    const form = { title: ` ${m.title} `, date: m.date, place: m.place ?? "", note: m.note ?? "", ratingA: ra, ratingI: ri };
    await same(`add ${m.title}`, o => o.addMovie(form, null), n => n.addMovie(form, null));
    if (m.tmdbId) {
      const raw = rawFrom(m);
      await same(`add+pick ${m.title}`, o => o.addMovie(form, raw), n => n.addMovie(form, mapTmdb(raw, IMG)));
    }
  }
  for (const bad of [{ title: " ", date: "2026-01-01" }, { title: "x", date: "" }]) {
    const form = { ...bad, place: "", note: "", ratingA: "1", ratingI: "1" };
    await same("add refused", o => o.addMovie(form, null), n => n.addMovie(form, null));
  }
});

test("movies: edit every real movie (same values, blank title fallback, new pick)", async () => {
  for (const [id, m] of Object.entries<any>(state.movies)) {
    const form = { title: m.title, date: m.date, place: m.place ?? "", note: m.note ?? "", ratingA: String(m.ratingA ?? ""), ratingI: String(m.ratingI ?? "") };
    await same(`edit ${id}`, o => o.editMovie(id, form, null), n => n.editMovie(id, form, null));
    const blank = { ...form, title: "  " };
    await same(`edit blank ${id}`, o => o.editMovie(id, blank, null), n => n.editMovie(id, blank, null));
    const raw = rawEdge[0];
    await same(`edit+pick ${id}`, o => o.editMovie(id, form, raw), n => n.editMovie(id, form, mapTmdb(raw, IMG)));
  }
  const ghost = { title: "", date: "", place: "", note: "", ratingA: "", ratingI: "" };
  await same("edit missing id", o => o.editMovie("nope", ghost, null), n => n.editMovie("nope", ghost, null));
});

test("places: add (file, gallery photo, none) and refusals", async () => {
  const gallery = Object.values<any>(state.photos)[0] ?? { url: "https://x/g.jpg", caption: "G" };
  const base = { name: " Oran ", date: "2026-07-01", lat: "35.6971", lng: "-0.6308", note: " beach " };
  const cases: [string, typeof base, File | null, { url: string; caption: string } | null][] = [
    ["plain", base, null, null],
    ["file", base, file("beach.png"), null],
    ["file wins over gallery", base, file("beach.png"), { url: gallery.url, caption: gallery.caption }],
    ["gallery", base, null, { url: gallery.url, caption: gallery.caption }],
    ["gallery no caption", base, null, { url: gallery.url, caption: "" }],
    ["lat with junk", { ...base, lat: "35.5abc" }, null, null],
    ["integer coords", { ...base, lat: "0", lng: "0" }, null, null],
    ["bad lat", { ...base, lat: "north" }, null, null],
    ["no name", { ...base, name: "  " }, null, null],
    ["no date", { ...base, date: "" }, null, null]
  ];
  for (const [label, v, f, g] of cases) await same(`place ${label}`, o => o.addPlace(v, f, g), n => n.addPlace(v, f, g));
});

test("places: edit and delete", async () => {
  const edits = [
    { name: " Paris ", date: "2026-02-15", lat: "48.85", lng: "2.35", note: " untrimmed " },
    { name: "Paris", date: "2026-02-15", lat: "x", lng: "2.35", note: "" },
    { name: "", date: "2026-02-15", lat: "1", lng: "2", note: "" }
  ];
  for (const id of [...Object.keys(state.places), "missing"]) {
    for (const e of edits) await same(`edit place ${id}`, o => o.editPlace(id, e), n => n.editPlace(id, e));
    await same(`delete place ${id}`, o => o.deletePlace(id), n => n.deletePlace(id));
  }
});

test("photos: upload and refusal", async () => {
  await same("photo", o => o.addPhoto(file("IMG_0001.HEIC"), "  us  "), n => n.addPhoto(file("IMG_0001.HEIC"), "  us  "));
  await same("photo no caption", o => o.addPhoto(file("a.webp"), ""), n => n.addPhoto(file("a.webp"), ""));
  await same("photo missing", o => o.addPhoto(null, "x"), n => n.addPhoto(null, "x"));
});

test("dates: helpers match legacy across month ends, leap days and DST", () => {
  const instants = [
    "2026-10-30T21:15:00Z", "2026-10-25T00:30:00Z", "2026-03-29T01:30:00Z", "2026-12-31T23:59:59Z",
    "2027-01-31T12:00:00Z", "2028-02-29T08:00:00Z", "2026-07-05T00:00:01Z", "2026-04-12T23:00:00Z", "2025-10-25T00:00:00Z"
  ].map(s => Date.parse(s));
  const RealDate = globalThis.Date;
  for (const t of instants) {
    const Frozen = frozenDate(t);
    const o = createLegacy(t, Frozen).global;
    globalThis.Date = Frozen;
    try {
      const label = new RealDate(t).toISOString();
      assert.equal(dates.iso(), o.iso(), `iso @ ${label}`);
      for (const d of ["2025-08-16", "2025-10-25", "2026-10-30", "2027-02-28"]) {
        assert.equal(dates.dBetween(d), o.dBetween(d), `dBetween ${d} @ ${label}`);
        assert.equal(dates.dUntil(d), o.dUntil(d), `dUntil ${d} @ ${label}`);
      }
      for (const md of ["07-05", "04-12", "02-29", "12-31", "01-01"]) assert.equal(dates.nextOcc(md).getTime(), o.nextOcc(md).getTime(), `nextOcc ${md} @ ${label}`);
      // legacy nextMiv reads the DATE_OFF constant; ours takes it as an argument
      o.DATE_OFF = "2025-10-25";
      assert.equal(dates.nextMiv("2025-10-25")?.getTime(), new RealDate(o.nextMiv()).getTime(), `nextMiv @ ${label}`);
    } finally {
      globalThis.Date = RealDate;
    }
  }
});
