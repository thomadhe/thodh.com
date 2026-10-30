import "server-only"

import { dagNummer, stokk } from "../dag"
import { omrader } from "../geografi"
import { steder, type Sted } from "../geografi-egenskaper"
import type { Utfall } from "../heksagon"
import { vurder } from "../heksagon-celler"

// Heksagonal jakt (our HexHunt): seven places a day, five cities and two landmarks. The page only gets
// names and countries; coordinates stay here until a place is found or its guesses are used up.

export const STEDER_PER_DAG = 7
const BYER_PER_DAG = 5
// Order of the day: cities from big to small with the landmarks in between.
const REKKE: Sted["type"][] = ["by", "by", "landemerke", "by", "by", "landemerke", "by"]

/** Rough extent in km of sites much larger than a hex; reaching them anywhere counts as found, and misses are
 * measured from their edge. */
const UTSTREKNING: Record<string, number> = {
  "store-barriererev": 900,
  "den-kinesiske-mur": 300,
  baikalsjoen: 250,
  "grand-canyon": 120,
  serengeti: 120,
  galapagosoyene: 120,
  lofoten: 80,
  "okavango-deltaet": 80,
  "salar-de-uyuni": 60,
  yellowstone: 50,
  dodehavet: 40,
  kappadokia: 40,
  "torres-del-paine": 40,
  "ha-long-bukta": 30,
  geirangerfjorden: 15,
}
/** Cities count within this many km of their centre, as in HexHunt. */
const BY_KM = 10

const byer = steder.filter((s) => s.type === "by")
const landemerker = steder.filter((s) => s.type === "landemerke")

/**
 * Element n of back-to-back shuffles of `liste`, like `iRotasjon`, but a place from the end of one round
 * is never among the first `vent` of the next, so nothing comes back within a few days across rounds.
 */
function rotasjon<T>(liste: readonly T[], n: number, salt: string, vent: number) {
  const runde = Math.floor(n / liste.length)
  const denne = stokk(liste, `${salt}:${runde}`)
  if (runde > 0) {
    // The previous round's tail is its plain shuffle's tail: swaps below only touch the head and the middle.
    const forrige = new Set(stokk(liste, `${salt}:${runde - 1}`).slice(-vent))
    let j = vent
    for (let i = 0; i < vent; i++) {
      if (!forrige.has(denne[i])) continue
      while (forrige.has(denne[j])) j++
      ;[denne[i], denne[j]] = [denne[j], denne[i]]
      j++
    }
  }
  return denne[n % liste.length]
}

/** The plain rotation for day n: five cities, then two landmarks. */
function rotasjonsdag(n: number): Sted[] {
  const merker = STEDER_PER_DAG - BYER_PER_DAG
  return [
    ...Array.from({ length: BYER_PER_DAG }, (_, i) => rotasjon(byer, n * BYER_PER_DAG + i, "heksagon:by", 60)),
    ...Array.from({ length: merker }, (_, i) => rotasjon(landemerker, n * merker + i, "heksagon:merke", 16)),
  ]
}

function km(a: Sted, b: Sted) {
  const rad = Math.PI / 180
  const h = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)))
}
/** Two places the same day shouldn't share a country or sit next to each other (Giza and Cairo). */
const krasjer = (a: Sted, b: Sted) => a.land === b.land || km(a, b) < 500

/** Today's seven places, in play order. */
export function dagensSteder(dato: string): Sted[] {
  const n = dagNummer(dato)
  // A place that clashes with one already picked is swapped for a spare that isn't due within ten days.
  const snart = new Set<string>()
  for (let d = Math.max(0, n - 10); d <= n + 10; d++) if (d !== n) rotasjonsdag(d).forEach((s) => snart.add(s.id))
  const reserve = stokk(steder, `heksagon:reserve:${dato}`)
  const valgt: Sted[] = []
  for (const s of rotasjonsdag(n)) {
    const ok = (t: Sted) => !valgt.some((v) => v.id === t.id || krasjer(v, t))
    valgt.push(ok(s) ? s : (reserve.find((r) => r.type === s.type && !snart.has(r.id) && ok(r)) ?? s))
  }
  const dagByer = valgt.slice(0, BYER_PER_DAG).sort((a, b) => (b.befolkning ?? 0) - (a.befolkning ?? 0))
  const dagMerker = valgt.slice(BYER_PER_DAG)
  return REKKE.map((type) => (type === "by" ? dagByer.shift()! : dagMerker.shift()!))
}

export type JaktSted = { navn: string; land: string; flagg: string }

const omradeEtterId = new Map(omrader.map((o) => [o.id, o]))

/** What the page may know before playing: names and countries only. */
export function dagensJakt(dato: string): JaktSted[] {
  return dagensSteder(dato).map((s) => {
    const o = omradeEtterId.get(s.land)
    return { navn: s.navn, land: o?.navn ?? s.land, flagg: o?.flagg ?? s.land.toLowerCase() }
  })
}

/** Where a place is, once it may be shown: [lat, lng], and the radius in km of ground that counts as the place. */
export type JaktFasit = { punkt: [number, number]; radiusKm: number }

const omraade = (s: Sted) => UTSTREKNING[s.id] ?? (s.type === "by" ? BY_KM : 0)

function fasitFor(s: Sted): JaktFasit {
  return { punkt: [Math.round(s.lat * 1e4) / 1e4, Math.round(s.lng * 1e4) / 1e4], radiusKm: omraade(s) }
}

export function vurderGjetning(dato: string, nr: number, celle: string): { utfall: Utfall; unna: number } {
  const s = dagensSteder(dato)[nr]
  return vurder(celle, [s.lat, s.lng], omraade(s), s.id in UTSTREKNING)
}

export function dagensFasit(dato: string, nr: number): JaktFasit {
  return fasitFor(dagensSteder(dato)[nr])
}

export function heleFasit(dato: string): JaktFasit[] {
  return dagensSteder(dato).map(fasitFor)
}
