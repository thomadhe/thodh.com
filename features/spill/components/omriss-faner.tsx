"use client"

import { useState } from "react"
import { Omriss } from "./omriss"
import { OmrissOvelse } from "./omriss-ovelse"

/** Today's puzzle and a rapid-fire practice tab. */
export function OmrissFaner({ dato, form, nokkel }: { dato: string; form: string; nokkel: string }) {
  const [fane, setFane] = useState<"dagens" | "ovelse">("dagens")
  const knapp = (id: typeof fane, tekst: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={fane === id}
      onClick={() => setFane(id)}
      className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${fane === id ? "bg-[var(--spill-flate)] text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-900"}`}
    >
      {tekst}
    </button>
  )
  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex gap-1 rounded-2xl bg-neutral-100 p-1">
        {knapp("dagens", "Dagens")}
        {knapp("ovelse", "Øving")}
      </div>
      {fane === "dagens" ? <Omriss dato={dato} form={form} nokkel={nokkel} /> : <OmrissOvelse />}
    </div>
  )
}
