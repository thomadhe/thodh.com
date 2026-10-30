import "server-only"

import { dagNummer, iRotasjon } from "../dag"
import { land, omrader } from "../geografi"
import { skjultNokkel } from "../geografi-svar"
import { TERRITORIER_FRA } from "./omriss"

// Every state's flag works; territories join from TERRITORIER_FRA, except tiny ones and Svalbard, whose flag
// is simply Norway's (checked against flagcdn: no other territory shares its sovereign's flag).
const medTerritorier = omrader.filter((o) => !o.liten && o.id !== "SJ")

/** Today's flag. The client only gets a key, and the picture comes through /spill/api/flagg. */
export function dagensFlagg(dato: string) {
  const l = iRotasjon(dato >= TERRITORIER_FRA ? medTerritorier : land, dagNummer(dato), "canvas")
  return { id: l.id, flagg: l.flagg, nokkel: skjultNokkel("canvas", l.id, dato) }
}
