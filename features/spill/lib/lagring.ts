"use client"

import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import type { SpillId } from "./spill"

// Progress lives in localStorage, one entry per game and date: "spill:<id>:<dato>".

export type Resultat = {
  status: "pagar" | "vunnet" | "tapt" | "ferdig"
  /** Short label for calendars and summaries, e.g. "18/25" or "12 gjetninger". */
  etikett?: string
  /** Numeric score for averages, where higher is better. */
  poeng?: number
}

const PREFIX = "spill"
const HENDELSE = "spill-lagring"

function nokkel(id: SpillId, dato: string) {
  return `${PREFIX}:${id}:${dato}`
}

export function lesLagret<T>(id: SpillId, dato: string): T | null {
  try {
    const raw = localStorage.getItem(nokkel(id, dato))
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function skrivLagret(id: SpillId, dato: string, verdi: unknown) {
  try {
    localStorage.setItem(nokkel(id, dato), JSON.stringify(verdi))
    window.dispatchEvent(new Event(HENDELSE))
  } catch {
    // Private mode or full storage: the game still works for this session.
  }
}

/** Rejects stored entries (old versions, hand edits) whose top-level shape differs from a fresh state. */
function sammeForm(x: unknown, mal: unknown): boolean {
  if (Array.isArray(mal)) return Array.isArray(x)
  if (mal && typeof mal === "object") {
    if (!x || typeof x !== "object" || Array.isArray(x)) return false
    return Object.entries(mal).every(([k, v]) => sammeForm((x as Record<string, unknown>)[k], v))
  }
  return typeof x === typeof mal
}

function harSammeForm(lagret: unknown, mal: object) {
  const status = (lagret as { resultat?: { status?: unknown } } | null)?.resultat?.status
  // A version field must match exactly; the shape check alone only compares types.
  const versjon = (x: unknown) => (x as { v?: unknown } | null)?.v
  return (
    sammeForm(lagret, mal) && versjon(lagret) === versjon(mal) && ["pagar", "vunnet", "tapt", "ferdig"].includes(status as string)
  )
}

/** Game state persisted for one date. `startverdi` must be stable for a given date. */
export function useDagligTilstand<T extends { resultat: Resultat }>(id: SpillId, dato: string, startverdi: () => T) {
  const [tilstand, setTilstand] = useState<{ dato: string; verdi: T; lastet: boolean }>(() => ({
    dato,
    verdi: startverdi(),
    lastet: false,
  }))

  useEffect(() => {
    const funnet = lesLagret<T>(id, dato)
    const lagret = funnet && harSammeForm(funnet, startverdi()) ? funnet : null
    // Loading from storage after hydration keeps server and client markup identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTilstand({ dato, verdi: lagret ?? startverdi(), lastet: true })
    // startverdi is derived from the date; re-running on identity changes would reset progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dato])

  const oppdater = useCallback(
    (endring: (forrige: T) => T) => {
      setTilstand((forrige) => {
        const verdi = endring(forrige.verdi)
        skrivLagret(id, forrige.dato, verdi)
        return { ...forrige, verdi }
      })
    },
    [id],
  )

  const aktuell = tilstand.dato === dato
  return {
    verdi: aktuell ? tilstand.verdi : startverdi(),
    lastet: aktuell && tilstand.lastet,
    oppdater,
  }
}

function abonner(varsle: () => void) {
  window.addEventListener(HENDELSE, varsle)
  window.addEventListener("storage", varsle)
  return () => {
    window.removeEventListener(HENDELSE, varsle)
    window.removeEventListener("storage", varsle)
  }
}

export type AlleResultater = Partial<Record<SpillId, Record<string, Resultat>>>

/** Stored results for every game, keyed by game and date. Re-renders when progress changes. */
export function useAlleResultater(): AlleResultater {
  const snapshot = useSyncExternalStore(
    abonner,
    () => {
      const ut: Record<string, Record<string, Resultat>> = {}
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const [prefix, id, dato] = localStorage.key(i)?.split(":") ?? []
          if (prefix !== PREFIX || !id || !dato) continue
          const r = (JSON.parse(localStorage.getItem(`${prefix}:${id}:${dato}`) ?? "null") as { resultat?: Resultat } | null)
            ?.resultat
          if (r) (ut[id] ??= {})[dato] = r
        }
      } catch {
        // Ignore unreadable entries.
      }
      return JSON.stringify(ut)
    },
    () => "{}",
  )
  return JSON.parse(snapshot) as AlleResultater
}

/** All stored results for one game, keyed by date. */
export function useResultater(id: SpillId) {
  return useAlleResultater()[id] ?? {}
}
