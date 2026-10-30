// Places: read GPS + capture date straight from the ORIGINAL photo (before HEIC conversion or
// compression, which strip metadata), then name the spot. Ported from the legacy readExifTags(),
// dateToISODate() and reverseGeocodePlace().

export async function readExifTags(file: File): Promise<{ gps?: { lat: number; lon: number } | null; dateTime?: Date | string | null }> {
  try {
    const exifr = (await import("exifr")).default;
    const out = await exifr.parse(file, { gps: true, exif: true, tiff: true });
    if (!out) return {};
    const lat = typeof out.latitude === "number" ? out.latitude : null;
    const lon = typeof out.longitude === "number" ? out.longitude : null;
    return {
      gps: lat != null && lon != null && isFinite(lat) && isFinite(lon) ? { lat, lon } : null,
      dateTime: out.DateTimeOriginal || out.CreateDate || out.DateTime || null
    };
  } catch {
    return {}; // a file exifr can't parse at all is just "no metadata"
  }
}

/** EXIF date -> "YYYY-MM-DD" from LOCAL calendar fields, so a late-night photo keeps its day. */
export function dateToISODate(input: Date | string | null | undefined): string | null {
  let d = input;
  if (!d) return null;
  if (typeof d === "string") {
    const m = /^(\d{4}):(\d{2}):(\d{2})/.exec(d);
    d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(d);
  }
  if (!(d instanceof Date) || isNaN(d.getTime())) return null;
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/** Nominatim reverse geocode: coordinates -> a short place name, preferring a landmark. */
export async function reverseGeocodePlace(lat: number, lon: number): Promise<string> {
  const url = "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + encodeURIComponent(lat) + "&lon=" + encodeURIComponent(lon) + "&zoom=16&addressdetails=1";
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("reverse geocode failed");
  const data = await res.json();
  const a = data.address || {};
  return a.attraction || a.tourism || a.leisure || a.building || a.amenity || a.city || a.town || a.village || a.suburb || a.county ||
    (data.display_name ? String(data.display_name).split(",")[0].trim() : "") || "";
}

/** legacy plML: coordinates from a pasted Google Maps link ("@lat,lng" or "?q=lat,lng"). */
export function coordsFromMapsLink(url: string): { lat: number; lng: number } | null {
  let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!m) m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null;
}
