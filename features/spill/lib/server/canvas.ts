import "server-only"

import { dagNummer, iRotasjon } from "../dag"
import { land } from "../geografi"
import { skjultNokkel } from "../geografi-svar"

/** Today's flag. The client only gets a key, and the picture comes through /spill/api/flagg. */
export function dagensFlagg(dato: string) {
  const l = iRotasjon(land, dagNummer(dato), "canvas")
  return { id: l.id, nokkel: skjultNokkel("canvas", l.id, dato) }
}
