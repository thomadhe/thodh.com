import "server-only"

import former from "../../data/geografi/former.json"
import kart from "../../data/geografi/kart.json"
import { dagNummer, iRotasjon } from "../dag"
import { land, omrader, type Omrade } from "../geografi"
import { omrissNokkel } from "../geografi-svar"

const formKart = former as Record<string, string>
// Microstates and tiny islands are shown as dots on the map; their outlines are too hard to recognise.
const smaa = new Set(Object.keys((kart as { punkter: Record<string, unknown> }).punkter))
const brukbar = (o: Omrade) => Boolean(formKart[o.id]) && !smaa.has(o.id) && !o.liten

/** Territories (Greenland, Puerto Rico, …) join the daily pool from this date; earlier days stay as they were. */
export const TERRITORIER_FRA = "2026-10-31"
const bareLand = land.filter(brukbar)
const medTerritorier = omrader.filter(brukbar)

/** The daily answer pool for a date (also used by Canvas). */
export function dagensPulje(dato: string): Omrade[] {
  return dato >= TERRITORIER_FRA ? medTerritorier : bareLand
}

/** A batch of random outlines for practice (answers included; nothing to hide there). */
export function ovelsesformer(antall: number) {
  const valgt = new Set<string>()
  while (valgt.size < Math.min(antall, medTerritorier.length)) valgt.add(medTerritorier[Math.floor(Math.random() * medTerritorier.length)].id)
  return [...valgt].map((id) => ({ id, form: formKart[id] }))
}

/** Today's outline and a key to check guesses against (see omrissNokkel). */
export function dagensOmriss(dato: string) {
  const l = iRotasjon(dagensPulje(dato), dagNummer(dato), "omriss")
  return { id: l.id, form: formKart[l.id], nokkel: omrissNokkel(l.id, dato) }
}
