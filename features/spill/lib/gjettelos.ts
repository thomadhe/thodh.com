// Gjetteløs: shared rules, scoring and number handling. The answers live on the server (lib/server/gjettelos*).

/** The first day with a puzzle. */
export const GJETTELOS_START = "2026-11-16"
export const ANTALL = 5
export const MAKS_POENG = 100
export const MAKS_SUM = ANTALL * MAKS_POENG

/**
 * Years are scored by how long ago they were, counted from this year, so 10 years off something 100 years
 * back costs as much as 1 year off something 10 years back. It lies a few years ahead so recent answers
 * still have some distance to work with, and no answer in the bank may be later than it.
 */
export const AARSTALL_REFERANSE = 2030

export type Kategori =
  | "norge"
  | "verden"
  | "historie"
  | "sport"
  | "rommet"
  | "teknologi"
  | "kultur"
  | "okonomi"
  | "kropp"
  | "rekorder"
  | "hverdag"
  | "natur"

export const KATEGORIER: Record<Kategori, { navn: string; farge: string }> = {
  norge: { navn: "Norge", farge: "#f87171" },
  verden: { navn: "Geografi", farge: "#38bdf8" },
  historie: { navn: "Historie", farge: "#d4a373" },
  sport: { navn: "Sport", farge: "#4ade80" },
  rommet: { navn: "Vitenskap og rommet", farge: "#a78bfa" },
  teknologi: { navn: "Teknologi", farge: "#22d3ee" },
  kultur: { navn: "Kultur", farge: "#f472b6" },
  okonomi: { navn: "Økonomi", farge: "#facc15" },
  kropp: { navn: "Kropp og helse", farge: "#fb923c" },
  rekorder: { navn: "Rekorder", farge: "#e879f9" },
  hverdag: { navn: "Hverdag", farge: "#94a3b8" },
  natur: { navn: "Natur", farge: "#a3e635" },
}

export type Vansk = 1 | 2 | 3

/** What the page gets for each of the day's questions: never the answer or its source. */
export type SporsmalVisning = {
  tekst: string
  enhet: string
  kategori: Kategori
  vansk: Vansk
  aarstall: boolean
}

/** What the server says once a guess is in. */
export type Fasit = {
  fasit: number
  poeng: number
  kilde: string
  /** The year the number is for, when it changes over time. */
  per?: string
  /** The answer is rounded. */
  ca?: boolean
  info?: string
}

/**
 * Points for one guess: 100 × the smaller of guess and answer divided by the larger. Exactly right is 100,
 * half or double is 50, a tenth of the answer or ten times it is 10, and 10 % off is about 90 whatever the
 * size of the number. It is the same as 100 · 2^(−|log₂(guess / answer)|): the points halve for every
 * doubling of the distance on a logarithmic scale, which keeps huge numbers fair.
 *
 * Years go through `AARSTALL_REFERANSE` first: the score compares how many years ago the guess and the
 * answer are. A guess at or after the reference year scores 0.
 */
export function poengFor(gjett: number, fasit: number, aarstall = false) {
  const a = aarstall ? AARSTALL_REFERANSE - gjett : gjett
  const b = aarstall ? AARSTALL_REFERANSE - fasit : fasit
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return 0
  return Math.round((MAKS_POENG * Math.min(a, b)) / Math.max(a, b))
}

const ORD: [RegExp, number][] = [
  [/^(?:tusen|k)$/, 1e3],
  [/^(?:mill|millioner|million|mil|mln)$/, 1e6],
  [/^(?:mrd|milliarder|milliard|mia)$/, 1e9],
  [/^(?:bill|billioner|billion)$/, 1e12],
  [/^(?:trill|trillioner|trillion)$/, 1e18],
]

/**
 * Reads a number the way Norwegians type it: "1 200 000", "1,5 mill.", "2 mrd", "12 000", "1.500" (a thousand
 * separator when three digits follow each dot), "3.5" or "6e23". Returns null for anything else or for
 * numbers that are not above zero.
 */
export function tolkTall(tekst: string): number | null {
  const t = tekst
    .toLowerCase()
    .replace(/[\s  ]+/g, " ")
    .replace(/\.$/, "")
    .trim()
  const treff = /^([0-9][0-9 .,']*?)(?:\s*(?:e|·\s*10\^?)\s*([+-]?\d{1,3}))?\s*([a-zæøå]+)?\.?$/.exec(t)
  if (!treff) return null
  let tall = treff[1].replace(/[ ']/g, "")
  if (tall.includes(",")) {
    // Comma is the decimal mark; any dots are thousand separators.
    if ((tall.match(/,/g) ?? []).length > 1) return null
    tall = tall.replace(/\./g, "").replace(",", ".")
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(tall)) {
    tall = tall.replace(/\./g, "")
  } else if ((tall.match(/\./g) ?? []).length > 1) {
    return null
  }
  if (!/^\d+(?:\.\d+)?$/.test(tall)) return null
  let verdi = Number(tall)
  if (treff[2]) verdi *= 10 ** Number(treff[2])
  if (treff[3]) {
    const faktor = ORD.find(([r]) => r.test(treff[3]!))?.[1]
    if (!faktor) return null
    verdi *= faktor
  }
  return Number.isFinite(verdi) && verdi > 0 ? verdi : null
}

/** A year: whole numbers from 1 to 9999, nothing else. */
export function tolkAar(tekst: string): number | null {
  const treff = /^\s*(\d{1,4})\s*$/.exec(tekst)
  const aar = treff ? Number(treff[1]) : 0
  return aar >= 1 ? aar : null
}

/** A guess as typed, read as a year or a number depending on the question. */
export const tolkGjett = (tekst: string, aarstall: boolean) => (aarstall ? tolkAar(tekst) : tolkTall(tekst))

const vanlig = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 2 })

function desimal(n: number, maksSiffer = 4) {
  return n.toLocaleString("nb-NO", { maximumSignificantDigits: maksSiffer })
}

/** A number for display: "1905" for years, "2 469", "5,55 mill.", "19 742 mrd.", "43 trillioner". */
export function formaterTall(n: number, aarstall = false) {
  if (aarstall) return String(Math.round(n))
  const abs = Math.abs(n)
  if (abs >= 1e21) {
    const eksponent = Math.floor(Math.log10(abs))
    const opphoyd = String(eksponent).replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)])
    return `${desimal(n / 10 ** eksponent)} · 10${opphoyd}`
  }
  if (abs >= 1e18) return `${desimal(n / 1e18)} trillioner`
  if (abs >= 1e14) return `${desimal(n / 1e12)} billioner`
  if (abs >= 1e9) return `${desimal(n / 1e9, 5)} mrd.`
  if (abs >= 1e7) return `${desimal(n / 1e6)} mill.`
  if (abs >= 100) return vanlig.format(n)
  return desimal(n)
}

/** How far off a guess was, in words: "riktig", "12 % for lavt", "3,2 ganger for høyt". */
export function avvik(gjett: number, fasit: number, aarstall = false) {
  if (aarstall) {
    const d = Math.round(gjett - fasit)
    if (d === 0) return "riktig år"
    return `${Math.abs(d)} år for ${d < 0 ? "tidlig" : "sent"}`
  }
  if (gjett === fasit) return "helt riktig"
  const forhold = gjett / fasit
  const retning = forhold < 1 ? "lavt" : "høyt"
  if (forhold >= 2 || forhold <= 0.5) {
    const ganger = forhold >= 1 ? forhold : 1 / forhold
    return `${ganger.toLocaleString("nb-NO", { maximumFractionDigits: ganger < 10 ? 1 : 0 })} ganger for ${retning}`
  }
  const prosent = Math.abs(forhold - 1) * 100
  if (prosent < 0.5) return "nesten helt riktig"
  return `${prosent.toLocaleString("nb-NO", { maximumFractionDigits: prosent < 10 ? 1 : 0 })} % for ${retning}`
}

/** Colour band for a score, for the reveal and the share text. */
export function poengTrinn(poeng: number): { farge: string; emoji: string; ord: string } {
  if (poeng >= 97) return { farge: "#34d399", emoji: "🟩", ord: "Blink!" }
  if (poeng >= 90) return { farge: "#34d399", emoji: "🟩", ord: "Veldig nær" }
  if (poeng >= 65) return { farge: "#facc15", emoji: "🟨", ord: "Nær" }
  if (poeng >= 35) return { farge: "#fb923c", emoji: "🟧", ord: "Et stykke unna" }
  return { farge: "#f43f5e", emoji: "🟥", ord: "Langt unna" }
}
