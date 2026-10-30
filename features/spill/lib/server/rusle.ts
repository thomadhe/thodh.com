import "server-only"

import { dagNummer, iRotasjon } from "../dag"
import { land } from "../geografi"
import { avstanderFra } from "../rusle"

// Every start/end pair of sovereign states with 3–6 countries in between: long enough to need some
// thinking, short enough to finish. Built once per server instance.
const par: [string, string][] = []
for (const a of land) {
  const d = avstanderFra(a.id)
  for (const b of land) {
    const steg = d.get(b.id)
    if (a.id < b.id && steg !== undefined && steg >= 4 && steg <= 7) par.push([a.id, b.id])
  }
}

/** Today's walk; the direction flips on alternate rotations so both ends get to be the start. */
export function dagensTur(dato: string) {
  const n = dagNummer(dato)
  const [a, b] = iRotasjon(par, n, "rusle")
  return n % 2 ? { fra: b, til: a } : { fra: a, til: b }
}
