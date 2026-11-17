// Gjetteløs duel: 2–6 friends guess the same number questions at the same time, then see every guess against the
// answer. The room is the shared duel room (lib/duell/rom.ts); this is Gjetteløs's own part, free of React and the
// network so it can be tested: the shared status, which guesses and answers count, and the standings.
//
// Nothing a client claims counts by itself. A guess is stamped by the server with the player, the question and the
// time, and the stamp says nothing about the answer, so it can be passed round while others still think. Once the
// question has closed, the host asks the server for the answer, which comes back signed. Every client checks both
// signatures and computes the points itself with the daily game's own scoring (poengFor).

import { erHeltall, erNyere, erObjekt, erTall, erTekst, iTide, lesDeltakere, plasser, type Deltaker } from "./duell/rom"
import { apne, lesSignert, type Signert } from "./duell/signatur"
import { ANTALL, poengFor, summer, type SporsmalVisning } from "./gjettelos"
import { lesSvarKart, slaSammenSvar, type SvarKart } from "./stegern-duell"

export const GJ_SEKUNDER = 30
export const GJ_SVAR_MS = GJ_SEKUNDER * 1000
/** Seconds the reveal stays up before the host's client moves on by itself. */
export const GJ_VISNING_SEKUNDER = 15

export type GjDuellSporsmal = SporsmalVisning & { dato: string; nr: number }
export type GjFase = "lobby" | "sporsmal" | "visning" | "slutt"

/** The answer to a question, as the server signed it. */
export type GjFasit = { fasit: number; aarstall: boolean; kilde: string; per?: string; ca?: boolean; info?: string }
/** A guess whose stamp checked out. */
export type GjGjett = { g: number; ts: number }

export type GjStatus = {
  runde: number
  v: number
  fase: GjFase
  nr: number
  sporsmal: GjDuellSporsmal[]
  deltakere: Deltaker[]
  /** Each question's deadline in server time once it has opened; 0 before. */
  frister: number[]
  /** The stamped guesses, as the players sent them. */
  svar: SvarKart<Signert>
  /** The signed answers, by question, added by the host when a question closes. */
  fasiter: Partial<Record<number, Signert>>
}

export const gjStart = (runde = 0): GjStatus => ({ runde, v: 0, fase: "lobby", nr: 0, sporsmal: [], deltakere: [], frister: [], svar: {}, fasiter: {} })

/** A newer status from the network, keeping guesses and answers this client heard that the sender had not yet. */
export function gjTaImot(lokal: GjStatus, ny: GjStatus): GjStatus {
  const samme = ny.runde === lokal.runde
  if (!erNyere(ny, lokal)) return samme ? { ...lokal, svar: slaSammenSvar(lokal.svar, ny.svar), fasiter: { ...ny.fasiter, ...lokal.fasiter } } : lokal
  return samme ? { ...ny, svar: slaSammenSvar(ny.svar, lokal.svar), fasiter: { ...lokal.fasiter, ...ny.fasiter } } : ny
}

type Omfang = Pick<GjStatus, "runde" | "sporsmal" | "frister">

const passer = (data: Record<string, unknown>, kode: string, s: Omfang, i: number) => {
  const q = s.sporsmal[i]
  return !!q && data.k === kode && data.r === s.runde && data.i === i && data.d === q.dato && data.nr === q.nr
}

/** The guess a stamp stands for, or null: for this room, round, question and player, and inside the question's window. */
export function godkjennGjett(data: Record<string, unknown> | null, kode: string, s: Omfang, id: string, i: number): GjGjett | null {
  if (!data || data.s !== "gjettelos" || data.id !== id || !passer(data, kode, s, i)) return null
  if (!erTall(data.g, Number.MIN_VALUE, 1e30) || typeof data.ts !== "number") return null
  if (!iTide(data.ts, s.frister[i], GJ_SVAR_MS)) return null
  return { g: data.g, ts: data.ts }
}

/** The answer a signed message stands for, or null when it is not the server's answer to this very question. */
export function godkjennFasit(data: Record<string, unknown> | null, kode: string, s: Omfang, i: number): GjFasit | null {
  if (!data || data.s !== "gjettelos-fasit" || !passer(data, kode, s, i)) return null
  if (!erTall(data.f, 0, 1e30) || typeof data.a !== "boolean" || !erTekst(data.kilde, 400)) return null
  return {
    fasit: data.f,
    aarstall: data.a,
    kilde: data.kilde,
    ...(erTekst(data.per, 40) ? { per: data.per } : {}),
    ...(data.ca === true ? { ca: true } : {}),
    ...(erTekst(data.info, 600) ? { info: data.info } : {}),
  }
}

/** The guesses and answers that count, given which signatures checked out. */
export function gjGodkjente(kode: string, s: GjStatus, ok: (x: Signert) => boolean) {
  const gjett: SvarKart<GjGjett> = {}
  for (const d of s.deltakere) {
    const rad: Partial<Record<number, GjGjett>> = {}
    for (const [i, x] of Object.entries(s.svar[d.id] ?? {})) {
      const g = x && ok(x) ? godkjennGjett(apne(x), kode, s, d.id, Number(i)) : null
      if (g) rad[Number(i)] = g
    }
    gjett[d.id] = rad
  }
  const fasiter: Partial<Record<number, GjFasit>> = {}
  for (const [i, x] of Object.entries(s.fasiter)) {
    const f = x && ok(x) ? godkjennFasit(apne(x), kode, s, Number(i)) : null
    if (f) fasiter[Number(i)] = f
  }
  return { gjett, fasiter }
}

/** Points for one player's guess on question i: 0 for no guess in time, nothing at all before the answer is known. */
export function gjPoeng(g: GjGjett | undefined, f: GjFasit | undefined): number | null {
  if (!f) return null
  return g ? poengFor(g.g, f.fasit, f.aarstall) : 0
}

export type GjPlassering = Deltaker & { poeng: number; per: (number | null)[]; beste: number; plass: number }

/**
 * Standings over the questions whose answers are known: highest sum first. A tie is broken by the best single
 * guess for the order, but tied sums share a place.
 */
export function gjRangering(deltakere: Deltaker[], gjett: SvarKart<GjGjett>, fasiter: Partial<Record<number, GjFasit>>, antall: number): GjPlassering[] {
  const rader = deltakere.map((d, i) => {
    const per = Array.from({ length: antall }, (_, j) => gjPoeng(gjett[d.id]?.[j], fasiter[j]))
    const tall = per.filter((p): p is number => p !== null)
    return { rad: { ...d, per, poeng: summer(tall), beste: Math.max(0, ...tall), plass: 0 }, i }
  })
  rader.sort((a, b) => b.rad.poeng - a.rad.poeng || b.rad.beste - a.rad.beste || a.i - b.i)
  const sortert = rader.map((r) => r.rad)
  const pl = plasser(sortert, (r) => r.poeng)
  return sortert.map((r, i) => ({ ...r, plass: pl[i] }))
}

/** Whether every player still in the room has a guess that counts for question nr. */
export function gjAlleHarSvart(s: Pick<GjStatus, "deltakere" | "nr">, gjett: SvarKart<unknown>, tilstede: ReadonlySet<string>) {
  const aktive = s.deltakere.filter((d) => tilstede.has(d.id))
  return aktive.length > 0 && aktive.every((d) => gjett[d.id]?.[s.nr])
}

// ---- reading messages from other clients ----

export function lesGjStatus(x: unknown): GjStatus | null {
  if (!erObjekt(x)) return null
  const { runde, v, fase, nr, sporsmal, frister, fasiter } = x
  if (!erHeltall(runde, 0, 999) || !erHeltall(v, 0, 1e6) || !erHeltall(nr, 0, ANTALL - 1)) return null
  if (fase !== "lobby" && fase !== "sporsmal" && fase !== "visning" && fase !== "slutt") return null
  if (!Array.isArray(sporsmal) || sporsmal.length > ANTALL || !Array.isArray(frister) || frister.length > ANTALL || !erObjekt(fasiter)) return null
  const sp: GjDuellSporsmal[] = []
  for (const s of sporsmal) {
    if (!erObjekt(s) || !erTekst(s.dato, 10) || !erHeltall(s.nr, 0, ANTALL - 1) || !erTekst(s.tekst, 300) || !erTekst(s.enhet, 60) || !erTekst(s.kategori, 40) || typeof s.aarstall !== "boolean") return null
    sp.push({ dato: s.dato, nr: s.nr, tekst: s.tekst, enhet: s.enhet, kategori: s.kategori, aarstall: s.aarstall })
  }
  if (fase !== "lobby" && (sp.length < 1 || nr >= sp.length)) return null
  if (!frister.every((f) => erHeltall(f, 0, 1e14))) return null
  const dl = lesDeltakere(x.deltakere)
  const sv = dl && lesSvarKart(x.svar, dl, ANTALL)
  if (!dl || !sv) return null
  const fa: Partial<Record<number, Signert>> = {}
  for (let i = 0; i < ANTALL; i++) {
    const f = lesSignert(fasiter[i])
    if (f) fa[i] = f
  }
  return { runde, v, fase, nr, sporsmal: sp, deltakere: dl, frister: frister as number[], svar: sv, fasiter: fa }
}
