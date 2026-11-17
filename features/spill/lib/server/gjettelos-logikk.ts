// Gjetteløs on the server: the day's questions and the answers. Kept free of "server-only" so the tests can
// import it; only server code (./gjettelos.ts) uses it.

import { gjettelosSporsmal } from "../../data/gjettelos"
import { gjettelosPlan } from "../../data/gjettelos/plan"
import type { GjSporsmal } from "../../data/gjettelos/typer"
import { dagNummer, erGyldigDato, iDagOslo } from "../dag"
import { GJETTELOS_START, poengFor, type Fasit, type SporsmalVisning } from "../gjettelos"

const etterId = new Map(gjettelosSporsmal.map((s) => [s.id, s]))

/**
 * The first three days (16–18 November 2026) as they were first played, easiest first. Saved answers are
 * keyed by question number, so these days keep their questions and order whatever the plan says later.
 * Every later day comes from the plan in its own (mixed) order.
 */
export const FASTE_DAGER: readonly (readonly string[])[] = [
  ["historie:elizabeth", "rommet:nullpunkt", "sport:paris-ovelser", "verden:sprak", "kultur:sonetter"],
  ["historie:forste-verdenskrig", "norge:preikestolen", "teknologi:bitcoin-maks", "sport:monaco", "kultur:avatar"],
  ["verden:usa-flagg", "historie:fn", "rommet:iss-hoyde", "kultur:undset-nobel", "sport:curlingstein"],
]

export function kanSpillesGjettelos(dato: string, iDag = iDagOslo()) {
  return erGyldigDato(dato) && dato >= GJETTELOS_START && dato <= iDag
}

const dagerSidenStart = (dato: string) => dagNummer(dato) - dagNummer(GJETTELOS_START)

/** Days since the start; the plan starts over when it runs out. */
function indeks(dato: string) {
  const n = dagerSidenStart(dato)
  return ((n % gjettelosPlan.length) + gjettelosPlan.length) % gjettelosPlan.length
}

/** The day's five questions with their answers, in the order they are asked. */
export function dagFor(dato: string): GjSporsmal[] {
  const n = dagerSidenStart(dato)
  const ider = n >= 0 && n < FASTE_DAGER.length ? FASTE_DAGER[n] : gjettelosPlan[indeks(dato)]
  return ider.map((id) => {
    const s = etterId.get(id)
    if (!s) throw new Error(`Gjetteløs: ukjent spørsmål ${id}`)
    return s
  })
}

/** Whether the date replays a day from an earlier round of the plan. */
export function erRepris(dato: string) {
  return dagerSidenStart(dato) >= gjettelosPlan.length
}

/** What the page gets: the questions without answers, sources or difficulty. */
export function dagensSporsmal(dato: string): SporsmalVisning[] {
  return dagFor(dato).map((s) => ({ tekst: s.tekst, enhet: s.enhet, kategori: s.kategori, aarstall: s.aarstall }))
}

/** The answer to question `nr` and the points for `gjett`. Only asked for once the player has guessed. */
export function vurder(dato: string, nr: number, gjett: number): Fasit {
  const s = dagFor(dato)[nr]
  return {
    fasit: s.fasit,
    poeng: poengFor(gjett, s.fasit, s.aarstall),
    kilde: s.kilde,
    ...(s.per ? { per: s.per } : {}),
    ...(s.ca ? { ca: true } : {}),
    ...(s.info ? { info: s.info } : {}),
  }
}
