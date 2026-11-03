// Addresses of the daily games. Players see /spill/<game> (today) and /spill/<game>?dato=YYYY-MM-DD; Proxy
// rewrites both to a prerendered page per date, /spill/<game>/<dag>. The date is decided per request in Proxy,
// so the pages themselves never depend on the clock and can stay cached for good.

import { erGyldigDato, iDagOslo, leggTilDager, START_DATO, velgDato } from "./dag"
import { spill, type SpillId } from "./spill"

/** The page for today's puzzle. The plain date is the same puzzle seen from a later day (with "next day" arrows). */
const I_DAG = "i-dag-"

export type Dag = { dato: string; iDag: boolean }

export function forsteDag(id: SpillId) {
  return spill.find((s) => s.id === id)?.start ?? START_DATO
}

export function dagSegment({ dato, iDag }: Dag) {
  return iDag ? `${I_DAG}${dato}` : dato
}

export function lesDagSegment(segment: string): Dag | null {
  const iDag = segment.startsWith(I_DAG)
  const dato = iDag ? segment.slice(I_DAG.length) : segment
  return erGyldigDato(dato) ? { dato, iDag } : null
}

export type Ruting = { type: "rewrite" | "redirect"; sti: string }

/** What Proxy does with a request for a daily game, or null when the path is not one. */
export function rutSpill(sti: string, onsket: string | null, iDag = iDagOslo()): Ruting | null {
  const treff = /^\/spill\/([^/]+)(?:\/([^/]+))?$/.exec(sti)
  const info = treff ? spill.find((s) => s.id === treff[1]) : undefined
  if (!treff || !info) return null

  if (treff[2] !== undefined) {
    // The per-date pages are internal. A direct visit goes to the public address, which checks the date again.
    const dag = lesDagSegment(treff[2])
    return { type: "redirect", sti: dag && !dag.iDag ? `${info.href}?dato=${dag.dato}` : info.href }
  }

  // Invalid and future dates show today, as before.
  const dato = velgDato(onsket ?? undefined, iDag)
  // A game that started later has no puzzle on earlier days: send the player to today's instead.
  if (dato < forsteDag(info.id)) return { type: "redirect", sti: info.href }
  return { type: "rewrite", sti: `${info.href}/${dagSegment({ dato, iDag: dato === iDag })}` }
}

/** Pages built ahead of time: today's and the two days before. Older days render on first visit and are then cached. */
export function forhandsbygdeDager(id: SpillId, iDag = iDagOslo()) {
  const dager: Dag[] = [{ dato: iDag, iDag: true }, ...[1, 2].map((n) => ({ dato: leggTilDager(iDag, -n), iDag: false }))]
  return dager.filter((d) => d.dato >= forsteDag(id)).map((d) => ({ dag: dagSegment(d) }))
}

/**
 * Slack for the pages' own date check. Proxy and the page read the clock separately; if the page's clock were a
 * moment behind at midnight, a strict check would cache a 404 for the new day's page. Never reached through Proxy.
 */
export const KLOKKESLINGRING_MS = 2 * 60_000

/** The date a per-date page may show, or null for a 404: an invalid date, one before the game started, or one in the future. */
export function sidensDag(id: SpillId, segment: string, naa = Date.now()): Dag | null {
  const dag = lesDagSegment(segment)
  if (!dag || dag.dato < forsteDag(id) || dag.dato > iDagOslo(new Date(naa + KLOKKESLINGRING_MS))) return null
  return dag
}
