// Gemini REST call, ported from the legacy askGemini(). The key is never in the code: it is
// typed in once and kept in this browser only (localStorage "geminiKey", same as the old app).
import { AI_NAME } from "./context";

/* Flash-Lite is the free tier's high-volume lane and far less prone to 503s than Flash. */
const GEMINI_MODEL = "gemini-3.5-flash-lite";

export interface ChatTurn { role: "user" | "model"; text: string }

export function getKey(): string {
  try { return localStorage.getItem("geminiKey") || ""; } catch { return ""; }
}
export function setKey(v: string) {
  try { localStorage.setItem("geminiKey", v); } catch { /* device-only */ }
}

export async function askGemini(history: ChatTurn[], systemPrompt: string): Promise<string> {
  const key = getKey();
  if (!key) throw new Error("No API key set.");

  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: history.slice(-24).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    /* Generous cap: Gemini 3.x thinks before it answers and those tokens count here. */
    generationConfig: { temperature: 0.9, maxOutputTokens: 2048 }
  });

  /* 5xx means Google is busy, so back off and retry. A 429 is a quota wall — retrying only burns it. */
  let res: Response | undefined;
  let data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let pending: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise(r => setTimeout(r, 700 * Math.pow(2.2, attempt - 1)));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    try {
      res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        signal: ctrl.signal,
        body: payload
      });
    } catch (e) {
      clearTimeout(timer);
      pending = new Error((e as Error).name === "AbortError" ? "Gemini took too long to answer." : "Could not reach Gemini. Check your connection.");
      continue;
    }
    clearTimeout(timer);
    data = await res.json().catch(() => null);
    if (res.ok || res.status < 500) { pending = null; break; }
    pending = new Error(AI_NAME + " is in high demand right now (" + res.status + "). Give it a few seconds and try again.");
  }
  if (pending || !res) throw pending || new Error("Could not reach Gemini.");
  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || ("HTTP " + res.status);
    throw new Error(res.status === 400 && /API key/i.test(msg) ? "That API key was rejected by Google." :
      res.status === 404 ? "Model \"" + GEMINI_MODEL + "\" was not found — it may have been retired." :
      res.status === 429 ? "Rate limited by Google. Give it a minute." : msg);
  }

  const cand = data && data.candidates && data.candidates[0];
  const text = cand && cand.content && cand.content.parts ? cand.content.parts.map((p: { text?: string }) => p.text).filter(Boolean).join("") : "";
  if (text) return text;

  const why = (cand && cand.finishReason) || (data && data.promptFeedback && data.promptFeedback.blockReason);
  throw new Error(
    why === "SAFETY" ? "Gemini blocked that one. Try rewording it." :
    why === "MAX_TOKENS" ? "Gemini ran out of room before answering. Try a shorter question." :
    "Gemini sent back an empty reply" + (why ? " (" + why + ")." : "."));
}
