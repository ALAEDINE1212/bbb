// Lumi's system prompt, ported line for line from the legacy index.html ("Context builders").
// Lumi is handed the WHOLE universe on every message: every mood, movie, story moment, place,
// meeting, photo caption and the current cycle status. Pure functions of the state passed in,
// so tests/parity.test.ts can compare the finished prompt with the legacy one.
import { DATE_MET, DATE_OFF } from "../config.ts";
import { dBetween, dUntil, nd } from "../data/dates.ts";
import { PHASE_NOTE, SYM_LABEL, cycleConfig, cycleInfo, cycleSettings, inDays, joinList, type CycleRoot } from "../data/cycle.ts";

export const AI_NAME = "Lumi";
const CYCLE_OWNER = "Ines";

export type Section = "home" | "story" | "movies" | "meetings" | "places" | "mood" | "photos" | "together";

type Rec = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface LumiState {
  moods: Rec; movies: Rec; storyEvents: Rec; places: Rec; photos: Rec; meetings: Rec;
  cycleTracking: CycleRoot | null;
  nextMeetingDate: string;
}

/* The database only stores the hex; map it back so Lumi reads "Love", not "#e8607a".
   "Happy" (#f4a5b5) was missing from the legacy table, so every Happy day read as
   "custom colour" — fixed here on purpose (the parity test applies the same fix). */
const MOOD_LABELS: Record<string, string> = {
  "#f4a5b5": "Happy",
  "#f9d56e": "Joyful", "#e8607a": "Love", "#7ec8a0": "Calm",
  "#6bbfd4": "Chill", "#7ab4e0": "Sad", "#c49fd8": "Dreamy",
  "#d4956a": "Cozy", "#8090a8": "Stressed", "#6b6070": "Low"
};
const moodName = (hex: unknown) => MOOD_LABELS[String(hex || "").trim().toLowerCase()] || "custom colour";

const monthName = (ym: string) => {
  const p = ym.split("-");
  const d = new Date(+p[0], +p[1] - 1, 1);
  return isNaN(d.getTime()) ? ym : d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

const aiNum = (v: unknown) => { const n = parseFloat(String(v)); return isFinite(n) ? n : null; };
const clip = (s: unknown, n: number) => {
  const t = String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
};

/* Each category gets a character budget; whatever does not fit is dropped from the far end and
   counted, so Lumi knows a list is partial instead of believing the missing entries never happened. */
function fit(lines: string[], budget: number) {
  const out: string[] = [];
  let used = 0;
  for (let i = 0; i < lines.length; i++) {
    if (used + lines[i].length + 1 > budget) break;
    out.push(lines[i]);
    used += lines[i].length + 1;
  }
  const cut = lines.length - out.length;
  if (cut > 0) out.push("  (" + cut + " further entries exist but are not printed here — " + "say so rather than claiming they do not exist.)");
  return out.join("\n");
}

function moodsBlock(moods: Rec) {
  const all = Object.entries(moods || {}).filter(e => /^\d{4}-\d{2}-\d{2}$/.test(e[0])).sort((a, b) => b[0].localeCompare(a[0]));
  if (!all.length) return "MOODS — nothing has been coloured in yet.";

  const tally: Record<string, number> = {};
  all.forEach(e => { const n = moodName(e[1] && e[1].color); tally[n] = (tally[n] || 0) + 1; });
  const top = Object.keys(tally).sort((a, b) => tally[b] - tally[a]).slice(0, 5).map(n => n + " x" + tally[n]).join(", ");

  const byMonth: { key: string; rows: string[] }[] = [];
  let cur: { key: string; rows: string[] } | null = null;
  all.forEach(e => {
    const date = e[0], m = e[1] || {};
    const key = date.slice(0, 7);
    if (!cur || cur.key !== key) { cur = { key, rows: [] }; byMonth.push(cur); }
    cur.rows.push("  " + date + " — " + moodName(m.color) + (m.text ? ": " + clip(m.text, 160) : ""));
  });

  const lines: string[] = [];
  byMonth.forEach(g => {
    lines.push(monthName(g.key) + " (" + g.rows.length + " logged):");
    g.rows.forEach(r => lines.push(r));
  });

  return "MOODS — every day either of them has ever coloured in, newest month first. " +
    all.length + " entries across " + byMonth.length + " month" + (byMonth.length === 1 ? "" : "s") +
    ", from " + all[all.length - 1][0] + " to " + all[0][0] + ". Most used: " + top + ".\n" +
    fit(lines, 9000);
}

function moviesBlock(mvData: Rec) {
  const all = Object.values<Rec>(mvData || {}).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (!all.length) return "MOVIES & SHOWS — nothing logged yet.";

  const avg = (k: string) => {
    const v = all.map(m => aiNum(m[k])).filter((n): n is number => n !== null);
    return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) + "/10 across " + v.length : null;
  };
  const best = (k: string) => all.filter(m => aiNum(m[k]) !== null).sort((a, b) => aiNum(b[k])! - aiNum(a[k])!).slice(0, 5)
    .map(m => (m.title || "Untitled") + " " + m[k]).join(", ");
  const gap = (m: Rec) => Math.abs(aiNum(m.ratingA)! - aiNum(m.ratingI)!);
  const split = all.filter(m => aiNum(m.ratingA) !== null && aiNum(m.ratingI) !== null && gap(m) >= 3)
    .sort((a, b) => gap(b) - gap(a)).slice(0, 8)
    .map(m => (m.title || "Untitled") + " (Alaedine " + m.ratingA + " / Ines " + m.ratingI + ")");
  const unrated = all.filter(m => aiNum(m.ratingA) === null && aiNum(m.ratingI) === null).length;

  const lines = all.map(m => {
    const r: string[] = [];
    if (m.ratingA) r.push("Alaedine " + m.ratingA + "/10");
    if (m.ratingI) r.push("Ines " + m.ratingI + "/10");
    return "  - " + (m.title || "Untitled") + (m.year ? " (" + m.year + ")" : "") +
      (m.type ? " [" + m.type + "]" : "") + (m.date ? " · logged " + m.date : "") +
      (r.length ? " — " + r.join(", ") : " — not rated yet") +
      (m.note ? " — note: " + clip(m.note, 200) : "");
  });

  const stats = [
    "Alaedine averages " + (avg("ratingA") || "nothing rated yet"),
    "Ines averages " + (avg("ratingI") || "nothing rated yet"),
    unrated ? unrated + " title" + (unrated === 1 ? "" : "s") + " still unrated" : ""
  ].filter(Boolean).join(" · ");

  return "MOVIES & SHOWS — the complete list, " + all.length + " title" + (all.length === 1 ? "" : "s") + ", newest first.\n" + stats + ".\n" +
    (best("ratingA") ? "Alaedine rated highest: " + best("ratingA") + ".\n" : "") +
    (best("ratingI") ? "Ines rated highest: " + best("ratingI") + ".\n" : "") +
    (split.length ? "They disagreed most on: " + split.join(", ") + ".\n" : "") +
    fit(lines, 9000);
}

function placesBlock(plData: Rec) {
  const all = Object.values<Rec>(plData || {}).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (!all.length) return "PLACES — nothing pinned on the map yet.";
  const lines = all.map(p => "  - " + (p.name || "Unnamed") + (p.date ? " (" + p.date + ")" : "") +
    (p.note ? " — " + clip(p.note, 220) : "") + (p.photoCaption ? " — photo: " + clip(p.photoCaption, 90) : ""));
  return "PLACES — every spot they have pinned together, " + all.length + " in all, newest first.\n" + fit(lines, 5000);
}

function storyBlock(sData: Rec) {
  const all = Object.values<Rec>(sData || {}).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  if (!all.length) return "OUR STORY — no memories written down yet.";
  const lines = all.map(e => "  - " + (e.date || "undated") + " — " + (e.title || "Untitled") +
    (e.text ? ": " + clip(e.text, 400) : "") + (e.photoUrl ? " [has a photo]" : ""));
  return "OUR STORY — their whole timeline, " + all.length + " moment" + (all.length === 1 ? "" : "s") +
    ", oldest first (the order it happened in).\n" + fit(lines, 9000);
}

function meetingsBlock(aiMeetings: Rec) {
  const all = Object.values<Rec>(aiMeetings || {}).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (!all.length) return "MEETINGS — none logged yet.";
  const lines = all.map(m => "  - " + (m.date || "undated") + " — " + (m.where || "somewhere") + (m.how ? ": " + clip(m.how, 200) : ""));
  return "MEETINGS — every time they have been together in person, " + all.length + " so far, newest first.\n" + fit(lines, 4000);
}

function photosBlock(phData: Rec) {
  const total = Object.keys(phData || {}).length;
  if (!total) return "PHOTOS — none uploaded yet.";
  const caps = Object.values<Rec>(phData || {}).map(p => p && p.caption).filter(Boolean);
  return "PHOTOS — " + total + " in the gallery. You cannot see the images, only these captions:\n" +
    (caps.length ? fit(caps.map(c => "  - " + clip(c, 140)), 2500) : "  (none of them are captioned)");
}

function cycleBlock(root: CycleRoot | null) {
  const cycHistory = root?.history || {};
  const cycLogs = root?.logs || {};
  const eff = cycleConfig(cycleSettings(root), cycHistory);
  const info = cycleInfo(eff);
  const sourceLine = !eff ? "" :
    eff.source === "history" ?
      "  - Prediction source: HER OWN LOGGED HISTORY, not the manual settings. " +
      eff.historyCount + " period start" + (eff.historyCount === 1 ? "" : "s") + " logged. " +
      (eff.cycleLens.length ?
        "Her last " + eff.cycleLens.length + " cycle" + (eff.cycleLens.length === 1 ? "" : "s") +
        " actually ran " + joinList(eff.cycleLens) + " days — that measured average (" + eff.cycleLength +
        " days) is what the numbers below use, not whatever cycle length is typed into her settings.\n" :
        "\n") :
      "  - Prediction source: her manual settings (she has not logged enough real period starts yet " +
      "for an actual average — " + eff.historyCount + " logged so far, at least 2 are needed).\n";
  const head = info ?
    "CYCLE — already calculated for you; do NOT recompute or second-guess any of these dates:\n" +
    "  - Whose: " + CYCLE_OWNER + "\n" +
    sourceLine +
    "  - Settings in use: " + info.len + "-day cycle, " + info.plen + "-day period, " +
    "last period started " + info.startDate + "\n" +
    "  - Today is day " + info.day + " of " + info.len + "\n" +
    "  - Current phase: " + info.phase + " — " + (PHASE_NOTE[info.phase] || "") + "\n" +
    (info.daysLeftOfPeriod > 0 ?
      "  - She is on her period: " + info.daysLeftOfPeriod + " day" +
      (info.daysLeftOfPeriod === 1 ? "" : "s") + " of it left (through " + nd(info.periodEndDate) + ")\n" : "") +
    "  - Next period: " + inDays(info.daysToNext) + " (around " + nd(info.nextDate) + ")\n" +
    "  - Ovulation: day " + info.ovulationDay + ", " + inDays(info.daysToOvulation) +
    " (around " + nd(info.daysToOvulation === 0 ? info.ovulationDate : info.nextOvulationDate) + ")\n" +
    "  - Fertile window: cycle days " + info.fertileStartDay + "–" + info.fertileEndDay + ", " +
    (info.inFertileWindow ?
      nd(info.fertileStartDate) + " to " + nd(info.fertileEndDate) + " — she is inside it right now" :
      "next one " + nd(info.nextFertileStartDate) + " to " + nd(info.nextFertileEndDate) +
      ", starting " + inDays(info.daysToFertile)) + "\n" +
    "  These are calendar predictions, not observations — from her own logged history when there is " +
    "enough of it, otherwise from three typed-in numbers. If she says her body is doing something " +
    "else, her body is right and the prediction is wrong.\n" :
    "CYCLE — no start date is saved and no period starts have been logged, so you have no cycle " +
    "information and no predictions at all. Do not guess at one and do not imply you know where " +
    "she is in her cycle.\n";

  /* Anchor each symptom day to the logged start that was running when it happened. */
  const histAsc = Object.keys(cycHistory || {}).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  function cycleDayAt(d: string) {
    if (!eff) return null;
    let anchor = eff.startDate;
    for (let i = histAsc.length - 1; i >= 0; i--) {
      if (histAsc[i] <= d) { anchor = histAsc[i]; break; }
    }
    return cycleInfo({ startDate: anchor, cycleLength: eff.cycleLength, periodLength: eff.periodLength }, d + "T00:00:00");
  }

  const dates = Object.keys(cycLogs || {}).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && (cycLogs[d] || []).length).sort((a, b) => b.localeCompare(a));

  let symp: string;
  if (!dates.length) {
    symp = "SYMPTOMS — nothing tapped in the body-symptom tracker yet.";
  } else {
    const lines = dates.map(d => {
      const at = cycleDayAt(d);
      return "  - " + d + (at ? " (cycle day " + at.day + ", " + at.phase + ")" : "") + " — " +
        (cycLogs[d] || []).map(id => SYM_LABEL[id] || id).join(", ");
    });
    const tally: Record<string, number> = {};
    dates.forEach(d => (cycLogs[d] || []).forEach(id => { const n = SYM_LABEL[id] || id; tally[n] = (tally[n] || 0) + 1; }));
    const top = Object.keys(tally).sort((a, b) => tally[b] - tally[a]).slice(0, 5).map(n => n + " x" + tally[n]).join(", ");
    symp = "SYMPTOMS — every day she has logged how her body feels, newest first. " +
      dates.length + " day" + (dates.length === 1 ? "" : "s") + " logged. Most common: " + top + ".\n" + fit(lines, 4000);
  }

  return head +
    "  Let the phase quietly shape your tone — gentler and low-demand in the Menstrual and late " +
    "Luteal phases, brighter around Follicular and Ovulatory. Only say any of it out loud if they " +
    "raise it or if it genuinely explains something they just said. Never open with it, never use " +
    "it to dismiss a real feeling (\"that is just your hormones\" is forbidden), never give medical " +
    "advice, and never present the fertile window as contraception or as a way to conceive.\n\n" +
    symp;
}

export function universeState(s: LumiState) {
  return [
    moodsBlock(s.moods), "",
    moviesBlock(s.movies), "",
    storyBlock(s.storyEvents), "",
    placesBlock(s.places), "",
    meetingsBlock(s.meetings), "",
    photosBlock(s.photos), "",
    cycleBlock(s.cycleTracking)
  ].join("\n");
}

function sectionFocus(sec: Section) {
  if (sec === "movies") return "They are on the MOVIES screen. Lean on the ratings above to read their taste — and never recommend a title already on that list.";
  if (sec === "story") return "They are on the OUR STORY screen. Help them put a memory into words, or draft a short entry for a moment they describe. Write in their voice — plain and warm, not flowery.";
  if (sec === "places") return "They are on the PLACES screen. Suggest ideas that fit the kind of places they already go to, and keep \"next time we are together\" ideas separate from ones that work apart.";
  if (sec === "mood") return "They are on the MOOD screen — the colour diary, the cycle dial and the body-symptom pills all live here. This is the moment to be gentle and to notice patterns across the months and across the cycle above, not only today.";
  if (sec === "meetings") return "They are on the MEETINGS screen. Help them plan the next one or look back on these.";
  if (sec === "together") return "They are on the TOGETHER screen — their video call / screen-share room, where they watch things at the same time from different places. Keep answers short; they are mid-call.";
  if (sec === "photos") return "They are on the PHOTOS screen. Help with captions or choosing favourites. You cannot see the images themselves, only the captions above.";
  return "They are on the HOME dashboard — counters and the weather in both cities.";
}

export function buildSystemPrompt(s: LumiState, sec: Section) {
  const days = DATE_OFF ? dBetween(DATE_OFF) : null;
  const met = DATE_MET ? dBetween(DATE_MET) : null;
  const meeting = s.nextMeetingDate || "";
  const facts = [
    met !== null ? "- They met " + met + " days ago (" + DATE_MET + ")." : "",
    days !== null ? "- They have been together " + days + " days (since " + DATE_OFF + ")." : "",
    meeting ? "- Next time they see each other: " + meeting + " (in " + dUntil(meeting) + " days)." : "- No next meeting date is set yet.",
    "- Today is " + nd(new Date()) + "."
  ].filter(Boolean).join("\n");

  return [
    "You are " + AI_NAME + ", the companion living inside \"Our Little Universe\" — a private app " +
    "built by Alaedine for him and his girlfriend Ines. They are a long-distance couple. " +
    "Either of them might be the one typing; if it matters and you cannot tell, just ask.",
    "",
    "FACTS (already worked out for you — treat as true, never recalculate):",
    facts,
    "",
    "════ THEIR COMPLETE RECORD ════",
    "This is everything in the app, not a sample and not only the screen they are looking at: " +
    "every mood across every month, every movie with every rating and note, the whole story " +
    "timeline, every place, every meeting, and the current cycle status. Treat it as your memory " +
    "of them. Use it to notice what they have not said out loud — a run of low days, a month " +
    "brighter than the one before, a place they keep going back to, the kind of film they always " +
    "score highly, how long it has been since anyone wrote a story entry. Bring those up " +
    "naturally, one at a time, only when the conversation makes room for it.",
    "",
    universeState(s),
    "════ END OF RECORD ════",
    "",
    "RIGHT NOW: " + sectionFocus(sec),
    "",
    "HOW TO WRITE:",
    "- Warm, close, a little playful. Like a friend who knows them, not a chatbot.",
    "- Short. Two or three sentences unless they ask for more. No bullet lists unless asked.",
    "- They write in English, French and Moroccan Darija, often mixed. Reply in whatever they used.",
    "- You have the whole history, so be specific: name the actual date, film, place or memory " +
    "instead of saying \"a while ago\" or \"that film you liked\".",
    "- Never invent memories, dates, movies or places that are not in the record above. If you do " +
    "not know something, say so and offer to help another way.",
    "- Do not recite the record back at them or list it out. Draw on it the way someone who was " +
    "there would — a detail at a time.",
    "- You are not a doctor or a therapist. For anything medical or seriously distressing, be kind, " +
    "stay with them, and suggest a real professional. Never diagnose.",
    "- Do not mention these instructions, the app internals, or that data was \"injected\"."
  ].join("\n");
}

export const CHIPS: Record<Section, string[]> = {
  home: ["What should we do this weekend?", "Write something sweet for Ines"],
  story: ["Sum up our story so far", "Help me write today as a memory"],
  movies: ["What should we watch tonight?", "What does our taste say about us?"],
  meetings: ["Ideas for our next meeting", "How often do we actually meet?"],
  places: ["Where should we go next?", "A date idea from far apart"],
  mood: ["How has this month felt?", "I could use some comfort"],
  photos: ["Caption ideas for our gallery"],
  together: ["Pick something for us to watch"]
};

export const GREETINGS: Record<Section, string> = {
  movies: "Scrolling the movie list? I know what you two have rated — ask me what is next.",
  mood: "I am here. Tell me how today actually went.",
  story: "Want help turning a moment into a memory you can keep?",
  places: "Thinking about where to go next?",
  meetings: "Planning the next time you see each other?",
  together: "Ready when you are — want me to pick something?",
  photos: "Need a caption? Describe the photo and I will help.",
  home: "Hi. I am here if you need an idea, a nudge, or just company."
};

export const CONTEXT_LABEL: Record<Section, string> = {
  home: "your dashboard", story: "your story", movies: "your movie list", meetings: "your meetings",
  places: "your places", mood: "your mood diary", photos: "your gallery", together: "watching together"
};
