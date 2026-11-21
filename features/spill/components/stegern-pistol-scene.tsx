"use client"

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { tilfeldig } from "../lib/dag"
import { KROPPER, type Figur } from "../lib/duell/figur"
import { serverNa } from "../lib/duell/signatur"
import { MAKS_LIV, type Pistol } from "../lib/stegern-pistol"
import { stemningsPose, useDpr } from "./stegern-bane"
import { hvile, type Pose } from "./stegern-motor"
import {
  FARGE,
  fyll,
  geometri,
  hvileBevegelse,
  Kulisse,
  lagSkjerm,
  merkelapp,
  palettFor,
  PIKSEL,
  rgb,
  sett,
  stortTekst,
  tegnFigur,
  tegnHjerte,
  tegnPistolFritt,
  tegnZzz,
  tekstBredde,
  tekstMedKant,
  type Bilde,
} from "./stegern-piksel"

// Startpistolen's stage: the players' figures in a row on the track at dusk. The holder points the cartoon
// starting pistol at the next player and it trembles (the fuse is never shown). A valid answer makes the holder hop
// and the pistol flies on; a bang pops a "PANG!" flag out of the barrel with smoke and confetti, and the holder
// tumbles over in fright. Hearts over each head, the life bar under the feet, and "+1" when a bar fills.

export type Pistolspiller = { id: string; figur: Figur; farge: number; liv: number; /** 0–1 */ bar: number; ute: boolean; deg: boolean }

const TICK_MS = 50
const FLYTID = 240
const SMELL_MS = 1500
const HOPP_MS = 650

const ROYK = rgb("#e5e7eb")
const KONFETTI = ["#facc15", "#f472b6", "#22d3ee", "#a3e635", "#fb923c", "#ffffff"].map((c) => rgb(c))
const BAR_BUNN = rgb("#1d2757")

function tegnScene(b: Bilde, kulisse: Kulisse, spillere: Pistolspiller[], p: Pick<Pistol, "holder" | "smell" | "pluss" | "hopp" | "vinner">, neste: string | null, na: number, redusert: boolean) {
  const geo = geometri(b.w, 1)
  const tid = na / 1000
  kulisse.tegn(b, geo, 0, redusert ? 0 : tid)
  kulisse.tegnBane(b, geo, (m) => Math.round(m * 12), 12, 1, 5)
  const bakke = geo.bakke[0]
  const n = Math.max(1, spillere.length)
  const plass = (i: number) => Math.round((b.w / n) * (i + 0.5))
  const indeks = new Map(spillere.map((s, i) => [s.id, i]))

  const smellDt = p.smell ? na - p.smell.ts : Infinity
  const iSmell = smellDt >= 0 && smellDt < SMELL_MS
  // During the bang the one it went off on still holds the pistol; then it is the new holder's.
  const visHolder = iSmell && p.smell ? p.smell.id : p.holder
  const hoppDt = p.hopp ? na - p.hopp.ts : Infinity
  const flyr = !iSmell && p.hopp && hoppDt >= 0 && hoppDt < FLYTID && p.hopp.id !== p.holder
  const nesteI = neste ? (indeks.get(neste) ?? 0) : 0

  spillere.forEach((s, i) => {
    const x0 = plass(i)
    let pose: Pose = hvileBevegelse(hvile(0), redusert ? 0 : tid + i * 0.83, s.ute && !(iSmell && p.smell?.id === s.id))
    let dy = 0
    let x = x0
    const harPistol = !p.vinner && s.id === visHolder && !flyr
    const speil = harPistol && nesteI < i
    if (s.ute) pose = { ...pose, sy: 0.82, sx: 1.08 }
    if (harPistol) {
      pose = { ...pose, armer: [pose.armer[0], { x: 0.2, y: -0.2 }], blikk: { x: 0.05, y: 0 }, stor: 1.15 }
      // A nervous tremble: one pixel back and forth a few times a second, not a buzz.
      if (!redusert && !iSmell) x += Math.floor(na / 180) % 2
    }
    if (p.hopp?.id === s.id && hoppDt >= 0 && hoppDt < HOPP_MS && !redusert) {
      const u = hoppDt / HOPP_MS
      dy = -Math.round((4 + 2 * p.hopp.n) * 4 * u * (1 - u))
      pose = { ...pose, opp: 1, munn: 1 }
    }
    if (iSmell && p.smell?.id === s.id) {
      // Startled: up with a jolt, then over backwards.
      const u = Math.min(1, smellDt / 280)
      pose = { ...pose, rot: (speil ? 1 : -1) * 80 * u, munn: 1, stor: 1.3, opp: 1 - u }
      dy = -Math.round(5 * Math.sin(Math.PI * Math.min(1, smellDt / 380)))
    } else if (p.vinner === s.id) pose = stemningsPose(pose, "glad", tid)
    // Shadow.
    for (let k = -4; k <= 4; k++) sett(b, x0 + k, bakke + 1, FARGE.skygge, 0.35)
    tegnFigur(b, x, bakke + dy, pose, palettFor(s.figur, s.farge), s.figur, { pistol: harPistol, speil })
    if (s.ute && !(iSmell && p.smell?.id === s.id) && !redusert) tegnZzz(b, x0 + 4, bakke - 22, tid + i * 0.5)

    // Hearts over the head, or "UTE".
    const hy = bakke - 33
    if (s.ute) merkelapp(b, "UTE", x0, hy, rgb("#94a3b8"))
    else for (let k = 0; k < MAKS_LIV; k++) tegnHjerte(b, x0 - 8 + k * 6, hy, k < s.liv)
    if (s.deg) for (let k = 0; k < 3; k++) for (let ddx = -2 + k; ddx <= 2 - k; ddx++) sett(b, x0 + ddx, hy - 5 + k, FARGE.hvit)

    // The life bar under the feet, in the figure's colour; it lights up white once, briefly, when it fills.
    const plussDt = p.pluss?.id === s.id ? na - p.pluss.ts : Infinity
    const blink = plussDt >= 0 && plussDt < 250
    const bw = 16
    const bx = x0 - bw / 2
    const by = bakke + 4
    fyll(b, bx - 1, by - 1, bw + 2, 5, FARGE.omriss)
    fyll(b, bx, by, bw, 3, BAR_BUNN)
    fyll(b, bx, by, Math.round(bw * Math.min(1, s.bar)), 3, blink ? FARGE.hvit : rgb(KROPPER[s.figur.kropp]?.farge ?? "#a3e635"))
    if (plussDt >= 0 && plussDt < 1500) {
      const a = plussDt < 1100 ? 1 : 1 - (plussDt - 1100) / 400
      const oy = Math.round(plussDt / 90)
      tekstMedKant(b, "+1", x0 - 6, hy - 9 - oy, rgb("#fda4af"), FARGE.omriss, a)
      tegnHjerte(b, x0 + 1, hy - 9 - oy, true, a)
    }
  })

  // The pistol in flight to the next holder.
  if (flyr && p.hopp) {
    const fra = plass(indeks.get(p.hopp.id) ?? 0)
    const til = plass(indeks.get(p.holder) ?? 0)
    const u = hoppDt / FLYTID
    const fx = Math.round(fra + (til - fra) * u)
    const fy = Math.round(bakke - 14 - 10 * 4 * u * (1 - u))
    tegnPistolFritt(b, fx, fy, til < fra)
  }

  // The bang: a flag pops out of the barrel, smoke, confetti, and the word itself.
  if (iSmell && p.smell) {
    const i = indeks.get(p.smell.id) ?? 0
    const x0 = plass(i)
    const ret = nesteI < i ? -1 : 1
    const mx = x0 + ret * 15
    const my = bakke - 14
    const r = tilfeldig(`pang:${p.smell.ts}`)
    const u = smellDt / SMELL_MS
    // Smoke puffs drifting up and out.
    for (let k = 0; k < 6; k++) {
      const rad = 1 + Math.min(4, (smellDt / 120) * (0.6 + r() * 0.5))
      const cx = mx + ret * Math.round(k * 2 + smellDt / 160) + Math.round((r() - 0.5) * 6)
      const cy = my - Math.round(smellDt / 90 + k * 1.5)
      const a = 0.75 * (1 - u)
      for (let yy = -4; yy <= 4; yy++) for (let xx = -4; xx <= 4; xx++) if (xx * xx + yy * yy <= rad * rad) sett(b, cx + xx, cy + yy, ROYK, a)
    }
    // The flag on its spring.
    const ut = Math.min(7, Math.round(smellDt / 30))
    for (let k = 1; k <= ut; k++) sett(b, mx + ret * k, my - Math.round(k / 3), FARGE.stang)
    if (ut >= 7) {
      const fx = mx + ret * 7
      const fy = my - 6
      for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 6; xx++) sett(b, fx + ret * xx, fy + yy, ((xx >> 1) + (yy >> 1)) % 2 ? FARGE.rutet : FARGE.hvit)
    }
    // Confetti.
    for (let k = 0; k < 28; k++) {
      const vx = ret * (0.4 + r() * 1.6) * (r() < 0.2 ? -1 : 1)
      const vy = -(1.2 + r() * 1.8)
      const t = smellDt / 60
      const cx = Math.round(mx + vx * t * 2.2)
      const cy = Math.round(my + vy * t * 2.2 + 0.11 * t * t * 2.2)
      if (cy < bakke) sett(b, cx, cy, KONFETTI[k % KONFETTI.length], 1 - u * 0.6)
    }
    if (smellDt < 1100) {
      const skala = smellDt < 90 ? 3 : 2
      const halv = Math.ceil((tekstBredde("PANG!") * skala) / 2) + 2
      stortTekst(b, "PANG!", Math.min(b.w - halv, Math.max(halv, x0)), 4, rgb("#fde047"), skala)
    }
  }
}

export function Startlinje({
  spillere,
  pistol,
  neste,
  etikett,
  children,
}: {
  spillere: Pistolspiller[]
  pistol: Pick<Pistol, "holder" | "smell" | "pluss" | "hopp" | "vinner">
  /** Who the holder points at. */
  neste: string | null
  etikett: string
  children?: ReactNode
}) {
  const ramme = useRef<HTMLDivElement>(null)
  const lerret = useRef<HTMLCanvasElement>(null)
  const [bredde, setBredde] = useState(360)
  const w = Math.max(60, Math.ceil(bredde / PIKSEL))
  const geo = geometri(w, 1)
  const dpr = useDpr()
  const props = useRef({ spillere, pistol, neste })

  useLayoutEffect(() => {
    const el = ramme.current
    if (!el) return
    const maal = () => setBredde(el.clientWidth || 360)
    maal()
    const ro = new ResizeObserver(maal)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    props.current = { spillere, pistol, neste }
  })

  useEffect(() => {
    const geo = geometri(w, 1)
    const c = lerret.current
    const skjerm = c ? lagSkjerm(c, geo.w, geo.h, PIKSEL) : null
    if (!skjerm) return
    const redusert = matchMedia("(prefers-reduced-motion: reduce)").matches
    const kulisse = new Kulisse()
    let id = 0
    const tegn = () => {
      const { spillere, pistol, neste } = props.current
      tegnScene(skjerm.bilde, kulisse, spillere, pistol, neste, serverNa(), redusert)
      skjerm.vis()
      id = window.setTimeout(tegn, document.hidden ? 1000 : redusert ? 250 : TICK_MS)
    }
    tegn()
    return () => window.clearTimeout(id)
  }, [w, dpr])

  return (
    <div ref={ramme} className="stegern-bane relative w-full overflow-hidden" style={{ height: geo.h * PIKSEL }} role="img" aria-label={etikett}>
      <canvas ref={lerret} className="absolute top-0 left-1/2 block max-w-none -translate-x-1/2" style={{ width: geo.w * PIKSEL, height: geo.h * PIKSEL }} />
      {children}
    </div>
  )
}
