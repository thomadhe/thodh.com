// Deterministic, transparent 0–10 face-landmark scoring for Moggern (pure math-for-fun, zero scientific basis).
//
// Pipeline per video frame:
//   1. Extract head pose (yaw, pitch, roll) from MediaPipe's 4×4 facial transformation matrix (or geometric fallback).
//   2. Reject non-frontal frames (|yaw| > 14°, |pitch| > 14°, |roll| > 18°) and frames where the face is too small/large.
//   3. Convert normalized [0, 1] landmarks to pixel aspect-ratio space, compute eye centers & interpupillary distance (IPD).
//   4. Rotate all landmarks around the eye midpoint by -roll so the eye line is horizontal, and divide by IPD.
//      Because horizontal direction is canonicalized from the image's left/right eye, scores are invariant to mirroring.
//   5. Compute 7 sub-scores on 0–10 by distance from target proportion intervals, and combine with fixed weights.
//   6. Across the ~10 s duel, average valid frames with a 10% trimmed mean so single-frame jitter or blinks do not skew it.

export type Punkt3D = {
  x: number
  y: number
  z?: number
}

export type HodeVinkel = {
  /** Horizontal head turn in degrees (0 = straight ahead). */
  yaw: number
  /** Vertical nod in degrees (0 = level). */
  pitch: number
  /** Head tilt in degrees (0 = eyes horizontal). */
  roll: number
}

export type DelpoengId =
  | "symmetri"
  | "oyevinkel"
  | "kjevelinje"
  | "midtansikt"
  | "ansiktstredjedeler"
  | "oyeavstand"
  | "harmoni"

export type DelpoengKart = Record<DelpoengId, number>

export type DelpoengInfo = {
  id: DelpoengId
  navn: string
  vekt: number
  kortForklaring: string
}

export const DELPOENG_LISTE: readonly DelpoengInfo[] = [
  {
    id: "symmetri",
    navn: "Symmetri",
    vekt: 0.2,
    kortForklaring: "Speilte punkter på venstre og høyre side rundt midtlinjen.",
  },
  {
    id: "kjevelinje",
    navn: "Kjevelinje",
    vekt: 0.17,
    kortForklaring: "Kjevebredde mot kinnben og vinkelen langs kjevekonturen.",
  },
  {
    id: "oyevinkel",
    navn: "Øyevinkel",
    vekt: 0.15,
    kortForklaring: "Vinkelen fra indre til ytre øyekrok relativt til ansiktets horisont.",
  },
  {
    id: "midtansikt",
    navn: "Midtansikt",
    vekt: 0.13,
    kortForklaring: "Forholdet mellom pupillavstand og avstanden fra øyne til overleppe.",
  },
  {
    id: "ansiktstredjedeler",
    navn: "Ansiktstredjedeler",
    vekt: 0.13,
    kortForklaring: "Balanse mellom panne, nese og hake langs midtlinjen.",
  },
  {
    id: "oyeavstand",
    navn: "Øyeavstand",
    vekt: 0.11,
    kortForklaring: "Avstand mellom øynene mot øyebredde og ansiktsbredde (femtedeler).",
  },
  {
    id: "harmoni",
    navn: "Harmoni",
    vekt: 0.11,
    kortForklaring: "Helhetlig balanse mellom bredde/høyde, munn/nese og jevne delpoeng.",
  },
] as const

export const DELPOENG_VEKTER: Record<DelpoengId, number> = {
  symmetri: 0.2,
  kjevelinje: 0.17,
  oyevinkel: 0.15,
  midtansikt: 0.13,
  ansiktstredjedeler: 0.13,
  oyeavstand: 0.11,
  harmoni: 0.11,
}

/** Pose & framing gates for counting a frame as valid. */
export const MAKS_YAW_GRADER = 14
export const MAKS_PITCH_GRADER = 14
export const MAKS_ROLL_GRADER = 18
export const MIN_IPD_ANDEL = 0.08
export const MAKS_IPD_ANDEL = 0.52
/** Minimum valid frontal frames needed over the ~10 s capture window. */
export const MIN_GYLDIGE_RAMMER = 12

// Canonical MediaPipe Face Landmarker (468 / 478) indices.
export const PUNKTER = {
  panneTopp: 10,
  brynMidt: 9,
  neseRot: 168,
  neseTipp: 1,
  neseBunn: 2,
  overleppeTopp: 0,
  munnMidt: 13,
  hake: 152,

  // Subject's right side (image left on unmirrored camera)
  hoyreOyeYtre: 33,
  hoyreOyeIndre: 133,
  hoyreOyeTopp: 159,
  hoyreOyeBunn: 145,
  hoyreIris: 468,
  hoyreKinnben: 234,
  hoyreKjeveOvre: 132,
  hoyreKjeveHjorne: 172,
  hoyreKjeveNedre: 136,
  hoyreNeseVinge: 129,
  hoyreMunnvik: 61,
  hoyreBrynYtre: 70,
  hoyreBrynMidt: 105,
  hoyreBrynIndre: 107,

  // Subject's left side (image right on unmirrored camera)
  venstreOyeYtre: 263,
  venstreOyeIndre: 362,
  venstreOyeTopp: 386,
  venstreOyeBunn: 374,
  venstreIris: 473,
  venstreKinnben: 454,
  venstreKjeveOvre: 361,
  venstreKjeveHjorne: 397,
  venstreKjeveNedre: 365,
  venstreNeseVinge: 358,
  venstreMunnvik: 291,
  venstreBrynYtre: 300,
  venstreBrynMidt: 334,
  venstreBrynIndre: 336,
} as const

/** Mirrored landmark pairs used for the symmetry sub-score. */
export const SYMMETRI_PAR: readonly (readonly [number, number])[] = [
  [PUNKTER.hoyreOyeYtre, PUNKTER.venstreOyeYtre],
  [PUNKTER.hoyreOyeIndre, PUNKTER.venstreOyeIndre],
  [PUNKTER.hoyreOyeTopp, PUNKTER.venstreOyeTopp],
  [PUNKTER.hoyreOyeBunn, PUNKTER.venstreOyeBunn],
  [PUNKTER.hoyreBrynYtre, PUNKTER.venstreBrynYtre],
  [PUNKTER.hoyreBrynMidt, PUNKTER.venstreBrynMidt],
  [PUNKTER.hoyreBrynIndre, PUNKTER.venstreBrynIndre],
  [PUNKTER.hoyreKinnben, PUNKTER.venstreKinnben],
  [PUNKTER.hoyreKjeveOvre, PUNKTER.venstreKjeveOvre],
  [PUNKTER.hoyreKjeveHjorne, PUNKTER.venstreKjeveHjorne],
  [PUNKTER.hoyreKjeveNedre, PUNKTER.venstreKjeveNedre],
  [PUNKTER.hoyreNeseVinge, PUNKTER.venstreNeseVinge],
  [PUNKTER.hoyreMunnvik, PUNKTER.venstreMunnvik],
  [116, 345], // outer cheek
] as const

export type Veiledning = "ingen-ansikt" | "for-langt-unna" | "for-naerme" | "snu-rett" | "vipp-rett" | "ok"

export type RammeResultat = {
  gyldig: boolean
  veiledning: Veiledning
  vinkel: HodeVinkel
  /** Interpupillary distance as a fraction of the shorter image edge. */
  ipdAndel: number
  delpoeng?: DelpoengKart
  total?: number
}

export type KvalitetStats = {
  antallRammer: number
  gyldigeRammer: number
  snittAbsYaw: number
  snittAbsPitch: number
  snittIpdAndel: number
  /** Score standard deviation across valid frames (lower = steadier pose). */
  stabilitet: number
}

export type SamletMaaling = {
  ok: boolean
  total: number
  delpoeng: DelpoengKart
  kvalitet: KvalitetStats
}

const RAD_TIL_GRADER = 180 / Math.PI

const avrund = (n: number, desimaler = 1) => {
  const f = 10 ** desimaler
  return Math.round(n * f) / f
}

const klem = (n: number, min: number, maks: number) => Math.max(min, Math.min(maks, n))

/**
 * Smooth target-range scoring function returning 0.0–10.0.
 * Inside [idealMin, idealMax], scores 9.2–10.0 (peaking at the midpoint).
 * Outside the range, falls off smoothly with Gaussian decay controlled by `spredning`.
 */
export function maalScore(verdi: number, idealMin: number, idealMax: number, spredning: number): number {
  if (!Number.isFinite(verdi) || spredning <= 0) return 0
  if (verdi >= idealMin && verdi <= idealMax) {
    const halv = (idealMax - idealMin) / 2
    if (halv <= 0) return 10
    const midt = (idealMin + idealMax) / 2
    const rel = Math.abs(verdi - midt) / halv
    return avrund(klem(10 - 0.8 * rel * rel, 0, 10), 2)
  }
  const avvik = verdi < idealMin ? idealMin - verdi : verdi - idealMax
  const norm = avvik / spredning
  const poeng = 9.2 * Math.exp(-0.675 * norm * norm)
  return avrund(klem(poeng, 0, 10), 2)
}

/**
 * Extracts yaw, pitch, and roll in degrees from a MediaPipe 4×4 facial transformation matrix.
 * MediaPipe's Matrix stores 16 floats in column-major order (OpenGL convention), where
 * R[row][col] = m[col * 4 + row]. For row-major matrices (where translation sits at m[3], m[7], m[11]),
 * we automatically read R[row][col] = m[row * 4 + col].
 */
export function vinkelFraMatrise(matrise: ArrayLike<number>): HodeVinkel {
  if (matrise.length < 16) return { yaw: 0, pitch: 0, roll: 0 }

  // Detect whether translation is in the last column (row-major: m[3], m[7], m[11]) or last row (column-major: m[12], m[13], m[14]).
  const kolonneTransl = Math.abs(matrise[12]) + Math.abs(matrise[13]) + Math.abs(matrise[14])
  const radTransl = Math.abs(matrise[3]) + Math.abs(matrise[7]) + Math.abs(matrise[11])
  const erRadMajor = radTransl > kolonneTransl + 1e-3

  const r = (row: number, col: number) => (erRadMajor ? matrise[row * 4 + col] : matrise[col * 4 + row])

  const r00 = r(0, 0)
  const r10 = r(1, 0)
  const r02 = r(0, 2)
  const r12 = r(1, 2)
  const r22 = r(2, 2)

  // Decompose rotation into yaw (Y), pitch (X), roll (Z) around frontal identity matrix.
  const yaw = Math.atan2(r02, r22) * RAD_TIL_GRADER
  const pitch = Math.atan2(-r12, Math.hypot(r02, r22)) * RAD_TIL_GRADER
  const roll = Math.atan2(r10, r00) * RAD_TIL_GRADER

  return {
    yaw: avrund(yaw, 1),
    pitch: avrund(pitch, 1),
    roll: avrund(roll, 1),
  }
}

/**
 * Geometric fallback for estimating yaw, pitch, and roll when no transformation matrix is supplied.
 */
export function vinkelFraPunkter(punkter: readonly Punkt3D[], bredde = 1, hoyde = 1): HodeVinkel {
  const rYtre = punkter[PUNKTER.hoyreOyeYtre]
  const lYtre = punkter[PUNKTER.venstreOyeYtre]
  const nese = punkter[PUNKTER.neseTipp]
  const panne = punkter[PUNKTER.panneTopp]
  const hake = punkter[PUNKTER.hake]
  if (!rYtre || !lYtre || !nese || !panne || !hake) return { yaw: 0, pitch: 0, roll: 0 }

  const ax = rYtre.x * bredde
  const ay = rYtre.y * hoyde
  const bx = lYtre.x * bredde
  const by = lYtre.y * hoyde

  const venstre = ax <= bx ? { x: ax, y: ay } : { x: bx, y: by }
  const hoyre = ax <= bx ? { x: bx, y: by } : { x: ax, y: ay }
  const roll = Math.atan2(hoyre.y - venstre.y, hoyre.x - venstre.x) * RAD_TIL_GRADER

  const oyeMidtX = (venstre.x + hoyre.x) / 2
  const breddeOye = Math.max(1e-6, Math.hypot(hoyre.x - venstre.x, hoyre.y - venstre.y))
  const neseX = nese.x * bredde
  const yaw = klem(((neseX - oyeMidtX) / (breddeOye * 0.5)) * 35, -60, 60)

  const oyeMidtY = (venstre.y + hoyre.y) / 2
  const ansiktHoyde = Math.max(1e-6, (hake.y - panne.y) * hoyde)
  const neseRel = (nese.y * hoyde - oyeMidtY) / ansiktHoyde
  // Neutral nose tip sits ~0.23 of total face height below the eye line.
  const pitch = klem((neseRel - 0.23) * 90, -45, 45)

  return { yaw: avrund(yaw, 1), pitch: avrund(pitch, 1), roll: avrund(roll, 1) }
}

type Punkt2D = { x: number; y: number }

const avstand2D = (a: Punkt2D, b: Punkt2D) => Math.hypot(a.x - b.x, a.y - b.y)

/** Interior angle in degrees at vertex `b` formed by segments b→a and b→c. */
function vinkelGrader(a: Punkt2D, b: Punkt2D, c: Punkt2D): number {
  const v1x = a.x - b.x
  const v1y = a.y - b.y
  const v2x = c.x - b.x
  const v2y = c.y - b.y
  const l1 = Math.hypot(v1x, v1y)
  const l2 = Math.hypot(v2x, v2y)
  if (l1 < 1e-6 || l2 < 1e-6) return 180
  const cos = klem((v1x * v2x + v1y * v2y) / (l1 * l2), -1, 1)
  return Math.acos(cos) * RAD_TIL_GRADER
}

function oyeSentrum(punkter: readonly Punkt3D[], side: "hoyre" | "venstre", bredde: number, hoyde: number): Punkt2D {
  const irisIdx = side === "hoyre" ? PUNKTER.hoyreIris : PUNKTER.venstreIris
  const iris = punkter[irisIdx]
  if (iris) return { x: iris.x * bredde, y: iris.y * hoyde }

  const ytre = punkter[side === "hoyre" ? PUNKTER.hoyreOyeYtre : PUNKTER.venstreOyeYtre]
  const indre = punkter[side === "hoyre" ? PUNKTER.hoyreOyeIndre : PUNKTER.venstreOyeIndre]
  const topp = punkter[side === "hoyre" ? PUNKTER.hoyreOyeTopp : PUNKTER.venstreOyeTopp]
  const bunn = punkter[side === "hoyre" ? PUNKTER.hoyreOyeBunn : PUNKTER.venstreOyeBunn]
  return {
    x: ((ytre.x + indre.x + topp.x + bunn.x) / 4) * bredde,
    y: ((ytre.y + indre.y + topp.y + bunn.y) / 4) * hoyde,
  }
}

/**
 * Evaluates a single video frame's Face Landmarker output.
 * Normalizes by IPD, corrects head roll, checks frontal pose, and computes all 7 sub-scores.
 */
export function vurderRamme(
  punkter: readonly Punkt3D[] | null | undefined,
  matrise?: ArrayLike<number> | null,
  bredde = 640,
  hoyde = 480,
): RammeResultat {
  if (!punkter || punkter.length < 468) {
    return {
      gyldig: false,
      veiledning: "ingen-ansikt",
      vinkel: { yaw: 0, pitch: 0, roll: 0 },
      ipdAndel: 0,
    }
  }

  const b = bredde > 0 ? bredde : 640
  const h = hoyde > 0 ? hoyde : 480
  const kortSide = Math.min(b, h)

  const hoyreOye = oyeSentrum(punkter, "hoyre", b, h)
  const venstreOye = oyeSentrum(punkter, "venstre", b, h)
  const ipd = avstand2D(hoyreOye, venstreOye)
  const ipdAndel = avrund(ipd / kortSide, 3)

  const vinkel = matrise && matrise.length >= 16 ? vinkelFraMatrise(matrise) : vinkelFraPunkter(punkter, b, h)

  // Always compute roll directly from the two eyes for canonical rotation (and check tilt gate).
  const speilet = hoyreOye.x > venstreOye.x
  const bildVenstre = speilet ? venstreOye : hoyreOye
  const bildHoyre = speilet ? hoyreOye : venstreOye
  const oyeRollRad = Math.atan2(bildHoyre.y - bildVenstre.y, bildHoyre.x - bildVenstre.x)
  const oyeRollGrader = avrund(oyeRollRad * RAD_TIL_GRADER, 1)
  const effektivVinkel: HodeVinkel = {
    yaw: vinkel.yaw,
    pitch: vinkel.pitch,
    roll: Math.abs(oyeRollGrader) > Math.abs(vinkel.roll) ? oyeRollGrader : vinkel.roll,
  }

  if (ipd < 1e-3 || ipdAndel < MIN_IPD_ANDEL) {
    return { gyldig: false, veiledning: "for-langt-unna", vinkel: effektivVinkel, ipdAndel }
  }
  if (ipdAndel > MAKS_IPD_ANDEL) {
    return { gyldig: false, veiledning: "for-naerme", vinkel: effektivVinkel, ipdAndel }
  }
  if (Math.abs(effektivVinkel.yaw) > MAKS_YAW_GRADER || Math.abs(effektivVinkel.pitch) > MAKS_PITCH_GRADER) {
    return { gyldig: false, veiledning: "snu-rett", vinkel: effektivVinkel, ipdAndel }
  }
  if (Math.abs(effektivVinkel.roll) > MAKS_ROLL_GRADER) {
    return { gyldig: false, veiledning: "vipp-rett", vinkel: effektivVinkel, ipdAndel }
  }

  // Transform landmarks into roll-corrected, IPD-normalized canonical face coordinates:
  // eye midpoint = (0, 0), eyes at (-0.5, 0) and (+0.5, 0), +y pointing down.
  const midtX = (hoyreOye.x + venstreOye.x) / 2
  const midtY = (hoyreOye.y + venstreOye.y) / 2
  const cos = Math.cos(-oyeRollRad)
  const sin = Math.sin(-oyeRollRad)
  const xTegn = speilet ? -1 : 1

  const norm = (idx: number): Punkt2D => {
    const p = punkter[idx]
    const dx = p.x * b - midtX
    const dy = p.y * h - midtY
    const rx = (dx * cos - dy * sin) / ipd
    const ry = (dx * sin + dy * cos) / ipd
    return { x: rx * xTegn, y: ry }
  }

  // 1. SYMMETRI: average mirrored deviation across 14 canonical left/right landmark pairs.
  let symSum = 0
  for (const [rIdx, lIdx] of SYMMETRI_PAR) {
    const rP = norm(rIdx)
    const lP = norm(lIdx)
    // Perfect mirror across x = 0 means rP.x === -lP.x and rP.y === lP.y.
    symSum += Math.hypot(rP.x + lP.x, rP.y - lP.y)
  }
  const snittAsym = symSum / SYMMETRI_PAR.length
  const symmetri = maalScore(snittAsym, 0, 0.038, 0.095)

  // 2. ØYEVINKEL (Canthal tilt): angle from inner corner to outer corner relative to face horizontal.
  // Positive when outer corner sits higher (smaller y) than inner corner.
  const rIndre = norm(PUNKTER.hoyreOyeIndre)
  const rYtre = norm(PUNKTER.hoyreOyeYtre)
  const lIndre = norm(PUNKTER.venstreOyeIndre)
  const lYtre = norm(PUNKTER.venstreOyeYtre)

  const tiltHoyre = Math.atan2(rIndre.y - rYtre.y, Math.max(1e-5, Math.abs(rYtre.x - rIndre.x))) * RAD_TIL_GRADER
  const tiltVenstre = Math.atan2(lIndre.y - lYtre.y, Math.max(1e-5, Math.abs(lYtre.x - lIndre.x))) * RAD_TIL_GRADER
  const snittTilt = (tiltHoyre + tiltVenstre) / 2
  const oyevinkel = maalScore(snittTilt, 3.0, 7.5, 6.2)

  // 3. KJEVELINJE: bigonial/bizygomatic ratio + gonial contour sharpness.
  const rKinn = norm(PUNKTER.hoyreKinnben)
  const lKinn = norm(PUNKTER.venstreKinnben)
  const rKjeve = norm(PUNKTER.hoyreKjeveHjorne)
  const lKjeve = norm(PUNKTER.venstreKjeveHjorne)
  const rOvre = norm(PUNKTER.hoyreKjeveOvre)
  const lOvre = norm(PUNKTER.venstreKjeveOvre)
  const hake = norm(PUNKTER.hake)

  const kinnBredde = Math.max(1e-5, avstand2D(rKinn, lKinn))
  const kjeveBredde = avstand2D(rKjeve, lKjeve)
  const kjeveForhold = kjeveBredde / kinnBredde

  const kjeveVinkelH = vinkelGrader(rOvre, rKjeve, hake)
  const kjeveVinkelV = vinkelGrader(lOvre, lKjeve, hake)
  const snittKjeveVinkel = (kjeveVinkelH + kjeveVinkelV) / 2

  const kjeveRatioPoeng = maalScore(kjeveForhold, 0.76, 0.86, 0.13)
  const kjeveVinkelPoeng = maalScore(snittKjeveVinkel, 122, 136, 17)
  const kjevelinje = avrund(0.55 * kjeveRatioPoeng + 0.45 * kjeveVinkelPoeng, 2)

  // 4. MIDTANSIKT: IPD / distance from eye line (y = 0) to upper lip.
  const overleppe = norm(PUNKTER.overleppeTopp)
  const oyeTilLeppe = Math.max(1e-5, overleppe.y)
  const midtansiktForhold = 1 / oyeTilLeppe
  const midtansikt = maalScore(midtansiktForhold, 0.94, 1.08, 0.21)

  // 5. ANSIKTSTREDJEDELER: forehead (10->9), nose (9->2), lower face (2->152) shares.
  const panne = norm(PUNKTER.panneTopp)
  const bryn = norm(PUNKTER.brynMidt)
  const neseBunn = norm(PUNKTER.neseBunn)
  const totalHoyde = Math.max(1e-5, hake.y - panne.y)
  const t1 = Math.max(0, bryn.y - panne.y) / totalHoyde
  const t2 = Math.max(0, neseBunn.y - bryn.y) / totalHoyde
  const t3 = Math.max(0, hake.y - neseBunn.y) / totalHoyde
  // Target shares calibrated for MediaPipe's forehead landmark 10 (slightly below hairline).
  const tredjedelAvvik = (Math.abs(t1 - 0.29) + Math.abs(t2 - 0.35) + Math.abs(t3 - 0.36)) / 3
  const ansiktstredjedeler = maalScore(tredjedelAvvik, 0, 0.022, 0.055)

  // 6. ØYEAVSTAND (Facial fifths): intercanthal / eye width + eye width / face width.
  const indreAvstand = Math.abs(lIndre.x - rIndre.x)
  const breddeH = avstand2D(rYtre, rIndre)
  const breddeV = avstand2D(lYtre, lIndre)
  const snittOyeBredde = Math.max(1e-5, (breddeH + breddeV) / 2)
  const oyeFemtedelIndre = indreAvstand / snittOyeBredde
  const oyeFemtedelBredde = snittOyeBredde / kinnBredde

  const oyeAvstand1 = maalScore(oyeFemtedelIndre, 0.94, 1.12, 0.27)
  const oyeAvstand2 = maalScore(oyeFemtedelBredde, 0.19, 0.23, 0.048)
  const oyeavstand = avrund(0.55 * oyeAvstand1 + 0.45 * oyeAvstand2, 2)

  // 7. HARMONI: fWHR + mouth-to-nose width + consistency across the 6 structural scores.
  const fwhrHoyde = Math.max(1e-5, overleppe.y - bryn.y)
  const fwhr = kinnBredde / fwhrHoyde
  const neseBredde = Math.max(1e-5, avstand2D(norm(PUNKTER.hoyreNeseVinge), norm(PUNKTER.venstreNeseVinge)))
  const munnBredde = avstand2D(norm(PUNKTER.hoyreMunnvik), norm(PUNKTER.venstreMunnvik))
  const munnNeseForhold = munnBredde / neseBredde

  const fwhrPoeng = maalScore(fwhr, 1.72, 2.0, 0.32)
  const munnNesePoeng = maalScore(munnNeseForhold, 1.38, 1.66, 0.34)
  const seksDelpoeng = [symmetri, oyevinkel, kjevelinje, midtansikt, ansiktstredjedeler, oyeavstand]
  const snittSeks = seksDelpoeng.reduce((a, x) => a + x, 0) / seksDelpoeng.length
  const spredningSeks = Math.sqrt(seksDelpoeng.reduce((a, x) => a + (x - snittSeks) ** 2, 0) / seksDelpoeng.length)
  const balansePoeng = maalScore(spredningSeks, 0, 1.1, 2.2)

  const harmoni = avrund(0.4 * fwhrPoeng + 0.35 * munnNesePoeng + 0.25 * balansePoeng, 2)

  const delpoeng: DelpoengKart = {
    symmetri: avrund(symmetri, 1),
    oyevinkel: avrund(oyevinkel, 1),
    kjevelinje: avrund(kjevelinje, 1),
    midtansikt: avrund(midtansikt, 1),
    ansiktstredjedeler: avrund(ansiktstredjedeler, 1),
    oyeavstand: avrund(oyeavstand, 1),
    harmoni: avrund(harmoni, 1),
  }

  const total = regnTotal(delpoeng)

  return {
    gyldig: true,
    veiledning: "ok",
    vinkel: effektivVinkel,
    ipdAndel,
    delpoeng,
    total,
  }
}

/** Weighted total score (0.0–10.0) from the 7 sub-scores. */
export function regnTotal(delpoeng: DelpoengKart): number {
  let sum = 0
  for (const info of DELPOENG_LISTE) {
    sum += klem(delpoeng[info.id], 0, 10) * info.vekt
  }
  return avrund(klem(sum, 0, 10), 1)
}

/** Trimmed mean: drops 10% from each tail when n >= 10 to ignore occasional blink/jitter outliers. */
export function trimmetSnitt(verdier: readonly number[]): number {
  if (verdier.length === 0) return 0
  const sortert = [...verdier].sort((a, b) => a - b)
  const kutt = sortert.length >= 10 ? Math.floor(sortert.length * 0.1) : 0
  const utsnitt = sortert.slice(kutt, sortert.length - kutt)
  const sum = utsnitt.reduce((a, x) => a + x, 0)
  return sum / utsnitt.length
}

/**
 * Aggregates all evaluated frames from a ~10 s duel capture into a final deterministic score.
 * Requires at least `minGyldige` frontal frames (default MIN_GYLDIGE_RAMMER).
 */
export function aggregerRammer(rammer: readonly RammeResultat[], minGyldige = MIN_GYLDIGE_RAMMER): SamletMaaling {
  const gyldige = rammer.filter((r): r is RammeResultat & { delpoeng: DelpoengKart; total: number } => r.gyldig && !!r.delpoeng && typeof r.total === "number")
  const medAnsikt = rammer.filter((r) => r.veiledning !== "ingen-ansikt")

  const snittAbsYaw = medAnsikt.length ? avrund(medAnsikt.reduce((a, r) => a + Math.abs(r.vinkel.yaw), 0) / medAnsikt.length, 1) : 0
  const snittAbsPitch = medAnsikt.length ? avrund(medAnsikt.reduce((a, r) => a + Math.abs(r.vinkel.pitch), 0) / medAnsikt.length, 1) : 0
  const snittIpdAndel = medAnsikt.length ? avrund(medAnsikt.reduce((a, r) => a + r.ipdAndel, 0) / medAnsikt.length, 3) : 0

  const totaler = gyldige.map((r) => r.total)
  const snittTotal = totaler.length ? totaler.reduce((a, x) => a + x, 0) / totaler.length : 0
  const stabilitet = totaler.length
    ? avrund(Math.sqrt(totaler.reduce((a, x) => a + (x - snittTotal) ** 2, 0) / totaler.length), 2)
    : 0

  const kvalitet: KvalitetStats = {
    antallRammer: rammer.length,
    gyldigeRammer: gyldige.length,
    snittAbsYaw,
    snittAbsPitch,
    snittIpdAndel,
    stabilitet,
  }

  if (gyldige.length < minGyldige) {
    return {
      ok: false,
      total: 0,
      delpoeng: {
        symmetri: 0,
        oyevinkel: 0,
        kjevelinje: 0,
        midtansikt: 0,
        ansiktstredjedeler: 0,
        oyeavstand: 0,
        harmoni: 0,
      },
      kvalitet,
    }
  }

  const delpoeng = {} as DelpoengKart
  for (const info of DELPOENG_LISTE) {
    delpoeng[info.id] = avrund(trimmetSnitt(gyldige.map((r) => r.delpoeng[info.id])), 1)
  }

  return {
    ok: true,
    total: regnTotal(delpoeng),
    delpoeng,
    kvalitet,
  }
}

/** Returns the sub-score ids sorted from weakest to strongest (deterministic tie-break by DELPOENG_LISTE order). */
export function svakesteDelpoeng(delpoeng: DelpoengKart): DelpoengId[] {
  return [...DELPOENG_LISTE]
    .sort((a, b) => delpoeng[a.id] - delpoeng[b.id])
    .map((d) => d.id)
}

/** Formats a 0–10 score with Norwegian decimal comma (e.g. "7,4"). */
export function formaterMoggernPoeng(poeng: number): string {
  return poeng.toFixed(1).replace(".", ",")
}
