"use client";

export function announceAccountChange() {
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("thodh-account");
    channel.postMessage("changed");
    channel.close();
  }
}

export async function signOut() {
  const response = await fetch("/auth/logg-ut", { method: "POST" });
  if (!response.ok) throw new Error("Kunne ikke logge ut. Prøv igjen.");
  announceAccountChange();
  window.location.replace("/logg-inn");
}
