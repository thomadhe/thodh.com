// Gjetteløs on the server: the day's questions and the answers. Kept free of "server-only" so the tests can
// import it; only server code (./gjettelos.ts) uses it.

import { gjettelosSporsmal } from "../../data/gjettelos"
import { gjettelosPlan } from "../../data/gjettelos/plan"
import type { GjSporsmal } from "../../data/gjettelos/typer"
import { dagNummer, erGyldigDato, iDagOslo } from "../dag"
import { GJETTELOS_START, poengFor, type Fasit, type SporsmalVisning } from "../gjettelos"

const etterId = new Map(gjettelosSporsmal.map((s) => [s.id, s]))

export function kanSpillesGjettelos(dato: string, iDag = iDagOslo()) {
  return erGyldigDato(dato) && dato >= GJETTELOS_START && dato <= iDag
}

/** Days since the start; the plan starts over when it runs out. */
function indeks(dato: string) {
  const n = dagNummer(dato) - dagNummer(GJETTELOS_START)
  return ((n % gjettelosPlan.length) + gjettelosPlan.length) % gjettelosPlan.length
}

/** The day's five questions with their answers, easiest first. */
export function dagFor(dato: string): GjSporsmal[] {
  return gjettelosPlan[indeks(dato)].map((id) => {
    const s = etterId.get(id)
    if (!s) throw new Error(`Gjetteløs: ukjent spørsmål ${id}`)
    return s
  })
}

/** Whether the date replays a day from an earlier round of the plan. */
export function erRepris(dato: string) {
  return dagNummer(dato) - dagNummer(GJETTELOS_START) >= gjettelosPlan.length
}

/** What the page gets: the questions without answers or sources. */
export function dagensSporsmal(dato: string): SporsmalVisning[] {
  return dagFor(dato).map((s) => ({ tekst: s.tekst, enhet: s.enhet, kategori: s.kategori, vansk: s.vansk, aarstall: s.aarstall }))
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
