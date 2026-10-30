import { useEffect, useRef, useState } from "react";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Droplets, Heart, MapPin, Moon, Snowflake, Sun, Thermometer, UserRound, Wind } from "lucide-react";
import { useLocal, writeLocal } from "@/lib/local";
import { nav, useNav } from "@/app/nav";
import { toast } from "@/app/feedback";
import { Card, SectionTitle } from "@/ui/Card";
import { Sheet } from "@/ui/Sheet";
import { PrimaryButton } from "@/ui/Controls";
import { haptic } from "@/lib/haptics";

// Port of the legacy weather widget (Open-Meteo, free, no key). Cities live on this device only
// under localStorage "wxCities" as [{ name, country, lat, lon }, { … }] — same as the old app.
interface City { name: string; country: string; lat: number; lon: number }
interface Forecast {
  timezone: string; utc_offset_seconds: number;
  current: { temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; weather_code: number; is_day: number; wind_speed_10m: number };
  daily: { temperature_2m_max: number[]; temperature_2m_min: number[] };
}

const WHO = ["Alaedine", "Ines"];
const FORECAST = "https://api.open-meteo.com/v1/forecast";
const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";

const valid = (c: unknown): c is City => !!c && typeof (c as City).name === "string" && isFinite((c as City).lat) && isFinite((c as City).lon);
const label = (c: City) => c.name + (c.country ? ", " + c.country : "");

function parseCities(raw: string): [City, City] | null {
  try {
    const s = JSON.parse(raw);
    if (Array.isArray(s) && valid(s[0]) && valid(s[1])) return [s[0], s[1]];
  } catch { /* corrupt or empty */ }
  return null;
}

/** WMO weather code -> icon + description (legacy info()). */
function info(code: number, day: boolean): [React.ReactNode, string] {
  if (code === 0) return day ? [<Sun />, "Clear sky"] : [<Moon />, "Clear night"];
  if (code === 1) return day ? [<Sun />, "Mostly clear"] : [<Moon />, "Mostly clear"];
  if (code === 2) return day ? [<CloudSun />, "Partly cloudy"] : [<CloudMoon />, "Partly cloudy"];
  if (code === 3) return [<Cloud />, "Overcast"];
  if (code === 45 || code === 48) return [<CloudFog />, "Fog"];
  if (code >= 51 && code <= 57) return [<CloudDrizzle />, "Drizzle"];
  if (code >= 61 && code <= 67) return [<CloudRain />, "Rain"];
  if (code >= 71 && code <= 77) return [<Snowflake />, "Snow"];
  if (code >= 80 && code <= 82) return [<CloudRain />, "Rain showers"];
  if (code === 85 || code === 86) return [<CloudSnow />, "Snow showers"];
  if (code >= 95) return [<CloudLightning />, "Thunderstorm"];
  return [<Cloud />, "Unknown"];
}

function timeIn(tz: string) {
  try { return new Intl.DateTimeFormat([], { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date()); } catch { return "--:--"; }
}

function km(a: City, b: City) {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)));
}

async function fetchOne(c: City): Promise<Forecast> {
  const u = FORECAST + "?latitude=" + c.lat + "&longitude=" + c.lon +
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m" +
    "&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1";
  const r = await fetch(u);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

export function WeatherCard() {
  const cities = parseCities(useLocal("wxCities"));
  const [data, setData] = useState<(Forecast | { error: true } | null)[]>([null, null]);
  const [, tick] = useState(0);
  const key = cities ? JSON.stringify(cities) : "";

  useEffect(() => {
    if (!cities) return;
    let live = true;
    setData([null, null]);
    const load = () => cities.forEach((c, i) => {
      fetchOne(c).then(d => { if (live) setData(prev => prev.map((x, j) => (j === i ? d : x))); })
        .catch(() => { if (live) setData(prev => prev.map((x, j) => (j === i && !x ? { error: true as const } : x))); });
    });
    load();
    const refresh = setInterval(load, 15 * 60 * 1000);
    const clock = setInterval(() => tick(t => t + 1), 30 * 1000);
    return () => { live = false; clearInterval(refresh); clearInterval(clock); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <SectionTitle action={<button onClick={() => nav.open("weather")} className="text-[14px] font-semibold text-accent-1">{cities ? "Cities" : ""}</button>}>Weather between us</SectionTitle>
      {!cities ? (
        <Card className="flex items-center gap-3 p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-card-2 text-ink-2"><CloudSun className="size-5" /></span>
          <span className="min-w-0 flex-1 text-[14px] leading-snug text-ink">See the weather where you both are<br /><span className="text-[12px] text-ink-2">Add your two cities. They stay on this device.</span></span>
          <button onClick={() => nav.open("weather")} className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--button)] px-3.5 py-2 text-[13px] font-semibold text-[var(--button-ink)]"><MapPin className="size-4" />Set</button>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
            <Loc city={cities[0]} who={0} d={data[0]} />
            <Mid cities={cities} data={data} />
            <Loc city={cities[1]} who={1} d={data[1]} />
          </div>
        </Card>
      )}
    </>
  );
}

function Loc({ city, who, d }: { city: City; who: number; d: Forecast | { error: true } | null }) {
  const head = (
    <>
      <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">{who ? <Heart className="size-3" /> : <UserRound className="size-3" />}{WHO[who]}</div>
      <div className="truncate text-[15px] font-semibold text-ink">{city.name}</div>
    </>
  );
  if (!d) return <div>{head}<div className="mt-2 h-12 animate-pulse rounded-xl bg-card-2" /></div>;
  if ("error" in d) return <div>{head}<div className="mt-1 text-[12px] text-ink-2">Weather unavailable<br /><span className="text-ink-3">Will retry shortly</span></div></div>;
  const [icon, desc] = info(d.current.weather_code, d.current.is_day === 1);
  return (
    <div className="min-w-0">
      {head}
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-accent-3 [&>svg]:size-6">{icon}</span>
        <span className="font-display text-[28px] font-semibold leading-none tabular text-ink">{Math.round(d.current.temperature_2m)}°</span>
      </div>
      <div className="mt-1 text-[12px] text-ink-2">{desc}</div>
      <div className="text-[11px] text-ink-3">H {Math.round(d.daily.temperature_2m_max[0])}° · L {Math.round(d.daily.temperature_2m_min[0])}°</div>
      <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-ink-3 [&_svg]:size-3">
        <span className="flex items-center gap-0.5"><Thermometer />{Math.round(d.current.apparent_temperature)}°</span>
        <span className="flex items-center gap-0.5"><Droplets />{Math.round(d.current.relative_humidity_2m)}%</span>
        <span className="flex items-center gap-0.5"><Wind />{Math.round(d.current.wind_speed_10m)}</span>
      </div>
      <div className="mt-1 font-mono text-[13px] font-semibold tabular text-ink">{timeIn(d.timezone)}</div>
    </div>
  );
}

function Mid({ cities, data }: { cities: [City, City]; data: (Forecast | { error: true } | null)[] }) {
  const dist = km(cities[0], cities[1]);
  const a = data[0], b = data[1];
  let tz = "";
  if (a && b && !("error" in a) && !("error" in b)) {
    const diff = (b.utc_offset_seconds - a.utc_offset_seconds) / 3600;
    tz = diff === 0 ? "Same time zone" : "Ines is " + Math.abs(diff) + "h " + (diff > 0 ? "ahead" : "behind");
  }
  return (
    <div className="flex flex-col items-center gap-1 pt-5 text-center">
      <Heart className="size-5 fill-accent-1 text-accent-1" />
      <div className="text-[13px] font-semibold tabular text-ink">{dist < 2 ? "Same city" : dist.toLocaleString() + " km"}</div>
      <div className="text-[11px] text-ink-3">{dist < 2 ? "together" : "apart"}</div>
      {tz && <div className="max-w-[78px] text-[11px] leading-tight text-ink-3">{tz}</div>}
    </div>
  );
}

interface GeoResult { name: string; country?: string; admin1?: string; latitude: number; longitude: number }

export function WeatherSheet() {
  const { sheet } = useNav();
  const open = sheet === "weather";
  const current = parseCities(useLocal("wxCities"));
  const [pending, setPending] = useState<(City | null)[]>([null, null]);
  const [text, setText] = useState(["", ""]);
  const [results, setResults] = useState<(GeoResult[] | null)[]>([null, null]);
  const [note, setNote] = useState(["", ""]);
  const timers = useRef([0, 0]);

  useEffect(() => {
    if (!open) return;
    const p = current ? [current[0], current[1]] : [null, null];
    setPending(p);
    setText(p.map(c => (c ? label(c) : "")));
    setResults([null, null]);
    setNote(["", ""]);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const at = <T,>(arr: T[], i: number, v: T) => arr.map((x, j) => (j === i ? v : x));

  const search = (i: number, q: string) => {
    setText(t => at(t, i, q));
    setPending(p => at(p, i, null));
    clearTimeout(timers.current[i]);
    if (q.trim().length < 2) { setResults(r => at(r, i, null)); return; }
    timers.current[i] = window.setTimeout(async () => {
      setNote(n => at(n, i, "Searching…"));
      try {
        const j = await (await fetch(GEOCODE + "?name=" + encodeURIComponent(q.trim()) + "&count=5&language=en&format=json")).json();
        setResults(r => at(r, i, j.results || []));
        setNote(n => at(n, i, (j.results || []).length ? "" : "No matches. Try another spelling."));
      } catch {
        setNote(n => at(n, i, "Couldn't reach the search service."));
      }
    }, 300);
  };

  const pick = (i: number, r: GeoResult) => {
    haptic("select");
    const c = { name: r.name, country: r.country || "", lat: r.latitude, lon: r.longitude };
    setPending(p => at(p, i, c));
    setText(t => at(t, i, label(c)));
    setResults(x => at(x, i, null));
  };

  const save = () => {
    if (!pending[0] || !pending[1]) { haptic("warn"); toast("Pick both cities from the suggestions", "info"); return; }
    writeLocal("wxCities", JSON.stringify(pending));
    toast("Cities saved");
    nav.close();
  };

  return (
    <Sheet open={open} onClose={nav.close} title="Your two cities" subtitle="Saved on this device only."
      footer={<PrimaryButton onClick={save}>Save</PrimaryButton>}>
      <div className="space-y-4">
        {[0, 1].map(i => (
          <div key={i}>
            <div className="mb-1.5 px-1 text-[12px] font-semibold text-ink-2">{WHO[i]}'s city</div>
            <input value={text[i]} onChange={e => search(i, e.target.value)} placeholder="Search a city" autoComplete="off"
              className="w-full rounded-2xl bg-card-2 px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink-3" />
            {note[i] && <div className="px-2 pt-1.5 text-[12px] text-ink-3">{note[i]}</div>}
            {results[i] && results[i]!.length > 0 && (
              <div className="mt-1.5 divide-y divide-line overflow-hidden rounded-2xl bg-card-2">
                {results[i]!.map((r, k) => (
                  <button key={k} onClick={() => pick(i, r)} className="block w-full px-4 py-2.5 text-left active:bg-track">
                    <span className="block text-[14px] font-semibold text-ink">{r.name}</span>
                    <span className="block text-[12px] text-ink-2">{[r.admin1, r.country].filter(Boolean).join(", ")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {current && <button onClick={() => { writeLocal("wxCities", null); nav.close(); }} className="w-full rounded-2xl bg-card-2 py-3 text-[14px] font-semibold text-danger">Remove cities</button>}
      </div>
    </Sheet>
  );
}
