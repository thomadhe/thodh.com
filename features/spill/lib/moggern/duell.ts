// Pure duel-room rules and message parsing for Moggern (exactly 2 friends per room).
//
// Reuses the shared duel room primitives from features/spill/lib/duell/rom.ts (4-letter codes,
// presence ordering, host election, safe validation helpers).
//
// Anti-cheat design among friends:
//   - Each client scores BOTH faces from the video it actually sees: its own camera (`egen`)
//     and the opponent's received WebRTC video stream (`motstander`).
//   - The official duel score for player A is player B's score of A (`maalinger[B].motstander`).
//   - If a player's self-score disagrees with the opponent's score by >= AVVIK_TERSKEL, both
//     scores are shown side by side so friends can laugh about it.

import {
  erHeltall,
  erNyere,
  erObjekt,
  erTall,
  erTekst,
  iRekkefolge,
  rensNavn,
  type GrunnStatus,
  type Tilstede,
} from "../duell/rom"
import type { LysStatus } from "./lys"
import { DELPOENG_LISTE, regnTotal, type DelpoengKart, type KvalitetStats } from "./poeng"

export const MOGGERN_MAKS_SPILLERE = 2
export const MOGGERN_MIN_SPILLERE = 2
export const NEDTELLING_MS = 3200
export const MALING_MS = 10_000
/** Minimum difference between self-score and opponent-measured score to highlight a disagreement. */
export const AVVIK_TERSKEL = 1.2

export type MoggernFase = "lobby" | "nedtelling" | "maling" | "resultat"

export type MoggernDeltaker = {
  id: string
  navn: string
  farge: number
}

export type SpillerMaaling = {
  ok: boolean
  total: number
  delpoeng: DelpoengKart
  lysStatus: LysStatus
  kvalitet: KvalitetStats
}

/** One client's end-of-round measurement report for both faces it saw. */
export type MoggernRapport = {
  runde: number
  av: string
  egen: SpillerMaaling | null
  motstander: SpillerMaaling | null
}

export type MoggernStatus = GrunnStatus & {
  fase: MoggernFase
  deltakere: MoggernDeltaker[]
  /** Epoch ms when the current countdown or measurement began (synced via serverNa). */
  faseStartTid: number
  /** Reports indexed by reporter player id (`av`). */
  rapporter: Record<string, MoggernRapport>
}

export function moggernStart(runde = 0): MoggernStatus {
  return {
    runde,
    v: 0,
    fase: "lobby",
    deltakere: [],
    faseStartTid: 0,
    rapporter: {},
  }
}

/** Picks the first 2 players in room-join order for a 1v1 duel. */
export function velgMoggernDeltakere(tilstede: Tilstede[]): MoggernDeltaker[] {
  return iRekkefolge(tilstede)
    .slice(0, MOGGERN_MAKS_SPILLERE)
    .map((t, i) => ({
      id: t.id,
      navn: t.navn || `Spiller ${i + 1}`,
      farge: i,
    }))
}

/** Merges a newer shared status from Realtime while preserving reports already received in the same round. */
export function moggernTaImot(lokal: MoggernStatus, ny: MoggernStatus): MoggernStatus {
  const sammeRunde = ny.runde === lokal.runde
  if (!erNyere(ny, lokal)) {
    return sammeRunde ? { ...lokal, rapporter: { ...ny.rapporter, ...lokal.rapporter } } : lokal
  }
  return sammeRunde ? { ...ny, rapporter: { ...lokal.rapporter, ...ny.rapporter } } : ny
}

// ---- Strict parsers for Realtime broadcast payloads ----

function lesLysStatus(x: unknown): LysStatus | null {
  return x === "ok" || x === "overeksponert" || x === "undereksponert" ? x : null
}

function lesDelpoengKart(x: unknown): DelpoengKart | null {
  if (!erObjekt(x)) return null
  const ut = {} as DelpoengKart
  for (const info of DELPOENG_LISTE) {
    const verdi = x[info.id]
    if (!erTall(verdi, 0, 10)) return null
    ut[info.id] = Math.round(verdi * 10) / 10
  }
  return ut
}

function lesKvalitetStats(x: unknown): KvalitetStats | null {
  if (!erObjekt(x)) return null
  if (
    !erHeltall(x.antallRammer, 0, 10_000) ||
    !erHeltall(x.gyldigeRammer, 0, 10_000) ||
    !erTall(x.snittAbsYaw, 0, 180) ||
    !erTall(x.snittAbsPitch, 0, 180) ||
    !erTall(x.snittIpdAndel, 0, 2) ||
    !erTall(x.stabilitet, 0, 10)
  ) {
    return null
  }
  return {
    antallRammer: x.antallRammer,
    gyldigeRammer: x.gyldigeRammer,
    snittAbsYaw: x.snittAbsYaw,
    snittAbsPitch: x.snittAbsPitch,
    snittIpdAndel: x.snittIpdAndel,
    stabilitet: x.stabilitet,
  }
}

export function lesSpillerMaaling(x: unknown): SpillerMaaling | null {
  if (!erObjekt(x) || typeof x.ok !== "boolean") return null
  const delpoeng = lesDelpoengKart(x.delpoeng)
  const lysStatus = lesLysStatus(x.lysStatus)
  const kvalitet = lesKvalitetStats(x.kvalitet)
  if (!delpoeng || !lysStatus || !kvalitet) return null
  // Recompute total deterministically from sub-scores so a tampered total cannot disagree with breakdown.
  const total = x.ok ? regnTotal(delpoeng) : 0
  return { ok: x.ok, total, delpoeng, lysStatus, kvalitet }
}

export function lesMoggernRapport(x: unknown): MoggernRapport | null {
  if (!erObjekt(x) || !erHeltall(x.runde, 0, 999) || !erTekst(x.av, 40) || !x.av) return null
  const egen = x.egen === null ? null : lesSpillerMaaling(x.egen)
  const motstander = x.motstander === null ? null : lesSpillerMaaling(x.motstander)
  if (x.egen !== null && !egen) return null
  if (x.motstander !== null && !motstander) return null
  return { runde: x.runde, av: x.av, egen, motstander }
}

export function lesMoggernDeltakere(x: unknown): MoggernDeltaker[] | null {
  if (!Array.isArray(x) || x.length > MOGGERN_MAKS_SPILLERE) return null
  const ut: MoggernDeltaker[] = []
  for (const d of x) {
    if (!erObjekt(d) || !erTekst(d.id, 40) || !d.id || !erTekst(d.navn, 20) || !erHeltall(d.farge, 0, 1)) return null
    ut.push({ id: d.id, navn: d.navn, farge: d.farge })
  }
  return ut
}

export function lesMoggernStatus(x: unknown): MoggernStatus | null {
  if (!erObjekt(x)) return null
  const { runde, v, fase, faseStartTid, rapporter } = x
  if (!erHeltall(runde, 0, 999) || !erHeltall(v, 0, 1e6)) return null
  if (fase !== "lobby" && fase !== "nedtelling" && fase !== "maling" && fase !== "resultat") return null
  if (!erHeltall(faseStartTid, 0, 1e15)) return null
  const deltakere = lesMoggernDeltakere(x.deltakere)
  if (!deltakere || !erObjekt(rapporter)) return null
  if (fase !== "lobby" && deltakere.length !== MOGGERN_MAKS_SPILLERE) return null

  const gyldigeRapporter: Record<string, MoggernRapport> = {}
  for (const [nokkel, verdi] of Object.entries(rapporter)) {
    if (!erTekst(nokkel, 40)) return null
    const r = lesMoggernRapport(verdi)
    if (!r || r.av !== nokkel || r.runde !== runde) return null
    gyldigeRapporter[nokkel] = r
  }

  return {
    runde,
    v,
    fase,
    deltakere,
    faseStartTid,
    rapporter: gyldigeRapporter,
  }
}

// ---- WebRTC signaling message parser ----

export type WebRtcSignal =
  | { fra: string; til: string; type: "offer"; sdp: string }
  | { fra: string; til: string; type: "answer"; sdp: string }
  | { fra: string; til: string; type: "ice"; candidate: { candidate: string; sdpMid?: string | null; sdpMLineIndex?: number | null } }
  | { fra: string; til: string; type: "klar-video" }

export function lesSignal(x: unknown): WebRtcSignal | null {
  if (!erObjekt(x) || !erTekst(x.fra, 40) || !x.fra || !erTekst(x.til, 40) || !x.til) return null
  if (x.type === "offer" || x.type === "answer") {
    if (!erTekst(x.sdp, 64_000) || !x.sdp) return null
    return { fra: x.fra, til: x.til, type: x.type, sdp: x.sdp }
  }
  if (x.type === "ice") {
    if (!erObjekt(x.candidate) || !erTekst(x.candidate.candidate, 4000)) return null
    const sdpMid = x.candidate.sdpMid === undefined || x.candidate.sdpMid === null ? null : erTekst(x.candidate.sdpMid, 128) ? x.candidate.sdpMid : undefined
    const sdpMLineIndex =
      x.candidate.sdpMLineIndex === undefined || x.candidate.sdpMLineIndex === null
        ? null
        : erHeltall(x.candidate.sdpMLineIndex, 0, 64)
          ? x.candidate.sdpMLineIndex
          : undefined
    if (sdpMid === undefined || sdpMLineIndex === undefined) return null
    return {
      fra: x.fra,
      til: x.til,
      type: "ice",
      candidate: { candidate: x.candidate.candidate, sdpMid, sdpMLineIndex },
    }
  }
  if (x.type === "klar-video") {
    return { fra: x.fra, til: x.til, type: "klar-video" }
  }
  return null
}

// ---- Anti-cheat result reconciliation ----

export type SpillerSluttResultat = {
  deltaker: MoggernDeltaker
  /** Official score used in the duel (opponent's measurement of this player, falling back to self if video failed). */
  offisiell: SpillerMaaling | null
  /** Whether the official score came from the opponent ("motstander") or fell back to self ("egen"). */
  kilde: "motstander" | "egen" | "ingen"
  /** This player's own local measurement of themselves. */
  egenMaaling: SpillerMaaling | null
  /** Opponent's local measurement of this player. */
  motstanderMaaling: SpillerMaaling | null
  /** True when both measurements exist and differ by >= AVVIK_TERSKEL. */
  stortAvvik: boolean
  avvik: number
}

export type DuellUtfall = {
  spillere: SpillerSluttResultat[]
  /** Winner's player id, or null on tie / incomplete measurement. */
  vinnerId: string | null
  uavgjort: boolean
  beggeHarResultat: boolean
}

/**
 * Computes the official duel outcome using each client's measurement of the OPPONENT.
 * If opponent measurement is missing/invalid, falls back to self-measurement and flags it clearly.
 * If both exist and differ by >= AVVIK_TERSKEL, sets `stortAvvik: true` so the UI displays both.
 */
export function regnDuellUtfall(deltakere: readonly MoggernDeltaker[], rapporter: Record<string, MoggernRapport>): DuellUtfall {
  const spillere: SpillerSluttResultat[] = deltakere.map((d) => {
    const motstanderDeltaker = deltakere.find((x) => x.id !== d.id)
    const egenMaaling = rapporter[d.id]?.egen ?? null
    const motstanderMaaling = motstanderDeltaker ? (rapporter[motstanderDeltaker.id]?.motstander ?? null) : null

    const harMot = !!motstanderMaaling?.ok
    const harEgen = !!egenMaaling?.ok

    const kilde: "motstander" | "egen" | "ingen" = harMot ? "motstander" : harEgen ? "egen" : "ingen"
    const offisiell = harMot ? motstanderMaaling : harEgen ? egenMaaling : null

    const avvik =
      harMot && harEgen
        ? Math.round(Math.abs(motstanderMaaling!.total - egenMaaling!.total) * 10) / 10
        : 0
    const stortAvvik = harMot && harEgen && avvik >= AVVIK_TERSKEL

    return {
      deltaker: d,
      offisiell,
      kilde,
      egenMaaling,
      motstanderMaaling,
      stortAvvik,
      avvik,
    }
  })

  if (spillere.length !== 2 || !spillere[0].offisiell?.ok || !spillere[1].offisiell?.ok) {
    return { spillere, vinnerId: null, uavgjort: false, beggeHarResultat: false }
  }

  const p0 = spillere[0].offisiell.total
  const p1 = spillere[1].offisiell.total
  if (Math.abs(p0 - p1) < 0.05) {
    return { spillere, vinnerId: null, uavgjort: true, beggeHarResultat: true }
  }

  return {
    spillere,
    vinnerId: p0 > p1 ? spillere[0].deltaker.id : spillere[1].deltaker.id,
    uavgjort: false,
    beggeHarResultat: true,
  }
}

/**
 * Derives a clean, safe Norwegian display name from Supabase user metadata or email prefix.
 * Never returns the full email address.
 */
export function utledVisningsnavn(user: {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}): string {
  const meta = user.user_metadata ?? {}
  const kandidater = [meta.display_name, meta.full_name, meta.name, meta.username]
  for (const k of kandidater) {
    if (typeof k === "string") {
      const ren = rensNavn(k)
      if (ren) return ren
    }
  }
  if (typeof user.email === "string" && user.email.includes("@")) {
    const foran = user.email.split("@")[0].replace(/[._+-]+/g, " ")
    const ren = rensNavn(foran)
    if (ren) return ren.charAt(0).toUpperCase() + ren.slice(1)
  }
  return "Spiller"
}
