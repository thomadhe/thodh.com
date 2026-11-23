// Minimal biometric green face-tracking overlay renderer for Moggern.
// Projects MediaPipe's 478 normalized [0, 1] landmarks onto a <canvas> layered over an `object-cover` <video>,
// accounting for cropping, devicePixelRatio, and horizontal selfie mirroring.
// Intentionally ultra-clean and peripheral so the entire face — especially the eyes — stays unobstructed.

import { PUNKTER, type Punkt3D } from "./poeng"

const KJEVELINJE = [
  127, 234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356,
] as const

const HOYRE_BRYN = [70, 63, 105, 66, 107] as const
const VENSTRE_BRYN = [300, 293, 334, 296, 336] as const

const HOVED_PUNKTER = [
  PUNKTER.hoyreKjeveHjorne,
  PUNKTER.venstreKjeveHjorne,
  PUNKTER.hake,
] as const

const SMAA_PUNKTER = [
  PUNKTER.hoyreOyeYtre,
  PUNKTER.hoyreOyeIndre,
  PUNKTER.venstreOyeYtre,
  PUNKTER.venstreOyeIndre,
  PUNKTER.hoyreKinnben,
  PUNKTER.venstreKinnben,
  PUNKTER.neseTipp,
  PUNKTER.hoyreNeseVinge,
  PUNKTER.venstreNeseVinge,
  PUNKTER.hoyreMunnvik,
  PUNKTER.venstreMunnvik,
] as const

export type VisningsPunkt = { x: number; y: number }

/**
 * Maps a normalized [0, 1] landmark from a video of intrinsic size (videoBredde × videoHoyde)
 * onto a CSS box of size (visningBredde × visningHoyde) rendered with `object-fit: cover`.
 * Pure helper exported for unit testing.
 */
export function kartleggPunktTilVisning(
  punkt: Punkt3D,
  videoBredde: number,
  videoHoyde: number,
  visningBredde: number,
  visningHoyde: number,
  speilet: boolean,
): VisningsPunkt {
  if (videoBredde <= 0 || videoHoyde <= 0 || visningBredde <= 0 || visningHoyde <= 0) {
    return { x: 0, y: 0 }
  }
  const skala = Math.max(visningBredde / videoBredde, visningHoyde / videoHoyde)
  const tegnBredde = videoBredde * skala
  const tegnHoyde = videoHoyde * skala
  const offsetX = (visningBredde - tegnBredde) / 2
  const offsetY = (visningHoyde - tegnHoyde) / 2
  const raaX = punkt.x * tegnBredde + offsetX
  return {
    x: speilet ? visningBredde - raaX : raaX,
    y: punkt.y * tegnHoyde + offsetY,
  }
}

export function tømSporingsLerret(lerret: HTMLCanvasElement | null) {
  if (!lerret) return
  const ctx = lerret.getContext("2d")
  if (!ctx) return
  ctx.clearRect(0, 0, lerret.width, lerret.height)
}

/**
 * Draws a sleek, unobtrusive green biometric reticle over a video tile:
 * hairline jawline trace, delicate brow ridges, outward-only canthal-tilt wings (keeping the eyes
 * completely clear), peripheral cheekbone/jaw width ticks, and tiny landmark points.
 */
export function tegnAnsiktSporing(
  lerret: HTMLCanvasElement,
  video: HTMLVideoElement,
  punkter: readonly Punkt3D[] | null,
  opts: { speilet: boolean; gyldig?: boolean; rizzlerGull?: boolean },
) {
  const visningBredde = lerret.clientWidth
  const visningHoyde = lerret.clientHeight
  if (visningBredde < 2 || visningHoyde < 2) return

  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2)
  const maalBredde = Math.round(visningBredde * dpr)
  const maalHoyde = Math.round(visningHoyde * dpr)
  if (lerret.width !== maalBredde || lerret.height !== maalHoyde) {
    lerret.width = maalBredde
    lerret.height = maalHoyde
  }

  const ctx = lerret.getContext("2d")
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, visningBredde, visningHoyde)

  if (!punkter || punkter.length < 468 || video.videoWidth < 64 || video.videoHeight < 64) return

  const vw = video.videoWidth
  const vh = video.videoHeight
  const p = (idx: number): VisningsPunkt | null => {
    const pt = punkter[idx]
    if (!pt) return null
    return kartleggPunktTilVisning(pt, vw, vh, visningBredde, visningHoyde, opts.speilet)
  }

  const tegnSti = (indekser: readonly number[]) => {
    let startet = false
    ctx.beginPath()
    for (const idx of indekser) {
      const pt = p(idx)
      if (!pt) continue
      if (!startet) {
        ctx.moveTo(pt.x, pt.y)
        startet = true
      } else {
        ctx.lineTo(pt.x, pt.y)
      }
    }
    if (startet) ctx.stroke()
  }

  const tegnLinje = (a: VisningsPunkt | null, b: VisningsPunkt | null) => {
    if (!a || !b) return
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }

  // Draws a small outward-pointing caliper tick on the left/right periphery of the face.
  const tegnSideHake = (a: VisningsPunkt | null, b: VisningsPunkt | null, lengde = 7) => {
    if (!a || !b) return
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.hypot(dx, dy)
    if (dist < 1) return
    const ux = dx / dist
    const uy = dy / dist
    tegnLinje({ x: a.x - ux * 2, y: a.y - uy * 2 }, { x: a.x - ux * (2 + lengde), y: a.y - uy * (2 + lengde) })
    tegnLinje({ x: b.x + ux * 2, y: b.y + uy * 2 }, { x: b.x + ux * (2 + lengde), y: b.y + uy * (2 + lengde) })
  }

  const gull = !!opts.rizzlerGull
  const linjeFarge = gull
    ? "rgba(250, 204, 21, 0.94)"
    : opts.gyldig === false
      ? "rgba(163, 230, 53, 0.52)"
      : "rgba(74, 222, 128, 0.58)"
  const lysFarge = gull ? "rgba(254, 240, 138, 0.92)" : "rgba(190, 242, 100, 0.68)"

  ctx.save()
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  // 1. Hairline jawline trace with subtle glow (turns glowing gold during Rizzler Finisher!)
  ctx.shadowColor = gull ? "rgba(250, 204, 21, 0.85)" : "rgba(74, 222, 128, 0.42)"
  ctx.shadowBlur = gull ? 12 : 3
  ctx.lineWidth = gull ? 2.6 : 1.2
  ctx.strokeStyle = linjeFarge
  tegnSti(KJEVELINJE)

  // 2. Whisper-thin brow ridges
  ctx.shadowBlur = 0
  ctx.lineWidth = 0.9
  ctx.strokeStyle = gull ? "rgba(250, 204, 21, 0.52)" : "rgba(74, 222, 128, 0.36)"
  tegnSti(HOYRE_BRYN)
  tegnSti(VENSTRE_BRYN)

  // 3. Outward-only canthal-tilt wings (starts OUTSIDE the outer eye corner so the eyes stay 100% clear)
  ctx.lineWidth = 1.05
  ctx.strokeStyle = lysFarge
  for (const [indreIdx, ytreIdx] of [
    [PUNKTER.hoyreOyeIndre, PUNKTER.hoyreOyeYtre],
    [PUNKTER.venstreOyeIndre, PUNKTER.venstreOyeYtre],
  ] as const) {
    const indre = p(indreIdx)
    const ytre = p(ytreIdx)
    if (!indre || !ytre) continue
    const dx = ytre.x - indre.x
    const dy = ytre.y - indre.y
    tegnLinje(
      { x: ytre.x + dx * 0.12, y: ytre.y + dy * 0.12 },
      { x: ytre.x + dx * 0.44, y: ytre.y + dy * 0.44 },
    )
  }

  // 4. Subtle peripheral width caliper ticks (cheekbones + gonions + chin/forehead vertical ticks)
  ctx.lineWidth = 0.95
  ctx.strokeStyle = gull ? "rgba(250, 204, 21, 0.65)" : "rgba(74, 222, 128, 0.48)"
  tegnSideHake(p(PUNKTER.hoyreKinnben), p(PUNKTER.venstreKinnben), 7)
  tegnSideHake(p(PUNKTER.hoyreKjeveHjorne), p(PUNKTER.venstreKjeveHjorne), 6)

  const hakePt = p(PUNKTER.hake)
  const pannePt = p(PUNKTER.panneTopp)
  if (hakePt) tegnLinje({ x: hakePt.x, y: hakePt.y + 3 }, { x: hakePt.x, y: hakePt.y + 9 })
  if (pannePt) tegnLinje({ x: pannePt.x, y: pannePt.y - 3 }, { x: pannePt.x, y: pannePt.y - 9 })

  // 5. Delicate micro-dots on key structural landmarks
  ctx.fillStyle = gull ? "rgba(254, 240, 138, 0.72)" : "rgba(190, 242, 100, 0.55)"
  for (const idx of SMAA_PUNKTER) {
    const pt = p(idx)
    if (!pt) continue
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, 1.25, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = lysFarge
  for (const idx of HOVED_PUNKTER) {
    const pt = p(idx)
    if (!pt) continue
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, gull ? 2.6 : 1.8, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}
