// Biometric green face-tracking overlay renderer for Moggern.
// Projects MediaPipe's 478 normalized [0, 1] landmarks onto an <canvas> layered over an `object-cover` <video>,
// accounting for cropping, devicePixelRatio, and horizontal selfie mirroring.

import { PUNKTER, type Punkt3D } from "./poeng"

// Canonical MediaPipe Face Landmarker contours.
const ANSIKT_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
] as const

const KJEVELINJE = [
  127, 234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356,
] as const

const HOYRE_OYE = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7] as const
const VENSTRE_OYE = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249] as const

const HOYRE_BRYN = [70, 63, 105, 66, 107] as const
const VENSTRE_BRYN = [300, 293, 334, 296, 336] as const

const NESERYGG = [168, 6, 197, 195, 5, 4, 1, 2] as const
const MUNN_YTRE = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146] as const

const KNUTEPUNKTER = [
  PUNKTER.panneTopp,
  PUNKTER.brynMidt,
  PUNKTER.neseTipp,
  PUNKTER.neseBunn,
  PUNKTER.hake,
  PUNKTER.hoyreOyeYtre,
  PUNKTER.hoyreOyeIndre,
  PUNKTER.venstreOyeYtre,
  PUNKTER.venstreOyeIndre,
  PUNKTER.hoyreKinnben,
  PUNKTER.venstreKinnben,
  PUNKTER.hoyreKjeveHjorne,
  PUNKTER.venstreKjeveHjorne,
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
 * Draws glowing green biometric tracking lines over a video tile:
 * face oval, sharp jawline + gonial markers, cheekbone & jaw width calipers,
 * eye contours + canthal tilt vectors + iris rings, brow ridges, nose bridge, lips,
 * and facial-thirds symmetry axis.
 */
export function tegnAnsiktSporing(
  lerret: HTMLCanvasElement,
  video: HTMLVideoElement,
  punkter: readonly Punkt3D[] | null,
  opts: { speilet: boolean; gyldig?: boolean },
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

  const tegnSti = (indekser: readonly number[], lukk = false) => {
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
    if (startet) {
      if (lukk) ctx.closePath()
      ctx.stroke()
    }
  }

  const tegnLinje = (a: VisningsPunkt | null, b: VisningsPunkt | null) => {
    if (!a || !b) return
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }

  const hovedFarge = opts.gyldig === false ? "#a3e635" : "#4ade80"
  const lysFarge = "#bef264"

  ctx.save()
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  // 1. Subtle biometric reference calipers (symmetry centerline, cheekbone width, jaw width, facial thirds ticks)
  ctx.setLineDash([4, 4])
  ctx.lineWidth = 1
  ctx.strokeStyle = "rgba(74, 222, 128, 0.36)"
  tegnSti([PUNKTER.panneTopp, PUNKTER.brynMidt, PUNKTER.neseRot, PUNKTER.neseTipp, PUNKTER.neseBunn, PUNKTER.overleppeTopp, PUNKTER.hake])
  tegnLinje(p(PUNKTER.hoyreKinnben), p(PUNKTER.venstreKinnben))
  tegnLinje(p(PUNKTER.hoyreKjeveHjorne), p(PUNKTER.venstreKjeveHjorne))
  tegnLinje(p(PUNKTER.hoyreNeseVinge), p(PUNKTER.venstreNeseVinge))

  // Horizontal tick marks along the symmetry axis for the facial thirds (forehead, brow, nose base, chin)
  for (const idx of [PUNKTER.panneTopp, PUNKTER.brynMidt, PUNKTER.neseBunn, PUNKTER.hake]) {
    const pt = p(idx)
    if (!pt) continue
    ctx.setLineDash([])
    ctx.lineWidth = 1.25
    ctx.strokeStyle = "rgba(190, 242, 100, 0.55)"
    ctx.beginPath()
    ctx.moveTo(pt.x - 10, pt.y)
    ctx.lineTo(pt.x + 10, pt.y)
    ctx.stroke()
  }

  // 2. Soft face oval silhouette
  ctx.setLineDash([])
  ctx.lineWidth = 1.25
  ctx.strokeStyle = "rgba(74, 222, 128, 0.38)"
  tegnSti(ANSIKT_OVAL, true)

  // 3. Glow pass for primary tracked anatomy (jawline, eyes, brows, nose, mouth)
  ctx.shadowColor = "rgba(74, 222, 128, 0.7)"
  ctx.shadowBlur = 8

  // Highlighted jawline contour
  ctx.lineWidth = 2.2
  ctx.strokeStyle = hovedFarge
  tegnSti(KJEVELINJE, false)

  // Eye contours & brow ridges
  ctx.lineWidth = 1.6
  ctx.strokeStyle = hovedFarge
  tegnSti(HOYRE_OYE, true)
  tegnSti(VENSTRE_OYE, true)
  tegnSti(HOYRE_BRYN, false)
  tegnSti(VENSTRE_BRYN, false)

  // Nose bridge & outer lip contour
  ctx.lineWidth = 1.4
  ctx.strokeStyle = "rgba(74, 222, 128, 0.85)"
  tegnSti(NESERYGG, false)
  tegnSti(MUNN_YTRE, true)

  // 4. Canthal tilt vectors (inner → outer eye corner, extended slightly outward) + iris rings
  ctx.lineWidth = 1.5
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
    tegnLinje(indre, { x: ytre.x + dx * 0.28, y: ytre.y + dy * 0.28 })
  }

  // Subtle IPD line + iris target rings
  const rIris = p(PUNKTER.hoyreIris)
  const lIris = p(PUNKTER.venstreIris)
  if (rIris && lIris) {
    ctx.setLineDash([2, 3])
    ctx.lineWidth = 1
    ctx.strokeStyle = "rgba(190, 242, 100, 0.55)"
    tegnLinje(rIris, lIris)
    ctx.setLineDash([])
    ctx.lineWidth = 1.5
    ctx.strokeStyle = lysFarge
    for (const iris of [rIris, lIris]) {
      ctx.beginPath()
      ctx.arc(iris.x, iris.y, 4.5, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  // 5. Crisp glowing nodes on key landmarks (gonions, cheekbones, corners, chin)
  ctx.shadowBlur = 6
  ctx.fillStyle = lysFarge
  for (const idx of KNUTEPUNKTER) {
    const pt = p(idx)
    if (!pt) continue
    const erGonion = idx === PUNKTER.hoyreKjeveHjorne || idx === PUNKTER.venstreKjeveHjorne || idx === PUNKTER.hake
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, erGonion ? 3.2 : 2.1, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}
