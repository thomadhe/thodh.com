import "server-only"

import { dagNummer, iRotasjon } from "../dag"
import { gjettMot, lastModell, normaliser, rangering, type GjettSvar } from "./anelseslos-logikk"
import { hemmeligeOrd } from "./hemmelige-ord"

// The word model, the ranking and the look-alike demotion live in ./anelseslos-logikk.ts; this file only knows
// which word is secret on which day.
export { normaliser, type GjettSvar }

export function hemmeligIndeks(dato: string) {
  const m = lastModell()
  const ord = iRotasjon(hemmeligeOrd, dagNummer(dato), "anelseslos")
  const i = m.indeks.get(ord)
  if (i === undefined) throw new Error(`Anelsesløs: "${ord}" mangler i ordlisten`)
  return i
}

export function gjett(dato: string, input: string): GjettSvar {
  return gjettMot(hemmeligIndeks(dato), input)
}

/**
 * A hint word, never the answer and never one already guessed.
 * - Best guess above 10: a word roughly halfway between it and the answer, but no closer than #10.
 * - Best guess 10 or better: just one step closer (best − 1, or the next free one above it).
 * - Every word closer than the best is taken: the closest free word, e.g. #11 when #2–#10 are used.
 */
export function hint(dato: string, beste: number | null, gjettet: string[]) {
  const m = lastModell()
  const r = rangering(hemmeligIndeks(dato))
  const brukt = new Set(gjettet.map(normaliser))
  const ledig = (p: number) => {
    const o = m.ord[r.rekkefolge[p - 1]]
    return brukt.has(o) ? null : { ord: o, avstand: p }
  }
  if (beste !== null && beste <= 10) {
    for (let p = beste - 1; p >= 2; p--) {
      const h = ledig(p)
      if (h) return h
    }
    for (let p = 2; p <= m.ord.length; p++) {
      const h = ledig(p)
      if (h) return h
    }
    return null
  }
  // Halfway, but never past #10 in one jump: from #13 the hint is #10, then #9, #8 …
  const mal = beste === null ? 500 : Math.max(10, Math.floor(beste / 2))
  const ovre = beste === null ? m.ord.length : beste
  for (let p = mal; p >= 2; p--) {
    const h = ledig(p)
    if (h) return h
  }
  for (let p = mal + 1; p < ovre; p++) {
    const h = ledig(p)
    if (h) return h
  }
  return null
}

export function fasit(dato: string) {
  const m = lastModell()
  const r = rangering(hemmeligIndeks(dato))
  return { ord: m.ord[r.hemmelig], naermeste: Array.from(r.rekkefolge.slice(1, 11), (i) => m.ord[i]) }
}

export function antallOrd() {
  return lastModell().ord.length
}
