import { land, omrader, type Land, type Omrade } from "./geografi"

/** Lowercase a–z only, so "Côte d'Ivoire" → "cotedivoire" and "Sør-Sudan" = "Sor-Sudan" → "sorsudan". */
export function normaliser(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/[^a-z]/g, "")
}

function oppslag(navn: (l: Land) => string[]) {
  const kart = new Map<string, string[]>()
  for (const l of land) {
    for (const n of navn(l)) {
      const k = normaliser(n)
      if (!k) continue
      const ider = kart.get(k) ?? []
      if (!ider.includes(l.id)) kart.set(k, [...ider, l.id])
    }
  }
  return kart
}

export type QuizModus = "land" | "hovedsteder"

/** Common abbreviations on top of land.json (which already has DRC, UK, USA, UAE, CAR, PNG, DPRK, PRC, RSA). */
const FORKORTELSER: Record<string, string[]> = {
  CG: ["RC"],
  AE: ["FAE"],
  NZ: ["NZ"],
  KR: ["ROK"],
  BA: ["BiH"],
  SA: ["KSA"],
  GB: ["GB"],
  ST: ["STP"],
  DO: ["DomRep"],
  VA: ["Vatikan"],
  CF: ["Sentralafrika"],
}

const svarKart: Record<QuizModus, Map<string, string[]>> = {
  land: oppslag((l) => [l.navn, l.en, ...l.svar, ...(FORKORTELSER[l.id] ?? [])]),
  hovedsteder: oppslag((l) => [l.hovedstad, l.hovedstadEn, ...l.hovedstadSvar]),
}

/** Country ids an answer matches exactly (after normalising). Empty when nothing matches. */
export function finnSvar(modus: QuizModus, tekst: string): string[] {
  return svarKart[modus].get(normaliser(tekst)) ?? []
}

/**
 * True when the text could still grow into another answer that is not found yet ("us" → "Usbekistan",
 * "uk" → "Ukraina", "niger" → "Nigeria"). The quiz then waits a moment instead of accepting at once.
 */
export function kanBliLengre(modus: QuizModus, tekst: string, funnet: Set<string>) {
  const t = normaliser(tekst)
  const her = svarKart[modus].get(t) ?? []
  for (const [k, ider] of svarKart[modus]) {
    if (k.length > t.length && k.startsWith(t) && ider.some((id) => !funnet.has(id) && !her.includes(id))) return true
  }
  return false
}

/** Every country and territory by id (the map quizzes only ever produce the 197 sovereign ids). */
export const landEtterId = new Map<string, Omrade>(omrader.map((l) => [l.id, l]))

/** Autocomplete for Omriss and Canvas, territories included: names starting with (then containing) the text. */
export function forslag(tekst: string, maks = 6): Omrade[] {
  const t = normaliser(tekst)
  if (!t) return []
  const navn = (l: Omrade) => [l.navn, l.en, ...l.svar].map(normaliser)
  const start = omrader.filter((l) => navn(l).some((n) => n.startsWith(t)))
  const inni = omrader.filter((l) => !start.includes(l) && navn(l).some((n) => n.includes(t)))
  return [...start, ...inni].slice(0, maks)
}

/**
 * Omriss sends the client a key instead of the answer, so it is not in plain sight in the page.
 * (Anyone determined can still hash all 197 countries; this only spares casual spoilers.)
 */
export function skjultNokkel(spill: string, id: string, dato: string) {
  let h = 0x811c9dc5
  for (const c of `${spill}:${dato}:${id}`) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193)
  return (h >>> 0).toString(36)
}

export const omrissNokkel = (id: string, dato: string) => skjultNokkel("omriss", id, dato)

const R = 6371

/** Great-circle distance in km between two countries' centres. */
export function avstand(a: Omrade, b: Omrade) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

type Punkt = Pick<Omrade, "lat" | "lng">

/** Mercator y for a latitude, clamped short of the poles where it goes to infinity. */
const mercatorY = (lat: number) => {
  const rad = (Math.max(-89.9, Math.min(89.9, lat)) * Math.PI) / 180
  return Math.log(Math.tan(Math.PI / 4 + rad / 2))
}

/**
 * Map direction from a towards b in degrees clockwise from north (0 = up, 90 = right), in [0, 360).
 *
 * This is the rhumb-line bearing: the straight line between the two centres on a Mercator map, which is
 * what players read off a world map (Worldle and the like use it too). The great-circle start bearing we
 * used before is what a plane flies, and it disagrees with every flat map over long distances: Norway to
 * Mexico pointed north-west instead of west/south-west, and Iceland to New Zealand pointed north over
 * the pole. East–west goes the short way across the antimeridian, like the distance in `avstand`.
 */
export function retning(a: Punkt, b: Punkt) {
  const dLng = ((((b.lng - a.lng) % 360) + 540) % 360) - 180
  const dY = mercatorY(b.lat) - mercatorY(a.lat)
  if (dLng === 0 && dY === 0) return 0
  return ((Math.atan2((dLng * Math.PI) / 180, dY) * 180) / Math.PI + 360) % 360
}

/** The eight share-text arrows, clockwise from north, matching the rotation of the on-screen arrow. */
export const PILER = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"] as const

/** Nearest of the eight arrows for a bearing in degrees (any value; wraps around). */
export function retningsPil(grader: number) {
  return PILER[((Math.round(grader / 45) % 8) + 8) % 8]
}

/**
 * 100 % = same place, 0 % = the other side of the planet, in a straight line like Worldle (max 20 000 km
 * between country centres): a neighbour 600 km away is 97 %, 2000 km is 90 %.
 */
export function naerhet(km: number) {
  return Math.max(0, Math.round(100 * (1 - km / 20000)))
}
