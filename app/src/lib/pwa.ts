import { useSyncExternalStore } from "react";
import { getApp } from "firebase/app";
import { toast } from "@/app/feedback";

// PWA plumbing ported from the legacy page: service worker, install prompt, notifications.

const VAPID_KEY = "BL2Xzm5XTdl0S0v_qjvatOzoMcx3DI1m2VrG8YD1DGe10gOrQ2BD0JYuOesOXNtrdWODxN26CHTlaV-t-87lVhk";
const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 7;

interface InstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());

export function isStandalone() {
  return matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: window-controls-overlay)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function recentlyDismissed() {
  try {
    const t = parseInt(localStorage.getItem(DISMISS_KEY) || "0", 10);
    return !!t && Date.now() - t < DISMISS_DAYS * 86400000;
  } catch { return false; }
}

/** Shows the install card only when the browser offered an install and it wasn't dismissed lately. */
export function useInstallable() {
  return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => !!deferred && !recentlyDismissed() && !isStandalone());
}

export async function promptInstall() {
  if (!deferred) return;
  const e = deferred;
  deferred = null;
  emit();
  await e.prompt();
  const { outcome } = await e.userChoice;
  if (outcome === "dismissed") dismissInstall();
}

export function dismissInstall() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* device-only */ }
  emit();
}

export function setupPwa() {
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e as InstallPromptEvent; emit(); });
  addEventListener("appinstalled", () => { deferred = null; emit(); });

  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).then(reg => {
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        w?.addEventListener("statechange", () => {
          if (w.state === "installed" && navigator.serviceWorker.controller) toast("A new version is ready — reopen the app to update", "info");
        });
      });
    }).catch(() => { /* offline support is a bonus, never a blocker */ });
    void listenForeground();
  });
}

/** legacy requestNotificationPermission(): ask, then register this device with FCM. */
export async function requestNotifications(): Promise<NotificationPermission | "unsupported"> {
  if (!("Notification" in window)) return "unsupported";
  const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (permission === "granted" && "serviceWorker" in navigator && import.meta.env.PROD) {
    try {
      const { getMessaging, getToken } = await import("firebase/messaging");
      const registration = await navigator.serviceWorker.ready;
      await getToken(getMessaging(getApp()), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    } catch { /* push isn't supported in every browser — local notifications still work */ }
  }
  return permission;
}

/** Messages that arrive while the app is open (legacy onMessage handler). */
async function listenForeground() {
  try {
    const { getMessaging, isSupported, onMessage } = await import("firebase/messaging");
    if (!(await isSupported())) return;
    onMessage(getMessaging(getApp()), payload => {
      const n = payload.notification || {};
      if (Notification.permission === "granted") new Notification(n.title || "New Message", { body: n.body, icon: "/icon-192.png" });
    });
  } catch { /* messaging not available */ }
}
