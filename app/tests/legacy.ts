// Loads the ORIGINAL write handlers out of ../index.html and runs them in a Node vm with a fake
// DOM and a recording Firebase, so the new code can be compared against the old code itself.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

export type Op = [string, ...unknown[]];

const LEGACY_PATH = fileURLToPath(new URL("../../index.html", import.meta.url));
export const legacySource = readFileSync(LEGACY_PATH, "utf8");

/** Returns the balanced `{ ... }` block starting at the first "{" at or after `from`. */
function block(src: string, from: number): number {
  let i = src.indexOf("{", from);
  if (i < 0) throw new Error("no block");
  let depth = 0;
  const tpl: number[] = []; // brace depth at which each open template literal resumes
  for (; i < src.length; i++) {
    const c = src[i];
    if (tpl.length && depth === tpl[tpl.length - 1] && c === "`") { tpl.pop(); continue; }
    if (tpl.length && depth === tpl[tpl.length - 1]) {
      // inside template text
      if (c === "\\") { i++; continue; }
      if (c === "$" && src[i + 1] === "{") { depth++; i++; }
      continue;
    }
    if (c === "/" && src[i + 1] === "/") { i = src.indexOf("\n", i); continue; }
    if (c === "/" && src[i + 1] === "*") { i = src.indexOf("*/", i) + 1; continue; }
    if (c === "'" || c === '"') {
      for (i++; src[i] !== c; i++) if (src[i] === "\\") i++;
      continue;
    }
    if (c === "`") { tpl.push(depth); continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return i + 1; }
  }
  throw new Error("unbalanced block");
}

/** Source text from `marker` (exclusive when `skipMarker`) through the end of the next block. */
export function extract(marker: string, opts: { skipMarker?: boolean; occurrence?: number } = {}): string {
  let at = -1;
  for (let n = 0; n <= (opts.occurrence ?? 0); n++) {
    at = legacySource.indexOf(marker, at + 1);
    if (at < 0) throw new Error(`legacy marker not found: ${marker}`);
  }
  const start = opts.skipMarker ? at + marker.length : at;
  return legacySource.slice(start, block(legacySource, at));
}

/** An object that tolerates any DOM-ish use: every property is itself, calling it returns itself. */
function inert(): any {
  const fn = function () {};
  const p: any = new Proxy(fn, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => "" : k === "then" ? undefined : p),
    set: () => true,
    apply: () => p
  });
  return p;
}

export interface LegacyState {
  sData?: Record<string, unknown>;
  mvData?: Record<string, unknown>;
  plData?: Record<string, unknown>;
  phData?: Record<string, unknown>;
  moods?: Record<string, unknown>;
}

export function createLegacy(now: number, DateImpl: DateConstructor) {
  const ops: Op[] = [];
  const fields = new Map<string, any>();
  const prompts: (string | null)[] = [];
  const ser = (v: unknown) => JSON.parse(JSON.stringify(v, (_k, x) => (x === undefined ? "__undefined__" : x)));
  const ref = (p: string) => ({ __path: p });

  const context: Record<string, unknown> = {
    console, Math, JSON, Number, String, parseInt, parseFloat, isNaN, Object, Array, Promise, Error,
    File, Date: DateImpl,
    db: {}, storage: {},
    TMDB_IMG_LG: "https://image.tmdb.org/t/p/w342",
    TMDB_IMG: "https://image.tmdb.org/t/p/w185",
    $: (id: string) => fields.get(id) ?? inert(),
    document: inert(),
    dr: (_db: unknown, p: string) => ref(p),
    sr: (_s: unknown, p: string) => ref(p),
    sRef: ref("storyEvents"), meRef: ref("meetings"), mvRef: ref("movies"), plRef: ref("places"), phRef: ref("photos"), moRef: ref("moods"),
    push: async (r: any, data: unknown) => { ops.push(["push", r.__path, ser(data)]); },
    update: async (r: any, data: unknown) => { ops.push(["update", r.__path, ser(data)]); },
    set: async (r: any, data: unknown) => { ops.push(["set", r.__path, ser(data)]); },
    remove: async (r: any) => { ops.push(["remove", r.__path]); },
    uploadBytes: async (r: any, f: File) => { ops.push(["upload", r.__path, f.name]); },
    getDownloadURL: async (r: any) => "https://fake.storage/" + r.__path,
    toDisplayableImage: async (f: File) => f,
    toDisplayableImage2: async (f: File) => f,
    compressImage: async (f: File) => fakeCompress(f),
    hearts: () => {}, closeStoryModal: () => {}, wireSlider: () => {}, clearMovieSelection: () => {}, closeMvEdit: () => {}, showToast: () => {}, alert: () => {},
    confirm: () => true,
    prompt: () => (prompts.length ? prompts.shift()! : null),
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    setTimeout: () => 0
  };
  context.Date = DateImpl;
  vm.createContext(context);

  // Module-level state of the legacy script, declared with `var` so the vm global can see/set it.
  const script = `
    var sData = {}, mvData = {}, plData = {}, phData = {}, moods = {};
    var selectedColor = '#f4a5b5', mvSelected = null, mvEditSel = null, mvEditId = null;
    ${extract("const iso = () =>").replace("const iso", "var iso")};
    ${extract("function dBetween(")}
    ${extract("function dUntil(")}
    ${extract("function nextOcc(")}
    ${extract("function nextMiv(")}
    ${extract("function nd(")}
    ${extract("async function saveStory()")}
    ${extract("function selectMovie(r)")}
    var __meSub = ${extract("$('meSub').addEventListener('click', ", { skipMarker: true })};
    var __moSub = ${extract("const newMoSub = ", { skipMarker: true })};
    var __mvSub = ${extract("$('mvSub').addEventListener('click', ", { skipMarker: true })};
    var __mvEditSave = ${extract("$('mvEditSave').addEventListener('click', ", { skipMarker: true })};
    var __mvEditPick = ${extract("$('mvEditSugg').addEventListener('mousedown', ", { skipMarker: true })};
    var __plSub = ${extract("$('plSub').addEventListener('click', ", { skipMarker: true })};
    var __placeList = ${extract("$('placeList').addEventListener('click', ", { skipMarker: true })};
    var __storyTimeline = ${extract("$('storyTimeline').addEventListener('click', ", { skipMarker: true, occurrence: 1 })};
    var __phSub = ${extract("$('phSub').addEventListener('click', ", { skipMarker: true })};
  `;
  vm.runInContext(script, context, { filename: "legacy-index.html" });
  const g = context as any;

  const input = (values: Record<string, unknown>) => {
    fields.clear();
    for (const [id, v] of Object.entries(values)) fields.set(id, v && (typeof v === "object" || typeof v === "function") ? v : { value: v ?? "" });
  };
  const fileField = (f: File | null) => ({ value: "", files: f ? [f] : [] });

  void now;
  return {
    ops,
    global: g,
    setState(s: LegacyState) {
      for (const [k, v] of Object.entries(s)) g[k] = structuredClone(v);
    },
    async saveStory(v: { editId: string; date: string; title: string; text: string; file?: File | null }) {
      input({ storyEditId: v.editId, storyDate: v.date, storyTitle: v.title, storyText: v.text, storyPhotoFile: fileField(v.file ?? null) });
      await g.saveStory();
    },
    async deleteStory(id: string) {
      const card = { dataset: { id } };
      const btn = { dataset: { action: "delete" }, closest: () => card };
      await g.__storyTimeline({ target: { closest: () => btn } });
    },
    async addMeeting(v: { date: string; where: string; how: string }) {
      input({ meD: v.date, meW: v.where, meH: v.how });
      await g.__meSub();
    },
    async setMood(v: { date: string; color: string; text: string }) {
      g.selectedColor = v.color;
      input({ moDa: v.date, moTx: v.text });
      await g.__moSub();
    },
    selectMovie(raw: unknown) {
      g.mvSelected = null;
      g.selectMovie(raw);
      return ser(g.mvSelected);
    },
    editPick(raw: unknown) {
      g.mvEditSel = null;
      fields.clear();
      fields.set("mvEditSugg", { _results: [raw], classList: inert() });
      g.__mvEditPick({ target: { closest: () => ({ dataset: { idx: "0" } }) }, preventDefault() {} });
      return ser(g.mvEditSel);
    },
    async addMovie(v: { title: string; date: string; place: string; note: string; ratingA: string; ratingI: string }, raw: unknown | null) {
      g.mvSelected = null;
      if (raw) g.selectMovie(raw);
      input({ mvT: v.title, mvD: v.date, mvP: v.place, mvN: v.note, mvRa: v.ratingA, mvRi: v.ratingI });
      await g.__mvSub();
    },
    async editMovie(id: string, v: { title: string; date: string; place: string; note: string; ratingA: string; ratingI: string }, raw: unknown | null) {
      g.mvEditSel = null;
      if (raw) this.editPick(raw);
      g.mvEditId = id;
      input({ mvEditT: v.title, mvEditD: v.date, mvEditP: v.place, mvEditN: v.note, mvEditRa: v.ratingA, mvEditRi: v.ratingI });
      await g.__mvEditSave();
    },
    async addPlace(v: { name: string; date: string; lat: string; lng: string; note: string }, file: File | null, gallery: { url: string; caption: string } | null) {
      const option = { getAttribute: (a: string) => (a === "data-caption" ? gallery?.caption ?? null : null) };
      input({
        plN: v.name, plD: v.date, plLa: v.lat, plLo: v.lng, plNo: v.note, plPf: fileField(file),
        plPs: { value: gallery?.url ?? "", selectedIndex: 0, options: [option] }
      });
      await g.__plSub();
    },
    async editPlace(id: string, v: { name: string; date: string; lat: string; lng: string; note: string }) {
      prompts.length = 0;
      prompts.push(v.name, v.date, v.lat, v.lng, v.note);
      await g.__placeList({ target: { closest: () => ({ dataset: { id, a: "edit" } }) } });
    },
    async deletePlace(id: string) {
      await g.__placeList({ target: { closest: () => ({ dataset: { id, a: "del" } }) } });
    },
    async addPhoto(file: File | null, caption: string) {
      input({ phF: fileField(file), phC: caption, pus: inert() });
      await g.__phSub();
    }
  };
}

/** Stand-in for image re-encoding, used identically on both sides: renames to .jpg like compressImage. */
export function fakeCompress(f: File): File {
  return new File([f], f.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

/** A Date whose "now" is pinned, for both the legacy vm and the new modules. */
export function frozenDate(now: number): DateConstructor {
  const Real = Date;
  class Frozen extends Real {
    constructor(...args: unknown[]) {
      if (args.length === 0) super(now);
      else super(...(args as [number]));
    }
    static now() { return now; }
  }
  return Frozen as unknown as DateConstructor;
}
