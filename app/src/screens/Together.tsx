import { useEffect, useRef, useState } from "react";
import { Copy, Maximize, Mic, MicOff, MonitorPlay, MonitorUp, PhoneOff, Send, Users, Video, VideoOff } from "lucide-react";
import { createRoom, hangup, joinRoom, myLabel, remoteLabel, sendChat, toggleCam, toggleMic, toggleScreen, useCall, type LinkState } from "@/together/call";
import { toast } from "@/app/feedback";
import { Card, SectionTitle } from "@/ui/Card";
import { PrimaryButton } from "@/ui/Controls";
import { cn } from "@/lib/cn";
import { haptic } from "@/lib/haptics";
import { BackLink, ScreenTitle } from "./common";

function VideoEl({ stream, muted, className }: { stream: MediaStream | null; muted?: boolean; className?: string }) {
  const el = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (el.current && el.current.srcObject !== stream) el.current.srcObject = stream; }, [stream]);
  return <video ref={el} autoPlay playsInline muted={muted} className={className} />;
}

const DOT: Record<LinkState, string> = { "": "bg-ink-3", connecting: "bg-caution animate-pulse", connected: "bg-positive", error: "bg-danger" };

export function Together() {
  const call = useCall();
  return (
    <div>
      <BackLink />
      <ScreenTitle>Together</ScreenTitle>
      {call.inCall ? <InCall /> : <Lobby />}
    </div>
  );
}

function Lobby() {
  const [code, setCode] = useState("");
  return (
    <>
      <Card className="p-5 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-[18px] bg-accent-2 text-on-accent" style={{ boxShadow: "inset 0 1px 0 var(--sheen), 0 8px 20px -8px var(--accent-2)" }}><MonitorPlay className="size-7" /></span>
        <h2 className="mt-3 text-[19px] font-semibold text-ink">Watch & call together</h2>
        <p className="mx-auto mt-1 max-w-[300px] text-[14px] leading-snug text-ink-2">Video call, share your screen with sound, and chat — from wherever you both are.</p>
        <PrimaryButton className="mt-4" onClick={() => void createRoom()}>Start a call</PrimaryButton>
      </Card>
      <SectionTitle>Join with a code</SectionTitle>
      <Card className="flex gap-2 p-3">
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" autoCapitalize="characters"
          onKeyDown={e => { if (e.key === "Enter" && code.trim()) void joinRoom(code); }}
          className="min-w-0 flex-1 rounded-2xl bg-card-2 px-4 py-3 text-center font-mono text-[20px] tracking-[0.3em] text-ink outline-none placeholder:text-ink-3" />
        <button disabled={code.trim().length < 4} onClick={() => { haptic("tap"); void joinRoom(code); }}
          className="shrink-0 rounded-2xl bg-[var(--button)] px-5 text-[15px] font-semibold text-[var(--button-ink)] disabled:opacity-30">Join</button>
      </Card>
      <p className="mt-3 px-2 text-center text-[12px] text-ink-3">Works with the old app too — either of you can start the call.</p>
    </>
  );
}

function InCall() {
  const call = useCall();
  const stage = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const msgs = useRef<HTMLDivElement>(null);
  useEffect(() => { msgs.current?.scrollTo({ top: msgs.current.scrollHeight }); }, [call.messages.length]);
  const time = `${String(Math.floor(call.seconds / 60)).padStart(2, "0")}:${String(call.seconds % 60).padStart(2, "0")}`;

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(call.roomId || ""); toast("Code copied"); } catch { toast("Copy failed — the code is " + call.roomId, "info"); }
  };
  const fullscreen = () => {
    const el = stage.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (el.requestFullscreen) void el.requestFullscreen();
    else toast("Fullscreen isn't supported here", "info");
  };
  const main = call.screen || call.remote;

  return (
    <>
      <div ref={stage} className="relative overflow-hidden rounded-[22px] bg-black shadow-card [&:fullscreen]:rounded-none">
        <div className="relative aspect-[4/5] w-full sm:aspect-video [:fullscreen_&]:aspect-auto [:fullscreen_&]:h-dvh">
          {main ? <VideoEl stream={main} muted={!!call.screen} className="absolute inset-0 size-full object-contain" /> : (
            <div className="absolute inset-0 grid place-items-center text-center text-white/70">
              <div><Users className="mx-auto mb-2 size-8" /><div className="text-[15px] font-medium">Waiting for {remoteLabel()}…</div></div>
            </div>
          )}
          {call.screen && call.remote && <VideoEl stream={call.remote} className="absolute left-3 top-14 w-[28%] rounded-xl border border-white/20 object-cover shadow-lg" />}
          <div className="absolute bottom-24 right-3 w-[30%] overflow-hidden rounded-xl border border-white/20 bg-neutral-800 shadow-lg">
            {call.local && call.camOn ? <VideoEl stream={call.local} muted className="aspect-[3/4] w-full -scale-x-100 object-cover" /> :
              <div className="grid aspect-[3/4] place-items-center text-[12px] font-medium text-white/70">{myLabel()}</div>}
            {!call.micOn && <span className="absolute left-1.5 top-1.5 rounded-full bg-danger p-1 text-white"><MicOff className="size-3" /></span>}
          </div>

          <div className="absolute inset-x-0 top-3 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-black/50 px-3.5 py-1.5 text-[13px] font-medium text-white backdrop-blur">
              <span className={cn("size-2 rounded-full", DOT[call.link])} />{call.status}{call.remoteJoined && <span className="font-mono tabular text-white/70">{time}</span>}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2.5">
            <CallBtn label={call.micOn ? "Mute" : "Unmute"} on={call.micOn} onClick={toggleMic}>{call.micOn ? <Mic /> : <MicOff />}</CallBtn>
            <CallBtn label={call.camOn ? "Camera off" : "Camera on"} on={call.camOn} onClick={toggleCam}>{call.camOn ? <Video /> : <VideoOff />}</CallBtn>
            <CallBtn label={call.screenOn ? "Stop sharing" : "Share screen"} on={!call.screenOn} active={call.screenOn} onClick={() => void toggleScreen()}><MonitorUp /></CallBtn>
            <CallBtn label="Fullscreen" on onClick={fullscreen}><Maximize /></CallBtn>
            <button aria-label="Hang up" onClick={() => { haptic("warn"); void hangup(); }} className="grid size-12 place-items-center rounded-full bg-danger text-white active:scale-90"><PhoneOff className="size-5" /></button>
          </div>
        </div>
      </div>

      {call.isHost && call.roomId && !call.remoteJoined && (
        <Card className="mt-2.5 flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-ink-2">Share this code with {remoteLabel()}</div>
            <div className="font-mono text-[26px] font-semibold tracking-[0.25em] text-ink">{call.roomId}</div>
          </div>
          <button onClick={() => void copyCode()} className="flex items-center gap-1.5 rounded-full bg-card-2 px-3.5 py-2 text-[13px] font-semibold text-ink"><Copy className="size-4" />Copy</button>
        </Card>
      )}

      <SectionTitle>Chat</SectionTitle>
      <Card className="p-3">
        <div ref={msgs} className="flex max-h-[260px] min-h-[80px] flex-col gap-1.5 overflow-y-auto">
          {call.messages.map(m => m.system ? (
            <div key={m.id} className="self-center px-2 text-center text-[12px] text-ink-3">{m.text}</div>
          ) : (
            <div key={m.id} className={cn("max-w-[80%] rounded-[18px] px-3 py-2 text-[14px] leading-snug", m.mine ? "self-end rounded-br-md bg-accent-1 text-on-accent" : "self-start rounded-bl-md bg-card-2 text-ink")}>
              {!m.mine && <div className="text-[11px] font-semibold text-accent-1">{m.from}</div>}
              {m.text}
            </div>
          ))}
        </div>
        <form onSubmit={e => { e.preventDefault(); void sendChat(text); setText(""); }} className="mt-2 flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Say something…" className="min-w-0 flex-1 rounded-full bg-card-2 px-4 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-3" />
          <button type="submit" aria-label="Send" disabled={!text.trim()} className="grid size-11 place-items-center rounded-full bg-[var(--button)] text-[var(--button-ink)] disabled:opacity-30"><Send className="size-4" /></button>
        </form>
      </Card>
    </>
  );
}

function CallBtn({ label, on, active, onClick, children }: { label: string; on: boolean; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button aria-label={label} aria-pressed={!on} onClick={() => { haptic("tap"); onClick(); }}
      className={cn("grid size-12 place-items-center rounded-full backdrop-blur transition-transform active:scale-90 [&>svg]:size-5",
        active ? "bg-accent-2 text-white" : on ? "bg-white/20 text-white" : "bg-white text-black")}>
      {children}
    </button>
  );
}
