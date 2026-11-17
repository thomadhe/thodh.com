// Gjetteløs on the server: the day's questions and the answers. Kept free of "server-only" so the tests can
// import it; only server code (./gjettelos.ts) uses it.

import { gjettelosSporsmal } from "../../data/gjettelos"
import { gjettelosPlan } from "../../data/gjettelos/plan"
import type { GjSporsmal } from "../../data/gjettelos/typer"
import { dagNummer, erGyldigDato, iDagOslo, iRotasjon, leggTilDager } from "../dag"
import { ANTALL, GJETTELOS_START, poengFor, type Fasit, type SporsmalVisning } from "../gjettelos"
import { signer as signerDom } from "./duell-signatur"

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

// ---- duels: questions from earlier days only, guesses stamped by the server, the answer signed for the reveal ----

/** Days ahead whose questions a duel never uses, so a duel cannot spoil them if the plan or the bank repeats. */
export const GJ_DUELL_SPERRE_DAGER = 14

/**
 * The questions a duel may ask: every question played on a day before today, once (from its latest date), and never
 * one that is scheduled today or within GJ_DUELL_SPERRE_DAGER days.
 */
export function gjettelosDuellPulje(iDag = iDagOslo()): { dato: string; nr: number }[] {
  const sperret = new Set<string>()
  for (let k = 0; k <= GJ_DUELL_SPERRE_DAGER; k++) for (const s of dagFor(leggTilDager(iDag, k))) sperret.add(s.id)
  const sett = new Set<string>()
  const ut: { dato: string; nr: number }[] = []
  for (let d = leggTilDager(iDag, -1); d >= GJETTELOS_START; d = leggTilDager(d, -1)) {
    dagFor(d).forEach((s, nr) => {
      if (sperret.has(s.id) || sett.has(s.id)) return
      sett.add(s.id)
      ut.push({ dato: d, nr })
    })
  }
  return ut.reverse()
}

export type GjDuellSporsmal = SporsmalVisning & { dato: string; nr: number }

/**
 * The questions for round `runde` in room `kode`: up to ANTALL, walking on through back-to-back shuffles of the pool,
 * so a room sees every question once before any comes back. Never the same question twice in one round.
 */
export function gjettelosDuellSporsmal(kode: string, runde: number, iDag = iDagOslo()): GjDuellSporsmal[] {
  const pulje = gjettelosDuellPulje(iDag)
  const antall = Math.min(ANTALL, pulje.length)
  const valgt: { dato: string; nr: number }[] = []
  for (let n = runde * antall; valgt.length < antall && n < runde * antall + 3 * antall; n++) {
    const p = iRotasjon(pulje, n, `gjettelos:duell:${kode}`)
    if (!valgt.some((v) => v.dato === p.dato && v.nr === p.nr)) valgt.push(p)
  }
  return valgt.map(({ dato, nr }) => {
    const s = dagFor(dato)[nr]
    return { dato, nr, tekst: s.tekst, enhet: s.enhet, kategori: s.kategori, aarstall: s.aarstall }
  })
}

/** Whether a duel may use question `nr` of `dato` now. Yesterday's pool counts too, for a round begun before midnight. */
export function erGjettelosDuellSporsmal(dato: string, nr: number, iDag = iDagOslo()) {
  const finnes = (pulje: { dato: string; nr: number }[]) => pulje.some((p) => p.dato === dato && p.nr === nr)
  return finnes(gjettelosDuellPulje(iDag)) || finnes(gjettelosDuellPulje(leggTilDager(iDag, -1)))
}

type DuellRef = { kode: string; runde: number; i: number; dato: string; nr: number }

/** A guess, stamped with who made it, for which question, and when. It says nothing about the answer. */
export function gjettelosDuellStempel(p: DuellRef & { id: string; gjett: number }, na = Date.now()) {
  return signerDom({ s: "gjettelos", k: p.kode, r: p.runde, i: p.i, d: p.dato, nr: p.nr, id: p.id, g: p.gjett, ts: na })
}

/** The answer to a duel question, signed, for the host to share once the question has closed. */
export function gjettelosDuellFasit(p: DuellRef) {
  const s = dagFor(p.dato)[p.nr]
  return signerDom({
    s: "gjettelos-fasit",
    k: p.kode,
    r: p.runde,
    i: p.i,
    d: p.dato,
    nr: p.nr,
    a: s.aarstall,
    f: s.fasit,
    kilde: s.kilde,
    ...(s.per ? { per: s.per } : {}),
    ...(s.ca ? { ca: true } : {}),
    ...(s.info ? { info: s.info } : {}),
  })
}
