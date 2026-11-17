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

/** A guess this many times too high or too low scores nothing. */
export const NULL_VED = 50
/** How the points bend: above 1 they fall faster near the answer and level out towards zero. */
export const KRUMNING = 1.5
/** Years count their ratio this many times over, since "how long ago" is a narrower scale than most numbers. */
export const AARSTALL_FAKTOR = 2

/** The categories the bank uses today. The bank may bring others; `kategoriInfo` gives those a neutral look. */
export type KjentKategori =
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
  | "dyr"
// Any other lower-case id works too; `string & {}` keeps the known ones in autocomplete.
export type Kategori = KjentKategori | (string & {})

export const KATEGORIER: Record<KjentKategori, { navn: string; farge: string }> = {
  norge: { navn: "Norge", farge: "#f87171" },
  verden: { navn: "Verden", farge: "#38bdf8" },
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
  dyr: { navn: "Dyr", farge: "#2dd4bf" },
}

export const erKjentKategori = (k: string): k is KjentKategori => Object.hasOwn(KATEGORIER, k)

/** Name and colour for a category; unknown ones get their id as a name and a neutral grey. */
export function kategoriInfo(k: Kategori): { navn: string; farge: string; kjent: boolean } {
  if (erKjentKategori(k)) return { ...KATEGORIER[k], kjent: true }
  const navn = k.replace(/[-_]+/g, " ").trim()
  return { navn: navn ? navn[0].toUpperCase() + navn.slice(1) : "Spørsmål", farge: "#a1a1aa", kjent: false }
}

export type Vansk = 1 | 2 | 3

/** What the page gets for each of the day's questions: never the answer, its source or its difficulty. */
export type SporsmalVisning = {
  tekst: string
  enhet: string
  kategori: Kategori
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
 * How many times off a guess is, as a signed power of ten: 0 is exact, 1 is ten times too high, −1 ten
 * times too low. Years compare how long before `AARSTALL_REFERANSE` they are, count `AARSTALL_FAKTOR` times
 * over, and are signed so that too early is negative. Null when the guess cannot be scored (a year at or
 * after the reference).
 */
export function avstand(gjett: number, fasit: number, aarstall = false): number | null {
  if (aarstall) {
    const a = AARSTALL_REFERANSE - gjett
    const b = AARSTALL_REFERANSE - fasit
    if (!(a > 0) || !(b > 0) || !Number.isFinite(a) || !Number.isFinite(b)) return null
    return -AARSTALL_FAKTOR * Math.log10(a / b)
  }
  if (!(gjett > 0) || !(fasit > 0) || !Number.isFinite(gjett) || !Number.isFinite(fasit)) return null
  return Math.log10(gjett / fasit)
}

/** Points for a distance from `avstand`, with one decimal. */
export function poengForAvstand(x: number | null) {
  if (x === null) return 0
  const rest = 1 - Math.abs(x) / Math.log10(NULL_VED)
  if (rest <= 0) return 0
  return Math.round(MAKS_POENG * rest ** KRUMNING * 10) / 10
}

/**
 * Points for one guess, from 0 to 100 with one decimal, on a symmetric logarithmic scale:
 *
 *   poeng = 100 · (1 − log(r) / log(50))^1.5,   r = larger / smaller of guess and answer
 *
 * Exactly right is 100, 25 % off about 92, double or half 74.6, five times 45.2, ten times 26.4, thirty
 * times 4.7 and fifty times or more 0. Being twice too high costs the same as being half, and the same
 * ratio scores the same whether the answer is 8 or 8 billion.
 *
 * Years use r = how many years before 2030 the guess is against the answer, squared (`AARSTALL_FAKTOR`),
 * so years score like numbers on a scale twice as steep. A guess at or after 2030 scores 0.
 */
export function poengFor(gjett: number, fasit: number, aarstall = false) {
  return poengForAvstand(avstand(gjett, fasit, aarstall))
}

/** A points value as Norwegians write it, always with one decimal: "74,6", "100,0". */
export const formaterPoeng = (p: number) => p.toLocaleString("nb-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Sum of points without floating-point crumbs. */
export const summer = (poeng: number[]) => Math.round(poeng.reduce((s, p) => s + p, 0) * 10) / 10

const ORD: [RegExp, number][] = [
  [/^(?:tusen|k)$/, 1e3],
  [/^(?:mill|millioner|million|mil|mln)$/, 1e6],
  [/^(?:mrd|milliarder|milliard|mia)$/, 1e9],
  [/^(?:bill|billioner|billion)$/, 1e12],
  [/^(?:trill|trillioner|trillion)$/, 1e18],
]

/**
 * Reads a number the way Norwegians type it: "1 200 000", "1,5 mill.", "2 mrd", "12 000", "1.500" (a thousand
 * separator when three digits follow each dot), "3.5" or "6e23". Any kind of space separates thousands.
 * Returns null for anything else or for numbers that are not above zero.
 */
export function tolkTall(tekst: string): number | null {
  const t = tekst
    .toLowerCase()
    .replace(/[\s'’]+/g, " ")
    .replace(/\.$/, "")
    .trim()
  const treff = /^([0-9][0-9 .,]*?)(?:\s*(?:e|·\s*10\^?)\s*([+-]?\d{1,3}))?\s*([a-zæøå]+)?\.?$/.exec(t)
  if (!treff) return null
  let tall = treff[1].replace(/ /g, "")
  if (/^\d{1,3}(?:,\d{3}){2,}$/.test(tall)) {
    // Pasted with English thousand commas: "1,234,567". One comma stays a decimal mark.
    tall = tall.replace(/,/g, "")
  } else if (tall.includes(",")) {
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

/**
 * The thousand separator the field puts in while typing: a no-break space, as Intl writes "nb-NO". The narrow
 * one (U+202F) is nearly invisible at input size in most fonts, and the point is to see how big the number is.
 */
export const SKILLE = String.fromCharCode(0xa0)

/**
 * Groups the leading digits of what is being typed in threes: "1500000" becomes "1 500 000", "2500,75" keeps
 * its decimals as typed, and "1,5 mill" or "2 mrd" are left as they are apart from the leading digits.
 * Spaces typed inside the digits are replaced; one after them (before a word) stays.
 */
export function grupperInndata(tekst: string) {
  return tekst.replace(/^(\s*)(\d(?:[\d\s]*\d)?)(?=\s*$|[^\d\s]|\s+\D)/, (_, foran: string, siffer: string) => {
    const rene = siffer.replace(/\s/g, "")
    return foran + rene.replace(/\B(?=(\d{3})+(?!\d))/g, SKILLE)
  })
}

/**
 * Where the caret goes after grouping: after the same number of non-space characters as before it. Spaces
 * come and go with the grouping, so counting everything else keeps the caret next to the same digit.
 */
export function markorEtterGruppering(gruppert: string, foran: string) {
  const antall = foran.replace(/\s/g, "").length
  // Spaces typed just before the caret ("2,5 |") stay before it.
  let mellomrom = /\s*$/.exec(foran)![0].length
  let pos = gruppert.length
  if (antall === 0) pos = 0
  else {
    let sett = 0
    for (let i = 0; i < gruppert.length; i++) {
      if (!/\s/.test(gruppert[i])) sett++
      if (sett === antall) {
        pos = i + 1
        break
      }
    }
  }
  while (mellomrom > 0 && pos < gruppert.length && /\s/.test(gruppert[pos])) {
    pos++
    mellomrom--
  }
  return pos
}

const vanlig = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 2 })

function desimal(n: number, maksSiffer = 4) {
  return n.toLocaleString("nb-NO", { maximumSignificantDigits: maksSiffer })
}

/** A number for display: "1905" for years, "2 469", "91 000", "5,594 mill.", "19 742 mrd.", "43 trillioner". */
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
  if (abs >= 1e6) return `${desimal(n / 1e6)} mill.`
  if (abs >= 100) return vanlig.format(n)
  return desimal(n)
}

/** Every digit, grouped: "1 500 000" for what was typed as "1,5 mill.". */
export const formaterFullt = (n: number) => (Math.abs(n) < 1e21 ? vanlig.format(n) : formaterTall(n))

const ganger = (f: number) => f.toLocaleString("nb-NO", { maximumFractionDigits: f < 10 ? 1 : 0 })

/** How far off a guess was, in few words: "Helt riktig", "12 % for lavt", "3,2× for høyt", "10 år for sent". */
export function avvik(gjett: number, fasit: number, aarstall = false) {
  if (aarstall) {
    const d = Math.round(gjett - fasit)
    if (d === 0) return "Riktig år"
    return `${Math.abs(d)} år for ${d < 0 ? "tidlig" : "sent"}`
  }
  if (gjett === fasit) return "Helt riktig"
  const forhold = gjett / fasit
  const retning = forhold < 1 ? "lavt" : "høyt"
  if (forhold >= 1.95 || forhold <= 1 / 1.95) return `${ganger(forhold >= 1 ? forhold : 1 / forhold)}× for ${retning}`
  const prosent = Math.abs(forhold - 1) * 100
  if (prosent < 0.5) return "Nesten helt riktig"
  return `${prosent.toLocaleString("nb-NO", { maximumFractionDigits: prosent < 10 ? 1 : 0 })} % for ${retning}`
}

/** Colour band for a score, for the reveal and the share text. */
export function poengTrinn(poeng: number): { farge: string; emoji: string; ord: string } {
  if (poeng >= 97) return { farge: "#34d399", emoji: "🟩", ord: "Blink!" }
  if (poeng >= 85) return { farge: "#34d399", emoji: "🟩", ord: "Veldig nær" }
  if (poeng >= 60) return { farge: "#facc15", emoji: "🟨", ord: "Nær" }
  if (poeng >= 30) return { farge: "#fb923c", emoji: "🟧", ord: "Et stykke unna" }
  return { farge: "#f43f5e", emoji: "🟥", ord: "Langt unna" }
}
