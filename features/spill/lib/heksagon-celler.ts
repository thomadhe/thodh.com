import { cellToBoundary, cellToChildren, cellToLatLng, getRes0Cells, getResolution, isValidCell, latLngToCell, polygonToCells, polygonToCellsExperimental, POLYGON_TO_CELLS_FLAGS } from "h3-js"
import { avstandKm, NIVAER, utfallForAvstand, type Utfall } from "./heksagon"

// The H3 grid for Heksagonal jakt: the page draws and taps cells with it, and the server judges guesses
// with the same functions, so both agree on every cell. Holds no answers.

/** The cell of a level that holds a point. */
export const celleFor = (lat: number, lng: number, nivaa: number) => latLngToCell(lat, lng, nivaa)

/** The level of a cell, or null if it isn't a cell of one of the game's levels. */
export function nivaaFor(celle: string) {
  if (!isValidCell(celle)) return null
  const n = getResolution(celle)
  return n >= 0 && n < NIVAER.length ? n : null
}

/** A circle of `km` around a point, as a ring of [lat, lng]. */
export function sirkel([lat, lng]: readonly [number, number], km: number, punkter = 72): [number, number][] {
  const rad = Math.PI / 180
  const d = km / 6371
  const f = lat * rad
  return Array.from({ length: punkter }, (_, i) => {
    const v = (i * 2 * Math.PI) / punkter
    const f2 = Math.asin(Math.sin(f) * Math.cos(d) + Math.cos(f) * Math.sin(d) * Math.cos(v))
    const l2 = lng * rad + Math.atan2(Math.sin(v) * Math.sin(d) * Math.cos(f), Math.cos(d) - Math.sin(f) * Math.sin(f2))
    return [f2 / rad, l2 / rad]
  })
}

// Cells of each level that a place's ground reaches into, by place and level.
const dekninger = new Map<string, Set<string>>()
function dekning(punkt: readonly [number, number], km: number, nivaa: number) {
  const nokkel = `${punkt.join(",")}:${km}:${nivaa}`
  let celler = dekninger.get(nokkel)
  if (!celler) {
    celler = new Set(polygonToCellsExperimental(sirkel(punkt, km), nivaa, POLYGON_TO_CELLS_FLAGS.containmentOverlapping))
    dekninger.set(nokkel, celler)
  }
  return celler
}

/**
 * Judges a guess as HexHunt does: a find if the hex holds the place or reaches into its ground (`radiusKm` around
 * it), otherwise feedback by the distance from the hex centre. Large sites (`fraKant`) measure from their edge.
 */
export function vurder(celle: string, punkt: readonly [number, number], radiusKm = 0, fraKant = false): Utfall {
  const nivaa = getResolution(celle)
  if (latLngToCell(punkt[0], punkt[1], nivaa) === celle) return "funnet"
  if (radiusKm > 0 && dekning(punkt, radiusKm, nivaa).has(celle)) return "funnet"
  const km = avstandKm(cellToLatLng(celle), punkt)
  return utfallForAvstand(nivaa, Math.max(0, km - (fraKant ? radiusKm : 0)))
}

/** The centre of a cell as [lat, lng]. */
export const sentrum = (celle: string) => cellToLatLng(celle) as [number, number]

/**
 * A cell's outline as a GeoJSON ring of [lng, lat]. Longitudes are unwrapped so cells on the date line don't streak
 * across the map, and a cell around a pole is closed along the pole.
 */
export function omriss(celle: string): [number, number][] {
  // Copies: the closing point is the same array as the first.
  const ring = cellToBoundary(celle, true).map(([lng, lat]) => [lng, lat] as [number, number])
  // Steps between corners, each the short way round (-180, 180].
  const steg = ring.slice(1).map((p, i) => ((((p[0] - ring[i][0] + 180) % 360) + 360) % 360) - 180 || 0)
  const nivaa = getResolution(celle)
  const pol = [90, -90].find((p) => latLngToCell(p, 0, nivaa) === celle)
  if (pol !== undefined) {
    // Around a pole the ring goes once round all longitudes. One step can be close to 180° and look like a turn
    // back; it follows the others' direction, so the ring winds a full 360°.
    const storst = steg.reduce((m, d, i) => (Math.abs(d) > Math.abs(steg[m]) ? i : m), 0)
    const retning = Math.sign(steg.reduce((s, d, i) => (i === storst ? s : s + d), 0)) || 1
    if (Math.sign(steg[storst]) !== retning) steg[storst] += 360 * retning
  }
  for (let i = 1; i < ring.length; i++) ring[i][0] = ring[i - 1][0] + steg[i - 1]
  if (pol !== undefined) ring.push([ring[ring.length - 1][0], pol], [ring[0][0], pol], [...ring[0]])
  return ring
}

const MAKS_CELLER = 9000

/** Cells of a level whose centre lies in a box of longitudes and latitudes (none if there would be too many). */
export function synligeCeller(vest: number, sor: number, ost: number, nord: number, nivaa: number): string[] {
  if (nivaa === 0) return getRes0Cells()
  if (ost - vest >= 180) {
    // Wide views take the whole grid; long box edges would bend along great circles.
    const alle = getRes0Cells().flatMap((c) => cellToChildren(c, nivaa))
    return alle.length > MAKS_CELLER ? [] : alle
  }
  const skift = Math.floor(((vest + ost) / 2 + 180) / 360) * 360
  const v = vest - skift
  const o = ost - skift
  const biter = v < -180 ? [[v + 360, 180], [-180, o]] : o > 180 ? [[v, 180], [-180, o - 360]] : [[v, o]]
  const s = Math.max(sor, -85)
  const n = Math.min(nord, 85)
  const ut = new Set<string>()
  for (const [a, b] of biter) {
    // Extra points along the top and bottom keep the box's edges on their latitude.
    const steg = Math.max(1, Math.ceil((b - a) / 10))
    const langs = Array.from({ length: steg + 1 }, (_, i) => a + ((b - a) * i) / steg)
    const ring = [...langs.map((l) => [s, l]), ...[...langs].reverse().map((l) => [n, l])]
    for (const c of polygonToCells(ring, nivaa)) ut.add(c)
    if (ut.size > MAKS_CELLER) return []
  }
  return [...ut]
}
