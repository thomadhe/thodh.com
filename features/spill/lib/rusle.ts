import { omrader } from "./geografi"

// Rusle (our Travle): walk from one country to another by naming the countries in between.
// The graph is land borders (plus the fixed links in the data: Channel Tunnel, Øresund, …).

// Like Travle, exclaves don't make a crossing: no Spain–Morocco via Ceuta/Melilla, no Russia–Poland or
// Russia–Lithuania via Kaliningrad.
const UNNTAK = new Set(["ES-MA", "MA-ES", "RU-PL", "PL-RU", "RU-LT", "LT-RU"])
const naboer = new Map(omrader.map((o) => [o.id, o.naboer.filter((n) => !UNNTAK.has(`${o.id}-${n}`))]))

/** Neighbours as Rusle sees them (exclave crossings removed). */
export const naboerAv = (id: string) => naboer.get(id) ?? []

/** Steps from `fra` to every reachable id (breadth-first). */
export function avstanderFra(fra: string, tillatt?: Set<string>) {
  const d = new Map<string, number>([[fra, 0]])
  const ko = [fra]
  while (ko.length) {
    const n = ko.shift()!
    for (const m of naboer.get(n) ?? []) {
      if (d.has(m) || (tillatt && !tillatt.has(m))) continue
      d.set(m, d.get(n)! + 1)
      ko.push(m)
    }
  }
  return d
}

/** Number of countries strictly between the two on the shortest route (Infinity when unreachable). */
export function mellomland(fra: string, til: string) {
  const d = avstanderFra(fra).get(til)
  return d === undefined ? Infinity : d - 1
}

/** One shortest route, start and end included. */
export function kortesteVei(fra: string, til: string) {
  const dFra = avstanderFra(fra)
  const vei = [til]
  let n = til
  while (n !== fra) {
    n = (naboer.get(n) ?? []).find((m) => dFra.get(m) === dFra.get(n)! - 1)!
    vei.unshift(n)
  }
  return vei
}

export type Rusevurdering = "perfekt" | "bra" | "naer" | "omvei" | "utenfor"

/**
 * How good a guess is: on a shortest route ("perfekt" if it extends the walk from the start right now,
 * otherwise "bra"), one step longer than the best route ("naer"), a longer detour ("omvei"), or not
 * connected to the two countries at all ("utenfor").
 */
export function vurder(fra: string, til: string, id: string) {
  const dFra = avstanderFra(fra)
  const dTil = avstanderFra(til)
  const total = dFra.get(til)
  const a = dFra.get(id)
  const b = dTil.get(id)
  if (total === undefined || a === undefined || b === undefined) return "utenfor" as const
  if (a + b === total) return "bra" as const
  if (a + b === total + 1) return "naer" as const
  return "omvei" as const
}

/** Solved when the guessed countries link start and end. */
export function erLost(fra: string, til: string, gjettet: string[]) {
  return avstanderFra(fra, new Set([...gjettet, til])).has(til)
}
