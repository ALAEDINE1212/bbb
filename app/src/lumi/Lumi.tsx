import { useEffect, useRef, useState } from "react";
import { ArrowUp, KeyRound, RotateCcw } from "lucide-react";
import { getSnapshot } from "@/data/store";
import { useNav } from "@/app/nav";
import { Sheet } from "@/ui/Sheet";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptics";
import { AI_NAME, buildSystemPrompt, CHIPS, CONTEXT_LABEL, GREETINGS, type Section } from "./context";
import { askGemini, getKey, setKey, type ChatTurn } from "./gemini";

interface Msg { who: "ai" | "me" | "err"; text: string }

/** Which legacy section the current screen corresponds to (drives Lumi's focus line and chips). */
export function useSection(): Section {
  const { tab, sub } = useNav();
  return sub ?? tab;
}

function readNextMeeting() { try { return localStorage.getItem("nextMeetingDate") || ""; } catch { return ""; } }

/* Gemini answers in markdown; render only the safe subset, escaped first (legacy aiMd). */
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const md = (t: string) => esc(t)
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$|[.,!?])/g, "$1<em>$2</em>")
  .replace(/^\s*[-*]\s+/gm, "• ")
  .replace(/\n/g, "<br>");

export function Lumi({ open, onClose }: { open: boolean; onClose: () => void }) {
  const section = useSection();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const history = useRef<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [hasKey, setHasKey] = useState(() => !!getKey());
  const [keyInput, setKeyInput] = useState("");
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !msgs.length) setMsgs([{ who: "ai", text: GREETINGS[section] }]);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);

  const send = async (text?: string) => {
    if (busy) return;
    const msg = (text ?? input).trim();
    if (!msg) return;
    haptic("tap");
    setInput("");
    setMsgs(m => [...m, { who: "me", text: msg }]);
    history.current.push({ role: "user", text: msg });
    setBusy(true);
    try {
      const s = getSnapshot();
      const prompt = buildSystemPrompt({ ...s, nextMeetingDate: readNextMeeting() }, section);
      const reply = await askGemini(history.current, prompt);
      setMsgs(m => [...m, { who: "ai", text: reply }]);
      history.current.push({ role: "model", text: reply });
    } catch (e) {
      haptic("warn");
      setMsgs(m => [...m, { who: "err", text: (e as Error).message || "Something went wrong." }]);
      history.current.pop(); // drop the unanswered turn so retrying is clean
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    haptic("tap");
    history.current = [];
    setMsgs([{ who: "ai", text: GREETINGS[section] }]);
  };

  const saveKey = () => {
    const v = keyInput.trim();
    if (!v) return;
    setKey(v);
    setKeyInput("");
    setHasKey(true);
    haptic("success");
  };

  return (
    <Sheet open={open} onClose={onClose} title={AI_NAME} subtitle={`reading ${CONTEXT_LABEL[section]}`}
      footer={hasKey ? (
        <form onSubmit={e => { e.preventDefault(); void send(); }} className="flex items-end gap-2">
          <button type="button" aria-label="New conversation" onClick={reset} className="grid size-11 shrink-0 place-items-center rounded-full bg-card-2 text-ink-2"><RotateCcw className="size-4" /></button>
          <textarea rows={1} value={input} onChange={e => setInput(e.target.value)} placeholder={`Ask ${AI_NAME} anything…`}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-[22px] bg-card-2 px-4 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-3" />
          <button type="submit" aria-label="Send" disabled={busy || !input.trim()} className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--button)] text-[var(--button-ink)] disabled:opacity-30"><ArrowUp className="size-5" /></button>
        </form>
      ) : undefined}>
      {!hasKey ? (
        <div className="space-y-3">
          <div className="rounded-2xl bg-card-2 p-4 text-[14px] leading-snug text-ink-2">
            <KeyRound className="mb-2 size-5 text-accent-2" />
            {AI_NAME} needs a free Gemini API key from <b className="text-ink">aistudio.google.com/apikey</b>. It's kept on this device only and never saved in the app's code or database.
          </div>
          <input value={keyInput} onChange={e => setKeyInput(e.target.value)} placeholder="Paste your Gemini API key" autoComplete="off"
            className="w-full rounded-2xl bg-card-2 px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink-3" />
          <button onClick={saveKey} className="h-[50px] w-full rounded-full bg-[var(--button)] text-[16px] font-semibold text-[var(--button-ink)]">Save key</button>
        </div>
      ) : (
        <div ref={list} className="flex min-h-[40dvh] flex-col gap-2">
          {msgs.map((m, i) => (
            <div key={i} className={cn("max-w-[85%] rounded-[20px] px-3.5 py-2.5 text-[15px] leading-snug",
              m.who === "me" ? "self-end rounded-br-md bg-accent-2 text-on-accent" :
              m.who === "err" ? "self-start rounded-bl-md bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-danger" :
              "self-start rounded-bl-md bg-card-2 text-ink")}
              {...(m.who === "ai" ? { dangerouslySetInnerHTML: { __html: md(m.text) } } : { children: m.text })} />
          ))}
          {busy && <div className="self-start rounded-[20px] rounded-bl-md bg-card-2 px-4 py-3"><span className="flex gap-1">{[0, 1, 2].map(i => <span key={i} className="size-1.5 animate-bounce rounded-full bg-ink-3" style={{ animationDelay: `${i * 120}ms` }} />)}</span></div>}
          {history.current.length === 0 && !busy && (
            <div className="mt-1 flex flex-wrap gap-2">
              {CHIPS[section].map(c => (
                <button key={c} onClick={() => void send(c)} className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-semibold text-ink-2 active:scale-95">{c}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
