// Rules for Heksagonal jakt (our HexHunt): hex sizes, how the zoom picks one, feedback and points.
// Shared by the page and the server. The H3 grid itself lives in heksagon-celler.ts, so this stays light.

/** Hex sizes, coarse to fine: the index is the H3 resolution. `zoom` is the map zoom where it starts, as in HexHunt. */
export const NIVAER = [
  { navn: "Vid", zoom: 0, poeng: 80, km2: 4_250_000 },
  { navn: "Region", zoom: 2.6, poeng: 120, km2: 607_000 },
  { navn: "Fokus", zoom: 4.2, poeng: 155, km2: 86_800 },
  { navn: "Presis", zoom: 5.8, poeng: 180, km2: 12_400 },
  { navn: "Ekspert", zoom: 7.4, poeng: 200, km2: 1_770 },
] as const

export const MAKS_POENG = NIVAER[NIVAER.length - 1].poeng

/** How far past a level's zoom the map must go before the level changes, so it doesn't flicker at the edge. */
const SLINGRING = 0.35

/** The level for a map zoom, moving step by step from the current one; a view of the whole world is always Vid. */
export function nivaaForZoom(zoom: number, forrige: number, helVerden = false) {
  if (helVerden) return 0
  let n = Math.min(Math.max(forrige, 0), NIVAER.length - 1)
  while (n < NIVAER.length - 1 && zoom >= NIVAER[n + 1].zoom + SLINGRING) n++
  while (n > 0 && zoom < NIVAER[n].zoom - SLINGRING) n--
  return n
}

export function avstandKm(a: readonly [number, number], b: readonly [number, number]) {
  const rad = Math.PI / 180
  const dLat = (b[0] - a[0]) * rad
  const dLng = (b[1] - a[1]) * rad
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.min(1, Math.sqrt(s)))
}

export type Utfall = "funnet" | "het" | "varm" | "lunken" | "kald"

/** Feedback for a miss `km` from the hex centre, measured in hex sizes (√area) as in HexHunt. */
export function utfallForAvstand(nivaa: number, km: number): Exclude<Utfall, "funnet"> {
  const forhold = km / Math.sqrt(NIVAER[nivaa].km2)
  return forhold <= 1.5 ? "het" : forhold <= 3 ? "varm" : forhold <= 6 ? "lunken" : "kald"
}

/** Share of the level's points kept for the round's last guess. */
const TREFF: Record<Utfall, number> = { funnet: 1, het: 0.6, varm: 0.3, lunken: 0, kald: 0 }
const FORSOK = [1, 0.8, 0.6]

/** Points for a round that ended with `utfall` on guess number `forsok` (0-based) at `nivaa`. */
export function rundePoeng(utfall: Utfall, nivaa: number, forsok: number) {
  const grunn = Math.round(NIVAER[nivaa].poeng * TREFF[utfall])
  return grunn > 0 ? Math.max(1, Math.round(grunn * FORSOK[Math.min(forsok, 2)])) : 0
}
