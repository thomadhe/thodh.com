// Pixel art for 6/7-stegern. Everything is drawn by hand into a small pixel buffer (no anti-aliasing anywhere)
// that the page scales up with nearest-neighbour: a dusk stadium in parallax layers, the track, and Stegern
// himself, built from the motion engine's poses with a one-pixel outline. Our own world, our own palette.

import { tilfeldig } from "../lib/dag"
import type { Pose } from "./stegern-motor"

/** CSS pixels per art pixel. */
export const PIKSEL = 3
/** Art pixels per body unit of the motion engine (Stegern's body is 0.92 units tall). */
export const U = 14

export type Bilde = { w: number; h: number; d: Uint32Array }

/** A colour packed the way ImageData stores it (RGBA bytes, little-endian). */
export function rgb(hex: string, a = 255) {
  const n = parseInt(hex.slice(1), 16)
  return ((a << 24) | ((n & 0xff) << 16) | (n & 0xff00) | (n >>> 16)) >>> 0
}

function bland(under: number, over: number, a: number) {
  const b = 1 - a
  const r = (over & 0xff) * a + (under & 0xff) * b
  const g = ((over >>> 8) & 0xff) * a + ((under >>> 8) & 0xff) * b
  const bl = ((over >>> 16) & 0xff) * a + ((under >>> 16) & 0xff) * b
  return ((0xff << 24) | (bl << 16) | (g << 8) | r) >>> 0
}

export function sett(b: Bilde, x: number, y: number, c: number, a = 1) {
  if (x < 0 || y < 0 || x >= b.w || y >= b.h) return
  const i = y * b.w + x
  b.d[i] = a >= 1 ? c : bland(b.d[i], c, a)
}

export function fyll(b: Bilde, x: number, y: number, w: number, h: number, c: number, a = 1) {
  const x0 = Math.max(0, x)
  const y0 = Math.max(0, y)
  const x1 = Math.min(b.w, x + w)
  const y1 = Math.min(b.h, y + h)
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) sett(b, xx, yy, c, a)
}

// ---- a 3×5 pixel font (M and W are wider) ----

const GLYFER: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["01", "11", "01", "01", "01"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "011", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "001", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["10001", "11011", "10101", "10001", "10001"],
  N: ["1001", "1101", "1011", "1001", "1001"],
  O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["10001", "10001", "10101", "11011", "10001"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  "+": ["000", "010", "111", "010", "000"],
  "-": ["000", "000", "111", "000", "000"],
  ",": ["00", "00", "00", "01", "10"],
  ".": ["0", "0", "0", "0", "1"],
  "/": ["001", "001", "010", "100", "100"],
  "!": ["1", "1", "1", "0", "1"],
  " ": ["0", "0", "0", "0", "0"],
}

export function tekstBredde(s: string) {
  let w = 0
  for (const t of s) w += (GLYFER[t]?.[0].length ?? 0) + 1
  return Math.max(0, w - 1)
}

/** Draws text with its top-left corner at x, y; returns its width. */
export function tekst(b: Bilde, s: string, x: number, y: number, c: number, a = 1) {
  let cx = x
  for (const t of s) {
    const g = GLYFER[t]
    if (!g) continue
    g.forEach((rad, r) => {
      for (let k = 0; k < rad.length; k++) if (rad[k] === "1") sett(b, cx + k, y + r, c, a)
    })
    cx += g[0].length + 1
  }
  return cx - x - 1
}

/** Text with a one-pixel dark outline, readable on any background. */
export function tekstMedKant(b: Bilde, s: string, x: number, y: number, c: number, kant: number, a = 1) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) tekst(b, s, x + dx, y + dy, kant, a)
  return tekst(b, s, x, y, c, a)
}

// ---- runners ----

export type Palett = { kropp: number; lys: number; skygge: number; mork: number }

const palett = (kropp: string, lys: string, skygge: string, mork: string): Palett => ({ kropp: rgb(kropp), lys: rgb(lys), skygge: rgb(skygge), mork: rgb(mork) })

/** In the order of DUELL_FARGER: lime Stegern first, then his rivals. */
export const PALETTER: Palett[] = [
  palett("#a3e635", "#d9f99d", "#65a30d", "#2f4a0c"),
  palett("#22d3ee", "#a5f3fc", "#0891b2", "#134e5e"),
  palett("#f472b6", "#fbcfe8", "#db2777", "#701a43"),
  palett("#facc15", "#fef08a", "#ca8a04", "#6b3f0a"),
  palett("#a78bfa", "#ddd6fe", "#7c3aed", "#3b1a7a"),
  palett("#fb923c", "#fed7aa", "#ea580c", "#6e2a0b"),
]

const OMRISS = rgb("#070a17")
const HVIT = rgb("#f8fafc")
const SKO_SALE = rgb("#f97316")
const PANNEBAND = rgb("#ef4444")
const PANNEBAND_MORK = rgb("#b91c1c")
const PUPILL = rgb("#0b1020")

// The figure is drawn upright into a small canvas of its own, turned and squashed into a second one by sampling
// back (nearest neighbour, so it stays crisp at any angle), and then copied out with an outline.
const L = 48
const OX = 24
const OY = 38
const lokal = new Uint32Array(L * L)
const snudd = new Uint32Array(L * L)

function lp(x: number, y: number, c: number) {
  const ix = OX + Math.floor(x)
  const iy = OY + Math.floor(y)
  if (ix >= 0 && iy >= 0 && ix < L && iy < L) lokal[iy * L + ix] = c
}

function linje(x0: number, y0: number, x1: number, y1: number, c: number, tykk = 1) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))))
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    const y = y0 + ((y1 - y0) * i) / n
    lp(x, y, c)
    if (tykk > 1) lp(x + 1, y, c)
  }
}

// The bean: 9 pixels wide and 13 tall, rounded at both ends.
const KROPP_TOPP = -18
const KROPP_RADER = [2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2]

function tegnLokal(p: Pose, pal: Palett) {
  lokal.fill(0)
  // Arms behind the body; the hands come in front of it further down.
  const hender: [number, number][] = []
  for (const [side, i] of [[-1, 0], [1, 1]] as const) {
    const sx = side * 0.27 * U
    const sy = -0.72 * U
    const hx = sx + (side * (0.17 - p.opp * 0.05) + p.armer[i].x) * U
    const hy = sy + (0.06 + p.armer[i].y - p.opp * 0.42) * U
    linje(sx, sy, hx, hy, pal.skygge)
    hender.push([hx, hy])
  }
  // Legs bend at the knee when the foot comes closer to the hip; the shoes follow the feet.
  for (const [side, i] of [[-1, 0], [1, 1]] as const) {
    const hx = side * 0.1 * p.hofte
    const hy = -0.42
    const fx = hx + p.ben[i].x
    const fy = -0.05 + p.ben[i].y
    const dx = fx - hx
    const dy = fy - hy
    const len = Math.hypot(dx, dy) || 1
    const boy = Math.sqrt(Math.max(0, 0.37 ** 2 - len ** 2)) * 1.3 + 0.03
    const kx = (hx + fx) / 2 + (dy / len) * boy
    const ky = (hy + fy) / 2 - (dx / len) * boy
    let fx0 = hx * U
    let fy0 = hy * U
    for (let s = 1; s <= 4; s++) {
      const t = s / 4
      const x = ((1 - t) ** 2 * hx + 2 * (1 - t) * t * kx + t * t * fx) * U
      const y = ((1 - t) ** 2 * hy + 2 * (1 - t) * t * ky + t * t * fy) * U
      linje(fx0, fy0, x, y, pal.mork, 2)
      fx0 = x
      fy0 = y
    }
    // A white sneaker with an orange sole, toe forward.
    const sx = Math.floor(fx * U)
    const sy = Math.floor(fy * U)
    for (let k = -1; k <= 1; k++) lp(sx + k, sy, HVIT)
    for (let k = -1; k <= 2; k++) lp(sx + k, sy + 1, SKO_SALE)
  }
  // The body, lit from the floodlights up left.
  KROPP_RADER.forEach((r, j) => {
    const y = KROPP_TOPP + j
    for (let x = -r; x <= r; x++) {
      let c = pal.kropp
      if (x === r || j === KROPP_RADER.length - 1) c = pal.skygge
      else if (x === -r + 1 && j > 0 && j < 9) c = pal.lys
      lp(x, y, c)
    }
  })
  // Red sweatband with its knot flying out behind.
  for (let x = -4; x <= 4; x++) lp(x, -15, PANNEBAND)
  lp(-5, -15, PANNEBAND)
  lp(-6, -14, PANNEBAND_MORK)
  lp(-5, -14, PANNEBAND_MORK)
  // Eyes: open, shut or wide; the pupils look where the pose looks.
  const stor = p.stor > 1.12
  for (const ex of [-2, 1]) {
    if (p.apne < 0.45) {
      lp(ex, -12, pal.mork)
      lp(ex + 1, -12, pal.mork)
      continue
    }
    const topp = stor ? -14 : -13
    for (let y = topp; y <= -11; y++) {
      lp(ex, y, HVIT)
      lp(ex + 1, y, HVIT)
    }
    const px = p.blikk.x >= 0.02 ? ex + 1 : ex
    const py = p.blikk.y > 0.015 ? -12 : p.blikk.y < -0.015 ? topp : -12
    lp(px, py, PUPILL)
    if (!stor) lp(px, py + 1 > -11 ? py - 1 : py + 1, PUPILL)
  }
  // Mouth: a smile, or an "O" in the air.
  if (p.munn >= 0.5) {
    lp(0, -10, pal.mork)
    lp(1, -10, pal.mork)
    lp(0, -9, pal.mork)
    lp(1, -9, pal.mork)
  } else {
    lp(-1, -10, pal.mork)
    lp(0, -9, pal.mork)
    lp(1, -9, pal.mork)
    lp(2, -10, pal.mork)
  }
  for (const [hx, hy] of hender) {
    const x = Math.floor(hx)
    const y = Math.floor(hy)
    lp(x, y, pal.kropp)
    lp(x + 1, y, pal.kropp)
    lp(x, y + 1, pal.skygge)
    lp(x + 1, y + 1, pal.kropp)
  }
}

function snu(p: Pose) {
  if (Math.abs(p.rot) < 0.5 && Math.abs(p.sx - 1) < 0.02 && Math.abs(p.sy - 1) < 0.02) {
    snudd.set(lokal)
    return
  }
  const v = (p.rot * Math.PI) / 180
  const cos = Math.cos(v)
  const sin = Math.sin(v)
  const piv = p.piv * U
  for (let ry = 0; ry < L; ry++) {
    for (let rx = 0; rx < L; rx++) {
      const qx = rx - OX + 0.5
      const qy = ry - OY + 0.5 - piv
      // Undo the turn around the pivot, then the squash around the feet.
      const ux = (qx * cos + qy * sin) / p.sx
      const uy = (-qx * sin + qy * cos + piv) / p.sy
      const lx = OX + Math.floor(ux)
      const ly = OY + Math.floor(uy)
      snudd[ry * L + rx] = lx >= 0 && ly >= 0 && lx < L && ly < L ? lokal[ly * L + lx] : 0
    }
  }
}

/** Stegern (or a rival) in pose p with his feet at pixel x, y. */
export function tegnFigur(b: Bilde, x: number, y: number, p: Pose, pal: Palett) {
  tegnLokal(p, pal)
  snu(p)
  const x0 = x - OX
  const y0 = y - OY
  for (let ry = 0; ry < L; ry++) {
    for (let rx = 0; rx < L; rx++) {
      const c = snudd[ry * L + rx]
      if (c) {
        sett(b, x0 + rx, y0 + ry, c)
        continue
      }
      const nabo =
        (rx > 0 && snudd[ry * L + rx - 1]) || (rx < L - 1 && snudd[ry * L + rx + 1]) || (ry > 0 && snudd[(ry - 1) * L + rx]) || (ry < L - 1 && snudd[(ry + 1) * L + rx])
      if (nabo) sett(b, x0 + rx, y0 + ry, OMRISS)
    }
  }
}

/** A standing pose's small idle: breathing, a blink, now and then the 6–7 hands, and sleep after a while. */
export function hvileBevegelse(p: Pose, tid: number, sover: boolean): Pose {
  if (sover) {
    const inn = (tid / 2.4) % 1 < 0.5
    return { ...p, apne: 0, sy: inn ? 0.93 : 1, sx: inn ? 1.04 : 1, rot: 3, blikk: { x: 0, y: 0.03 } }
  }
  const pust = (tid / 1.6) % 1 < 0.5
  const blunk = tid % 3.7 < 0.14
  const t7 = tid % 7
  const hender = t7 > 5.4 && t7 < 6.6
  const opp = Math.floor(tid * 6) % 2 === 0
  return {
    ...p,
    sy: pust ? 0.94 : 1,
    apne: blunk ? 0 : p.apne,
    armer: hender
      ? [
          { x: 0, y: opp ? -0.2 : 0.08 },
          { x: 0, y: opp ? 0.08 : -0.2 },
        ]
      : p.armer,
  }
}

/** Little Zs drifting up from a sleeping head at x, y. */
export function tegnZzz(b: Bilde, x: number, y: number, tid: number) {
  for (let k = 0; k < 3; k++) {
    const f = (tid * 0.45 + k / 3) % 1
    const a = f < 0.15 ? f / 0.15 : 1 - Math.max(0, (f - 0.6) / 0.4)
    tekstMedKant(b, "Z", x + Math.round(f * 7), y - Math.round(f * 12), rgb("#a5f3fc"), OMRISS, a)
  }
}

// ---- the stadium at dusk ----

export type Geometri = {
  w: number
  h: number
  /** Ground row of each lane, back to front. */
  bakke: number[]
  /** Far edge of the track. */
  topp: number
}

const BANE_AVSTAND = 6

export function geometri(w: number, baner: number): Geometri {
  const h = 74 + (baner - 1) * BANE_AVSTAND
  const forste = h - 10
  const bakke = Array.from({ length: baner }, (_, i) => forste - (baner - 1 - i) * BANE_AVSTAND)
  return { w, h, bakke, topp: bakke[0] - 7 }
}

const HIMMEL = ["#060920", "#0c1035", "#1a1449", "#33185a", "#5c1f66", "#8f2f6e", "#c94b6f"].map((c) => rgb(c))
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)

const FJELL_BAK = rgb("#2a1752")
const FJELL_BAK_LYS = rgb("#3a2468")
const FJELL = rgb("#1b1040")
const FJELL_LYS = rgb("#2b1a58")
const SNO = rgb("#7d6bb0")
const TRIBUNE = rgb("#110b29")
const TAK = rgb("#08061a")
const TAKKANT = rgb("#3d2b70")
const MAST = rgb("#07051a")
const LAMPE = rgb("#fff4c2")
const LAMPE_KANT = rgb("#c9a75a")
const GLOD = rgb("#7e4a8c")
const BANE = rgb("#8a2c1c")
const BANE_KORN = rgb("#7a2617")
const BANE_KANT = rgb("#d25a2c")
const BANELINJE = rgb("#e7b9a3")
const MERKE = rgb("#ffd7b5")
const BRETT = rgb("#0a0f2a")
// Dimmed neon, so the boards stay behind the action.
const NEON = ["#b83a9e", "#1f9fb8", "#6f9a2a", "#b8931a"].map((c) => rgb(c))

/** A pixel row for a stretch of hills: height per x, repeating every `periode` pixels. */
function profil(periode: number, frø: string, lav: number, hoy: number, topper: number) {
  const r = tilfeldig(frø)
  const ut = new Float32Array(periode)
  const fase = [r() * 6.28, r() * 6.28, r() * 6.28]
  for (let x = 0; x < periode; x++) {
    const v = x / periode
    ut[x] = 0.5 + 0.25 * Math.sin(v * 6.283 * 2 + fase[0]) + 0.15 * Math.sin(v * 6.283 * 5 + fase[1]) + 0.1 * Math.sin(v * 6.283 * 11 + fase[2])
  }
  // A few sharp peaks, fjord style.
  for (let k = 0; k < topper; k++) {
    const midt = Math.floor(r() * periode)
    const bredde = 14 + r() * 26
    const hoyde = 0.4 + r() * 0.5
    for (let x = -Math.ceil(bredde); x <= bredde; x++) {
      const i = (midt + x + periode) % periode
      ut[i] = Math.max(ut[i], hoyde + 0.55 * (1 - Math.abs(x) / bredde))
    }
  }
  return ut.map((v) => lav + Math.min(1, v) * (hoy - lav))
}

type Lag = { w: number; h: number; d: Uint32Array }

function lagLag(w: number, h: number): Lag {
  return { w, h, d: new Uint32Array(w * h) }
}

function settLag(l: Lag, x: number, y: number, c: number) {
  if (x < 0 || y < 0 || x >= l.w || y >= l.h) return
  l.d[y * l.w + x] = c
}

/** Grandstands with floodlight masts, 26 px high, repeating every 220 px. */
function lagTribune(): { lag: Lag; publikum: number[] } {
  const l = lagLag(220, 30)
  const r = tilfeldig("stegern:tribune")
  const publikum: number[] = []
  const bunn = l.h
  const tribuner = [
    [6, 70],
    [86, 64],
    [160, 52],
  ]
  for (const [a, w] of tribuner) {
    const hoyde = 11
    for (let x = a; x < a + w; x++) {
      for (let y = bunn - hoyde; y < bunn; y++) settLag(l, x, y, TRIBUNE)
      // The roof juts out over the stand.
      settLag(l, x, bunn - hoyde - 1, TAK)
      settLag(l, x, bunn - hoyde - 2, TAKKANT)
    }
    for (const x of [a - 1, a - 2, a + w, a + w + 1]) settLag(l, x, bunn - hoyde - 1, TAK)
    // Rows of spectators: dim dots, some of which flash now and then.
    for (let y = bunn - hoyde + 2; y < bunn - 1; y += 2) {
      for (let x = a + 1; x < a + w - 1; x++) {
        if (r() < 0.45) continue
        const c = [rgb("#3c2a6e"), rgb("#4a2f62"), rgb("#2c3d72"), rgb("#5a3058")][Math.floor(r() * 4)]
        settLag(l, x, y, c)
        publikum.push(y * l.w + x)
      }
    }
    // Pillars.
    for (let x = a + 6; x < a + w - 2; x += 14) for (let y = bunn - hoyde; y < bunn; y++) settLag(l, x, y, TAK)
  }
  // Floodlight masts between the stands, each with a lamp grid and a dithered halo.
  for (const mx of [80, 155, 216]) {
    const topp = 2
    for (let y = topp + 4; y < bunn; y++) settLag(l, mx, y, MAST)
    for (let dy = -5; dy <= 7; dy++) {
      for (let dx = -7; dx <= 7; dx++) {
        const d = Math.hypot(dx, dy * 1.3)
        if (d < 7 && (dx + dy) % 2 === 0 && d > 3) settLag(l, (mx + dx + l.w) % l.w, topp + 1 + dy, GLOD)
      }
    }
    for (let dx = -3; dx <= 3; dx++) {
      settLag(l, (mx + dx + l.w) % l.w, topp - 1, LAMPE_KANT)
      settLag(l, (mx + dx + l.w) % l.w, topp + 3, LAMPE_KANT)
      for (let dy = 0; dy <= 2; dy++) settLag(l, (mx + dx + l.w) % l.w, topp + dy, (dx + dy) % 2 === 0 ? LAMPE : rgb("#ffe08a"))
    }
  }
  return { lag: l, publikum }
}

/** Advertising boards along the back straight, 7 px high, repeating every so often. */
function lagBrett(): Lag {
  const tekster = ["6/7", "THODH", "HOPP!", "67 M", "STEGERN", "SJELDEN"]
  const bredder = tekster.map((t) => tekstBredde(t) + 8)
  const w = bredder.reduce((s, b) => s + b + 2, 0)
  const l = lagLag(w, 7)
  const bilde: Bilde = { w: l.w, h: l.h, d: l.d }
  let x = 0
  tekster.forEach((t, i) => {
    const bw = bredder[i]
    const neon = NEON[i % NEON.length]
    for (let xx = x; xx < x + bw; xx++) {
      for (let y = 0; y < 7; y++) l.d[y * w + xx] = y === 0 || y === 6 || xx === x || xx === x + bw - 1 ? rgb("#1d2550") : BRETT
    }
    tekst(bilde, t, x + 4, 1, neon)
    x += bw + 2
  })
  return l
}

/** A cheap, stable hash of a pixel to 0–1. */
function korn(x: number, y: number) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

type Stjerne = { x: number; y: number; c: number; blink: number }

export class Kulisse {
  private himmel: number[][] = []
  private fjellBak = profil(512, "stegern:fjell-bak", 10, 26, 4)
  private fjell = profil(384, "stegern:fjell", 6, 18, 3)
  private tribune = lagTribune()
  private brett = lagBrett()
  private stjerner: Stjerne[] = []
  private hoyde = -1

  /** Sky colours per row and dither column, rebuilt when the horizon moves. */
  private forbered(topp: number) {
    if (this.hoyde === topp) return
    this.hoyde = topp
    this.himmel = Array.from({ length: topp }, (_, y) => {
      // The warm band sits behind the peaks, so the glow outlines them.
      const f = Math.min(1, y / Math.max(1, topp - 12)) * (HIMMEL.length - 1)
      const i = Math.min(HIMMEL.length - 2, Math.floor(f))
      const rest = f - i
      return BAYER.map((terskel) => (rest > terskel ? HIMMEL[i + 1] : HIMMEL[i]))
    })
    const r = tilfeldig("stegern:stjerner")
    this.stjerner = Array.from({ length: 70 }, () => ({
      x: Math.floor(r() * 400),
      y: Math.floor(r() * topp * 0.6),
      c: [rgb("#ffffff"), rgb("#a5f3fc"), rgb("#fbcfe8"), rgb("#c7d2fe")][Math.floor(r() * 4)],
      blink: r() < 0.3 ? r() * 10 : -1,
    }))
  }

  /** The background behind the track, scrolled to camera pixel `kam` at time `tid` (seconds). */
  tegn(b: Bilde, g: Geometri, kam: number, tid: number) {
    const { w, topp } = g
    this.forbered(topp)
    for (let y = 0; y < topp; y++) {
      const rad = this.himmel[y]
      for (let x = 0; x < w; x++) b.d[y * w + x] = rad[(y & 3) * 4 + (x & 3)]
    }
    // Stars, a few of them twinkling.
    const sk = Math.round(kam * 0.03)
    for (const s of this.stjerner) {
      const x = (((s.x - sk) % 400) + 400) % 400
      if (x >= w) continue
      const av = s.blink >= 0 && (tid + s.blink) % 3 < 0.25
      if (!av) sett(b, x, s.y, s.c, s.blink >= 0 ? 0.9 : 0.55)
    }
    // A full moon high up, almost still, with a dithered halo and a few craters.
    const mx = w - 22 - Math.round(kam * 0.02)
    const my = 10
    for (let dy = -9; dy <= 9; dy++) {
      for (let dx = -9; dx <= 9; dx++) {
        const d = dx * dx + dy * dy
        if (d <= 20) sett(b, mx + dx, my + dy, (dx - 1) * (dx - 1) + (dy + 1) * (dy + 1) <= 2 || (dx + 2) * (dx + 2) + (dy - 2) * (dy - 2) <= 1 ? rgb("#e9cf95") : rgb("#fdf0c4"))
        else if (d <= 42 && (dx + dy) % 2 === 0) sett(b, mx + dx, my + dy, rgb("#fde9b8"), 0.18)
      }
    }
    // Two ridges of mountains, the far one paler and slower.
    this.rygg(b, g, this.fjellBak, kam * 0.06, FJELL_BAK, FJELL_BAK_LYS, null, 8)
    this.rygg(b, g, this.fjell, kam * 0.12, FJELL, FJELL_LYS, SNO, 4)
    // Grandstands and floodlights, with camera flashes in the crowd.
    const t = this.tribune.lag
    const tx = Math.round(kam * 0.3)
    const ty = topp - 7 - t.h
    for (let y = 0; y < t.h; y++) {
      for (let x = 0; x < w; x++) {
        const c = t.d[y * t.w + ((((x + tx) % t.w) + t.w) % t.w)]
        if (c) sett(b, x, ty + y, c)
      }
    }
    for (let k = 0; k < 4; k++) {
      const takt = tid * 1.7 + k * 0.37
      if (takt % 1 > 0.12) continue
      const n = this.tribune.publikum.length
      const i = this.tribune.publikum[Math.floor(tilfeldig(`blits:${k}:${Math.floor(takt)}`)() * n)]
      const x = ((((i % t.w) - tx) % t.w) + t.w) % t.w
      if (x < w) sett(b, x, ty + Math.floor(i / t.w), rgb("#ffffff"))
    }
    // Advertising boards behind the track.
    const br = this.brett
    const bx = Math.round(kam * 0.65)
    for (let y = 0; y < br.h; y++) {
      for (let x = 0; x < w; x++) b.d[(topp - 7 + y) * w + x] = br.d[y * br.w + ((((x + bx) % br.w) + br.w) % br.w)]
    }
  }

  private rygg(b: Bilde, g: Geometri, p: Float32Array, forskyv: number, farge: number, lys: number, sno: number | null, loft: number) {
    const fot = g.topp - 7 - loft
    const fs = Math.round(forskyv)
    for (let x = 0; x < g.w; x++) {
      const i = (((x + fs) % p.length) + p.length) % p.length
      const h = Math.round(p[i])
      const hForrige = Math.round(p[(i - 1 + p.length) % p.length])
      for (let y = fot - h; y < g.topp - 7; y++) {
        // Slopes that face the sunset catch a little light; high peaks keep snow.
        let c = farge
        if (y < fot - h + 2 && hForrige < h) c = lys
        if (sno && h > 16 && y < fot - h + 2) c = sno
        sett(b, x, y, c)
      }
    }
  }

  /** The track: tartan with grain, lane lines, and ticks every metre along the front. */
  tegnBane(b: Bilde, g: Geometri, tilPx: (m: number) => number, pxPerM: number, merkeHvert: number, tallHvert: number) {
    const { w, h, topp, bakke } = g
    for (let y = topp; y < h; y++) {
      for (let x = 0; x < w; x++) b.d[y * w + x] = BANE
    }
    // Grain that moves with the track.
    const null0 = tilPx(0)
    for (let y = topp + 1; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const wx = x - null0
        if (korn(wx, y) < 0.1) b.d[y * w + x] = BANE_KORN
      }
    }
    for (let x = 0; x < w; x++) b.d[topp * w + x] = BANE_KANT
    for (let x = 0; x < w; x++) sett(b, x, topp + 2, BANELINJE, 0.55)
    for (const gy of bakke) for (let x = 0; x < w; x++) sett(b, x, gy + 3, BANELINJE, 0.6)
    const front = bakke[bakke.length - 1] + 3
    const fra = Math.floor(-tilPx(0) / pxPerM) - 1
    const til = fra + Math.ceil(w / pxPerM) + 2
    for (let m = Math.max(0, fra); m <= til; m++) {
      if (m % merkeHvert) continue
      const x = tilPx(m)
      const stor = m % tallHvert === 0
      sett(b, x, front, MERKE)
      if (stor) {
        sett(b, x, front + 1, MERKE)
        const s = String(m)
        tekst(b, s, x - Math.floor(tekstBredde(s) / 2), front + 2 + 0, MERKE, 0.85)
      }
    }
  }
}

export const FARGE = {
  omriss: OMRISS,
  hvit: HVIT,
  stov: rgb("#fdf2e4"),
  stang: rgb("#cbd5e1"),
  skygge: rgb("#000000"),
  rutet: rgb("#18191b"),
}
