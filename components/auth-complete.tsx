"use client";
import { useEffect } from "react";
import { announceAccountChange } from "@/lib/auth/client";

export function AuthComplete({ next }: { next: string }) {
  useEffect(() => {
    announceAccountChange();
    window.location.replace(next);
  }, [next]);
  return <main className="mx-auto max-w-lg px-6 py-20"><h1 className="text-2xl font-semibold">Du er logget inn</h1><p className="mt-4 text-neutral-600" role="status">Åpner kontoen din…</p></main>;
}
