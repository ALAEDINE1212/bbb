import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { deletePlace, useData } from "@/data/store";
import { ndIso } from "@/data/dates";
import { nav } from "@/app/nav";
import { runSave } from "@/app/feedback";
import { Card, SectionTitle } from "@/ui/Card";
import { Confirm } from "@/ui/Confirm";
import { Squircle } from "@/ui/Field";
import { AddPill, Empty, ScreenTitle } from "./common";

function prefersDark() {
  const forced = document.documentElement.dataset.theme;
  return forced ? forced === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
}

export function Places() {
  const places = useData(s => s.places);
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const sorted = Object.entries(places).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""));

  useEffect(() => {
    if (!host.current) return;
    const m = L.map(host.current, { zoomControl: false, attributionControl: true }).setView([40, 5], 3);
    // CARTO basemaps now require an API key; standard OSM tiles, darkened with a CSS filter in dark mode.
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", maxZoom: 19, className: prefersDark() ? "tiles-dark" : ""
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current, g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    const pts: L.LatLngTuple[] = [];
    for (const [, p] of sorted) {
      if (typeof p.lat !== "number" || typeof p.lng !== "number") continue;
      pts.push([p.lat, p.lng]);
      L.circleMarker([p.lat, p.lng], { radius: 8, color: "#fff", weight: 2, fillColor: "#e8557a", fillOpacity: 1 })
        .bindPopup(`<b>${escapeHtml(p.name)}</b><br>${escapeHtml(ndIso(p.date))}`)
        .addTo(g);
    }
    if (pts.length === 1) m.setView(pts[0], 11);
    else if (pts.length > 1) m.fitBounds(pts, { padding: [30, 30] });
  }, [places]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <ScreenTitle action={<AddPill onClick={() => nav.open("place")}>Place</AddPill>}>Places</ScreenTitle>
      <Card className="relative isolate overflow-hidden">
        <div ref={host} className="h-[300px] w-full" />
      </Card>

      <SectionTitle>{sorted.length ? `${sorted.length} places` : "Places"}</SectionTitle>
      <Card className="divide-y divide-line overflow-hidden">
        {!sorted.length && <Empty icon={<MapPin />}>No places pinned yet.</Empty>}
        {sorted.map(([id, p]) => (
          <div key={id} className="flex items-center gap-3 px-4 py-3">
            {p.photoUrl ? <img src={p.photoUrl} alt="" className="size-[34px] rounded-[10px] object-cover" /> : <Squircle color="var(--accent-1)"><MapPin /></Squircle>}
            <button className="min-w-0 flex-1 text-left" onClick={() => map.current?.flyTo([p.lat, p.lng], 12)}>
              <span className="block truncate text-[15px] font-semibold text-ink">{p.name}</span>
              <span className="block truncate text-[12px] text-ink-2">{ndIso(p.date)}{p.note ? ` · ${p.note}` : ""}</span>
            </button>
            <button aria-label="Edit place" onClick={() => nav.open("place", id)} className="grid size-8 place-items-center rounded-full bg-card-2 text-ink-2"><Pencil className="size-3.5" /></button>
            <button aria-label="Delete place" onClick={() => setDeleting(id)} className="grid size-8 place-items-center rounded-full bg-card-2 text-danger"><Trash2 className="size-3.5" /></button>
          </div>
        ))}
      </Card>

      <Confirm
        open={deleting != null}
        title="Delete this place?"
        message={deleting ? `"${places[deleting]?.name}" will be removed from the map.` : undefined}
        confirmLabel="Delete place"
        onClose={() => setDeleting(null)}
        onConfirm={() => { const id = deleting!; setDeleting(null); void runSave(() => deletePlace(id), "Place deleted"); }}
      />
    </div>
  );
}

function escapeHtml(s: string) {
  return (s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

/** Small map inside the place sheet: tap to drop the pin (legacy map click), follows typed coords. */
export function PickMap({ lat, lng, onPick }: { lat: number | null; lng: number | null; onPick: (lat: number, lng: number) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const pin = useRef<L.CircleMarker | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    if (!host.current) return;
    const m = L.map(host.current, { zoomControl: false, attributionControl: false }).setView([lat ?? 40, lng ?? 5], lat != null ? 12 : 3);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, className: prefersDark() ? "tiles-dark" : "" }).addTo(m);
    m.on("click", e => pickRef.current(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))));
    map.current = m;
    setTimeout(() => m.invalidateSize(), 250); // the sheet is still sliding in when this mounts
    return () => { m.remove(); map.current = null; pin.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) { pin.current?.remove(); pin.current = null; return; }
    if (!pin.current) pin.current = L.circleMarker([lat, lng], { radius: 8, color: "#fff", weight: 2, fillColor: "#e8557a", fillOpacity: 1 }).addTo(m);
    else pin.current.setLatLng([lat, lng]);
    if (!m.getBounds().contains([lat, lng])) m.setView([lat, lng], Math.max(m.getZoom(), 11));
  }, [lat, lng]);

  return <div ref={host} className="relative isolate h-[180px] w-full overflow-hidden rounded-2xl" />;
}
