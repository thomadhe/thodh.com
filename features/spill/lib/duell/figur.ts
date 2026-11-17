// The duel character: one small pixel figure per player, the same in every duel (6/7-stegern and Gjetteløs). A
// player picks body colour, headwear, eyes and an extra in the lobby; the choice is kept in localStorage and
// told to the room through presence. Only indices travel, so a message from another client is easy to check.

export const KROPPER = [
  { navn: "Lime", farge: "#a3e635" },
  { navn: "Cyan", farge: "#22d3ee" },
  { navn: "Rosa", farge: "#f472b6" },
  { navn: "Gul", farge: "#facc15" },
  { navn: "Lilla", farge: "#a78bfa" },
  { navn: "Oransje", farge: "#fb923c" },
  { navn: "Rød", farge: "#f87171" },
  { navn: "Snø", farge: "#e2e8f0" },
] as const

export const HODER = ["Pannebånd", "Caps", "Lue", "Krone", "Propell", "Ingen"] as const
export const OYNE = ["Glad", "Solbriller", "Bestemt", "Fornøyd"] as const
export const EKSTRA = ["Ingen", "Bart", "Sløyfe", "Medalje"] as const

export type Figur = { kropp: number; hode: number; oyne: number; ekstra: number }

/** The options, in the order the editor shows them. */
export const FIGUR_VALG = [
  { felt: "kropp", navn: "Farge", valg: KROPPER.map((k) => k.navn) },
  { felt: "hode", navn: "Hode", valg: HODER },
  { felt: "oyne", navn: "Øyne", valg: OYNE },
  { felt: "ekstra", navn: "Ekstra", valg: EKSTRA },
] as const satisfies readonly { felt: keyof Figur; navn: string; valg: readonly string[] }[]

/** Stegern as he looks on the daily page: lime, red sweatband. */
export const STANDARD_FIGUR: Figur = { kropp: 0, hode: 0, oyne: 0, ekstra: 0 }

const antall: Record<keyof Figur, number> = { kropp: KROPPER.length, hode: HODER.length, oyne: OYNE.length, ekstra: EKSTRA.length }

const erIndeks = (x: unknown, n: number): x is number => typeof x === "number" && Number.isInteger(x) && x >= 0 && x < n

/** A figure from the network or storage, or null when anything is off. */
export function lesFigur(x: unknown): Figur | null {
  if (typeof x !== "object" || x === null) return null
  const f = x as Record<string, unknown>
  if (!erIndeks(f.kropp, antall.kropp) || !erIndeks(f.hode, antall.hode) || !erIndeks(f.oyne, antall.oyne) || !erIndeks(f.ekstra, antall.ekstra)) return null
  return { kropp: f.kropp, hode: f.hode, oyne: f.oyne, ekstra: f.ekstra }
}

/** One step forward or back through the options of a field, round the ends. */
export function blaFigur(f: Figur, felt: keyof Figur, steg: number): Figur {
  const n = antall[felt]
  return { ...f, [felt]: (((f[felt] + steg) % n) + n) % n }
}

/** A random figure. `tall` gives numbers in [0, 1). */
export function tilfeldigFigur(tall: () => number = Math.random): Figur {
  const velg = (n: number) => Math.min(n - 1, Math.floor(tall() * n))
  return { kropp: velg(antall.kropp), hode: velg(antall.hode), oyne: velg(antall.oyne), ekstra: velg(antall.ekstra) }
}

/** The colour that stands for a player in lists and charts. */
export const figurFarge = (f: Figur | undefined) => KROPPER[f?.kropp ?? 0].farge

export const FIGUR_NOKKEL = "duell:figur"

export function lesLagretFigur(): Figur | null {
  try {
    return lesFigur(JSON.parse(localStorage.getItem(FIGUR_NOKKEL) ?? "null"))
  } catch {
    return null
  }
}

export function lagreFigur(f: Figur) {
  try {
    localStorage.setItem(FIGUR_NOKKEL, JSON.stringify(f))
  } catch {}
}
