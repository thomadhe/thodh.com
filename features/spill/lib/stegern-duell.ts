// 6/7-stegern duel: rooms of 2–6 friends answering the same five prompts at the same time. The room itself (codes,
// host, presence) is shared with the other duels in lib/duell/rom.ts; what is 6/7-stegern's own lives here, free of
// React and the network, so it can be tested: the shared game state, how it is merged, which answers count, and the
// final standings.
//
// Answers are never taken on a client's word. A player's answer goes to the server, which judges it and signs the
// verdict with the time (lib/server/duell-signatur.ts); the player passes that signed verdict to the room, and every
// client checks the signature, that it is for this room, round, question and player, and that the server judged it
// before the question's deadline. Scores are computed only from verdicts that pass.

import { apne, lesSignert, type Signert } from "./duell/signatur"
import { erHeltall, erObjekt, erTekst, iTide, lesDeltakere, type Deltaker } from "./duell/rom"
import { hoppDm, NORMALE, SEKUNDER, type Nivaa } from "./stegern"
import { lesPistol, rensInnstillinger, STANDARD_INNSTILLINGER, type Pistol, type PistolInnstillinger } from "./stegern-pistol"

export {
  erGyldigKode,
  erNyere,
  iRekkefolge,
  KODE_LENGDE,
  KODE_TEGN,
  lagKode,
  lesTilstede,
  MAKS_SPILLERE,
  MIN_SPILLERE,
  NAVN_MAKS,
  normaliserKode,
  rensNavn,
  SLINGRING_MS,
  velgDeltakere,
  vertAv,
  type Deltaker,
  type Tilstede,
} from "./duell/rom"
import { erNyere } from "./duell/rom"

/** Seconds the answers stay on screen before the host's client moves on by itself. */
export const VISNING_SEKUNDER = 12
export const SVAR_MS = SEKUNDER * 1000

/** One answer once its signed verdict has been checked. `ts` is when the server judged it. */
export type DuellSvar = { t: string; n: Nivaa; treff: string | null; ts: number }
export type DuellSporsmal = { dato: string; nr: number; tekst: string }
export type Fase = "lobby" | "sporsmal" | "visning" | "pistol" | "slutt"
/** "runder": five prompts for everyone at once. "pistol": Startpistolen, the hot-potato mode (lib/stegern-pistol.ts). */
export type Modus = "runder" | "pistol"

/** Answers by player id and question index (0–4). */
export type SvarKart<T> = Record<string, Partial<Record<number, T>>>

/** The shared game, sent by the host. */
export type Status = {
  runde: number
  /** Counts up with every change the host makes, so an older message never overwrites a newer one. */
  v: number
  fase: Fase
  nr: number
  sporsmal: DuellSporsmal[]
  deltakere: Deltaker[]
  /** Each question's deadline in server time (epoch ms) once it has opened; 0 before. */
  frister: number[]
  /** The signed verdicts, as the players sent them. Only `godkjenn` turns them into answers that count. */
  svar: SvarKart<Signert>
  /** The game mode and Startpistolen's settings, chosen by the host in the lobby. */
  modus: Modus
  innst: PistolInnstillinger
  /** Startpistolen's state while it is played and on its podium. */
  pistol: Pistol | null
}

export const startStatus = (runde = 0): Status => ({
  runde,
  v: 0,
  fase: "lobby",
  nr: 0,
  sporsmal: [],
  deltakere: [],
  frister: [],
  svar: {},
  modus: "runder",
  innst: STANDARD_INNSTILLINGER,
  pistol: null,
})

/** Every answer from both maps. A player's first verdict for a question is the one that stays. */
export function slaSammenSvar<T>(a: SvarKart<T>, b: SvarKart<T>): SvarKart<T> {
  const ut: SvarKart<T> = {}
  for (const kilde of [a, b]) {
    for (const [id, svar] of Object.entries(kilde)) {
      ut[id] = { ...svar, ...ut[id] }
    }
  }
  return ut
}

/** A newer status from the network, keeping answers this client heard that the sender had not yet. */
export function taImot(lokal: Status, ny: Status): Status {
  if (!erNyere(ny, lokal)) return lokal.runde === ny.runde ? { ...lokal, svar: slaSammenSvar(lokal.svar, ny.svar) } : lokal
  return { ...ny, svar: ny.runde === lokal.runde ? slaSammenSvar(ny.svar, lokal.svar) : ny.svar }
}

/**
 * The answer a signed verdict stands for, or null when it does not count: it must be the server's 6/7-stegern
 * verdict for this room, round, question and player, and judged inside the question's window. The signature itself
 * is checked before (lib/duell/signatur.ts); `data` is the signed JSON.
 */
export function godkjennDom(data: Record<string, unknown> | null, kode: string, s: Pick<Status, "runde" | "sporsmal" | "frister">, id: string, i: number): DuellSvar | null {
  if (!data) return null
  const q = s.sporsmal[i]
  if (!q || data.s !== "stegern" || data.k !== kode || data.r !== s.runde || data.i !== i || data.id !== id || data.d !== q.dato || data.nr !== q.nr) return null
  if (!erTekst(data.t, 80) || !erHeltall(data.n, 0, 5) || !(data.tr === null || erTekst(data.tr, 120)) || typeof data.ts !== "number") return null
  if (!iTide(data.ts, s.frister[i], SVAR_MS)) return null
  return { t: data.t, n: data.n as Nivaa, treff: data.tr, ts: data.ts }
}

/**
 * The answers that count: those whose signature checked out (`ok` says, by signature) and that `godkjennDom`
 * accepts. Players not in the round are left out.
 */
export function godkjenteSvar(kode: string, s: Status, ok: (x: Signert) => boolean): SvarKart<DuellSvar> {
  const ut: SvarKart<DuellSvar> = {}
  for (const d of s.deltakere) {
    const rad: Partial<Record<number, DuellSvar>> = {}
    for (const [i, x] of Object.entries(s.svar[d.id] ?? {})) {
      if (!x || !ok(x)) continue
      const svar = godkjennDom(apne(x), kode, s, d.id, Number(i))
      if (svar) rad[Number(i)] = svar
    }
    ut[d.id] = rad
  }
  return ut
}

/** Whether every player still in the room has an answer that counts for question nr. */
export function alleHarSvart(s: Pick<Status, "deltakere" | "nr">, svar: SvarKart<unknown>, tilstede: ReadonlySet<string>) {
  const aktive = s.deltakere.filter((d) => tilstede.has(d.id))
  return aktive.length > 0 && aktive.every((d) => svar[d.id]?.[s.nr])
}

/** The jump for one answer in decimetres. No answer in time is a miss, like an empty field. */
export const duellDm = (svar: Pick<DuellSvar, "n"> | undefined) => hoppDm(svar?.n ?? 0)

/** A player's total over the first `antall` questions. */
export function duellSum(svar: Partial<Record<number, Pick<DuellSvar, "n">>> | undefined, antall = NORMALE) {
  let dm = 0
  for (let i = 0; i < antall; i++) dm += duellDm(svar?.[i])
  return dm
}

export type Plassering = Deltaker & { dm: number; beste: number; plass: number }

/**
 * Standings after `antall` questions: longest total first. A tie is broken by the longest single jump for the
 * order, but tied totals share a place.
 */
export function rangering(deltakere: Deltaker[], svar: SvarKart<Pick<DuellSvar, "n">>, antall = NORMALE): Plassering[] {
  const rader = deltakere.map((d, i) => {
    const dm = duellSum(svar[d.id], antall)
    const beste = Math.max(0, ...Array.from({ length: antall }, (_, j) => duellDm(svar[d.id]?.[j])))
    return { rad: { ...d, dm, beste, plass: 0 }, i }
  })
  rader.sort((a, b) => b.rad.dm - a.rad.dm || b.rad.beste - a.rad.beste || a.i - b.i)
  return rader.map(({ rad }) => ({ ...rad, plass: 1 + rader.findIndex((x) => x.rad.dm === rad.dm) }))
}

// ---- reading messages from other clients: friends may cheat, but a malformed message must not break the page ----

export function lesSvarKart(x: unknown, deltakere: Deltaker[], antall: number): SvarKart<Signert> | null {
  if (!erObjekt(x)) return null
  const sv: SvarKart<Signert> = {}
  for (const d of deltakere) {
    const egne = x[d.id]
    if (!erObjekt(egne)) continue
    const rad: Partial<Record<number, Signert>> = {}
    for (let i = 0; i < antall; i++) {
      const s = lesSignert(egne[i])
      if (s) rad[i] = s
    }
    sv[d.id] = rad
  }
  return sv
}

export function lesStatus(x: unknown): Status | null {
  if (!erObjekt(x)) return null
  const { runde, v, fase, nr, sporsmal, frister } = x
  if (!erHeltall(runde, 0, 999) || !erHeltall(v, 0, 1e6) || !erHeltall(nr, 0, NORMALE - 1)) return null
  if (fase !== "lobby" && fase !== "sporsmal" && fase !== "visning" && fase !== "pistol" && fase !== "slutt") return null
  const modus: Modus = x.modus === "pistol" ? "pistol" : "runder"
  const innst = rensInnstillinger(erObjekt(x.innst) ? (x.innst as Partial<PistolInnstillinger>) : {})
  if (!Array.isArray(sporsmal) || sporsmal.length > NORMALE || !Array.isArray(frister) || frister.length > NORMALE) return null
  const sp: DuellSporsmal[] = []
  for (const s of sporsmal) {
    if (!erObjekt(s) || !erTekst(s.dato, 10) || !erHeltall(s.nr, 0, 9999) || !erTekst(s.tekst, 200)) return null
    sp.push({ dato: s.dato, nr: s.nr, tekst: s.tekst })
  }
  if ((fase === "sporsmal" || fase === "visning" || (fase === "slutt" && modus === "runder")) && sp.length !== NORMALE) return null
  if (!frister.every((f) => erHeltall(f, 0, 1e14))) return null
  const dl = lesDeltakere(x.deltakere)
  const sv = dl && lesSvarKart(x.svar, dl, NORMALE)
  if (!dl || !sv) return null
  const pistol = x.pistol == null ? null : lesPistol(x.pistol, dl)
  if (x.pistol != null && !pistol) return null
  if ((fase === "pistol" || (fase === "slutt" && modus === "pistol")) && !pistol) return null
  return { runde, v, fase, nr, sporsmal: sp, deltakere: dl, frister: frister as number[], svar: sv, modus, innst, pistol }
}
