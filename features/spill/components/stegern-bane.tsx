"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import { MAKS_DM, NIVAAER, type Nivaa } from "../lib/stegern"
import "./stegern-bane.css"

// The course: Stegern, a lime bean in sneakers, runs and jumps along a track marked in metres. Each answer is
// one go: a short run-up and a leap whose length and height follow the score, a triple jump in the final, a
// backflip on question 6 and a stumble on a miss. Everything moves in one animation loop that writes straight
// to the SVG, so React only renders when a jump is added. The loop stops once Stegern has landed and the camera
// has arrived; while he waits, a CSS idle (breathing, blinking, now and then the 6–7 hands) takes over and runs
// out by itself.

export type Hopp = { dm: number; nivaa: Nivaa; type: "vanlig" | "gjenta" | "finale" }

const MAL_M = MAKS_DM / 10
/** Width of the play view in metres, and the ground's place in it. */
const SYN = 11
const FORHOLD = 0.4
const BAKKE = 0.78
/** One running stride: metres and seconds. */
const SKRITT = 0.55
const SKRITT_TID = 0.115
/** The widest the camera zooms out to follow a jump; longer jumps are followed instead. */
const FOLG = 14
/** How long a dust puff lives, in seconds. */
const STOV_TID = 0.5

const buehoyde = (m: number) => (m < 1 ? 0.22 : 0.45 + 0.24 * m ** 0.85)
const flytid = (m: number) => 0.36 + 0.06 * m

const ro = (t: number) => t * t * (3 - 2 * t)
const klem = (t: number, a = 0, b = 1) => Math.min(b, Math.max(a, t))
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
type Stov = { t: number; x: number; vx: number; s: number }

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

type Lem = { x: number; y: number }
type Pose = {
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

function hvile(x: number): Pose {
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
function poseIHopp(plan: Plan, a: number, t: number): Pose | null {
  if (t >= plan.slutt) return null
  const f = plan.faser.findLast((f) => t >= f.t) ?? plan.faser[0]
  return poseIFase(f, a, Math.max(0, t - f.t))
}

function Sko() {
  return (
    <>
      <path d="M-0.08 -0.05 h0.13 q0.12 0 0.12 0.08 v0.02 h-0.25 z" fill="#f4f4f5" />
      <path d="M-0.08 0.03 h0.25" stroke="#f97316" strokeWidth={0.03} />
    </>
  )
}

const STOV_ANTALL = 10

export function Bane({ hopp, oversikt = false }: { hopp: Hopp[]; oversikt?: boolean }) {
  const svg = useRef<SVGSVGElement>(null)
  const figur = useRef<SVGGElement>(null)
  const skygge = useRef<SVGEllipseElement>(null)
  const beinV = useRef<SVGPathElement>(null)
  const beinH = useRef<SVGPathElement>(null)
  const skoV = useRef<SVGGElement>(null)
  const skoH = useRef<SVGGElement>(null)
  const armV = useRef<SVGPathElement>(null)
  const armH = useRef<SVGPathElement>(null)
  const handV = useRef<SVGCircleElement>(null)
  const handH = useRef<SVGCircleElement>(null)
  const oyne = useRef<SVGGElement>(null)
  const pupiller = useRef<SVGGElement>(null)
  const smil = useRef<SVGPathElement>(null)
  const gap = useRef<SVGEllipseElement>(null)
  const fart = useRef<SVGGElement>(null)
  const stov = useRef<SVGGElement>(null)
  const etikett = useRef<SVGTextElement>(null)
  /** The newest jump's trail, kept hidden until Stegern has landed. */
  const sisteSpor = useRef<SVGGElement>(null)

  const landinger = hopp.reduce<number[]>((acc, h) => [...acc, (acc.at(-1) ?? 0) + h.dm / 10], [])
  const total = landinger.at(-1) ?? 0
  const bredde = oversikt ? Math.max(MAL_M, total) + 7 : SYN
  // Stegern and the flags grow with the view so they stay readable when zoomed out.
  const skala = oversikt ? bredde / 16 : 1.25

  // Which jump to play: set when a new one arrives, cleared when it has played out. The camera survives
  // re-runs of the loop so it glides on from where it was.
  const spilt = useRef(hopp.length)
  const aktivt = useRef<{ a: number; b: number; h: Hopp; plan: Plan; start: number } | null>(null)
  const kamera = useRef<{ x: number; b: number } | null>(null)
  /** Starts the loop if it has stopped. */
  const vekk = useRef<() => void>(() => {})
  const sisteHopp = hopp.at(-1)
  const sisteStart = landinger.at(-2) ?? 0

  // Before paint, so the new trail never flashes up ahead of him.
  useLayoutEffect(() => {
    if (hopp.length > spilt.current && sisteHopp) {
      aktivt.current = { a: sisteStart, b: total, h: sisteHopp, plan: lagPlan(total - sisteStart, sisteHopp), start: -1 }
      sisteSpor.current?.setAttribute("opacity", "0")
    } else if (hopp.length < spilt.current) aktivt.current = null
    spilt.current = hopp.length
    vekk.current()
  }, [hopp.length, sisteHopp, sisteStart, total])

  useEffect(() => {
    // With reduced motion the course is drawn once per change: no jumps, no idle movement, no gliding camera.
    const redusert = matchMedia("(prefers-reduced-motion: reduce)").matches
    kamera.current ??= { x: oversikt ? -2 : Math.max(-2, total - 3), b: bredde }
    let forrige = performance.now()
    let ramme = 0
    let landet = -1
    const puffer = Array.from(stov.current?.children ?? []) as SVGCircleElement[]

    const tegn = (p: Pose) => {
      const s = skala
      figur.current?.setAttribute("transform", `translate(${p.x} ${p.y}) scale(${s}) rotate(${p.rot} 0 ${p.piv}) scale(${p.sx} ${p.sy})`)
      const lav = 1 / (1 - p.y * 0.35)
      skygge.current?.setAttribute("transform", `translate(${p.x} 0) scale(${s * lav} ${s})`)
      fart.current?.setAttribute("transform", `translate(${p.x} ${p.y}) scale(${s})`)
      fart.current?.setAttribute("opacity", String(p.fart))
      // Legs bend at the knee when the foot comes closer to the hip; shoes follow the feet and point their toes.
      for (const [bein, sko, side, i] of [[beinV, skoV, -1, 0], [beinH, skoH, 1, 1]] as const) {
        const hx = side * 0.1 * p.hofte
        const hy = -0.42
        const fx = hx + p.ben[i].x
        const fy = -0.05 + p.ben[i].y
        const dx = fx - hx
        const dy = fy - hy
        const len = Math.hypot(dx, dy)
        const boy = Math.sqrt(Math.max(0, 0.37 ** 2 - len ** 2)) * 1.3 + 0.03
        const kx = (hx + fx) / 2 + (dy / len) * boy
        const ky = (hy + fy) / 2 - (dx / len) * boy
        bein.current?.setAttribute("d", `M${hx} ${hy} Q${kx} ${ky} ${fx} ${fy}`)
        sko.current?.setAttribute("transform", `translate(${fx} ${fy}) rotate(${klem(-p.ben[i].y * 140, -10, 40)})`)
      }
      oyne.current?.setAttribute("transform", `translate(0 -0.86) scale(${p.stor} ${p.stor * p.apne}) translate(0 0.86)`)
      pupiller.current?.setAttribute("transform", `translate(${p.blikk.x} ${p.blikk.y})`)
      smil.current?.setAttribute("opacity", String(1 - p.munn))
      gap.current?.setAttribute("transform", `translate(0.02 -0.68) scale(${p.munn})`)
      for (const [arm, hand, side, i] of [[armV, handV, -1, 0], [armH, handH, 1, 1]] as const) {
        const sx = side * 0.27
        const sy = -0.72
        const hx = sx + side * (0.17 - p.opp * 0.05) + p.armer[i].x
        const hy = sy + 0.06 + p.armer[i].y - p.opp * 0.42
        arm.current?.setAttribute("d", `M${sx} ${sy} Q${sx + side * 0.1 + p.armer[i].x * 0.4} ${sy + 0.1 - p.opp * 0.2} ${hx} ${hy}`)
        hand.current?.setAttribute("cx", String(hx))
        hand.current?.setAttribute("cy", String(hy))
      }
    }

    const tegnStov = (akt: { a: number; plan: Plan } | null, tid: number) => {
      const levende = akt ? akt.plan.stov.filter((s) => tid >= s.t && tid < s.t + STOV_TID) : []
      puffer.forEach((c, i) => {
        const s = levende[i]
        if (!s || !akt) return c.setAttribute("opacity", "0")
        const alder = (tid - s.t) / STOV_TID
        // Out fast, then it slows, swells and shrinks away rather than fading to grey.
        const e = 1 - (1 - alder) ** 2
        c.setAttribute("cx", String(akt.a + s.x + s.vx * 0.5 * e * skala))
        c.setAttribute("cy", String((-0.06 - 0.22 * alder * s.s) * skala))
        c.setAttribute("r", String((0.03 + 0.15 * s.s * Math.sin(Math.PI * Math.min(1, alder * 1.15 + 0.15))) * skala))
        c.setAttribute("opacity", String(0.8 * (1 - alder ** 3)))
      })
    }

    const steg = (na: number) => {
      const dt = Math.min(0.05, (na - forrige) / 1000)
      forrige = na
      const tid = na / 1000
      const akt = aktivt.current
      let pose: Pose
      let p: Pose | null = null
      let mal = { x: total - 3, b: SYN }
      if (akt) {
        if (akt.start < 0) akt.start = tid
        const t = tid - akt.start
        p = redusert ? null : poseIHopp(akt.plan, akt.a, t)
        const m = akt.b - akt.a
        // Frame the whole jump when it fits; longer ones (the final) get a camera that runs along.
        if (p) {
          const b = Math.min(Math.max(SYN, m + 4.6), FOLG)
          mal = { x: klem(p.x - b * 0.4, akt.a - 2.2, akt.b + 2.4 - b), b }
        }
        pose = p ?? hvile(akt.b)
        tegnStov(redusert ? null : akt, t)
        // The distance floats up from the landing spot once the jump is decided; the jump is over when it has
        // faded.
        const etter = t - akt.plan.landet
        const e = etikett.current
        const merkeIgjen = !redusert && etter < 1.6
        if (e && etter >= 0 && merkeIgjen) {
          if (landet !== spilt.current) {
            landet = spilt.current
            e.textContent = `+${m.toLocaleString("nb-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m`
            e.setAttribute("fill", NIVAAER[akt.h.nivaa].farge)
          }
          e.setAttribute("x", String(akt.b))
          e.setAttribute("y", String(-1.75 - etter * 0.5))
          e.setAttribute("opacity", String(etter < 1.1 ? 1 : 1 - (etter - 1.1) / 0.5))
        }
        sisteSpor.current?.setAttribute("opacity", String(klem(etter / 0.3)))
        if (!p && !merkeIgjen) {
          aktivt.current = null
          e?.setAttribute("opacity", "0")
        }
      } else {
        pose = hvile(total)
        tegnStov(null, 0)
        etikett.current?.setAttribute("opacity", "0")
      }
      if (oversikt) mal = { x: -2, b: bredde }
      const k = redusert ? 1 : 1 - Math.exp(-dt * (p ? 6 : 4.5))
      const kam = kamera.current!
      kam.x += (mal.x - kam.x) * k
      kam.b += (mal.b - kam.b) * k
      // Idle: no jump playing and the camera has arrived. Draw Stegern standing still and stop.
      const hviler = !aktivt.current && Math.abs(mal.x - kam.x) < 0.002 && Math.abs(mal.b - kam.b) < 0.002
      if (hviler) {
        kam.x = mal.x
        kam.b = mal.b
      }
      const h = kam.b * FORHOLD
      svg.current?.setAttribute("viewBox", `${kam.x} ${-h * BAKKE} ${kam.b} ${h}`)
      // The CSS idle runs whenever Stegern is standing, even while the camera or the label still move.
      svg.current?.toggleAttribute("data-hvile", !p)
      tegn(pose)
      ramme = hviler ? 0 : requestAnimationFrame(steg)
    }
    vekk.current = () => {
      if (ramme) return
      forrige = performance.now()
      ramme = requestAnimationFrame(steg)
    }
    vekk.current()
    return () => {
      cancelAnimationFrame(ramme)
      ramme = 0
      vekk.current = () => {}
    }
  }, [total, bredde, skala, oversikt])

  const strek = { vectorEffect: "non-scaling-stroke" } as const
  const merker = oversikt ? 10 : 5
  const maksMerke = Math.ceil((Math.max(MAL_M, total) + 20) / merker) * merker
  const startX = landinger.map((_, i) => landinger[i - 1] ?? 0)

  return (
    <svg
      ref={svg}
      viewBox={`-2 ${-SYN * FORHOLD * BAKKE} ${SYN} ${SYN * FORHOLD}`}
      className="stegern-bane block w-full select-none"
      style={{ aspectRatio: `${1 / FORHOLD}` }}
      role="img"
      aria-label={`Stegern har hoppet ${total.toLocaleString("nb-NO", { maximumFractionDigits: 1 })} meter`}
    >
      {/* Track: tartan with lane lines, ticks every metre and numbers every five (ten when zoomed out). */}
      <rect x={-50} y={0} width={maksMerke + 100} height={30} fill="#7c2d12" />
      <rect x={-50} y={0} width={maksMerke + 100} height={0.12} fill="#c2410c" />
      <rect x={-50} y={0.42} width={maksMerke + 100} height={0.03} fill="#fdba74" opacity={0.35} />
      {Array.from({ length: maksMerke + 1 }, (_, m) =>
        oversikt && m % 5 ? null : (
          <line key={m} x1={m} x2={m} y1={0} y2={m % merker === 0 ? 0.32 : 0.14} stroke="#fed7aa" strokeOpacity={m % merker === 0 ? 0.8 : 0.4} strokeWidth={1} style={strek} />
        ),
      )}
      {Array.from({ length: maksMerke / merker + 1 }, (_, i) => i * merker).map((m) => (
        <text key={m} x={m} y={oversikt ? 3.3 : 0.78} textAnchor="middle" fontSize={oversikt ? 2.4 : 0.34} fontFamily="var(--font-geist-mono), monospace" fill="#fed7aa" opacity={0.75}>
          {m}
        </text>
      ))}

      {/* 67 m: a perfect day. */}
      <g transform={`translate(${MAL_M} 0) scale(${skala})`}>
        <line x1={0} x2={0} y1={0} y2={-1.9} stroke="#f4f4f5" strokeWidth={1.5} style={strek} />
        <path d="M0 -1.9 h0.9 v0.5 h-0.9 z" fill="#f4f4f5" />
        <path d="M0 -1.9 h0.3 v0.25 h-0.3 z M0.6 -1.9 h0.3 v0.25 h-0.3 z M0.3 -1.65 h0.3 v0.25 h-0.3 z" fill="#18191b" />
        <text x={0.45} y={-2.05} textAnchor="middle" fontSize={0.32} fontWeight={700} fill="#f4f4f5">
          67
        </text>
      </g>

      {/* The trail of each jump so far: footprints for the run-up, an arc for each leap, a flag where it landed. */}
      {hopp.map((h, i) => {
        const a = startX[i]
        const b = landinger[i]
        const farge = NIVAAER[h.nivaa].farge
        const plan = lagPlan(b - a, h)
        return (
          <g key={i} ref={i === hopp.length - 1 ? sisteSpor : undefined}>
            {plan.faser.map((f, j) =>
              f.k === "lop" ? (
                <g key={j} fill={farge} opacity={0.5}>
                  {Array.from({ length: f.skritt }, (_, n) => (
                    <ellipse key={n} cx={a + f.x0 + ((f.x1 - f.x0) * (n + 0.5)) / f.skritt} cy={-0.04} rx={0.07 * skala} ry={0.025 * skala} />
                  ))}
                </g>
              ) : f.k === "fly" ? (
                <path
                  key={j}
                  d={`M${a + f.x0} -0.5 Q${a + (f.x0 + f.x1) / 2} ${-f.h * 2 - 0.5} ${a + f.x1} -0.5`}
                  fill="none"
                  stroke={farge}
                  strokeOpacity={0.45}
                  strokeWidth={1.5}
                  strokeDasharray="3 4"
                  style={strek}
                />
              ) : null,
            )}
            <g transform={`translate(${b} 0) scale(${skala})`}>
              <line x1={0} x2={0} y1={0} y2={-0.75} stroke="#d4d4d8" strokeWidth={1} style={strek} />
              <path d="M0 -0.75 L0.42 -0.62 L0 -0.49 Z" fill={farge} />
            </g>
          </g>
        )
      })}

      <ellipse ref={skygge} cx={0} cy={0.02} rx={0.3} ry={0.06} fill="#000" opacity={0.35} />
      <g ref={stov} fill="#fdf2e4">
        {Array.from({ length: STOV_ANTALL }, (_, i) => (
          <circle key={i} r={0} opacity={0} />
        ))}
      </g>
      <g ref={fart} opacity={0} stroke="#f4f4f5" strokeLinecap="round" strokeWidth={0.035}>
        <path d="M-0.5 -1.05 h-0.42 M-0.48 -0.78 h-0.6 M-0.5 -0.5 h-0.36" />
      </g>
      <g ref={figur}>
        <g fill="none" strokeWidth={0.075} strokeLinecap="round">
          <path ref={beinV} d="M-0.1 -0.42 Q-0.04 -0.24 -0.1 -0.05" stroke="#365314" />
          <path ref={beinH} d="M0.1 -0.42 Q0.16 -0.24 0.1 -0.05" stroke="#3f6212" />
        </g>
        <g ref={skoV} transform="translate(-0.1 -0.05)">
          <Sko />
        </g>
        <g ref={skoH} transform="translate(0.1 -0.05)">
          <Sko />
        </g>
        <g className="stegern-pust">
          {/* Arms behind the body, hands in front; the idle bobs both halves of a side together. */}
          <g fill="none" stroke="#65a30d" strokeWidth={0.07} strokeLinecap="round">
            <path ref={armV} className="stegern-arm-v" d="M-0.27 -0.72 Q-0.37 -0.62 -0.44 -0.66" />
            <path ref={armH} className="stegern-arm-h" d="M0.27 -0.72 Q0.37 -0.62 0.44 -0.66" />
          </g>
          <rect x={-0.3} y={-1.3} width={0.6} height={0.92} rx={0.3} fill="#a3e635" />
          <rect x={-0.3} y={-1.3} width={0.6} height={0.92} rx={0.3} fill="url(#stegern-glans)" />
          <path d="M-0.29 -1.08 Q0 -1.16 0.29 -1.08 L0.29 -0.98 Q0 -1.06 -0.29 -0.98 Z" fill="#ef4444" />
          <path d="M-0.3 -1.03 l-0.13 -0.06 l0.02 0.12 Z" fill="#ef4444" />
          <g ref={oyne}>
            <g className="stegern-blunk">
              <ellipse cx={-0.1} cy={-0.86} rx={0.085} ry={0.1} fill="#fff" />
              <ellipse cx={0.11} cy={-0.86} rx={0.085} ry={0.1} fill="#fff" />
              <g ref={pupiller} transform="translate(0.03 0)">
                <circle cx={-0.09} cy={-0.85} r={0.042} fill="#18181b" />
                <circle cx={0.12} cy={-0.85} r={0.042} fill="#18181b" />
              </g>
            </g>
          </g>
          <path ref={smil} d="M-0.07 -0.71 Q0.02 -0.64 0.11 -0.72" fill="none" stroke="#365314" strokeWidth={0.03} strokeLinecap="round" />
          <ellipse ref={gap} cx={0} cy={0} rx={0.045} ry={0.055} fill="#365314" transform="translate(0.02 -0.68) scale(0)" />
          <text x={0} y={-0.47} textAnchor="middle" fontSize={0.17} fontWeight={800} fill="#365314" fontFamily="var(--font-visning), sans-serif">
            67
          </text>
          <g fill="#a3e635" stroke="#65a30d" strokeWidth={0.02}>
            <g className="stegern-arm-v">
              <circle ref={handV} cx={-0.44} cy={-0.66} r={0.06} />
            </g>
            <g className="stegern-arm-h">
              <circle ref={handH} cx={0.44} cy={-0.66} r={0.06} />
            </g>
          </g>
        </g>
      </g>
      <text ref={etikett} x={0} y={-1.6} textAnchor="middle" fontSize={0.42} fontWeight={800} opacity={0} fontFamily="var(--font-visning), sans-serif" />
      <defs>
        <linearGradient id="stegern-glans" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0.25} />
          <stop offset="0.45" stopColor="#fff" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.12} />
        </linearGradient>
      </defs>
    </svg>
  )
}
