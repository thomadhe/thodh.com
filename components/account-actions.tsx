"use client";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth/client";

export function AccountActions() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const reload = () => window.location.reload();
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("thodh-account") : null;
    if (channel) channel.onmessage = reload;
    const pageShow = (event: PageTransitionEvent) => { if (event.persisted) reload(); };
    window.addEventListener("pageshow", pageShow);
    return () => { channel?.close(); window.removeEventListener("pageshow", pageShow); };
  }, []);
  return <div className="mt-8"><button disabled={busy} onClick={async () => { setBusy(true); try { await signOut(); } catch { setError("Kunne ikke logge ut. Prøv igjen."); setBusy(false); } }} className="rounded-xl border border-neutral-300 px-5 py-3 text-sm hover:bg-neutral-100 disabled:opacity-50">{busy ? "Logger ut…" : "Logg ut av thodh.com"}</button>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</div>;
}
