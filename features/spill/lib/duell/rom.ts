// Duel rooms shared by every duel (6/7-stegern, Gjetteløs): 2–6 friends in a room on Supabase Realtime. The rules
// every client must agree on live here, free of React and the network, so they can be tested: room codes, who is
// host, who plays a round, how messages from other clients are read, and when a signed answer came in time.

import { lesFigur, STANDARD_FIGUR, type Figur } from "./figur"

/** Consonants only, so a code never spells a word, and nothing that looks like a digit (no I or O). */
export const KODE_TEGN = "BCDFGHJKLMNPQRSTVWXZ"
export const KODE_LENGDE = 4
export const MIN_SPILLERE = 2
export const MAKS_SPILLERE = 6
export const NAVN_MAKS = 14

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

/** What each client tells the room about itself through Realtime presence. */
export type Tilstede = {
  id: string
  navn: string
  /** When the player first came into the room (epoch ms). Kept across reloads; the earliest is host. */
  inn: number
  klar: boolean
  /** The round the ready flag is for, so a new round starts with everyone unready. */
  runde: number
  figur: Figur
}

/** Players in the order they came in: the first is host, and the order gives seats. */
export function iRekkefolge<T extends Pick<Tilstede, "id" | "inn">>(spillere: T[]) {
  return [...spillere].sort((a, b) => a.inn - b.inn || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

/** The host: whoever has been in the room longest. Everyone computes the same, so no vote is needed. */
export function vertAv<T extends Pick<Tilstede, "id" | "inn">>(spillere: T[]): T | null {
  return iRekkefolge(spillere)[0] ?? null
}

/** A player in a round, with the seat (0–5) they had in the lobby and their figure. */
export type Deltaker = { id: string; navn: string; farge: number; figur: Figur }

/** Who plays a round: the first MAKS_SPILLERE in the room, in the order they came. */
export function velgDeltakere(tilstede: Tilstede[]): Deltaker[] {
  return iRekkefolge(tilstede)
    .slice(0, MAKS_SPILLERE)
    .map((t, i) => ({ id: t.id, navn: t.navn || `Spiller ${i + 1}`, farge: i, figur: t.figur }))
}

/** What every duel's shared status has: the round, a version that only goes up, and the phase. */
export type GrunnStatus = { runde: number; v: number; fase: string }

export function erNyere(a: Pick<GrunnStatus, "runde" | "v">, b: Pick<GrunnStatus, "runde" | "v">) {
  return a.runde > b.runde || (a.runde === b.runde && a.v > b.v)
}

// ---- reading messages from other clients: friends may cheat, but a malformed message must not break the page ----

export const erObjekt = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x)
export const erHeltall = (x: unknown, min: number, maks: number): x is number => typeof x === "number" && Number.isInteger(x) && x >= min && x <= maks
export const erTekst = (x: unknown, maks: number): x is string => typeof x === "string" && x.length <= maks
export const erTall = (x: unknown, min: number, maks: number): x is number => typeof x === "number" && Number.isFinite(x) && x >= min && x <= maks

export function lesTilstede(x: unknown): Tilstede | null {
  if (!erObjekt(x) || !erTekst(x.id, 40) || !x.id || !erTekst(x.navn, NAVN_MAKS) || typeof x.inn !== "number" || typeof x.klar !== "boolean" || !erHeltall(x.runde, 0, 999)) return null
  // A client from before figures had none: it plays as the classic Stegern.
  return { id: x.id, navn: x.navn, inn: x.inn, klar: x.klar, runde: x.runde, figur: lesFigur(x.figur) ?? STANDARD_FIGUR }
}

export function lesDeltakere(x: unknown): Deltaker[] | null {
  if (!Array.isArray(x) || x.length > MAKS_SPILLERE) return null
  const ut: Deltaker[] = []
  for (const d of x) {
    if (!erObjekt(d) || !erTekst(d.id, 40) || !erTekst(d.navn, NAVN_MAKS) || !erHeltall(d.farge, 0, MAKS_SPILLERE - 1)) return null
    ut.push({ id: d.id, navn: d.navn, farge: d.farge, figur: lesFigur(d.figur) ?? STANDARD_FIGUR })
  }
  return ut
}

/**
 * Whether a server timestamp falls inside a question's window: from when it opened (`frist - varighet`) to the
 * deadline, with SLINGRING_MS either side for clocks that are a little apart. Both ends are server time.
 */
export function iTide(ts: number, frist: number | null | undefined, varighetMs: number, slingring = SLINGRING_MS) {
  if (typeof frist !== "number") return false
  return ts >= frist - varighetMs - slingring && ts <= frist + slingring
}

/** Places for a list sorted best first: equal scores share a place (1, 2, 2, 4). */
export function plasser<T>(sortert: T[], poeng: (x: T) => number) {
  return sortert.map((x) => 1 + sortert.findIndex((y) => poeng(y) === poeng(x)))
}
