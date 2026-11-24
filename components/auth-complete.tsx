"use client";
import { useEffect } from "react";
import { announceAccountChange } from "@/lib/auth/client";
import { useT } from "@/lib/sprak";

export function AuthComplete({ next }: { next: string }) {
  const t = useT();
  useEffect(() => {
    announceAccountChange();
    window.location.replace(next);
  }, [next]);
  return (
    <main className="mx-auto max-w-lg px-6 py-20">
      <h1 className="text-2xl font-semibold">{t("Du er logget inn", "You are signed in")}</h1>
      <p className="mt-4 text-neutral-600" role="status">{t("Åpner kontoen din…", "Opening your account…")}</p>
    </main>
  );
}
