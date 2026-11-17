// 6/7-stegern's motion: a jump as a timed plan (run-up, leap, landing; a triple jump in the final, a backflip on
// question 6 and a stumble on a miss) and Stegern's pose at any moment of it. Pure maths in metres and seconds,
// shared by the course (stegern-bane.tsx) and the pixel renderer that draws the poses (stegern-piksel.ts).

import { MAKS_DM, type Nivaa } from "../lib/stegern"

export type Hopp = { dm: number; nivaa: Nivaa; type: "vanlig" | "gjenta" | "finale" }

export const MAL_M = MAKS_DM / 10
/** Width of the play view in metres. */
export const SYN = 11
/** One running stride: metres and seconds. */
const SKRITT = 0.55
const SKRITT_TID = 0.115
/** The widest the camera zooms out to follow a jump; longer jumps are followed instead. */
export const FOLG = 14
/** How long a dust puff lives, in seconds. */
export const STOV_TID = 0.5

const buehoyde = (m: number) => (m < 1 ? 0.22 : 0.45 + 0.24 * m ** 0.85)
const flytid = (m: number) => 0.36 + 0.06 * m

const ro = (t: number) => t * t * (3 - 2 * t)
export const klem = (t: number, a = 0, b = 1) => Math.min(b, Math.max(a, t))
const blend = (a: number, b: number, t: number) => a + (b - a) * t

// ---- the plan: a jump as a list of timed phases, shared by the animation and the trail it leaves ----

type Fase =
  | { k: "sats"; t: number; d: number; x: number; dyp: number }
  | { k: "lop"; t: number; d: number; x0: number; x1: number; skritt: number }
  | { k: "fly"; t: number; d: number; x0: number; x1: number; h: number; salto: boolean; stor: boolean; bom: boolean }
  | { k: "land"; t: number; d: number; x: number; skli: number; kraft: number; siste: boolean }
  | { k: "snubl"; t: number; d: number; x: number }

type UtenTid<F> = F extends Fase ? Omit<F, "t"> : never

/** A dust puff: born at t at x, drifting by vx, sized by s. */
export type Stov = { t: number; x: number; vx: number; s: number }

export type Plan = { faser: Fase[]; slutt: number; /** When the jump's length is decided: the last touchdown or the faceplant. */ landet: number; stov: Stov[] }

/** The phases of one jump of m metres, positions relative to where it starts. */
export function lagPlan(m: number, h: Hopp): Plan {
  const faser: Fase[] = []
  const stov: Stov[] = []
  let t = 0
  const legg = (f: UtenTid<Fase>) => {
    faser.push({ ...f, t } as Fase)
    t += f.d
  }
  if (h.nivaa === 0 || m < 1) {
    // A miss: a nervous little hink, a toe that catches, and down on the nose.
    legg({ k: "sats", d: 0.16, x: 0, dyp: 0.5 })
    legg({ k: "fly", d: 0.3, x0: 0, x1: m, h: 0.22, salto: false, stor: false, bom: true })
    stov.push({ t, x: m, vx: 0.3, s: 0.5 })
    const snubl = t
    legg({ k: "snubl", d: 1.05, x: m })
    stov.push({ t: snubl + 0.32, x: m + 1.3, vx: 0.6, s: 0.9 }, { t: snubl + 0.32, x: m + 1.1, vx: -0.5, s: 0.7 })
    return { faser, slutt: t, landet: snubl + 0.32, stov }
  }
  const finale = h.type === "finale"
  const skritt = Math.max(2, Math.round(klem(m * 0.33, 1, finale ? 4.4 : 3.3) / SKRITT))
  const lop = Math.min(skritt * SKRITT, m * 0.5)
  legg({ k: "sats", d: 0.13, x: 0, dyp: 1 })
  stov.push({ t, x: -0.1, vx: -0.8, s: 0.7 })
  for (let i = 1; i < skritt; i++) stov.push({ t: t + i * SKRITT_TID, x: (lop * i) / skritt - 0.1, vx: -0.5, s: 0.35 })
  legg({ k: "lop", d: skritt * SKRITT_TID, x0: 0, x1: lop, skritt })
  // The final is a triple jump: hop, step and jump. Everything else is one leap.
  const deler = finale ? [0.3, 0.28, 0.42] : [1]
  let x = lop
  let landet = t
  deler.forEach((andel, i) => {
    const l = (m - lop) * andel
    const siste = i === deler.length - 1
    const kraft = siste ? klem(l / 5, 0.55, 1.2) : 0.5
    const skli = siste ? 0.22 * kraft : 0
    if (i === 0) legg({ k: "sats", d: 0.07, x, dyp: 0.7 })
    stov.push({ t, x: x - 0.1, vx: -1, s: 0.9 })
    legg({
      k: "fly",
      d: flytid(l) * (siste ? 1 : 0.8),
      x0: x,
      x1: x + l - skli,
      h: buehoyde(l) * (siste ? 1 : 0.75),
      salto: siste && h.type === "gjenta",
      stor: l > 3,
      bom: false,
    })
    x += l
    stov.push({ t, x: x - skli, vx: 1, s: siste ? 1.2 : 0.6 }, { t, x: x - skli, vx: -0.9, s: siste ? 1 : 0.5 })
    if (siste) landet = t
    legg({ k: "land", d: siste ? 0.42 : 0.09, x, skli, kraft, siste })
  })
  return { faser, slutt: t, landet, stov }
}

/** Milliseconds from an answer until its jump is decided, for timing the sound to the landing. */
export function tidTilLanding(h: Hopp) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return 0
  return Math.round(lagPlan(h.dm / 10, h).landet * 1000)
}

// ---- poses ----

export type Lem = { x: number; y: number }
export type Pose = {
  x: number
  y: number
  rot: number
  /** Where the body turns around: 0 at the feet, -0.6 at its middle. */
  piv: number
  sx: number
  sy: number
  /** How far apart the hips are, 1 standing; running seen from the side brings them together. */
  hofte: number
  /** Feet and hands, offset from where they rest. */
  ben: [Lem, Lem]
  armer: [Lem, Lem]
  /** Arms thrown up, 0–1. */
  opp: number
  blikk: Lem
  /** Eye opening (1 open, 0 shut) and size. */
  apne: number
  stor: number
  /** 0 smiling, 1 an open "O". */
  munn: number
  /** Speed lines, 0–1. */
  fart: number
}

const null2 = (): [Lem, Lem] => [
  { x: 0, y: 0 },
  { x: 0, y: 0 },
]

export function hvile(x: number): Pose {
  return { x, y: 0, rot: 0, piv: 0, sx: 1, sy: 1, hofte: 1, ben: null2(), armer: null2(), opp: 0, blikk: { x: 0.03, y: 0 }, apne: 1, stor: 1, munn: 0, fart: 0 }
}

/** Running legs and arms at stride phase f (π per stride). */
function lopelemmer(f: number, lofte = 0.14): Pick<Pose, "ben" | "armer"> {
  const ben = [0, 1].map((i) => {
    const p = f + i * Math.PI
    return { x: -0.17 * Math.cos(p), y: -lofte * Math.max(0, Math.sin(p)) }
  }) as [Lem, Lem]
  const armer = [0, 1].map((i) => {
    const p = f + i * Math.PI
    return { x: 0.11 * Math.cos(p), y: -0.07 * Math.max(0, Math.cos(p)) }
  }) as [Lem, Lem]
  return { ben, armer }
}

function poseIFase(f: Fase, a: number, tau: number): Pose {
  const u = klem(tau / f.d)
  switch (f.k) {
    case "sats": {
      // Anticipation: sink, lean back, wind the arms back.
      const e = Math.sin((Math.PI / 2) * u) * f.dyp
      return {
        ...hvile(a + f.x),
        rot: -7 * e,
        sx: 1 + 0.14 * e,
        sy: 1 - 0.2 * e,
        armer: [
          { x: -0.12 * e, y: 0.04 * e },
          { x: -0.12 * e, y: 0.04 * e },
        ],
        blikk: { x: 0.05, y: 0.01 },
        stor: 1 + 0.12 * e,
        apne: 1 - 0.25 * e,
      }
    }
    case "lop": {
      const f0 = u * f.skritt * Math.PI
      const s = Math.abs(Math.sin(f0))
      return {
        ...hvile(a + f.x0 + (f.x1 - f.x0) * (0.75 * u + 0.25 * u * u)),
        ...lopelemmer(f0),
        hofte: 0.3,
        y: -0.11 * s,
        rot: 9,
        sx: 1 + 0.05 * (1 - s) - 0.03 * s,
        sy: 1 - 0.07 * (1 - s) + 0.05 * s,
        blikk: { x: 0.055, y: 0 },
        fart: 0.25 + 0.5 * u,
      }
    }
    case "fly": {
      const l = f.x1 - f.x0
      const y = -f.h * 4 * u * (1 - u)
      const strekk = Math.abs(Math.cos(Math.PI * u))
      const base = { ...hvile(a + f.x0 + l * u), y, sx: 1 - 0.08 * strekk, sy: 1 + 0.14 * strekk }
      if (f.bom) {
        return { ...base, rot: 6 + 10 * u, ben: [{ x: 0.1, y: -0.1 * Math.sin(Math.PI * u) }, { x: -0.06, y: 0 }], opp: 0.25, blikk: { x: 0.02, y: 0.03 } }
      }
      if (f.salto) {
        // Question 6: a tucked backflip around the middle of the body.
        const k = Math.sin(Math.PI * u)
        return {
          ...base,
          rot: -360 * ro(u),
          piv: -0.6,
          sx: 1 + 0.06 * k,
          sy: 1 - 0.1 * k,
          ben: [
            { x: 0.14 * k, y: -0.24 * k },
            { x: 0.16 * k, y: -0.22 * k },
          ],
          armer: [
            { x: 0.1 * k, y: 0.12 * k },
            { x: -0.1 * k, y: 0.12 * k },
          ],
          apne: 1 - 0.75 * k,
          munn: k,
          fart: 0.6,
        }
      }
      // A long leap cycles the legs in the air before reaching them forward for the landing; a short hop tucks.
      const nedfor = ro(klem((u - 0.6) / 0.3))
      const sykkel = f.stor ? lopelemmer(u * 3.2 * Math.PI, 0.12) : null
      const tuck = Math.sin(Math.PI * u)
      const ben = [0, 1].map((i) => {
        const fri = sykkel ? { x: sykkel.ben[i].x, y: sykkel.ben[i].y - 0.06 } : { x: 0.12 * tuck, y: -0.2 * tuck }
        return { x: blend(fri.x, 0.2, nedfor), y: blend(fri.y, -0.1, nedfor) }
      }) as [Lem, Lem]
      return {
        ...base,
        hofte: f.stor ? blend(0.3, 0.6, nedfor) : 0.7,
        rot: 10 - 22 * ro(u),
        ben,
        armer: sykkel ? sykkel.armer : null2(),
        opp: f.stor ? Math.sin(Math.PI * Math.min(1, u * 1.3)) : 0.45 * tuck,
        blikk: { x: 0.04, y: 0.035 * (2 * u - 1) },
        stor: f.stor ? 1 + 0.2 * Math.sin(Math.PI * u) : 1,
        munn: f.stor ? klem(Math.sin(Math.PI * u) * 1.4) : 0,
        fart: f.stor ? 0.9 : 0.45,
      }
    }
    case "land": {
      if (!f.siste) {
        // A quick touch between the hops of the triple jump.
        const k = Math.sin(Math.PI * u)
        return { ...hvile(a + f.x), sx: 1 + 0.16 * k, sy: 1 - 0.24 * k, rot: 6, ben: [{ x: 0.08, y: 0 }, { x: -0.1, y: -0.12 * k }], blikk: { x: 0.05, y: 0 }, fart: 0.6 }
      }
      // Squash, spring back past straight, settle. The body slides the last bit and leans over its feet.
      const s = 0.27 * f.kraft * Math.exp(-tau * 6) * Math.cos(tau * 15)
      return {
        ...hvile(a + f.x - f.skli * Math.exp(-tau * 14)),
        sx: 1 + 0.7 * s,
        sy: 1 - s,
        rot: 22 * f.kraft * Math.exp(-tau * 7) * Math.sin(tau * 13),
        ben: [
          { x: 0.05 * Math.exp(-tau * 8), y: 0 },
          { x: -0.06 * Math.exp(-tau * 8), y: 0 },
        ],
        opp: 0.55 * Math.exp(-tau * 9),
        blikk: { x: 0.03, y: 0.01 },
        apne: 1 - 0.65 * Math.exp(-tau * 10),
        munn: 0,
      }
    }
    case "snubl": {
      // Toe catches, arms windmill, faceplant, a dazed moment, and up again.
      const fall = ro(klem((tau - 0.1) / 0.24))
      const opp = ro(klem((tau - 0.68) / 0.3))
      const vinkel = 84 * fall * (1 - opp)
      const sprett = tau > 0.34 && tau < 0.5 ? Math.sin(((tau - 0.34) / 0.16) * Math.PI) : 0
      const vift = tau < 0.4 ? tau * 34 : 0
      const liggende = fall * (1 - opp)
      return {
        ...hvile(a + f.x),
        y: -0.14 * Math.sin(Math.PI * opp),
        rot: vinkel - 8 * sprett,
        sx: 1 + 0.12 * sprett,
        sy: 1 - 0.14 * sprett,
        ben: [
          { x: 0.02, y: -0.12 * liggende * Math.max(0, Math.sin(tau * 18)) },
          { x: -0.04, y: -0.1 * liggende * Math.max(0, Math.sin(tau * 18 + 2)) },
        ],
        armer: tau < 0.4 ? [
          { x: 0.13 * Math.cos(vift), y: 0.13 * Math.sin(vift) },
          { x: 0.13 * Math.cos(vift + Math.PI), y: 0.13 * Math.sin(vift + Math.PI) },
        ] : null2(),
        opp: tau < 0.4 ? 0.3 : 0,
        blikk: { x: 0.03, y: 0.04 * liggende },
        stor: tau < 0.34 ? 1.25 : 1,
        apne: tau < 0.34 ? 1 : blend(0.25, 1, opp),
        munn: tau < 0.42 ? 1 : 0,
      }
    }
  }
}

/** Stegern's pose at t seconds into a jump starting at a; null once it has played out. */
export function poseIHopp(plan: Plan, a: number, t: number): Pose | null {
  if (t >= plan.slutt) return null
  const f = plan.faser.findLast((f) => t >= f.t) ?? plan.faser[0]
  return poseIFase(f, a, Math.max(0, t - f.t))
}

