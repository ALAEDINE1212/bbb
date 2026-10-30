// Line-for-line ports of the legacy date helpers. All dates are local "YYYY-MM-DD" strings.

/** Today's LOCAL calendar date (legacy `iso()`), not UTC. */
export function iso(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function midnight(): Date {
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return n;
}

export function dBetween(isoDate: string): number {
  return Math.floor((midnight().getTime() - new Date(isoDate + "T00:00:00").getTime()) / 86400000);
}

export function dUntil(isoDate: string): number {
  return Math.ceil((new Date(isoDate + "T00:00:00").getTime() - midnight().getTime()) / 86400000);
}

export function nextOcc(mmdd: string): Date {
  const n = midnight();
  const [mm, dd] = mmdd.split("-").map(Number);
  let d = new Date(n.getFullYear(), mm - 1, dd);
  if (d < n) d = new Date(n.getFullYear() + 1, mm - 1, dd);
  return d;
}

export function nextMiv(dateOff: string): Date | null {
  if (!dateOff) return null;
  const [y, m, d] = dateOff.split("-").map(Number);
  const nx = new Date(y, m - 1, d);
  const n = midnight();
  while (nx <= n) nx.setMonth(nx.getMonth() + 1);
  return nx;
}

/** Days from now (legacy dash(): ceil over the raw time, not midnight-aligned). */
export function daysTo(d: Date): number {
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export function nd(d: Date): string {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function ndIso(isoDate: string): string {
  return isoDate ? nd(new Date(isoDate + "T00:00:00")) : "?";
}

export function dk(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
