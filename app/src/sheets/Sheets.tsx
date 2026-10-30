import { useEffect, useRef, useState } from "react";
import { BookOpen, CalendarHeart, Camera, Clapperboard, ImagePlus, MapPin, MonitorPlay, Palette, Sparkles } from "lucide-react";
import { MOOD_SWATCHES, WRITE_ENABLED } from "@/config";
import { addMeeting, addMovie, addPhoto, addPlace, editMovie, editPlace, saveStory, setMood, tmdbSearch, type TmdbPick, useData } from "@/data/store";
import { iso } from "@/data/dates";
import { nav, useNav } from "@/app/nav";
import { runSave, toast } from "@/app/feedback";
import { Sheet } from "@/ui/Sheet";
import { PrimaryButton } from "@/ui/Controls";
import { NumberStepper } from "@/ui/NumberStepper";
import { DateInput, InlineField, Squircle, TextArea, TextInput } from "@/ui/Field";
import { haptic } from "@/lib/haptics";
import { readLocal, writeLocal } from "@/lib/local";
import { WeatherSheet } from "@/screens/Weather";
import { PickMap } from "@/screens/Places";
import { coordsFromMapsLink, dateToISODate, readExifTags, reverseGeocodePlace } from "@/lib/exif";
import { cn } from "@/lib/cn";

/** Every input sheet, mounted once at the app root and driven by nav.open(kind, editId). */
export function Sheets() {
  const { sheet, editId, sheetDate } = useNav();
  return (
    <>
      <LogSheet open={sheet === "log"} />
      <StorySheet open={sheet === "story"} editId={editId} />
      <MoodSheet open={sheet === "mood"} date={sheetDate} />
      <MovieSheet open={sheet === "movie"} editId={editId} />
      <MeetingSheet open={sheet === "meeting"} />
      <PlaceSheet open={sheet === "place"} editId={editId} />
      <PhotoSheet open={sheet === "photo"} />
      <NextMeetingSheet open={sheet === "nextMeeting"} />
      <WeatherSheet />
    </>
  );
}

const close = () => nav.close();

/** Wraps a save so the button can't double-submit and the sheet closes only on a real save. */
function useSubmit() {
  const [busy, setBusy] = useState(false);
  const submit = async (action: () => Promise<void>, success?: string) => {
    if (busy) return;
    setBusy(true);
    const ok = await runSave(action, success);
    setBusy(false);
    if (ok) close();
  };
  return { busy, submit };
}

function invalid(msg: string) { haptic("warn"); toast(msg, "info"); }

function LogSheet({ open }: { open: boolean }) {
  const items = [
    { kind: "mood" as const, label: "Today's mood", icon: <Palette />, color: "var(--accent-3)" },
    { kind: "story" as const, label: "Story moment", icon: <BookOpen />, color: "var(--accent-1)" },
    { kind: "meeting" as const, label: "Meeting", icon: <CalendarHeart />, color: "var(--accent-1)" },
    { kind: "place" as const, label: "Place", icon: <MapPin />, color: "var(--accent-1)" },
    { kind: "movie" as const, label: "Movie", icon: <Clapperboard />, color: "var(--accent-2)" },
    { kind: "photo" as const, label: "Photo", icon: <Camera />, color: "var(--accent-2)" }
  ];
  return (
    <Sheet open={open} onClose={close} title="Add something" subtitle={WRITE_ENABLED ? undefined : "This preview is read-only — saving is switched off."}>
      <div className="grid grid-cols-2 gap-2.5">
        {items.map(it => (
          <button key={it.kind} onClick={() => { haptic("tap"); nav.open(it.kind, null, it.kind === "mood" ? iso() : null); }} className="flex items-center gap-3 rounded-2xl bg-card-2 px-3.5 py-3.5 text-left text-[15px] font-semibold text-ink active:scale-[0.98]">
            <Squircle color={it.color}>{it.icon}</Squircle>{it.label}
          </button>
        ))}
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <button onClick={() => { haptic("tap"); nav.close(); nav.sub("together"); }} className="flex items-center gap-3 rounded-2xl bg-card-2 px-3.5 py-3.5 text-left text-[15px] font-semibold text-ink active:scale-[0.98]">
          <Squircle color="var(--accent-2)"><MonitorPlay /></Squircle>Together
        </button>
        <button onClick={() => { haptic("tap"); nav.open("lumi"); }} className="flex items-center gap-3 rounded-2xl bg-card-2 px-3.5 py-3.5 text-left text-[15px] font-semibold text-ink active:scale-[0.98]">
          <Squircle color="var(--accent-2)"><Sparkles /></Squircle>Ask Lumi
        </button>
      </div>
    </Sheet>
  );
}

function StorySheet({ open, editId }: { open: boolean; editId: string | null }) {
  const events = useData(s => s.storyEvents);
  const [date, setDate] = useState(iso());
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { busy, submit } = useSubmit();
  useEffect(() => {
    if (!open) return;
    const e = editId ? events[editId] : null;
    setDate(e?.date || iso()); setTitle(e?.title || ""); setText(e?.text || ""); setFile(null);
  }, [open, editId]); // eslint-disable-line react-hooks/exhaustive-deps
  const existing = editId ? events[editId]?.photoUrl : null;

  const save = () => void submit(() => saveStory({ editId: editId || "", date, title, text, file }), editId ? "Moment updated 💕" : "Moment saved 💕");
  return (
    <Sheet open={open} onClose={close} title={editId ? "Edit moment" : "New moment"} footer={<PrimaryButton disabled={busy} onClick={save}>{busy ? "Saving…" : editId ? "Update" : "Save"}</PrimaryButton>}>
      <div className="space-y-3">
        <InlineField label="Date"><DateInput value={date} onChange={e => setDate(e.target.value)} /></InlineField>
        <TextInput placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <TextArea placeholder="What happened?" rows={5} value={text} onChange={e => setText(e.target.value)} />
        <PhotoPicker file={file} onFile={setFile} existing={existing} />
      </div>
    </Sheet>
  );
}

function PhotoPicker({ file, onFile, existing }: { file: File | null; onFile: (f: File | null) => void; existing?: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const shown = preview || existing;
  return (
    <button type="button" onClick={() => input.current?.click()} className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-card-2 px-4 py-3 text-left">
      {shown ? <img src={shown} alt="" className="size-12 rounded-xl object-cover" /> : <span className="grid size-12 place-items-center rounded-xl bg-track text-ink-2"><ImagePlus className="size-5" /></span>}
      <span className="text-[15px] font-semibold text-ink">{file ? file.name : existing ? "Replace photo" : "Add a photo"}</span>
      <input ref={input} type="file" accept="image/*" hidden onChange={e => onFile(e.target.files?.[0] || null)} />
    </button>
  );
}

function MoodSheet({ open, date: initialDate }: { open: boolean; date: string | null }) {
  const moods = useData(s => s.moods);
  const [date, setDate] = useState(iso());
  const [color, setColor] = useState<string>(MOOD_SWATCHES[0].color);
  const [text, setText] = useState("");
  const { busy, submit } = useSubmit();
  useEffect(() => {
    if (!open) return;
    const d = initialDate || iso();
    setDate(d);
    setColor(moods[d]?.color || MOOD_SWATCHES[0].color);
    setText(moods[d]?.text || "");
  }, [open, initialDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const custom = !MOOD_SWATCHES.some(s => s.color === color);
  const label = MOOD_SWATCHES.find(s => s.color === color);
  return (
    <Sheet open={open} onClose={close} title="How was the day?" subtitle={label ? `${label.label} ${label.emoji}` : "Custom colour"}
      footer={<PrimaryButton disabled={busy} onClick={() => void submit(() => setMood({ date, color, text }), "Mood saved 💕")}>{busy ? "Saving…" : moods[date] ? "Update" : "Save"}</PrimaryButton>}>
      <div className="space-y-3">
        <InlineField label="Date"><DateInput value={date} onChange={e => { setDate(e.target.value); setText(moods[e.target.value]?.text || ""); }} /></InlineField>
        <div className="grid grid-cols-5 gap-2.5 rounded-2xl bg-card-2 p-3.5">
          {MOOD_SWATCHES.map(s => (
            <button key={s.color} aria-label={s.label} aria-pressed={color === s.color} onClick={() => { haptic("select"); setColor(s.color); }} className="flex flex-col items-center gap-1">
              <span className={cn("size-11 rounded-full transition-transform", color === s.color && "scale-110 ring-[3px] ring-ink ring-offset-2 ring-offset-card-2")} style={{ background: s.color }} />
              <span className="text-[10px] font-medium text-ink-2">{s.label}</span>
            </button>
          ))}
        </div>
        <InlineField label="Custom colour">
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className={cn("h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent", custom && "ring-2 ring-ink")} />
        </InlineField>
        <TextArea placeholder="A few words about the day (optional)" value={text} onChange={e => setText(e.target.value)} />
      </div>
    </Sheet>
  );
}

function MovieSheet({ open, editId }: { open: boolean; editId: string | null }) {
  const movies = useData(s => s.movies);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(iso());
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [ra, setRa] = useState(0);
  const [ri, setRi] = useState(0);
  const [pick, setPick] = useState<TmdbPick | null>(null);
  const [results, setResults] = useState<TmdbPick[]>([]);
  const { busy, submit } = useSubmit();
  const timer = useRef<number>(0);

  useEffect(() => {
    if (!open) return;
    const m = editId ? movies[editId] : null;
    setTitle(m?.title || ""); setDate(m?.date || iso()); setPlace(m?.place || ""); setNote(m?.note || "");
    setRa(m?.ratingA || 0); setRi(m?.ratingI || 0); setPick(null); setResults([]);
  }, [open, editId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTitle = (q: string) => {
    setTitle(q);
    clearTimeout(timer.current);
    if (q.trim().length < 2) { setResults([]); return; }
    timer.current = window.setTimeout(async () => setResults(await tmdbSearch(q.trim())), 300);
  };

  const save = () => {
    const form = { title, date, place, note, ratingA: String(ra), ratingI: String(ri) };
    if (editId) return void submit(() => editMovie(editId, form, pick), "Movie updated 🎬");
    void submit(() => addMovie(form, pick), "Movie saved 🎬");
  };
  const poster = pick?.poster || (editId ? movies[editId]?.poster : "");

  return (
    <Sheet open={open} onClose={close} title={editId ? "Edit movie" : "Add a movie"} footer={<PrimaryButton disabled={busy} onClick={save}>{busy ? "Saving…" : editId ? "Update" : "Save"}</PrimaryButton>}>
      <div className="space-y-3">
        <div className="relative">
          <TextInput placeholder="Search a movie or series" value={title} onChange={e => onTitle(e.target.value)} />
          {results.length > 0 && (
            <div className="mt-1.5 divide-y divide-line overflow-hidden rounded-2xl bg-card-2">
              {results.map(r => (
                <button key={r.id} onClick={() => { haptic("select"); setPick(r); setTitle(r.title); setResults([]); }} className="flex w-full items-center gap-3 px-3 py-2 text-left active:bg-track">
                  {r.poster ? <img src={r.poster} alt="" className="h-[42px] w-[28px] rounded object-cover" /> : <span className="h-[42px] w-[28px] rounded bg-track" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-ink">{r.title}</span>
                    <span className="block text-[12px] text-ink-2">{[r.year, r.type, r.rating ? "★ " + r.rating : ""].filter(Boolean).join(" · ")}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {poster && (
          <div className="flex items-center gap-3 rounded-2xl bg-card-2 p-3">
            <img src={poster} alt="" className="h-[60px] w-[40px] rounded-md object-cover" />
            <div className="text-[13px] text-ink-2">{pick ? [pick.year, pick.type, pick.rating && "★ " + pick.rating].filter(Boolean).join(" · ") : "Current poster"}</div>
          </div>
        )}
        <InlineField label="Watched"><DateInput value={date} onChange={e => setDate(e.target.value)} /></InlineField>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-line p-3"><NumberStepper label="His rating" value={ra} onChange={setRa} min={0} max={10} unit="/10" /></div>
          <div className="rounded-2xl border border-line p-3"><NumberStepper label="Ines's rating" value={ri} onChange={setRi} min={0} max={10} unit="/10" /></div>
        </div>
        <TextInput placeholder="Where (cinema, couch, call…)" value={place} onChange={e => setPlace(e.target.value)} />
        <TextArea placeholder="Note" rows={3} value={note} onChange={e => setNote(e.target.value)} />
      </div>
    </Sheet>
  );
}

function MeetingSheet({ open }: { open: boolean }) {
  const [date, setDate] = useState(iso());
  const [where, setWhere] = useState("");
  const [how, setHow] = useState("");
  const { busy, submit } = useSubmit();
  useEffect(() => { if (open) { setDate(iso()); setWhere(""); setHow(""); } }, [open]);
  const save = () => void submit(() => addMeeting({ date, where, how }), "Meeting saved 💕");
  return (
    <Sheet open={open} onClose={close} title="New meeting" footer={<PrimaryButton disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</PrimaryButton>}>
      <div className="space-y-3">
        <InlineField label="Date"><DateInput value={date} onChange={e => setDate(e.target.value)} /></InlineField>
        <TextInput placeholder="Where" value={where} onChange={e => setWhere(e.target.value)} />
        <TextArea placeholder="How was it?" value={how} onChange={e => setHow(e.target.value)} />
      </div>
    </Sheet>
  );
}

function PlaceSheet({ open, editId }: { open: boolean; editId: string | null }) {
  const places = useData(s => s.places);
  const [name, setName] = useState("");
  const [date, setDate] = useState(iso());
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [gallery, setGallery] = useState<string | null>(null);
  const [mapsLink, setMapsLink] = useState("");
  const photos = useData(s => s.photos);
  const { busy, submit } = useSubmit();
  useEffect(() => {
    if (!open) return;
    setGallery(null);
    const p = editId ? places[editId] : null;
    setName(p?.name || ""); setDate(p?.date || iso()); setLat(p ? String(p.lat ?? "") : ""); setLng(p ? String(p.lng ?? "") : "");
    setNote(p?.note || ""); setFile(null); setMapsLink("");
  }, [open, editId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setCoords = (la: number, lo: number) => { setLat(la.toFixed(6)); setLng(lo.toFixed(6)); };
  const onMapsLink = (url: string) => {
    setMapsLink(url);
    const c = coordsFromMapsLink(url.trim());
    if (c) { haptic("success"); setCoords(c.lat, c.lng); }
  };
  /* legacy plPf change: read GPS + date from the ORIGINAL file, before any re-encoding. */
  const onPlacePhoto = async (f: File | null) => {
    setFile(f);
    setGallery(null);
    if (!f) return;
    const tags = await readExifTags(f);
    const dateISO = dateToISODate(tags.dateTime);
    if (dateISO) setDate(dateISO);
    if (tags.gps) {
      haptic("success");
      setCoords(tags.gps.lat, tags.gps.lon);
      toast("Location read from the photo 📍");
      reverseGeocodePlace(tags.gps.lat, tags.gps.lon).then(n => { if (n) setName(cur => cur.trim() ? cur : n); }).catch(() => {});
    } else {
      toast("No GPS metadata found in photo — pick on map or paste a link.", "info");
    }
  };

  const useHere = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => { haptic("success"); setLat(pos.coords.latitude.toFixed(5)); setLng(pos.coords.longitude.toFixed(5)); },
      () => invalid("Couldn't get your location.")
    );
  };
  const save = () => {
    const p = { name, date, lat, lng, note };
    void submit(() => editId ? editPlace(editId, p) : addPlace(p, file, gallery ? { url: photos[gallery].url, caption: photos[gallery].caption || "" } : null), editId ? "Place updated 📍" : "Place saved 📍");
  };
  return (
    <Sheet open={open} onClose={close} title={editId ? "Edit place" : "Pin a place"} footer={<PrimaryButton disabled={busy} onClick={save}>{busy ? "Saving…" : editId ? "Update" : "Save"}</PrimaryButton>}>
      <div className="space-y-3">
        <TextInput placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <InlineField label="Date"><DateInput value={date} onChange={e => setDate(e.target.value)} /></InlineField>
        <div className="grid grid-cols-2 gap-2.5">
          <TextInput inputMode="decimal" placeholder="Latitude" value={lat} onChange={e => setLat(e.target.value)} />
          <TextInput inputMode="decimal" placeholder="Longitude" value={lng} onChange={e => setLng(e.target.value)} />
        </div>
        {open && <PickMap lat={lat ? parseFloat(lat) : null} lng={lng ? parseFloat(lng) : null} onPick={setCoords} />}
        <div className="grid grid-cols-[auto_1fr] gap-2.5">
          <button onClick={useHere} className="flex items-center justify-center gap-1.5 rounded-2xl bg-card-2 px-3.5 text-[14px] font-semibold text-accent-1"><MapPin className="size-4" />Here</button>
          <TextInput type="url" placeholder="…or paste a Google Maps link" value={mapsLink} onChange={e => onMapsLink(e.target.value)} />
        </div>
        <TextArea placeholder="Note" rows={3} value={note} onChange={e => setNote(e.target.value)} />
        {!editId && <PhotoPicker file={file} onFile={f => void onPlacePhoto(f)} />}
        {!editId && !file && Object.keys(photos).length > 0 && (
          <div>
            <div className="mb-1.5 px-1 text-[12px] font-semibold text-ink-2">Or pick from uploaded photos</div>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {Object.entries(photos).map(([id, ph]) => (
                <button key={id} aria-label={ph.caption || "Photo"} aria-pressed={gallery === id} onClick={() => { haptic("select"); setGallery(gallery === id ? null : id); }}
                  className={cn("size-16 shrink-0 overflow-hidden rounded-xl", gallery === id && "ring-[3px] ring-accent-1 ring-offset-2 ring-offset-card")}>
                  <img src={ph.url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function PhotoSheet({ open }: { open: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const { busy, submit } = useSubmit();
  useEffect(() => { if (open) { setFile(null); setCaption(""); } }, [open]);
  return (
    <Sheet open={open} onClose={close} title="Add a photo"
      footer={<PrimaryButton disabled={busy} onClick={() => void submit(() => addPhoto(file, caption), "Photo uploaded 📸")}>{busy ? "Uploading…" : "Upload"}</PrimaryButton>}>
      <div className="space-y-3">
        <PhotoPicker file={file} onFile={setFile} />
        <TextInput placeholder="Caption" value={caption} onChange={e => setCaption(e.target.value)} />
      </div>
    </Sheet>
  );
}

/** legacy meetingPopup: the next meeting date lives on this device ("nextMeetingDate"). */
function NextMeetingSheet({ open }: { open: boolean }) {
  const [date, setDate] = useState("");
  useEffect(() => { if (open) setDate(readLocal("nextMeetingDate")); }, [open]);
  return (
    <Sheet open={open} onClose={close} title="Next meeting" subtitle="When do you see each other next?"
      footer={<PrimaryButton onClick={() => { if (!date) return invalid("Pick a date."); writeLocal("nextMeetingDate", date); toast("Can't wait 💕"); close(); }}>Save</PrimaryButton>}>
      <InlineField label="Date"><DateInput value={date} min={iso()} onChange={e => setDate(e.target.value)} /></InlineField>
    </Sheet>
  );
}
