// 6/7-stegern duel: rooms of 2–6 friends answering the same five prompts at the same time. The rules that every
// client must agree on live here, free of React and the network, so they can be tested: room codes, who is
// host, how the shared game state is merged, and the final standings.

import { hoppDm, NORMALE, type Nivaa } from "./stegern"

/** Consonants only, so a code never spells a word, and nothing that looks like a digit (no I or O). */
export const KODE_TEGN = "BCDFGHJKLMNPQRSTVWXZ"
export const KODE_LENGDE = 4
export const MIN_SPILLERE = 2
export const MAKS_SPILLERE = 6
export const NAVN_MAKS = 14

/** Seconds the answers stay on screen before the host's client moves on by itself. */
export const VISNING_SEKUNDER = 12
/** Slack after the clock runs out for the last answers to come back from the server. */
export const SLINGRING_MS = 2500

/** A random room code. `tall` gives random integers 0–2^32; crypto by default. */
export function lagKode(tall: () => number = () => crypto.getRandomValues(new Uint32Array(1))[0]) {
  return Array.from({ length: KODE_LENGDE }, () => KODE_TEGN[tall() % KODE_TEGN.length]).join("")
}

export function normaliserKode(s: string) {
  return s.trim().toUpperCase()
}

export function erGyldigKode(s: unknown): s is string {
  return typeof s === "string" && s.length === KODE_LENGDE && [...s].every((c) => KODE_TEGN.includes(c))
}

/** A display name: single spaces, no control characters, at most NAVN_MAKS characters. */
export function rensNavn(s: string) {
  return s
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NAVN_MAKS)
    .trim()
}

/** The six runner colours, in the order players get them. */
export const DUELL_FARGER = [
  { navn: "Lime", farge: "#a3e635" },
  { navn: "Cyan", farge: "#22d3ee" },
  { navn: "Rosa", farge: "#f472b6" },
  { navn: "Gul", farge: "#facc15" },
  { navn: "Lilla", farge: "#a78bfa" },
  { navn: "Oransje", farge: "#fb923c" },
] as const

/** What each client tells the room about itself through Realtime presence. */
export type Tilstede = {
  id: string
  navn: string
  /** When the player first came into the room (epoch ms). Kept across reloads; the earliest is host. */
  inn: number
  klar: boolean
  /** The round the ready flag is for, so a new round starts with everyone unready. */
  runde: number
}

/** Players in the order they came in: the first is host, and the order gives colours and seats. */
export function iRekkefolge<T extends Pick<Tilstede, "id" | "inn">>(spillere: T[]) {
  return [...spillere].sort((a, b) => a.inn - b.inn || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

/** The host: whoever has been in the room longest. Everyone computes the same, so no vote is needed. */
export function vertAv<T extends Pick<Tilstede, "id" | "inn">>(spillere: T[]): T | null {
  return iRekkefolge(spillere)[0] ?? null
}

export type DuellSvar = { t: string; n: Nivaa; treff: string | null }
export type DuellSporsmal = { dato: string; nr: number; tekst: string }
export type Deltaker = { id: string; navn: string; farge: number }
export type Fase = "lobby" | "sporsmal" | "visning" | "slutt"

/** The shared game, sent by the host. Answers are keyed by player id and question index (0–4). */
export type Status = {
  runde: number
  /** Counts up with every change the host makes, so an older message never overwrites a newer one. */
  v: number
  fase: Fase
  nr: number
  sporsmal: DuellSporsmal[]
  deltakere: Deltaker[]
  /** Milliseconds left on the open question when the message was sent; each client starts its own clock from it. */
  igjenMs: number
  svar: Record<string, Partial<Record<number, DuellSvar>>>
}

export const startStatus = (runde = 0): Status => ({ runde, v: 0, fase: "lobby", nr: 0, sporsmal: [], deltakere: [], igjenMs: 0, svar: {} })

export function erNyere(a: Pick<Status, "runde" | "v">, b: Pick<Status, "runde" | "v">) {
  return a.runde > b.runde || (a.runde === b.runde && a.v > b.v)
}

/** Every answer from both maps. Answers never change once given, so the union is always right. */
export function slaSammenSvar(a: Status["svar"], b: Status["svar"]): Status["svar"] {
  const ut: Status["svar"] = {}
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

/** Whether every player still in the room has answered question nr. */
export function alleHarSvart(s: Status, tilstede: ReadonlySet<string>) {
  const aktive = s.deltakere.filter((d) => tilstede.has(d.id))
  return aktive.length > 0 && aktive.every((d) => s.svar[d.id]?.[s.nr])
}

/** The jump for one answer in decimetres. No answer in time is a miss, like an empty field. */
export const duellDm = (svar: DuellSvar | undefined) => hoppDm(svar?.n ?? 0)

/** A player's total over the first `antall` questions. */
export function duellSum(svar: Partial<Record<number, DuellSvar>> | undefined, antall = NORMALE) {
  let dm = 0
  for (let i = 0; i < antall; i++) dm += duellDm(svar?.[i])
  return dm
}

export type Plassering = Deltaker & { dm: number; beste: number; plass: number }

/**
 * Standings after `antall` questions: longest total first. A tie is broken by the longest single jump for the
 * order, but tied totals share a place.
 */
export function rangering(deltakere: Deltaker[], svar: Status["svar"], antall = NORMALE): Plassering[] {
  const rader = deltakere.map((d, i) => {
    const dm = duellSum(svar[d.id], antall)
    const beste = Math.max(0, ...Array.from({ length: antall }, (_, j) => duellDm(svar[d.id]?.[j])))
    return { rad: { ...d, dm, beste, plass: 0 }, i }
  })
  rader.sort((a, b) => b.rad.dm - a.rad.dm || b.rad.beste - a.rad.beste || a.i - b.i)
  return rader.map(({ rad }) => ({ ...rad, plass: 1 + rader.findIndex((x) => x.rad.dm === rad.dm) }))
}

// ---- reading messages from other clients: friends may cheat, but a malformed message must not break the page ----

const erObjekt = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x)
const erHeltall = (x: unknown, min: number, maks: number): x is number => typeof x === "number" && Number.isInteger(x) && x >= min && x <= maks
const erTekst = (x: unknown, maks: number): x is string => typeof x === "string" && x.length <= maks

export function lesSvar(x: unknown): DuellSvar | null {
  if (!erObjekt(x) || !erTekst(x.t, 80) || !erHeltall(x.n, 0, 5) || !(x.treff === null || erTekst(x.treff, 120))) return null
  return { t: x.t, n: x.n as Nivaa, treff: x.treff }
}

export function lesStatus(x: unknown): Status | null {
  if (!erObjekt(x)) return null
  const { runde, v, fase, nr, sporsmal, deltakere, igjenMs, svar } = x
  if (!erHeltall(runde, 0, 999) || !erHeltall(v, 0, 1e6) || !erHeltall(nr, 0, NORMALE - 1) || !erHeltall(igjenMs, 0, 120_000)) return null
  if (fase !== "lobby" && fase !== "sporsmal" && fase !== "visning" && fase !== "slutt") return null
  if (!Array.isArray(sporsmal) || sporsmal.length > NORMALE || !Array.isArray(deltakere) || deltakere.length > MAKS_SPILLERE || !erObjekt(svar)) return null
  const sp: DuellSporsmal[] = []
  for (const s of sporsmal) {
    if (!erObjekt(s) || !erTekst(s.dato, 10) || !erHeltall(s.nr, 0, NORMALE - 1) || !erTekst(s.tekst, 200)) return null
    sp.push({ dato: s.dato, nr: s.nr, tekst: s.tekst })
  }
  if (fase !== "lobby" && sp.length !== NORMALE) return null
  const dl: Deltaker[] = []
  for (const d of deltakere) {
    if (!erObjekt(d) || !erTekst(d.id, 40) || !erTekst(d.navn, NAVN_MAKS) || !erHeltall(d.farge, 0, DUELL_FARGER.length - 1)) return null
    dl.push({ id: d.id, navn: d.navn, farge: d.farge })
  }
  const sv: Status["svar"] = {}
  for (const d of dl) {
    const egne = svar[d.id]
    if (!erObjekt(egne)) continue
    const rad: Partial<Record<number, DuellSvar>> = {}
    for (let i = 0; i < NORMALE; i++) {
      const s = lesSvar(egne[i])
      if (s) rad[i] = s
    }
    sv[d.id] = rad
  }
  return { runde, v, fase, nr, sporsmal: sp, deltakere: dl, igjenMs, svar: sv }
}

export function lesTilstede(x: unknown): Tilstede | null {
  if (!erObjekt(x) || !erTekst(x.id, 40) || !x.id || !erTekst(x.navn, NAVN_MAKS) || typeof x.inn !== "number" || typeof x.klar !== "boolean" || !erHeltall(x.runde, 0, 999)) return null
  return { id: x.id, navn: x.navn, inn: x.inn, klar: x.klar, runde: x.runde }
}

/**
 * Who plays a round: the first MAKS_SPILLERE in the room, in the order they came, each with a colour. Colours
 * follow the seat, so they match what the lobby showed.
 */
export function velgDeltakere(tilstede: Tilstede[]): Deltaker[] {
  return iRekkefolge(tilstede)
    .slice(0, MAKS_SPILLERE)
    .map((t, i) => ({ id: t.id, navn: t.navn || `Spiller ${i + 1}`, farge: i }))
}
