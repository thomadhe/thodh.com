"use client"

import { useEffect, useRef } from "react"
import { MAKS_DM, NIVAAER, type Nivaa } from "../lib/stegern"

// The course: Stegern, a lime bean in sneakers, jumps along a track marked in metres. One jump per answer,
// its length and arc set by the score. Everything moves in one animation loop that writes straight to the SVG,
// so React only renders when a jump is added. The loop stops once Stegern stands still and the camera has
// arrived, and starts again with the next jump.

export type Hopp = { dm: number; nivaa: Nivaa; type: "vanlig" | "gjenta" | "finale" }

const MAL_M = MAKS_DM / 10
/** Width of the play view in metres, and the ground's place in it. */
const SYN = 11
const FORHOLD = 0.4
const BAKKE = 0.78

const buehoyde = (m: number) => (m < 1 ? 0.22 : 0.45 + 0.24 * m ** 0.85)
const varighet = (m: number) => (m < 1 ? 0.32 : 0.5 + 0.055 * m)

type Pose = { x: number; y: number; rot: number; sx: number; sy: number; tuck: number; armer: [number, number]; opp: number }

const ro = (t: number) => t * t * (3 - 2 * t)
const klem = (t: number) => Math.min(1, Math.max(0, t))

/** Stegern's pose at time t (s) into a jump from a to b metres; null once it is over. */
function poseIHopp(a: number, b: number, h: Hopp, t: number): Pose | null {
  const m = b - a
  const bom = h.nivaa === 0
  const sats = 0.14
  const fly = varighet(m)
  const land = 0.22
  const snubl = bom ? 1.05 : 0
  const base: Pose = { x: a, y: 0, rot: 0, sx: 1, sy: 1, tuck: 0, armer: [0, 0], opp: 0 }
  if (t < sats) {
    const u = t / sats
    return { ...base, sx: 1 + 0.12 * u, sy: 1 - 0.2 * u, armer: [0.12 * u, 0.12 * u] }
  }
  t -= sats
  if (t < fly) {
    const u = t / fly
    const rot = h.type === "gjenta" ? -360 * ro(u) : bom ? 10 * u : -8 * Math.sin(Math.PI * u)
    return {
      ...base,
      x: a + m * u,
      y: -buehoyde(m) * 4 * u * (1 - u),
      rot,
      sx: 0.94,
      sy: 1.08,
      tuck: Math.sin(Math.PI * u),
      opp: bom ? 0.2 : Math.sin(Math.PI * Math.min(1, u * 1.4)),
    }
  }
  t -= fly
  if (t < land) {
    const u = t / land
    const k = Math.sin(Math.PI * u)
    return { ...base, x: b, sx: 1 + 0.18 * k, sy: 1 - 0.26 * k, armer: [-0.1 * k, -0.1 * k] }
  }
  t -= land
  if (t < snubl) {
    // A miss: tip over onto the nose, lie there a moment, then get up.
    const ned = klem(t / 0.25)
    const opp = klem((t - 0.7) / 0.35)
    const vinkel = 78 * ro(ned) * (1 - ro(opp))
    return { ...base, x: b, rot: vinkel, armer: [0.2, -0.15], tuck: 0.3 * (1 - opp) }
  }
  return null
}

function hvilePose(x: number, tid: number, stille = false): Pose {
  if (stille) return { x, y: 0, rot: 0, sx: 1, sy: 1, tuck: 0, armer: [0, 0], opp: 0 }
  // The 6–7 hands: palms up, weighing one against the other.
  const s = Math.sin(tid * 7)
  return { x, y: 0, rot: 0, sx: 1 + 0.015 * Math.sin(tid * 3), sy: 1 - 0.015 * Math.sin(tid * 3), tuck: 0, armer: [0.11 * s, -0.11 * s], opp: 0 }
}

function Sko() {
  return (
    <>
      <path d="M-0.08 -0.05 h0.13 q0.12 0 0.12 0.08 v0.02 h-0.25 z" fill="#f4f4f5" />
      <path d="M-0.08 0.03 h0.25" stroke="#f97316" strokeWidth={0.03} />
    </>
  )
}

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
  const pupiller = useRef<SVGGElement>(null)
  const etikett = useRef<SVGTextElement>(null)

  const landinger = hopp.reduce<number[]>((acc, h) => [...acc, (acc.at(-1) ?? 0) + h.dm / 10], [])
  const total = landinger.at(-1) ?? 0
  const bredde = oversikt ? Math.max(MAL_M, total) + 7 : SYN
  // Stegern and the flags grow with the view so they stay readable when zoomed out.
  const skala = oversikt ? bredde / 16 : 1.25

  // Which jump to play: set when a new one arrives, cleared when it has played out. The camera survives
  // re-runs of the loop so it glides on from where it was.
  const spilt = useRef(hopp.length)
  const aktivt = useRef<{ a: number; b: number; h: Hopp; start: number } | null>(null)
  const kamera = useRef<{ x: number; b: number } | null>(null)
  /** Starts the loop if it has stopped. */
  const vekk = useRef<() => void>(() => {})
  const sisteHopp = hopp.at(-1)
  const sisteStart = landinger.at(-2) ?? 0

  useEffect(() => {
    if (hopp.length > spilt.current && sisteHopp) aktivt.current = { a: sisteStart, b: total, h: sisteHopp, start: -1 }
    else if (hopp.length < spilt.current) aktivt.current = null
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

    const tegn = (p: Pose, tid: number, stille: boolean) => {
      const s = skala
      figur.current?.setAttribute("transform", `translate(${p.x} ${p.y}) scale(${s}) rotate(${p.rot} 0 -0.6) scale(${p.sx} ${p.sy})`)
      const lav = 1 / (1 - p.y * 0.35)
      skygge.current?.setAttribute("transform", `translate(${p.x} 0) scale(${s * lav} ${s})`)
      // Legs bend at the knee as they tuck; shoes follow the feet.
      for (const [bein, sko, side] of [[beinV, skoV, -1], [beinH, skoH, 1]] as const) {
        const hx = side * 0.1
        const fx = side * 0.1 + p.tuck * 0.16
        const fy = -0.05 - p.tuck * 0.2
        const kx = (hx + fx) / 2 + 0.06 + p.tuck * 0.14
        const ky = (-0.42 + fy) / 2
        bein.current?.setAttribute("d", `M${hx} -0.42 Q${kx} ${ky} ${fx} ${fy}`)
        sko.current?.setAttribute("transform", `translate(${fx} ${fy}) rotate(${-p.tuck * 25})`)
      }
      const blunk = !stille && tid % 3.6 < 0.12 ? 0.15 : 1
      pupiller.current?.setAttribute("transform", `translate(0.035 0) scale(1 ${blunk})`)
      for (const [arm, hand, side, i] of [[armV, handV, -1, 0], [armH, handH, 1, 1]] as const) {
        const sx = side * 0.27
        const sy = -0.72
        const hx = sx + side * (0.17 - p.opp * 0.05)
        const hy = sy + 0.06 + p.armer[i] - p.opp * 0.42
        arm.current?.setAttribute("d", `M${sx} ${sy} Q${sx + side * 0.1} ${sy + 0.1 - p.opp * 0.2} ${hx} ${hy}`)
        hand.current?.setAttribute("cx", String(hx))
        hand.current?.setAttribute("cy", String(hy))
      }
    }

    const steg = (na: number) => {
      const dt = Math.min(0.05, (na - forrige) / 1000)
      forrige = na
      const tid = na / 1000
      const akt = aktivt.current
      let pose: Pose
      let mal = { x: total - 3, b: SYN }
      if (akt) {
        if (akt.start < 0) akt.start = tid
        const p = redusert ? null : poseIHopp(akt.a, akt.b, akt.h, tid - akt.start)
        const m = akt.b - akt.a
        if (p) {
          pose = p
          mal = { x: Math.min(akt.a, akt.b) - 2.5, b: Math.max(SYN, m + 6) }
        } else {
          pose = hvilePose(akt.b, tid)
        }
        // The distance floats up from the landing spot once Stegern touches down; the jump is over when it
        // has faded.
        const etter = tid - akt.start - 0.14 - varighet(m)
        const e = etikett.current
        const merkeIgjen = !redusert && etter < 1.6
        if (e && etter >= 0 && merkeIgjen) {
          if (landet !== spilt.current) {
            landet = spilt.current
            e.textContent = `+${m.toLocaleString("nb-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m`
            e.setAttribute("fill", NIVAAER[akt.h.nivaa].farge)
          }
          e.setAttribute("x", String(akt.b))
          e.setAttribute("y", String(-1.55 - etter * 0.5))
          e.setAttribute("opacity", String(etter < 1.1 ? 1 : 1 - (etter - 1.1) / 0.5))
        }
        if (!p && !merkeIgjen) {
          aktivt.current = null
          e?.setAttribute("opacity", "0")
        }
      } else {
        pose = hvilePose(total, tid)
        etikett.current?.setAttribute("opacity", "0")
      }
      if (oversikt) mal = { x: -2, b: bredde }
      const k = redusert ? 1 : 1 - Math.exp(-dt * 4.5)
      const kam = kamera.current!
      kam.x += (mal.x - kam.x) * k
      kam.b += (mal.b - kam.b) * k
      // Idle: no jump playing and the camera has arrived. Draw Stegern standing still and stop.
      const hviler = !aktivt.current && Math.abs(mal.x - kam.x) < 0.002 && Math.abs(mal.b - kam.b) < 0.002
      if (hviler) {
        kam.x = mal.x
        kam.b = mal.b
        pose = hvilePose(total, tid, true)
      }
      const h = kam.b * FORHOLD
      svg.current?.setAttribute("viewBox", `${kam.x} ${-h * BAKKE} ${kam.b} ${h}`)
      tegn(pose, tid, hviler)
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
      className="block w-full select-none"
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

      {/* Arcs of the jumps so far, and a flag where each one landed. */}
      {hopp.map((h, i) => {
        const a = startX[i]
        const b = landinger[i]
        const m = b - a
        const top = -buehoyde(m) * 2 - 0.5
        return (
          <g key={i}>
            <path d={`M${a} -0.5 Q${(a + b) / 2} ${top} ${b} -0.5`} fill="none" stroke={NIVAAER[h.nivaa].farge} strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="3 4" style={strek} />
            <g transform={`translate(${b} 0) scale(${skala})`}>
              <line x1={0} x2={0} y1={0} y2={-0.75} stroke="#d4d4d8" strokeWidth={1} style={strek} />
              <path d="M0 -0.75 L0.42 -0.62 L0 -0.49 Z" fill={NIVAAER[h.nivaa].farge} />
            </g>
          </g>
        )
      })}

      <ellipse ref={skygge} cx={0} cy={0.02} rx={0.3} ry={0.06} fill="#000" opacity={0.35} />
      <g ref={figur}>
        <g fill="none" stroke="#3f6212" strokeWidth={0.075} strokeLinecap="round">
          <path ref={beinV} d="M-0.1 -0.42 Q-0.04 -0.24 -0.1 -0.05" />
          <path ref={beinH} d="M0.1 -0.42 Q0.16 -0.24 0.1 -0.05" />
        </g>
        <g ref={skoV} transform="translate(-0.1 -0.05)">
          <Sko />
        </g>
        <g ref={skoH} transform="translate(0.1 -0.05)">
          <Sko />
        </g>
        <g fill="none" stroke="#65a30d" strokeWidth={0.07} strokeLinecap="round">
          <path ref={armV} d="M-0.27 -0.72 Q-0.37 -0.62 -0.44 -0.66" />
          <path ref={armH} d="M0.27 -0.72 Q0.37 -0.62 0.44 -0.66" />
        </g>
        <rect x={-0.3} y={-1.3} width={0.6} height={0.92} rx={0.3} fill="#a3e635" />
        <rect x={-0.3} y={-1.3} width={0.6} height={0.92} rx={0.3} fill="url(#stegern-glans)" />
        <path d="M-0.29 -1.08 Q0 -1.16 0.29 -1.08 L0.29 -0.98 Q0 -1.06 -0.29 -0.98 Z" fill="#ef4444" />
        <path d="M-0.3 -1.03 l-0.13 -0.06 l0.02 0.12 Z" fill="#ef4444" />
        <g>
          <ellipse cx={-0.1} cy={-0.86} rx={0.085} ry={0.1} fill="#fff" />
          <ellipse cx={0.11} cy={-0.86} rx={0.085} ry={0.1} fill="#fff" />
          <g ref={pupiller}>
            <circle cx={-0.09} cy={-0.85} r={0.042} fill="#18181b" />
            <circle cx={0.12} cy={-0.85} r={0.042} fill="#18181b" />
          </g>
        </g>
        <path d="M-0.07 -0.71 Q0.02 -0.64 0.11 -0.72" fill="none" stroke="#365314" strokeWidth={0.03} strokeLinecap="round" />
        <text x={0} y={-0.47} textAnchor="middle" fontSize={0.17} fontWeight={800} fill="#365314" fontFamily="var(--font-visning), sans-serif">
          67
        </text>
        <circle ref={handV} cx={-0.44} cy={-0.66} r={0.06} fill="#a3e635" stroke="#65a30d" strokeWidth={0.02} />
        <circle ref={handH} cx={0.44} cy={-0.66} r={0.06} fill="#a3e635" stroke="#65a30d" strokeWidth={0.02} />
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
