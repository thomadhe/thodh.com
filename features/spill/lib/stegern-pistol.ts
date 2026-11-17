// Startpistolen: 6/7-stegern's hot-potato duel. The players stand in a row; the one whose turn it is holds the
// cartoon starting pistol and must give a valid answer to the category no one has given yet. A valid answer passes
// the pistol on. The fuse is hidden and shared: it keeps running across passes, and when it goes off the holder
// loses a heart. Last one standing wins. Every valid answer also fills the player's life bar by its jump length;
// a full bar gives a heart back.
//
// The host runs this state machine and broadcasts it. Answers are only taken from the server's signed verdicts
// (lib/server/duell-signatur.ts), checked here for room, round, prompt, player and time. Pure, so it can be tested.

import { erHeltall, erObjekt, erTekst } from "./duell/rom"
import { hoppDm, type Nivaa } from "./stegern"
import type { Deltaker } from "./duell/rom"
import type { Signert } from "./duell/signatur"

export const MAKS_LIV = 3
/** When the pistol is passed with less than this left on the fuse, the fuse is set back to it. */
export const MIN_LUNTE_MS = 8000
/** Slack for clocks and the network at either end of a turn. */
export const PISTOL_SLINGRING_MS = 1500
/** A new prompt after this many accepted answers, so a prompt never runs dry. */
export const SVAR_PER_SPORSMAL = 10
/** The pause after a bang before the next fuse starts burning, so everyone sees what happened. */
export const SMELL_PAUSE_MS = 1800

export type PistolInnstillinger = {
  /** Hearts at the start, 1–3. */
  liv: number
  /** The hidden fuse is drawn between these, in seconds. */
  lunteMin: number
  lunteMaks: number
  /** Metres of jumps that fill the life bar. */
  livMeter: number
}

export const STANDARD_INNSTILLINGER: PistolInnstillinger = { liv: 2, lunteMin: 10, lunteMaks: 30, livMeter: 30 }
export const LUNTE_GRENSER = { min: 5, maks: 60, steg: 5 }
export const METER_GRENSER = { min: 10, maks: 60, steg: 5 }

/** Settings from the host (or the network), forced into their ranges. */
export function rensInnstillinger(x: Partial<PistolInnstillinger>): PistolInnstillinger {
  const klem = (v: unknown, min: number, maks: number, standard: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(maks, Math.max(min, Math.round(v))) : standard)
  const lunteMin = klem(x.lunteMin, LUNTE_GRENSER.min, LUNTE_GRENSER.maks - LUNTE_GRENSER.steg, STANDARD_INNSTILLINGER.lunteMin)
  return {
    liv: klem(x.liv, 1, MAKS_LIV, STANDARD_INNSTILLINGER.liv),
    lunteMin,
    lunteMaks: klem(x.lunteMaks, lunteMin + LUNTE_GRENSER.steg, LUNTE_GRENSER.maks, Math.max(lunteMin + LUNTE_GRENSER.steg, STANDARD_INNSTILLINGER.lunteMaks)),
    livMeter: klem(x.livMeter, METER_GRENSER.min, METER_GRENSER.maks, STANDARD_INNSTILLINGER.livMeter),
  }
}

export type PistolSpiller = { id: string; liv: number; /** Decimetres in the life bar. */ bar: number }

/** An accepted answer to the current prompt. */
export type PistolSvar = { id: string; tr: string; n: Nivaa; dom: Signert }

export type PistolSporsmal = { dato: string; nr: number; tekst: string }

export type Pistol = {
  innst: PistolInnstillinger
  sporsmal: PistolSporsmal[]
  /** Which prompt is up: an index that only grows (the list is used round and round). */
  sp: number
  spillere: PistolSpiller[]
  holder: string
  /** When the holder got the pistol (server ms): answers judged before that are not theirs to give. */
  tur: number
  /** When the pistol goes off (server ms). Hidden on screen. */
  lunte: number
  /** Accepted answers to the current prompt, oldest first. */
  svar: PistolSvar[]
  /** Who was knocked out, in order. */
  ute: string[]
  /** The last bang, for the animation: who, when (server ms). */
  smell: { id: string; ts: number; ute: boolean } | null
  /** The last heart won, for the "+1 ♥" flash. */
  pluss: { id: string; ts: number } | null
  /** The last pass, for the jump: who answered, the tier, when. */
  hopp: { id: string; n: Nivaa; ts: number } | null
  vinner: string | null
}

export const gjeldende = (p: Pick<Pistol, "sporsmal" | "sp">) => p.sporsmal[p.sp % Math.max(1, p.sporsmal.length)]
export const barMaks = (innst: PistolInnstillinger) => innst.livMeter * 10

/** A fuse length in ms, drawn from the settings. `tall` gives [0, 1). */
export const trekkLunte = (innst: PistolInnstillinger, tall: () => number) => Math.round((innst.lunteMin + (innst.lunteMaks - innst.lunteMin) * tall()) * 1000)

export function nyPistol(deltakere: Deltaker[], innst: PistolInnstillinger, sporsmal: PistolSporsmal[], na: number, tall: () => number): Pistol {
  return {
    innst,
    sporsmal,
    sp: 0,
    spillere: deltakere.map((d) => ({ id: d.id, liv: innst.liv, bar: 0 })),
    holder: deltakere[Math.floor(tall() * deltakere.length) % deltakere.length].id,
    tur: na,
    lunte: na + SMELL_PAUSE_MS + trekkLunte(innst, tall),
    svar: [],
    ute: [],
    smell: null,
    pluss: null,
    hopp: null,
    vinner: null,
  }
}

const lever = (s: PistolSpiller) => s.liv > 0

/**
 * The next player after `fra` in seat order who still has hearts and is in the room. `fra` itself only if nobody
 * else can take it.
 */
export function nesteHolder(p: Pick<Pistol, "spillere">, fra: string, tilstede: ReadonlySet<string>) {
  const n = p.spillere.length
  const start = p.spillere.findIndex((s) => s.id === fra)
  for (let k = 1; k <= n; k++) {
    const s = p.spillere[(start + k + n) % n]
    if (s.id !== fra && lever(s) && tilstede.has(s.id)) return s.id
  }
  return fra
}

/** The fuse after a pass: it keeps burning, but never with less than MIN_LUNTE_MS left. */
export const lunteEtterPass = (lunte: number, na: number) => Math.max(lunte, na + MIN_LUNTE_MS)

/** A jump into the life bar: a full bar gives a heart (up to MAKS_LIV) and the rest carries over; at the cap the bar stays full. */
export function fyllBar(s: PistolSpiller, dm: number, maks: number): { spiller: PistolSpiller; nyttLiv: boolean } {
  let { liv, bar } = s
  bar += dm
  let nyttLiv = false
  while (bar >= maks && liv < MAKS_LIV) {
    bar -= maks
    liv++
    nyttLiv = true
  }
  if (liv >= MAKS_LIV) bar = Math.min(bar, maks)
  return { spiller: { ...s, liv, bar }, nyttLiv }
}

export type Avslag = "ikke-signert" | "feil-holder" | "feil-sporsmal" | "for-sent" | "bom" | "allerede-sagt" | "ferdig"

/**
 * Whether a signed verdict (already checked for its signature; `data` is its JSON) is a valid answer by the holder
 * to the current prompt, given in their turn, on the list (tier 1 or more) and not said before for this prompt. The
 * server's matched answer (`tr`) decides what counts as the same answer, so "USA" and "Amerika" are one.
 */
export function vurderPistolsvar(data: Record<string, unknown> | null, kode: string, runde: number, p: Pistol): { ok: true; svar: Omit<PistolSvar, "dom"> } | { ok: false; grunn: Avslag } {
  if (p.vinner) return { ok: false, grunn: "ferdig" }
  if (!data || data.s !== "stegern" || data.k !== kode || data.r !== runde) return { ok: false, grunn: "ikke-signert" }
  if (data.id !== p.holder) return { ok: false, grunn: "feil-holder" }
  const q = gjeldende(p)
  if (data.i !== p.sp || data.d !== q?.dato || data.nr !== q?.nr) return { ok: false, grunn: "feil-sporsmal" }
  if (typeof data.ts !== "number" || data.ts < p.tur - PISTOL_SLINGRING_MS || data.ts > p.lunte + PISTOL_SLINGRING_MS) return { ok: false, grunn: "for-sent" }
  if (!erHeltall(data.n, 0, 5) || data.n === 0 || !erTekst(data.tr, 120) || !data.tr) return { ok: false, grunn: "bom" }
  if (p.svar.some((s) => s.tr === data.tr)) return { ok: false, grunn: "allerede-sagt" }
  return { ok: true, svar: { id: data.id, tr: data.tr, n: data.n as Nivaa } }
}

/** A valid answer: the holder jumps, fills the life bar, and the pistol goes to the next living player. */
export function pass(p: Pistol, svar: PistolSvar, na: number, tilstede: ReadonlySet<string>): Pistol {
  let pluss = p.pluss
  const spillere = p.spillere.map((s) => {
    if (s.id !== svar.id) return s
    const { spiller, nyttLiv } = fyllBar(s, hoppDm(svar.n), barMaks(p.innst))
    if (nyttLiv) pluss = { id: s.id, ts: na }
    return spiller
  })
  const alleSvar = [...p.svar, svar]
  const nyttSporsmal = alleSvar.length >= SVAR_PER_SPORSMAL
  return {
    ...p,
    spillere,
    pluss,
    hopp: { id: svar.id, n: svar.n, ts: na },
    svar: nyttSporsmal ? [] : alleSvar,
    sp: nyttSporsmal ? p.sp + 1 : p.sp,
    holder: nesteHolder({ spillere }, p.holder, tilstede),
    tur: na,
    lunte: lunteEtterPass(p.lunte, na),
  }
}

/**
 * The pistol goes off: the holder loses a heart (and is out at none), a new prompt and a new hidden fuse, and the
 * pistol goes to the next living player. When only one is left standing, they win.
 */
export function smell(p: Pistol, na: number, tilstede: ReadonlySet<string>, tall: () => number): Pistol {
  let erUte = false
  const spillere = p.spillere.map((s) => {
    if (s.id !== p.holder) return s
    const liv = Math.max(0, s.liv - 1)
    erUte = liv === 0
    return { ...s, liv }
  })
  const ute = erUte ? [...p.ute, p.holder] : p.ute
  const levende = spillere.filter(lever)
  const ny: Pistol = {
    ...p,
    spillere,
    ute,
    smell: { id: p.holder, ts: na, ute: erUte },
    svar: [],
    sp: p.sp + 1,
    tur: na,
    lunte: na + SMELL_PAUSE_MS + trekkLunte(p.innst, tall),
  }
  if (levende.length <= 1) return { ...ny, vinner: levende[0]?.id ?? p.holder, lunte: Infinity }
  // Everyone who is left might be away from the room for a moment: then the holder keeps it, if still alive.
  const neste = nesteHolder({ spillere }, p.holder, tilstede)
  return { ...ny, holder: neste === p.holder && erUte ? (levende[0]?.id ?? neste) : neste }
}

/** The holder is gone from the room: the pistol moves on with no penalty, and the fuse keeps burning. */
export function hoppOver(p: Pistol, na: number, tilstede: ReadonlySet<string>): Pistol {
  const neste = nesteHolder(p, p.holder, tilstede)
  return neste === p.holder ? p : { ...p, holder: neste, tur: na, lunte: lunteEtterPass(p.lunte, na) }
}

/** A new host takes over mid-game: a fresh fuse from now, so nobody loses a heart to the handover. */
export const nyLunte = (p: Pistol, na: number, tall: () => number): Pistol => ({ ...p, tur: na, lunte: na + trekkLunte(p.innst, tall) })

/** Final places: the winner, then the others in the reverse order they went out; those still in share by hearts. */
export function pistolPlassering(p: Pick<Pistol, "spillere" | "ute" | "vinner">): { id: string; plass: number }[] {
  const ute = [...p.ute].reverse()
  const inne = p.spillere.filter((s) => !p.ute.includes(s.id)).sort((a, b) => (a.id === p.vinner ? -1 : b.id === p.vinner ? 1 : b.liv - a.liv))
  return [...inne.map((s) => s.id), ...ute].map((id, i) => ({ id, plass: i + 1 }))
}

// ---- reading the pistol from the network ----

export function lesPistol(x: unknown, deltakere: Deltaker[]): Pistol | null {
  if (!erObjekt(x) || !erObjekt(x.innst) || !Array.isArray(x.sporsmal) || !Array.isArray(x.spillere) || !Array.isArray(x.svar) || !Array.isArray(x.ute)) return null
  const innst = rensInnstillinger(x.innst as Partial<PistolInnstillinger>)
  if (x.sporsmal.length < 1 || x.sporsmal.length > 40) return null
  const sporsmal: PistolSporsmal[] = []
  for (const s of x.sporsmal) {
    if (!erObjekt(s) || !erTekst(s.dato, 10) || !erHeltall(s.nr, 0, 4) || !erTekst(s.tekst, 200)) return null
    sporsmal.push({ dato: s.dato, nr: s.nr, tekst: s.tekst })
  }
  const ider = new Set(deltakere.map((d) => d.id))
  const spillere: PistolSpiller[] = []
  for (const s of x.spillere) {
    if (!erObjekt(s) || typeof s.id !== "string" || !ider.has(s.id) || !erHeltall(s.liv, 0, MAKS_LIV) || !erHeltall(s.bar, 0, 10_000)) return null
    spillere.push({ id: s.id, liv: s.liv, bar: s.bar })
  }
  const svar: PistolSvar[] = []
  for (const s of x.svar.slice(0, SVAR_PER_SPORSMAL)) {
    if (!erObjekt(s) || typeof s.id !== "string" || !erTekst(s.tr, 120) || !erHeltall(s.n, 1, 5) || !erObjekt(s.dom) || typeof s.dom.j !== "string" || typeof s.dom.s !== "string") return null
    svar.push({ id: s.id, tr: s.tr, n: s.n as Nivaa, dom: { j: s.dom.j, s: s.dom.s } })
  }
  const tid = (v: unknown) => (typeof v === "number" && (Number.isFinite(v) || v === Infinity) ? v : null)
  const hendelse = <T extends Record<string, unknown>>(v: unknown, sjekk: (o: Record<string, unknown>) => T | null): T | null => (erObjekt(v) ? sjekk(v) : null)
  const sp = x.sp
  const tur = tid(x.tur)
  const lunte = x.lunte === null ? Infinity : tid(x.lunte)
  if (!erHeltall(sp, 0, 1e6) || typeof x.holder !== "string" || !ider.has(x.holder) || tur === null || lunte === null) return null
  return {
    innst,
    sporsmal,
    sp,
    spillere,
    holder: x.holder,
    tur,
    lunte,
    svar,
    ute: x.ute.filter((u): u is string => typeof u === "string" && ider.has(u)),
    smell: hendelse(x.smell, (o) => (typeof o.id === "string" && typeof o.ts === "number" ? { id: o.id, ts: o.ts, ute: o.ute === true } : null)),
    pluss: hendelse(x.pluss, (o) => (typeof o.id === "string" && typeof o.ts === "number" ? { id: o.id, ts: o.ts } : null)),
    hopp: hendelse(x.hopp, (o) => (typeof o.id === "string" && typeof o.ts === "number" && erHeltall(o.n, 0, 5) ? { id: o.id, n: o.n as Nivaa, ts: o.ts } : null)),
    vinner: typeof x.vinner === "string" && ider.has(x.vinner) ? x.vinner : null,
  }
}
