// Hex grid for Heksagonal jakt, laid flat on the world map's Equal Earth projection (kart.json).
// The projection is equal-area, so every hex of a level covers the same area on the ground.
// Shared by the page (drawing, tapping) and the server (judging guesses); holds no answers.

// d3 geoEqualEarth().fitWidth(1000, Sphere) as in scripts/geo/lag-geodata.mjs, shifted up by the
// northernmost land point (83.6° N) that the map crop starts at.
const SKALA = 184.73156767339816
const TX = 500
const TY = 243.35848769370224
const FORSKYVNING = 2.236
const A1 = 1.340264
const A2 = -0.081106
const A3 = 0.000893
const A4 = 0.003796
const M = Math.sqrt(3) / 2
const RAD = Math.PI / 180

/** Ground area of one square map unit. */
export const KM2_PER_PX2 = 510_065_622 / 428_532.916
export const KM_PER_PX = Math.sqrt(KM2_PER_PX2)

/** Map coordinates [x, y] of a place. */
export function tilKart(lat: number, lng: number): [number, number] {
  const l = Math.asin(M * Math.sin(lat * RAD))
  const l2 = l * l
  const l6 = l2 * l2 * l2
  const x = (lng * RAD * Math.cos(l)) / (M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)))
  const y = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2))
  return [TX + SKALA * x, TY - SKALA * y - FORSKYVNING]
}

/** [lat, lng] of a map point, or null outside the globe's outline. */
export function fraKart(px: number, py: number): [number, number] | null {
  const x = (px - TX) / SKALA
  const y = (TY - FORSKYVNING - py) / SKALA
  let l = y
  for (let i = 0; i < 12; i++) {
    const l2 = l * l
    const l6 = l2 * l2 * l2
    const steg = (l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2)) - y) / (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2))
    l -= steg
    if (Math.abs(steg) < 1e-12) break
  }
  const l2 = l * l
  const l6 = l2 * l2 * l2
  const sinPhi = Math.sin(l) / M
  if (!Number.isFinite(l) || Math.abs(sinPhi) > 1) return null
  const lng = (M * x * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2))) / Math.cos(l) / RAD
  if (Math.abs(lng) > 180) return null
  return [Math.asin(sinPhi) / RAD, lng]
}

export function avstandKm(a: [number, number], b: [number, number]) {
  const dLat = (b[0] - a[0]) * RAD
  const dLng = (b[1] - a[1]) * RAD
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.min(1, Math.sqrt(s)))
}

/** Hex sizes, coarse to fine; the map's zoom picks one. Areas follow H3 resolutions 0–3 like HexHunt. */
export const NIVAER = [
  { navn: "Vid", km2: 4_250_000, poeng: 80 },
  { navn: "Region", km2: 607_000, poeng: 120 },
  { navn: "Fokus", km2: 86_800, poeng: 160 },
  { navn: "Presis", km2: 12_400, poeng: 200 },
] as const

export const MAKS_POENG = NIVAER[NIVAER.length - 1].poeng

/** Centre-to-corner radius of a level's hexes in map units. */
export const side = (nivaa: number) => Math.sqrt((2 * NIVAER[nivaa].km2) / KM2_PER_PX2 / (3 * Math.sqrt(3)))

// Pointy-top hexes in axial coordinates (q, r), with a hex centred on 0° N 0° E.
const [OX, OY] = tilKart(0, 0)

export function sentrum(nivaa: number, q: number, r: number): [number, number] {
  const s = side(nivaa)
  return [OX + s * Math.sqrt(3) * (q + r / 2), OY + s * 1.5 * r]
}

/** The hex containing a map point. */
export function celle(nivaa: number, x: number, y: number): [number, number] {
  const s = side(nivaa)
  const fq = ((Math.sqrt(3) / 3) * (x - OX) - (y - OY) / 3) / s
  const fr = ((2 / 3) * (y - OY)) / s
  // Round in cube coordinates and fix the component with the largest rounding error.
  let q = Math.round(fq)
  let r = Math.round(fr)
  const z = Math.round(-fq - fr)
  const dq = Math.abs(q - fq)
  const dr = Math.abs(r - fr)
  const dz = Math.abs(z + fq + fr)
  if (dq > dr && dq > dz) q = -r - z
  else if (dr > dz) r = -q - z
  return [q, r]
}

export function hjorner(nivaa: number, q: number, r: number) {
  const [cx, cy] = sentrum(nivaa, q, r)
  const s = side(nivaa)
  return Array.from({ length: 6 }, (_, i) => {
    const v = (60 * i - 30) * RAD
    return [cx + s * Math.cos(v), cy + s * Math.sin(v)] as [number, number]
  })
}

/** SVG path data for a set of hexes. */
export function hexSti(nivaa: number, celler: Iterable<readonly [number, number]>) {
  let d = ""
  for (const [q, r] of celler) d += `M${hjorner(nivaa, q, r).map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L")}Z`
  return d
}

/** Hexes of a level whose centre lies on the globe and inside the given map rectangle (plus a margin). */
export function synligeCeller(nivaa: number, x: number, y: number, b: number, h: number) {
  const s = side(nivaa)
  const ut: [number, number][] = []
  const r0 = Math.floor((y - OY) / (1.5 * s)) - 1
  const r1 = Math.ceil((y + h - OY) / (1.5 * s)) + 1
  for (let r = r0; r <= r1; r++) {
    const q0 = Math.floor((x - OX) / (Math.sqrt(3) * s) - r / 2) - 1
    const q1 = Math.ceil((x + b - OX) / (Math.sqrt(3) * s) - r / 2) + 1
    for (let q = q0; q <= q1; q++) {
      const [cx, cy] = sentrum(nivaa, q, r)
      if (fraKart(cx, cy)) ut.push([q, r])
    }
  }
  return ut
}

/** The finest level whose hexes are at least `minPx` wide on screen (`pxPerEnhet` screen pixels per map unit). */
export function nivaaForZoom(pxPerEnhet: number, minPx = 28) {
  let n = 0
  while (n < NIVAER.length - 1 && side(n + 1) * Math.sqrt(3) * pxPerEnhet >= minPx) n++
  return n
}

export type Utfall = "funnet" | "het" | "varm" | "lunken" | "kald"

/**
 * Judges a guess against a place at map point `punkt`, as in HexHunt: inside the hex is a find, otherwise the
 * distance from the hex centre is measured in hex sizes (√area). Large sites have a radius in km and count
 * as found when they reach into the hex.
 */
export function vurder(nivaa: number, q: number, r: number, punkt: [number, number], sted: [number, number], radiusKm = 0): Utfall {
  const [pq, pr] = celle(nivaa, punkt[0], punkt[1])
  if (pq === q && pr === r) return "funnet"
  const midt = fraKart(...sentrum(nivaa, q, r))
  if (!midt) return "kald"
  const storrelse = Math.sqrt(NIVAER[nivaa].km2)
  // Inradius of the hex in km: a site this close to the centre touches the hex.
  const innerKm = (side(nivaa) * KM_PER_PX * Math.sqrt(3)) / 2
  const d = avstandKm(midt, sted)
  if (radiusKm > 0 && d - radiusKm <= innerKm) return "funnet"
  const forhold = Math.max(0, d - radiusKm) / storrelse
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
