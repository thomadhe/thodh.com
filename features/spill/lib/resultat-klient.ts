"use client"

import { erServerSpill, type ServerSpillId } from "./sosial"
import type { SpillId } from "./spill"

// Client-side helpers for signed session tokens (`okt`), offline result receipts (`bevis`),
// auto-saving client-checked games when logged in, and syncing localStorage results after login.

export type KlientSignertPakke = { j: string; s: string }

const OKT_PREFIX = "spill-okt"
const BEVIS_PREFIX = "spill-bevis"
const SYNK_CACHE = "spill-synket-v1"

function lesJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function skrivJson(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    // Storage unavailable or full: gameplay still works.
  }
}

export function lesKlientOkt(spillId: ServerSpillId, dato: string): KlientSignertPakke | null {
  const p = lesJson<{ j?: unknown; s?: unknown }>(`${OKT_PREFIX}:${spillId}:${dato}`)
  return p && typeof p.j === "string" && typeof p.s === "string" ? { j: p.j, s: p.s } : null
}

export function lagreKlientOkt(spillId: ServerSpillId, dato: string, okt: unknown) {
  if (okt && typeof okt === "object" && typeof (okt as { j?: unknown }).j === "string" && typeof (okt as { s?: unknown }).s === "string") {
    skrivJson(`${OKT_PREFIX}:${spillId}:${dato}`, okt)
  }
}

export function lesKlientBevis(spillId: string, dato: string): KlientSignertPakke | null {
  const p = lesJson<{ j?: unknown; s?: unknown }>(`${BEVIS_PREFIX}:${spillId}:${dato}`)
  return p && typeof p.j === "string" && typeof p.s === "string" ? { j: p.j, s: p.s } : null
}

export function lagreKlientBevis(spillId: ServerSpillId, dato: string, bevis: unknown) {
  if (bevis && typeof bevis === "object" && typeof (bevis as { j?: unknown }).j === "string" && typeof (bevis as { s?: unknown }).s === "string") {
    skrivJson(`${BEVIS_PREFIX}:${spillId}:${dato}`, bevis)
  }
}

/**
 * Shared fetch wrapper for the 8 server-judged daily games.
 * Transparently attaches the stored signed `okt` token (if present) and persists
 * any returned `okt` / `bevis` tokens without altering the game's own payload shape.
 */
export async function spillSpor<T>(spillId: ServerSpillId, url: string, body: Record<string, unknown>): Promise<T> {
  const dato = typeof body.dato === "string" ? body.dato : null
  const okt = dato ? lesKlientOkt(spillId, dato) : null
  const payload = okt ? { ...body, okt } : body
  const svar = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = (await svar.json().catch(() => ({ melding: "Noe gikk galt." }))) as Record<string, unknown>
  if (!svar.ok) throw new Error(typeof data.melding === "string" ? data.melding : "Noe gikk galt.")
  if (dato) {
    if ("okt" in data) lagreKlientOkt(spillId, dato, data.okt)
    if ("bevis" in data) lagreKlientBevis(spillId, dato, data.bevis)
  }
  return data as T
}

function lesSynkSett(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SYNK_CACHE)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    return Array.isArray(arr) ? new Set(arr.filter((x): x is string => typeof x === "string")) : new Set()
  } catch {
    return new Set()
  }
}

function markerSynket(nokler: string[]) {
  try {
    const sett = lesSynkSett()
    for (const k of nokler) sett.add(k)
    sessionStorage.setItem(SYNK_CACHE, JSON.stringify([...sett].slice(-500)))
  } catch {
    // Ignore storage errors.
  }
}

/** Silently persists a completed client-checked daily game if the user is logged in. */
export function lagreKlientSpillResultat(spillId: SpillId, dato: string, tilstand: unknown) {
  if (typeof window === "undefined" || erServerSpill(spillId)) return
  const nokkel = `${spillId}:${dato}`
  void fetch("/spill/api/resultater", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oppforinger: [{ spillId, dato, tilstand }] }),
  })
    .then((r) => {
      if (r.ok) markerSynket([nokkel])
    })
    .catch(() => undefined)
}

export type LokalOppforing = {
  spillId: string
  dato: string
  tilstand?: unknown
  bevis?: KlientSignertPakke
}

/** Scans localStorage for all finished daily games (plus any signed `bevis` receipts). */
export function finnLokaleFerdigeResultater(): LokalOppforing[] {
  if (typeof window === "undefined") return []
  const kart = new Map<string, LokalOppforing>()
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      const deler = k.split(":")
      if (deler.length !== 3) continue
      const [prefix, spillId, dato] = deler
      if (!spillId || !/^\d{4}-\d{2}-\d{2}$/.test(dato)) continue
      const id = `${spillId}:${dato}`
      if (prefix === "spill") {
        const val = lesJson<{ resultat?: { status?: string } }>(k)
        if (!val?.resultat?.status || val.resultat.status === "pagar") continue
        const eks = kart.get(id) ?? { spillId, dato }
        eks.tilstand = val
        kart.set(id, eks)
      } else if (prefix === BEVIS_PREFIX) {
        const bevis = lesKlientBevis(spillId, dato)
        if (!bevis) continue
        const eks = kart.get(id) ?? { spillId, dato }
        eks.bevis = bevis
        kart.set(id, eks)
      }
    }
  } catch {
    return []
  }
  return [...kart.values()]
}

/**
 * Uploads finished local results (and signed offline `bevis` receipts) to the logged-in account.
 * Skips items already synced in this browser session unless `tving` is true.
 */
export async function synkLokaleResultater(tving = false): Promise<{ lagret: number; totalt: number; innlogget: boolean }> {
  const alle = finnLokaleFerdigeResultater()
  const synket = tving ? new Set<string>() : lesSynkSett()
  const nye = alle.filter((o) => !synket.has(`${o.spillId}:${o.dato}`))
  if (!nye.length) return { lagret: 0, totalt: alle.length, innlogget: true }

  let lagret = 0
  const batchStorrelse = 30
  for (let i = 0; i < nye.length; i += batchStorrelse) {
    const del = nye.slice(i, i + batchStorrelse)
    const svar = await fetch("/spill/api/resultater", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oppforinger: del }),
    })
    if (svar.status === 401) return { lagret: 0, totalt: alle.length, innlogget: false }
    if (!svar.ok) continue
    const data = (await svar.json().catch(() => ({}))) as { lagret?: number }
    lagret += typeof data.lagret === "number" ? data.lagret : 0
    markerSynket(del.map((o) => `${o.spillId}:${o.dato}`))
  }
  return { lagret, totalt: alle.length, innlogget: true }
}
