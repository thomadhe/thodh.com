"use client"

import { useCallback, useState, useSyncExternalStore } from "react"
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

const ingenEndring = () => () => {}

/**
 * False on the server and while hydrating, true in every other client render. Server HTML and hydration
 * agree because both see false; a component that mounts later (after a client-side navigation) sees true
 * in its very first render and can read localStorage straight away.
 */
export function useErKlient() {
  return useSyncExternalStore(
    ingenEndring,
    () => true,
    () => false,
  )
}

/** Game state persisted for one date. `startverdi` must be stable for a given date. */
export function useDagligTilstand<T extends { resultat: Resultat }>(id: SpillId, dato: string, startverdi: () => T) {
  const klient = useErKlient()
  const les = () => {
    const funnet = klient ? lesLagret<T>(id, dato) : null
    const lagret = funnet && harSammeForm(funnet, startverdi()) ? funnet : null
    return { dato, verdi: lagret ?? startverdi(), lastet: klient }
  }
  const [tilstand, setTilstand] = useState<{ dato: string; verdi: T; lastet: boolean }>(les)

  // Right after hydration (or if the date changes without a remount) storage is read during render rather
  // than in an effect, so the saved game replaces the placeholder without an extra painted frame.
  if (tilstand.dato !== dato || tilstand.lastet !== klient) setTilstand(les())

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

  return { verdi: tilstand.verdi, lastet: tilstand.lastet, oppdater }
}

export type AlleResultater = Partial<Record<SpillId, Record<string, Resultat>>>

const INGEN: AlleResultater = {}
const INGEN_FOR_SPILL: Record<string, Resultat> = {}

// One shared, parsed copy of all results, rebuilt only after storage changes. Every render gets the same object
// back, so components that depend on it do not recompute or re-render for nothing (the desktop re-renders
// every second for its clock).
let alleResultater: AlleResultater | null = null

if (typeof window !== "undefined") {
  // Added when the module loads, so the copy is cleared before any component is told about a change.
  const glem = () => {
    alleResultater = null
  }
  window.addEventListener(HENDELSE, glem)
  window.addEventListener("storage", glem)
}

function abonner(varsle: () => void) {
  window.addEventListener(HENDELSE, varsle)
  window.addEventListener("storage", varsle)
  return () => {
    window.removeEventListener(HENDELSE, varsle)
    window.removeEventListener("storage", varsle)
  }
}

function lesAlleResultater(): AlleResultater {
  if (alleResultater) return alleResultater
  const ut: Record<string, Record<string, Resultat>> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const [prefix, id, dato] = localStorage.key(i)?.split(":") ?? []
      if (prefix !== PREFIX || !id || !dato) continue
      try {
        const r = (JSON.parse(localStorage.getItem(`${prefix}:${id}:${dato}`) ?? "null") as { resultat?: Resultat } | null)?.resultat
        if (r) (ut[id] ??= {})[dato] = r
      } catch {
        // Ignore unreadable entries.
      }
    }
  } catch {
    // Storage is unavailable: no results.
  }
  return (alleResultater = ut)
}

/** Stored results for every game, keyed by game and date. Re-renders when progress changes. */
export function useAlleResultater(): AlleResultater {
  return useSyncExternalStore(abonner, lesAlleResultater, () => INGEN)
}

/** All stored results for one game, keyed by date. */
export function useResultater(id: SpillId) {
  return useAlleResultater()[id] ?? INGEN_FOR_SPILL
}
