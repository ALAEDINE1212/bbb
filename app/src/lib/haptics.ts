// Haptic feedback, ported from the legacy app: navigator.vibrate on Android/Chrome, and on iOS Safari
// 17.4+ (no vibrate()) flipping a hidden <input switch> fires the system haptic. Best-effort only.
export type HapticKind = "tap" | "select" | "success" | "warn" | "error";

const PATTERNS: Record<HapticKind, number[]> = {
  tap: [8],
  select: [12],
  success: [14, 40, 24],
  warn: [30, 50, 30],
  error: [40, 60, 40, 60, 40]
};
const STORAGE_KEY = "haptics";
let iosSwitch: HTMLLabelElement | null = null;

export function hapticsEnabled(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) !== "off"; } catch { return true; }
}

export function setHapticsEnabled(on: boolean): void {
  try { localStorage.setItem(STORAGE_KEY, on ? "on" : "off"); } catch { /* best-effort */ }
}

export function haptic(kind: HapticKind = "tap"): void {
  if (!hapticsEnabled()) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  if (activation && !activation.hasBeenActive) return;
  const pattern = PATTERNS[kind];
  try {
    if (navigator.vibrate) { navigator.vibrate(pattern); return; }
    if (!iosSwitch) {
      iosSwitch = document.createElement("label");
      iosSwitch.setAttribute("aria-hidden", "true");
      iosSwitch.style.cssText = "position:fixed;left:-99px;top:-99px;width:1px;height:1px;opacity:0;pointer-events:none";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("switch", "");
      input.tabIndex = -1;
      iosSwitch.append(input);
      document.body.append(iosSwitch);
    }
    let offset = 0;
    pattern.forEach((ms, index) => {
      if (index % 2 === 0) setTimeout(() => iosSwitch?.click(), offset);
      offset += ms;
    });
  } catch { /* haptics must never block the UI */ }
}
