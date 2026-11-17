"use client"

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { KROPPER, type Figur } from "../lib/duell/figur"
import { stemningsPose, type Stemning } from "./stegern-bane"
import { hvile } from "./stegern-motor"
import { FARGE, fyll, hvileBevegelse, merkelapp, palettFor, PIKSEL, rgb, sett, tegnFigur, tekst, tekstBredde, type Bilde } from "./stegern-piksel"

// The Gjetteløs duel's stage: a pixel quiz studio with a marquee scoreboard, spotlights and one lectern per player.
// Each player's figure stands behind their lectern with their score above, a lamp on the lectern that lights when
// they have locked in a guess, and a cheer or a sulk after each reveal. One small pixel buffer, scaled up crisp;
// a slow idle tick drives the marquee and the figures, and reduced motion draws it once.

export type Studiospiller = {
  id: string
  figur: Figur
  farge: number
  /** The label over the head (the score), or null for none. */
  poeng: string | null
  /** The label's colour. */
  poengFarge?: string
  stemning: Stemning
  /** Has locked in a guess for the open question. */
  svart: boolean
  deg?: boolean
}

const H = 78
const GULV = H - 12
const IDLE_MS = 125
/** Where the spotlight rig hangs, under the scoreboard. */
const RIGG = 26

const VEGG = ["#0a0820", "#110c2e", "#18103b", "#21134a"].map((c) => rgb(c))
const LED = [rgb("#1b2a6b"), rgb("#3a1a5e")]
const SKJERM = rgb("#050a1f")
const SKJERM_KANT = rgb("#38e8ff")
const PAERE = rgb("#fde68a")
const PAERE_AV = rgb("#5b4a1f")
const GULVFARGE = rgb("#120a2a")
const GULV_LYS = rgb("#24124a")
const NEON = rgb("#ff4fd8")
const LYS = rgb("#fff4c2")
const PULT = rgb("#0d1438")
const PULT_KANT = rgb("#2b3a80")
const LAMPE_PA = rgb("#a3e635")
const LAMPE_AV = rgb("#1d2757")
const TEKST = rgb("#e0f7ff")

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)

function tegnStudio(b: Bilde, spillere: Studiospiller[], skjerm: string, lys: string | null, tid: number) {
  const { w } = b
  // Back wall: a dithered gradient with LED columns.
  for (let y = 0; y < GULV; y++) {
    const f = (y / GULV) * (VEGG.length - 1)
    const i = Math.min(VEGG.length - 2, Math.floor(f))
    for (let x = 0; x < w; x++) b.d[y * w + x] = f - i > BAYER[(y & 3) * 4 + (x & 3)] ? VEGG[i + 1] : VEGG[i]
  }
  for (let x = 3; x < w; x += 8) {
    const c = LED[(x >> 3) % 2]
    for (let y = 24; y < GULV - 1; y++) if ((y + (x >> 3)) % 3 !== 0) sett(b, x, y, c, 0.7)
  }
  // The scoreboard with chasing marquee bulbs round it.
  const sw = Math.min(w - 16, Math.max(64, tekstBredde(skjerm) + 14))
  const sx = Math.floor((w - sw) / 2)
  const sy = 4
  const sh = 15
  fyll(b, sx - 2, sy - 2, sw + 4, sh + 4, rgb("#1a1240"))
  fyll(b, sx, sy, sw, sh, SKJERM)
  for (let x = sx; x < sx + sw; x++) {
    sett(b, x, sy, SKJERM_KANT, 0.8)
    sett(b, x, sy + sh - 1, SKJERM_KANT, 0.8)
  }
  for (let y = sy; y < sy + sh; y++) {
    sett(b, sx, y, SKJERM_KANT, 0.8)
    sett(b, sx + sw - 1, y, SKJERM_KANT, 0.8)
  }
  const steg = Math.floor(tid * 6)
  let n = 0
  const paere = (x: number, y: number) => sett(b, x, y, (n++ + steg) % 3 === 0 ? PAERE : PAERE_AV)
  for (let x = sx - 2; x < sx + sw + 2; x += 3) paere(x, sy - 2)
  for (let y = sy + 1; y < sy + sh + 2; y += 3) paere(sx + sw + 1, y)
  for (let x = sx + sw + 1; x >= sx - 2; x -= 3) paere(x, sy + sh + 1)
  for (let y = sy + sh; y > sy - 2; y -= 3) paere(sx - 2, y)
  const tw = tekstBredde(skjerm)
  const tx = sx + Math.floor((sw - tw) / 2)
  // A soft glow under the letters, then the letters.
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) tekst(b, skjerm, tx + dx, sy + 5 + dy, SKJERM_KANT, 0.25)
  tekst(b, skjerm, tx, sy + 5, TEKST)

  // Floor: glossy with a neon edge and a reflection of the edge.
  for (let y = GULV; y < H; y++) for (let x = 0; x < w; x++) b.d[y * w + x] = (x + y * 3) % 11 === 0 ? GULV_LYS : GULVFARGE
  for (let x = 0; x < w; x++) {
    sett(b, x, GULV, NEON)
    sett(b, x, GULV + 1, NEON, 0.35)
  }

  const antall = Math.max(1, spillere.length)
  const avstand = w / antall
  const plass = (i: number) => Math.round(avstand * (i + 0.5))
  // Spotlights from the rig, the lit player's brighter.
  spillere.forEach((s, i) => {
    const x = plass(i)
    const sterk = lys === s.id
    for (let y = RIGG; y < GULV; y++) {
      const halv = 2 + ((y - RIGG) / (GULV - RIGG)) * 8
      for (let dx = -Math.floor(halv); dx <= halv; dx++) sett(b, x + dx, y, LYS, sterk ? 0.16 : 0.05)
    }
    for (let dx = -2; dx <= 2; dx++) sett(b, x + dx, RIGG, sterk ? LYS : rgb("#6b5c9a"))
  })

  spillere.forEach((s, i) => {
    const x = plass(i)
    const fot = GULV - 2
    const t = tid + i * 0.83
    let pose = hvileBevegelse(hvile(0), t, false)
    pose = stemningsPose(pose, s.stemning, t)
    tegnFigur(b, x - 1, fot, pose, palettFor(s.figur, s.farge), s.figur)
    // The lectern in front: a navy desk with the player's colour along its face and the lamp on top.
    const pw = 14
    const px = x - pw / 2
    const topp = GULV - 11
    fyll(b, px, topp, pw, GULV - topp, PULT)
    for (let k = 0; k < pw; k++) sett(b, px + k, topp, PULT_KANT)
    const farge = rgb(KROPPER[s.figur.kropp]?.farge ?? KROPPER[0].farge)
    fyll(b, px + 2, topp + 3, pw - 4, 2, farge)
    fyll(b, px + 2, topp + 6, pw - 4, 1, farge, 0.45)
    const lampe = s.svart ? LAMPE_PA : LAMPE_AV
    fyll(b, x - 1, topp - 1, 2, 1, lampe)
    if (s.svart) for (const [dx, dy] of [[-2, -1], [1, -1], [-1, -2], [0, -2]]) sett(b, x + dx, topp + dy, LAMPE_PA, 0.35)
    if (s.deg) for (let k = 0; k < 3; k++) for (let dx = -2 + k; dx <= 2 - k; dx++) sett(b, x + dx - 1, fot - 30 + k, FARGE.hvit)
    if (s.poeng) merkelapp(b, s.poeng, x, fot - (s.deg ? 38 : 33), rgb(s.poengFarge ?? "#ffffff"))
  })
}

export function Studio({
  spillere,
  skjerm,
  lys = null,
  etikett,
  children,
}: {
  spillere: Studiospiller[]
  /** The text on the scoreboard: upper case, digits and a few signs. */
  skjerm: string
  /** The player in the bright spotlight. */
  lys?: string | null
  etikett: string
  children?: ReactNode
}) {
  const ramme = useRef<HTMLDivElement>(null)
  const lerret = useRef<HTMLCanvasElement>(null)
  const [bredde, setBredde] = useState(360)
  const w = Math.max(60, Math.ceil(bredde / PIKSEL))
  const props = useRef({ spillere, skjerm, lys })
  const tegnNa = useRef<() => void>(() => {})

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
    props.current = { spillere, skjerm, lys }
    tegnNa.current()
  })

  useEffect(() => {
    const ctx = lerret.current?.getContext("2d")
    if (!ctx) return
    const redusert = matchMedia("(prefers-reduced-motion: reduce)").matches
    const data = ctx.createImageData(w, H)
    const bilde: Bilde = { w, h: H, d: new Uint32Array(data.data.buffer) }
    let id = 0
    const tegn = () => {
      const { spillere, skjerm, lys } = props.current
      tegnStudio(bilde, spillere, skjerm, lys, redusert ? 0 : performance.now() / 1000)
      ctx.putImageData(data, 0, 0)
    }
    tegnNa.current = tegn
    const loop = () => {
      tegn()
      if (!redusert) id = window.setTimeout(loop, document.hidden ? 1000 : IDLE_MS)
    }
    loop()
    return () => {
      window.clearTimeout(id)
      tegnNa.current = () => {}
    }
  }, [w])

  return (
    <div ref={ramme} className="relative w-full overflow-hidden" style={{ height: H * PIKSEL }} role="img" aria-label={etikett}>
      <canvas
        ref={lerret}
        width={w}
        height={H}
        className="absolute top-0 left-1/2 block max-w-none -translate-x-1/2"
        style={{ width: w * PIKSEL, height: H * PIKSEL, imageRendering: "pixelated" }}
      />
      {children}
    </div>
  )
}
