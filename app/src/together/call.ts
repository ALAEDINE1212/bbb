// Together — WebRTC video call + screen share, ported from the legacy "TOGETHER: WebRTC module".
// Signalling uses the same Firebase paths and shapes as the old app, so an old-app tab and a
// new-app tab can call each other:
//   together/{room}/offer|answer   { type, sdp }
//   together/{room}/ice/{host|guest}/{push-id}   RTCIceCandidateInit
//   together/{room}/chat/{push-id}  { text, from, ts }
// These are short-lived call records the host removes on hang-up (and onDisconnect), not app
// data, so calls work even in the read-only preview build.
import { useSyncExternalStore } from "react";
import { onChildAdded, onDisconnect, onValue, push, ref, remove, set, type Unsubscribe } from "firebase/database";
import { db } from "@/data/store";

const TURN_USERNAME = "000000002092916291";
const TURN_CREDENTIAL = "3bar7cVLgMPVZCNK3sPV2PFH5J8=";
const TURN_HOST = "free.expressturn.com:3478";
const ICE_CFG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: `turn:${TURN_HOST}`, username: TURN_USERNAME, credential: TURN_CREDENTIAL },
    { urls: `turn:${TURN_HOST}?transport=tcp`, username: TURN_USERNAME, credential: TURN_CREDENTIAL },
    { urls: "turns:free.expressturn.com:443", username: TURN_USERNAME, credential: TURN_CREDENTIAL },
    { urls: "turns:free.expressturn.com:443?transport=tcp", username: TURN_USERNAME, credential: TURN_CREDENTIAL }
  ],
  iceCandidatePoolSize: 10
};

export type LinkState = "" | "connecting" | "connected" | "error";
export interface ChatMsg { id: string; text: string; from: string; mine: boolean; system?: boolean }

export interface CallState {
  inCall: boolean;
  roomId: string | null;
  isHost: boolean;
  status: string;
  link: LinkState;
  micOn: boolean;
  camOn: boolean;
  screenOn: boolean;
  remoteJoined: boolean;
  seconds: number;
  messages: ChatMsg[];
  local: MediaStream | null;
  remote: MediaStream | null;
  screen: MediaStream | null;
}

const initial: CallState = {
  inCall: false, roomId: null, isHost: false, status: "", link: "", micOn: true, camOn: true, screenOn: false,
  remoteJoined: false, seconds: 0, messages: [], local: null, remote: null, screen: null
};

let state: CallState = initial;
const listeners = new Set<() => void>();
function patch(p: Partial<CallState>) { state = { ...state, ...p }; listeners.forEach(fn => fn()); }
export function useCall() {
  return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => state);
}

let pc: RTCPeerConnection | null = null;
let audioCtx: AudioContext | null = null;
let timer = 0;
let unsubs: Unsubscribe[] = [];
let iceBuffer: RTCIceCandidateInit[] = [];
let remoteDescSet = false;
let sysId = 0;

export const myLabel = () => (state.isHost ? "Alaedine" : "Ines");
export const remoteLabel = () => (state.isHost ? "Ines" : "Alaedine");

function setStatus(status: string, link: LinkState) { patch({ status, link }); }
function sysMsg(text: string) { patch({ messages: [...state.messages, { id: "sys" + sysId++, text, from: "", mine: false, system: true }] }); }

function startTimer() {
  clearInterval(timer);
  patch({ seconds: 0 });
  timer = window.setInterval(() => patch({ seconds: state.seconds + 1 }), 1000);
}

async function getMedia(): Promise<MediaStream | null> {
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: { width: 1920, height: 1080, facingMode: "user" }, audio: true });
    patch({ local: s });
    return s;
  } catch {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      patch({ local: s });
      return s;
    } catch {
      sysMsg("⚠️ Camera/mic unavailable — screen-share-only mode");
      return null;
    }
  }
}

async function drainIceBuffer() {
  while (iceBuffer.length) {
    const c = iceBuffer.shift()!;
    try { await pc?.addIceCandidate(new RTCIceCandidate(c)); } catch { /* stale candidate */ }
  }
}

function buildPC() {
  if (pc) { pc.close(); pc = null; }
  remoteDescSet = false;
  iceBuffer = [];
  const conn = new RTCPeerConnection(ICE_CFG);
  pc = conn;
  const roomId = state.roomId!;
  const myRole = state.isHost ? "host" : "guest";
  const theirRole = state.isHost ? "guest" : "host";
  let gotSrflx = false, gotRelay = false, gotHost = false;
  conn.onicecandidate = e => {
    if (!e.candidate) return;
    const t = e.candidate.candidate || "";
    if (t.includes(" typ host")) gotHost = true;
    if (t.includes(" typ srflx")) gotSrflx = true;
    if (t.includes(" typ relay")) gotRelay = true;
    void push(ref(db, `together/${roomId}/ice/${myRole}`), e.candidate.toJSON());
  };
  unsubs.push(onChildAdded(ref(db, `together/${roomId}/ice/${theirRole}`), snap => {
    const c = snap.val();
    if (!c) return;
    if (remoteDescSet && pc) pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    else iceBuffer.push(c);
  }));
  conn.ontrack = e => { if (state.remote !== e.streams[0]) patch({ remote: e.streams[0] }); };

  let connectedOnce = false;
  let iceRestartTries = 0;
  conn.onconnectionstatechange = () => {
    const s = conn.connectionState;
    if (s === "connected") {
      setStatus("Connected 💕", "connected");
      if (!connectedOnce) {
        connectedOnce = true;
        patch({ remoteJoined: true });
        startTimer();
        sysMsg("✨ " + remoteLabel() + " joined the call");
      }
    }
    if (s === "connecting") setStatus("Connecting…", "connecting");
    if (s === "disconnected") setStatus(remoteLabel() + " reconnecting…", "connecting");
    if (s === "failed") {
      if (iceRestartTries < 2) {
        iceRestartTries++;
        setStatus("Reconnecting (" + iceRestartTries + ")…", "connecting");
        sysMsg("🔄 Trying to reconnect…");
        try { conn.restartIce(); } catch { /* not supported */ }
      } else {
        setStatus("Connection failed ❌", "error");
        sysMsg("⚠️ Connection failed. ICE candidates collected — host: " + gotHost + ", srflx: " + gotSrflx + ", relay: " + gotRelay + ".");
        sysMsg(gotRelay ? "💡 TURN was reachable but couldn't connect. Try a different network on one side, or refresh both pages."
          : "💡 No TURN relay candidates — this network needs a TURN server.");
      }
    }
  };
  return conn;
}

function subscribeChat() {
  unsubs.push(onChildAdded(ref(db, `together/${state.roomId}/chat`), snap => {
    const m = snap.val();
    if (!m) return;
    patch({ messages: [...state.messages, { id: snap.key!, text: String(m.text ?? ""), from: String(m.from ?? ""), mine: m.from === myLabel() }] });
  }));
}

export async function createRoom() {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  patch({ ...initial, inCall: true, isHost: true, roomId });
  setStatus("Waiting for " + remoteLabel() + "…", "connecting");
  sysMsg("Room " + roomId + " created — share the code 💕");
  const stream = await getMedia();
  const conn = buildPC();
  if (stream) stream.getTracks().forEach(t => conn.addTrack(t, stream));
  const offer = await conn.createOffer();
  await conn.setLocalDescription(offer);
  await set(ref(db, `together/${roomId}/offer`), { type: offer.type, sdp: offer.sdp });
  unsubs.push(onValue(ref(db, `together/${roomId}/answer`), async snap => {
    if (!snap.val() || remoteDescSet) return;
    await conn.setRemoteDescription(new RTCSessionDescription(snap.val()));
    remoteDescSet = true;
    await drainIceBuffer();
    setStatus("Call connecting…", "connecting");
    subscribeChat();
  }));
  void onDisconnect(ref(db, `together/${roomId}`)).remove();
}

export async function joinRoom(code: string) {
  const roomId = code.trim().toUpperCase();
  if (!roomId) return;
  patch({ ...initial, inCall: true, isHost: false, roomId });
  setStatus("Fetching room…", "connecting");
  const offer = await new Promise<RTCSessionDescriptionInit | null>(res => {
    let done = false;
    const u = onValue(ref(db, `together/${roomId}/offer`), snap => {
      if (snap.val()) { done = true; u(); res(snap.val()); }
    });
    setTimeout(() => { if (!done) { u(); res(null); } }, 8000);
  });
  if (!offer) {
    setStatus("Room not found ❌", "error");
    sysMsg("⚠️ No room with code " + roomId + ". Is the host already in?");
    return;
  }
  sysMsg("Joining room " + roomId + " 💕");
  const stream = await getMedia();
  const conn = buildPC();
  if (stream) stream.getTracks().forEach(t => conn.addTrack(t, stream));
  await conn.setRemoteDescription(new RTCSessionDescription(offer));
  remoteDescSet = true;
  await drainIceBuffer();
  const answer = await conn.createAnswer();
  await conn.setLocalDescription(answer);
  await set(ref(db, `together/${roomId}/answer`), { type: answer.type, sdp: answer.sdp });
  setStatus("Connecting…", "connecting");
  subscribeChat();
}

export async function sendChat(text: string) {
  const txt = text.trim();
  if (!txt || !state.roomId) return;
  await push(ref(db, `together/${state.roomId}/chat`), { text: txt, from: myLabel(), ts: Date.now() });
}

export function toggleMic() {
  if (!state.local) return;
  const micOn = !state.micOn;
  state.local.getAudioTracks().forEach(t => { t.enabled = micOn; });
  patch({ micOn });
}

export function toggleCam() {
  if (!state.local) return;
  const camOn = !state.camOn;
  state.local.getVideoTracks().forEach(t => { t.enabled = camOn; });
  patch({ camOn });
}

export async function toggleScreen() {
  if (state.screenOn) {
    state.screen?.getTracks().forEach(t => t.stop());
    const camTrack = state.local?.getVideoTracks()[0];
    if (pc && camTrack) pc.getSenders().find(s => s.track && s.track.kind === "video")?.replaceTrack(camTrack);
    if (audioCtx) {
      const mic = state.local?.getAudioTracks()[0];
      if (pc && mic) pc.getSenders().find(s => s.track && s.track.kind === "audio")?.replaceTrack(mic);
      try { await audioCtx.close(); } catch { /* already closed */ }
      audioCtx = null;
    }
    patch({ screenOn: false, screen: null });
    sysMsg("🛑 Screen share stopped");
    return;
  }
  try {
    const s = await navigator.mediaDevices.getDisplayMedia({
      video: { width: 1920, height: 1080, frameRate: 30 },
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, sampleRate: 48000 }
    });
    patch({ screenOn: true, screen: s });
    if (pc) {
      pc.getSenders().find(x => x.track && x.track.kind === "video")?.replaceTrack(s.getVideoTracks()[0]);
      const screenAudio = s.getAudioTracks();
      if (screenAudio.length) {
        /* Mix mic + screen audio so the other side hears both you and the movie. */
        try {
          audioCtx = new AudioContext();
          const dest = audioCtx.createMediaStreamDestination();
          const mic = state.local?.getAudioTracks()[0];
          if (mic) {
            const g = audioCtx.createGain();
            g.gain.value = 1.0;
            audioCtx.createMediaStreamSource(new MediaStream([mic])).connect(g).connect(dest);
          }
          const sg = audioCtx.createGain();
          sg.gain.value = 0.85;
          audioCtx.createMediaStreamSource(new MediaStream([screenAudio[0]])).connect(sg).connect(dest);
          const aSender = pc.getSenders().find(x => x.track && x.track.kind === "audio");
          if (aSender && dest.stream.getAudioTracks()[0]) await aSender.replaceTrack(dest.stream.getAudioTracks()[0]);
          sysMsg("🔊 Sharing screen + system audio (" + remoteLabel() + " hears both you and the movie)");
        } catch {
          sysMsg("⚠️ Audio mix failed — " + remoteLabel() + " will hear your mic only. Try Chrome.");
        }
      } else {
        sysMsg("🔇 No screen audio captured. Next time tick \"Share tab audio\" in the dialog (Chrome / Edge share tab + system audio best — Firefox cannot share system audio at all).");
      }
    }
    s.getVideoTracks()[0].onended = () => { if (state.screenOn) void toggleScreen(); };
  } catch (e) {
    if ((e as Error).name !== "NotAllowedError") sysMsg("⚠️ Screen share failed: " + (e as Error).message);
  }
}

export async function hangup() {
  state.local?.getTracks().forEach(t => t.stop());
  state.screen?.getTracks().forEach(t => t.stop());
  if (audioCtx) { try { await audioCtx.close(); } catch { /* already closed */ } audioCtx = null; }
  if (pc) { pc.close(); pc = null; }
  unsubs.forEach(u => { try { u(); } catch { /* already gone */ } });
  unsubs = [];
  const { isHost, roomId } = state;
  clearInterval(timer);
  remoteDescSet = false;
  iceBuffer = [];
  patch({ ...initial });
  if (isHost && roomId) await remove(ref(db, `together/${roomId}`));
}

/** The lobby shows this when a join attempt found no room. */
export function backToLobby() { void hangup(); }
