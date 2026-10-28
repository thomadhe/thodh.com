"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ProgressStore } from "../lib/progress-store";
import { type ProgressSnapshot } from "../lib/progress";

export function useAccountProgress(userId: string, initial: ProgressSnapshot) {
  const [store] = useState(() => new ProgressStore(userId, initial));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => {
    if (snapshot.status !== "pending") return;
    const timer = setTimeout(() => { void store.flush(); }, 300);
    return () => clearTimeout(timer);
  }, [snapshot, store]);
  useEffect(() => {
    const check = () => { void store.refresh(); };
    const visible = () => { if (document.visibilityState === "visible") check(); };
    const beforeUnload = (event: BeforeUnloadEvent) => { if (store.getSnapshot().dirty) event.preventDefault(); };
    const pageShow = (event: PageTransitionEvent) => { if (event.persisted) { store.invalidate(); window.location.reload(); } };
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("thodh-account") : null;
    if (channel) channel.onmessage = () => store.invalidate();
    window.addEventListener("focus", check);
    window.addEventListener("online", check);
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("pageshow", pageShow);
    document.addEventListener("visibilitychange", visible);
    const timer = setInterval(visible, 60000);
    check();
    return () => {
      channel?.close(); clearInterval(timer);
      window.removeEventListener("focus", check); window.removeEventListener("online", check);
      window.removeEventListener("beforeunload", beforeUnload); window.removeEventListener("pageshow", pageShow);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [store]);
  return { ...snapshot, setState: store.update, flush: store.flush, invalidate: store.invalidate };
}
