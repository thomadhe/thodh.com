import "server-only"

import former from "../../data/geografi/former.json"
import kart from "../../data/geografi/kart.json"
import { dagNummer, iRotasjon } from "../dag"
import { land } from "../geografi"
import { omrissNokkel } from "../geografi-svar"

const formKart = former as Record<string, string>
// Microstates and tiny islands are shown as dots on the map; their outlines are too hard to recognise.
const smaa = new Set(Object.keys((kart as { punkter: Record<string, unknown> }).punkter))
const kandidater = land.filter((l) => formKart[l.id] && !smaa.has(l.id))

/** A batch of random outlines for practice (answers included; nothing to hide there). */
export function ovelsesformer(antall: number) {
  const valgt = new Set<string>()
  while (valgt.size < Math.min(antall, kandidater.length)) valgt.add(kandidater[Math.floor(Math.random() * kandidater.length)].id)
  return [...valgt].map((id) => ({ id, form: formKart[id] }))
}

/** Today's outline and a key to check guesses against (see omrissNokkel). */
export function dagensOmriss(dato: string) {
  const l = iRotasjon(kandidater, dagNummer(dato), "omriss")
  return { form: formKart[l.id], nokkel: omrissNokkel(l.id, dato) }
}
