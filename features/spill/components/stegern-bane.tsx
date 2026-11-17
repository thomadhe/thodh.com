"use client"

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { NIVAAER } from "../lib/stegern"
import { FOLG, hvile, klem, lagPlan, MAL_M, poseIHopp, STOV_TID, SYN, type Hopp, type Plan, type Pose } from "./stegern-motor"
import { FARGE, geometri, hvileBevegelse, Kulisse, merkelapp, PALETTER, PIKSEL, rgb, sett, tegnFigur, tegnZzz, tekstMedKant, type Bilde } from "./stegern-piksel"
import "./stegern-bane.css"

export { lagPlan, tidTilLanding, type Hopp } from "./stegern-motor"

// The course: a pixel-art athletics track at dusk, with mountains, grandstands and floodlights scrolling past in
// parallax. Each runner (Stegern alone in the daily game, up to six in a duel, one per lane) runs and jumps as
// far as their answers allow. One animation loop draws everything into a small pixel buffer; while nobody jumps
// it drops to a slow idle tick (breathing, blinking, the 6–7 hands, and in the end a nap) and stops entirely
// for reduced motion.

/** `deg` puts a small arrow over the runner, so a player finds themself among the lanes. */
export type Loper = { id: string; hopp: Hopp[]; farge: number; deg?: boolean }

type Aktivt = { a: number; b: number; h: Hopp; plan: Plan; start: number }
type Spor = { antall: number; aktivt: Aktivt | null; merket: number }

/** Seconds without a jump before a runner nods off. */
const SOVN_S = 10
const IDLE_MS = 125

const planer = new Map<string, Plan>()
function planFor(h: Hopp) {
  const nokkel = `${h.dm}:${h.nivaa}:${h.type}`
  let p = planer.get(nokkel)
  if (!p) planer.set(nokkel, (p = lagPlan(h.dm / 10, h)))
  return p
}

const landinger = (hopp: Hopp[]) => hopp.reduce<number[]>((acc, h) => [...acc, (acc.at(-1) ?? 0) + h.dm / 10], [])
const metertekst = (m: number) => `+${m.toLocaleString("nb-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M`

export function Bane({
  lopere,
  oversikt = false,
  mal = true,
  vekker,
  etikett,
  children,
}: {
  lopere: Loper[]
  /** Zoom out to the whole run (the summary). */
  oversikt?: boolean
  /** Show the 67 m flag of a perfect day. */
  mal?: boolean
  /** Any value; when it changes, sleeping runners wake up. */
  vekker?: unknown
  etikett: string
  /** Laid over the scene, e.g. the title screen. */
  children?: ReactNode
}) {
  const ramme = useRef<HTMLDivElement>(null)
  const lerret = useRef<HTMLCanvasElement>(null)
  const [bredde, setBredde] = useState(360)
  const w = Math.max(60, Math.ceil(bredde / PIKSEL))
  const baner = Math.max(1, lopere.length)
  const geo = geometri(w, baner)

  const props = useRef({ lopere, oversikt, mal })
  const spor = useRef(new Map<string, Spor>())
  const kamera = useRef<{ x: number; b: number } | null>(null)
  const vaken = useRef(0)
  const vekk = useRef<() => void>(() => {})

  useLayoutEffect(() => {
    const el = ramme.current
    if (!el) return
    const maal = () => setBredde(el.clientWidth || 360)
    maal()
    const ro = new ResizeObserver(maal)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // New jumps start playing before paint, so the trail they leave never flashes up ahead of the runner.
  useLayoutEffect(() => {
    props.current = { lopere, oversikt, mal }
    const kjente = spor.current
    for (const l of lopere) {
      const s = kjente.get(l.id)
      if (!s) {
        kjente.set(l.id, { antall: l.hopp.length, aktivt: null, merket: -1 })
        continue
      }
      if (l.hopp.length > s.antall) {
        const ender = landinger(l.hopp)
        const h = l.hopp[l.hopp.length - 1]
        const a = ender.at(-2) ?? 0
        s.aktivt = { a, b: ender.at(-1) ?? 0, h, plan: planFor(h), start: -1 }
      } else if (l.hopp.length < s.antall) s.aktivt = null
      s.antall = l.hopp.length
    }
    vekk.current()
  })

  useEffect(() => {
    vaken.current = performance.now() / 1000
    vekk.current()
  }, [vekker])

  useEffect(() => {
    const geo = geometri(w, baner)
    const c = lerret.current
    const ctx = c?.getContext("2d")
    if (!c || !ctx) return
    const redusert = matchMedia("(prefers-reduced-motion: reduce)").matches
    const data = ctx.createImageData(geo.w, geo.h)
    const bilde: Bilde = { w: geo.w, h: geo.h, d: new Uint32Array(data.data.buffer) }
    const kulisse = new Kulisse()
    if (!vaken.current) vaken.current = performance.now() / 1000
    let forrige = performance.now()
    let raf = 0
    let tidtaker = 0

    const tegn = (na: number) => {
      raf = 0
      tidtaker = 0
      const dt = Math.min(0.05, (na - forrige) / 1000)
      forrige = na
      const tid = na / 1000
      const { lopere, oversikt, mal } = props.current
      const enkel = lopere.length === 1

      // Where everyone is, and what the camera should frame.
      type Rad = { l: Loper; ender: number[]; total: number; akt: Aktivt | null; t: number; p: Pose | null; s: Spor }
      const rader: Rad[] = lopere.map((l) => {
        const s = spor.current.get(l.id) ?? { antall: l.hopp.length, aktivt: null, merket: -1 }
        const ender = landinger(l.hopp)
        const akt = s.aktivt
        let t = 0
        let p: Pose | null = null
        if (akt) {
          if (akt.start < 0) akt.start = tid
          t = tid - akt.start
          p = redusert ? null : poseIHopp(akt.plan, akt.a, t)
        }
        return { l, ender, total: ender.at(-1) ?? 0, akt, t, p, s }
      })
      const lengst = Math.max(0, ...rader.map((r) => r.total))
      let mal_ = { x: lengst - 3, b: SYN }
      if (oversikt) {
        mal_ = { x: -2, b: Math.max(mal ? MAL_M : SYN, lengst) + 7 }
      } else if (enkel) {
        const r = rader[0]
        if (r.akt && r.p) {
          const m = r.akt.b - r.akt.a
          const b = Math.min(Math.max(SYN, m + 4.6), FOLG)
          mal_ = { x: klem(r.p.x - b * 0.4, r.akt.a - 2.2, r.akt.b + 2.4 - b), b }
        } else mal_ = { x: r.total - 3, b: SYN }
      } else {
        const fra = Math.min(...rader.map((r) => (r.akt ? r.akt.a : r.total)))
        const til = Math.max(...rader.map((r) => r.total))
        const b = Math.max(SYN, til - fra + 6)
        mal_ = { x: fra - 2.5, b }
      }
      kamera.current ??= { ...mal_ }
      const kam = kamera.current
      const spiller = rader.some((r) => r.p)
      const k = redusert ? 1 : 1 - Math.exp(-dt * (spiller ? 6 : 4.5))
      kam.x += (mal_.x - kam.x) * k
      kam.b += (mal_.b - kam.b) * k
      const framme = Math.abs(mal_.x - kam.x) < 0.002 && Math.abs(mal_.b - kam.b) < 0.002
      if (framme) {
        kam.x = mal_.x
        kam.b = mal_.b
      }

      const pxPerM = geo.w / kam.b
      const tilPx = (m: number) => Math.round((m - kam.x) * pxPerM)
      kulisse.tegn(bilde, geo, kam.x * pxPerM, redusert ? 0 : tid)
      kulisse.tegnBane(bilde, geo, tilPx, pxPerM, pxPerM >= 4 ? 1 : 5, pxPerM >= 8 ? 5 : pxPerM >= 2.5 ? 10 : 20)

      const fot = geo.bakke[geo.bakke.length - 1]
      if (mal) tegnMal(bilde, tilPx(MAL_M), fot)

      // Trails: footprints and arcs for a lone runner, flags where every jump landed.
      rader.forEach((r, i) => {
        const gy = geo.bakke[i]
        r.l.hopp.forEach((h, j) => {
          const siste = j === r.l.hopp.length - 1
          let a = 1
          if (siste && r.akt) a = redusert ? 1 : klem((r.t - r.akt.plan.landet) / 0.3)
          if (a <= 0) return
          const start = r.ender[j - 1] ?? 0
          const farge = rgb(NIVAAER[h.nivaa].farge)
          if (enkel) tegnSpor(bilde, planFor(h), start, tilPx, pxPerM, gy, farge, a)
          tegnFlagg(bilde, tilPx(r.ender[j]), gy, farge, a)
        })
      })

      // Runners from the back lane to the front, each with shadow, dust, speed lines and the landing's distance.
      let sover = false
      rader.forEach((r, i) => {
        const gy = geo.bakke[i]
        const pal = PALETTER[r.l.farge % PALETTER.length]
        const sovn = !redusert && !r.akt && tid - vaken.current > SOVN_S + i * 1.7
        sover ||= sovn
        let pose = r.p ?? hvile(r.akt ? r.akt.b : r.total)
        if (!r.p && !redusert) pose = hvileBevegelse(pose, tid + i * 0.83, sovn)
        const x = tilPx(pose.x)
        const y = gy + Math.round(pose.y * pxPerM)
        const lav = 1 / (1 - pose.y * 0.35)
        const sw = Math.max(2, Math.round(4 * lav))
        for (let dx = -sw; dx <= sw; dx++) sett(bilde, x + dx, gy + 1, FARGE.skygge, 0.35)
        for (let dx = -sw + 1; dx < sw; dx++) sett(bilde, x + dx, gy + 2, FARGE.skygge, 0.2)
        if (r.akt && !redusert) tegnStov(bilde, r.akt, r.t, tilPx, pxPerM, gy)
        if (pose.fart > 0.3) {
          const lengde = Math.round(pose.fart * 6)
          for (const [dy, ekstra] of [[-15, 0], [-11, 2], [-7, -1]]) {
            for (let dx = 0; dx < lengde + ekstra; dx++) sett(bilde, x - 7 - dx, y + dy, FARGE.hvit, 0.7 - dx * 0.08)
          }
        }
        tegnFigur(bilde, x, y, pose, pal)
        if (sovn) tegnZzz(bilde, x + 4, y - 24, tid + i * 0.5)
        else if (r.l.deg && !r.p) {
          const opp = !redusert && Math.floor(tid * 2.5) % 2 === 0 ? 1 : 0
          for (let k = 0; k < 3; k++) for (let dx = -2 + k; dx <= 2 - k; dx++) sett(bilde, x + dx, y - 25 + k - opp, FARGE.hvit)
        }
        if (r.akt && !redusert) {
          const etter = r.t - r.akt.plan.landet
          if (etter >= 0 && etter < 1.6) {
            const s = metertekst(r.akt.b - r.akt.a)
            const a = etter < 1.1 ? 1 : 1 - (etter - 1.1) / 0.5
            merkelapp(bilde, s, tilPx(r.akt.b), gy - 31 - Math.round(etter * 5), rgb(NIVAAER[r.akt.h.nivaa].farge), a)
          }
          if (redusert || (!r.p && etter >= 1.6)) {
            r.s.aktivt = null
            vaken.current = tid
          }
        }
      })

      ctx.putImageData(data, 0, 0)

      const fortsatt = rader.some((r) => r.s.aktivt) || !framme
      if (fortsatt) raf = requestAnimationFrame(tegn)
      else if (!redusert) tidtaker = window.setTimeout(() => (raf = requestAnimationFrame(tegn)), document.hidden ? 1000 : sover ? IDLE_MS * 2 : IDLE_MS)
    }

    vekk.current = () => {
      if (raf) return
      window.clearTimeout(tidtaker)
      tidtaker = 0
      forrige = performance.now()
      raf = requestAnimationFrame(tegn)
    }
    vekk.current()
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(tidtaker)
      raf = 0
      vekk.current = () => {}
    }
  }, [w, baner])

  return (
    <div ref={ramme} className="stegern-bane relative w-full overflow-hidden" style={{ height: geo.h * PIKSEL }} role="img" aria-label={etikett}>
      <canvas
        ref={lerret}
        width={geo.w}
        height={geo.h}
        className="absolute top-0 left-1/2 block max-w-none -translate-x-1/2"
        style={{ width: geo.w * PIKSEL, height: geo.h * PIKSEL, imageRendering: "pixelated" }}
      />
      {children}
    </div>
  )
}

/** The 67 m flag: a chequered flag on a pole, the number above. */
function tegnMal(b: Bilde, x: number, gy: number) {
  if (x < -10 || x > b.w + 10) return
  for (let y = gy - 18; y <= gy; y++) sett(b, x, y, FARGE.stang)
  for (let dy = 0; dy < 4; dy++) for (let dx = 1; dx <= 6; dx++) sett(b, x + dx, gy - 18 + dy, ((dx >> 1) + (dy >> 1)) % 2 ? FARGE.rutet : FARGE.hvit)
  tekstMedKant(b, "67", x + 1, gy - 25, FARGE.hvit, FARGE.omriss)
}

/** A small pennant in the tier's colour where a jump landed. */
function tegnFlagg(b: Bilde, x: number, gy: number, farge: number, a: number) {
  for (let y = gy - 8; y <= gy; y++) sett(b, x, y, FARGE.stang, a)
  for (let k = 0; k < 3; k++) for (let dx = 1; dx <= 3 - k; dx++) sett(b, x + dx, gy - 8 + k, farge, a)
}

/** Footprints for the run-up and a dotted arc for each leap. */
function tegnSpor(b: Bilde, plan: Plan, start: number, tilPx: (m: number) => number, pxPerM: number, gy: number, farge: number, a: number) {
  for (const f of plan.faser) {
    if (f.k === "lop") {
      for (let n = 0; n < f.skritt; n++) sett(b, tilPx(start + f.x0 + ((f.x1 - f.x0) * (n + 0.5)) / f.skritt), gy + 1, farge, 0.6 * a)
    } else if (f.k === "fly") {
      const x0 = tilPx(start + f.x0)
      const x1 = tilPx(start + f.x1)
      const h = f.h * pxPerM
      for (let x = x0 + 2; x < x1 - 1; x += 3) {
        const u = (x - x0) / Math.max(1, x1 - x0)
        sett(b, x, Math.round(gy - 8 - h * 4 * u * (1 - u)), farge, 0.55 * a)
      }
    }
  }
}

function tegnStov(b: Bilde, akt: Aktivt, t: number, tilPx: (m: number) => number, pxPerM: number, gy: number) {
  for (const s of akt.plan.stov) {
    if (t < s.t || t >= s.t + STOV_TID) continue
    const alder = (t - s.t) / STOV_TID
    const e = 1 - (1 - alder) ** 2
    const x = tilPx(akt.a + s.x + s.vx * 0.5 * e)
    const y = gy - Math.round((0.06 + 0.22 * alder * s.s) * pxPerM)
    const r = Math.max(1, Math.round((0.5 + 2 * s.s) * Math.sin(Math.PI * Math.min(1, alder * 1.15 + 0.15))))
    const a = 0.8 * (1 - alder ** 3)
    for (let dy = -r + 1; dy < r; dy++) for (let dx = -r + 1; dx < r; dx++) if (dx * dx + dy * dy < r * r) sett(b, x + dx, y + dy, FARGE.stov, a)
  }
}

/** A runner standing still, for the lobby and the podium: a little canvas of its own with the same idle. */
export function Figur({ farge, sover = false, className = "" }: { farge: number; sover?: boolean; className?: string }) {
  const lerret = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = lerret.current?.getContext("2d")
    if (!ctx) return
    const redusert = matchMedia("(prefers-reduced-motion: reduce)").matches
    const data = ctx.createImageData(FIGUR_B, FIGUR_H)
    const bilde: Bilde = { w: FIGUR_B, h: FIGUR_H, d: new Uint32Array(data.data.buffer) }
    const forskyv = farge * 0.77
    let id = 0
    const tegn = () => {
      const tid = performance.now() / 1000 + forskyv
      bilde.d.fill(0)
      const pose = redusert ? hvile(0) : hvileBevegelse(hvile(0), tid, sover)
      tegnFigur(bilde, 11, FIGUR_H - 3, pose, PALETTER[farge % PALETTER.length])
      if (sover && !redusert) tegnZzz(bilde, 15, FIGUR_H - 25, tid)
      ctx.putImageData(data, 0, 0)
      if (!redusert) id = window.setTimeout(tegn, document.hidden ? 1000 : IDLE_MS * (sover ? 2 : 1))
    }
    tegn()
    return () => window.clearTimeout(id)
  }, [farge, sover])
  return (
    <canvas
      ref={lerret}
      width={FIGUR_B}
      height={FIGUR_H}
      aria-hidden="true"
      className={`block ${className}`}
      style={{ imageRendering: "pixelated", aspectRatio: `${FIGUR_B} / ${FIGUR_H}` }}
    />
  )
}

const FIGUR_B = 26
const FIGUR_H = 32
