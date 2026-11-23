// Deterministic, transparent 0–10 face-landmark scoring for Moggern (pure math-for-fun, zero scientific basis).
//
// Original TypeScript math, inspired by open-source 478-point MediaPipe Face Landmarker projects such as
// LcccSky/facial-proportion-math (MIT) and DroneOps/MogOps. No trained weights or datasets are copied.
//
// Pipeline per video frame:
//   1. Extract head pose (yaw, pitch, roll) from MediaPipe's 4×4 facial transformation matrix (or geometric fallback).
//   2. Reject non-frontal frames (|yaw| > 14°, |pitch| > 14°, |roll| > 18°) and frames where the face is too small/large.
//   3. Convert normalized [0, 1] landmarks to pixel aspect-ratio space, compute eye centers & interpupillary distance (IPD).
//   4. Rotate all landmarks around the eye midpoint by -roll so the eye line is horizontal, and divide by IPD.
//      Because horizontal direction is canonicalized from the image's left/right eye, scores are invariant to mirroring.
//   5. Compute craniofacial measurements (canthal tilt, PFR, 3D gonial angle, fWHR, ESR, thirds, φ mouth/nose …) and
//      score each against an anthropometric target range with an asymmetric Gaussian plateau → 7 sub-scores on 0–10.
//   6. Combine sub-scores with fixed weights into a raw structural score, then map it through a population
//      bell-curve calibration (normal CDF) so real faces genuinely spread across 0–10 instead of clustering at 6–7.
//   7. Add live "mog-uttrykk" bonuses from MediaPipe's 52 face blendshapes (The Rock, jegerøyne, mewing …),
//      exponentially smoothed across frames. Final total is clamped to [0, 10].
//   8. Across the ~10 s duel, average valid frames with a 10% trimmed mean so single-frame jitter or blinks do not skew it.

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
    kortForklaring: "16 speilte punktpar rundt midtlinjen, normalisert mot ansiktets bredde og høyde.",
  },
  {
    id: "kjevelinje",
    navn: "Kjevelinje",
    vekt: 0.17,
    kortForklaring: "Kjeve-/kinnbensbredde, ekte 3D-kjevevinkel (tragion → gonion → hake) og skarp kjevekontur.",
  },
  {
    id: "oyevinkel",
    navn: "Øyevinkel",
    vekt: 0.15,
    kortForklaring: "Øyekrok-tilt i grader pluss øyeform (PFR = øyebredde / øyehøyde — mandelform slår runde øyne).",
  },
  {
    id: "midtansikt",
    navn: "Midtansikt",
    vekt: 0.13,
    kortForklaring: "Pupillavstand mot øye-til-overleppe og fWHR (kinnbensbredde / bryn-til-overleppe).",
  },
  {
    id: "ansiktstredjedeler",
    navn: "Ansiktstredjedeler",
    vekt: 0.13,
    kortForklaring: "Balanse mellom panne, nese og hake, pluss hake-til-filtrum-forholdet.",
  },
  {
    id: "oyeavstand",
    navn: "Øyeavstand",
    vekt: 0.11,
    kortForklaring: "ESR (pupillavstand / ansiktsbredde, ideelt ~0,45–0,47) og ansiktets femtedeler.",
  },
  {
    id: "harmoni",
    navn: "Harmoni",
    vekt: 0.11,
    kortForklaring: "Gyllent snitt munn/nese (φ ≈ 1,618), nese mot øyeavstand, leppeforhold og jevne delpoeng.",
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

/** Pose & framing gates for counting a frame as valid during the official duel. */
export const MAKS_YAW_GRADER = 22
export const MAKS_PITCH_GRADER = 21
export const MAKS_ROLL_GRADER = 22
export const MIN_IPD_ANDEL = 0.055
export const MAKS_IPD_ANDEL = 0.6
/** Minimum valid frontal frames needed over the ~10 s capture window. */
export const MIN_GYLDIGE_RAMMER = 12

/**
 * Population bell-curve calibration: raw structural score R (weighted 0–10) → 10 · Φ((R − μ) / σ).
 * MediaPipe's regularized 3D face mesh naturally averages ~7.8–8.3 raw on a typical neutral webcam face,
 * so μ = 7.9, σ = 0.95 puts neutral faces around 5–7 (Normie/Mid-mogger/Aura-farmer), weak proportions
 * down to Bjeffern/Chopped, and reserves Gigamogger (9+) for genuinely sharp geometry + clean mogging form.
 */
export const KALIBRERING_SNITT = 7.9
export const KALIBRERING_SPREDNING = 0.95

/** Golden ratio φ used for the mouth-to-nose width target. */
export const GYLDENT_SNITT = (1 + Math.sqrt(5)) / 2

// Canonical MediaPipe Face Landmarker (468 / 478) indices.
export const PUNKTER = {
  panneTopp: 10,
  brynMidt: 9,
  neseRot: 168,
  neseTipp: 1,
  neseBunn: 2,
  overleppeTopp: 0,
  munnMidt: 13,
  underleppeTopp: 14,
  underleppeBunn: 17,
  hake: 152,

  // Subject's right side (image left on unmirrored camera)
  hoyreOyeYtre: 33,
  hoyreOyeIndre: 133,
  hoyreOyeTopp: 159,
  hoyreOyeBunn: 145,
  hoyreIris: 468,
  hoyreTragion: 127,
  hoyreKinnben: 234,
  hoyreKjeveOvre: 132,
  hoyreKjeveHjorne: 172,
  hoyreKjeveNedre: 136,
  hoyreHakeKropp: 149,
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
  venstreTragion: 356,
  venstreKinnben: 454,
  venstreKjeveOvre: 361,
  venstreKjeveHjorne: 397,
  venstreKjeveNedre: 365,
  venstreHakeKropp: 378,
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
  [PUNKTER.hoyreTragion, PUNKTER.venstreTragion],
  [PUNKTER.hoyreKinnben, PUNKTER.venstreKinnben],
  [PUNKTER.hoyreKjeveOvre, PUNKTER.venstreKjeveOvre],
  [PUNKTER.hoyreKjeveHjorne, PUNKTER.venstreKjeveHjorne],
  [PUNKTER.hoyreKjeveNedre, PUNKTER.venstreKjeveNedre],
  [PUNKTER.hoyreHakeKropp, PUNKTER.venstreHakeKropp],
  [PUNKTER.hoyreNeseVinge, PUNKTER.venstreNeseVinge],
  [PUNKTER.hoyreMunnvik, PUNKTER.venstreMunnvik],
  [116, 345], // outer cheek
] as const

export type Veiledning = "ingen-ansikt" | "for-langt-unna" | "for-naerme" | "snu-rett" | "vipp-rett" | "ok"

// ---- Mog-uttrykk (blendshape expression bonuses & anti-mog grimase penalties) ----

export type MogUttrykkId =
  | "the-rock"
  | "jegeroyne"
  | "innsugde-kinn"
  | "mewing"
  | "smiler"
  | "oppblaste-kinn"
  | "munn-puster"
  | "grimase"
  | "bytteoyne"
  | "sur-geip"

export type MogUttrykkInfo = {
  id: MogUttrykkId
  navn: string
  /** Max bonus (positive) or penalty (negative) at full strength. */
  maks: number
  /** Ramp start (signal where the bonus begins) and end (signal where it is maxed out). */
  fra: number
  til: number
  forklaring: string
}

export const MOG_UTTRYKK: readonly MogUttrykkInfo[] = [
  { id: "the-rock", navn: "The Rock", maks: 0.8, fra: 0.28, til: 0.62, forklaring: "Ett øyenbryn hevet, det andre rolig." },
  { id: "jegeroyne", navn: "Jegerøyne", maks: 0.65, fra: 0.4, til: 0.74, forklaring: "Stram myse uten å blunke eller lage grimase." },
  { id: "innsugde-kinn", navn: "Innsugde kinn", maks: 0.55, fra: 0.44, til: 0.8, forklaring: "Blue steel: sug inn kinnene med lukket munn." },
  { id: "mewing", navn: "Mewing", maks: 0.45, fra: 0.36, til: 0.68, forklaring: "Kjeven fram eller leppene stramt lukket." },
  { id: "smiler", navn: "Smiler", maks: -1.4, fra: 0.28, til: 0.72, forklaring: "Ekte moggere gliser ikke i kameraet!" },
  { id: "oppblaste-kinn", navn: "Ballongkinn", maks: -2.0, fra: 0.2, til: 0.58, forklaring: "Oppblåste kinn dreper kjevelinja." },
  { id: "munn-puster", navn: "Munn-puster", maks: -2.8, fra: 0.16, til: 0.55, forklaring: "Lukk munnen — åpen kjeve er anti-mewing." },
  { id: "grimase", navn: "Grimase", maks: -3.2, fra: 0.22, til: 0.62, forklaring: "Skjev munn, rynket nese eller rar grimase straffes hardt." },
  { id: "bytteoyne", navn: "Bytteøyne", maks: -2.2, fra: 0.24, til: 0.62, forklaring: "Kuleøyne eller hevede innerbryn gir panikk-aura." },
  { id: "sur-geip", navn: "Sur geip", maks: -1.8, fra: 0.26, til: 0.66, forklaring: "Nedovermunn og sur geip koster dyrt." },
] as const

export type MogUttrykkStyrker = Record<MogUttrykkId, number>

export type MogUttrykkResultat = {
  /** 0–1 strength per expression (0 = not doing it, 1 = maxed out). */
  styrker: MogUttrykkStyrker
  /** Sum of bonuses and penalties in score points. */
  bonus: number
}

export const MAKS_UTTRYKK_BONUS = MOG_UTTRYKK.reduce((s, u) => s + Math.max(0, u.maks), 0)
export const MIN_UTTRYKK_BONUS = MOG_UTTRYKK.reduce((s, u) => s + Math.min(0, u.maks), 0)

/** Blendshape scores by MediaPipe category name (e.g. `browOuterUpLeft`). */
export type Blendshapes = Readonly<Record<string, number>>

export type AnsiktsMaal = {
  /** Mean mirrored deviation normalized by face width/height. */
  asymmetri: number
  canthalTilt: number
  pfr: number
  kjeveForhold: number
  gonialVinkel3D: number
  kjeveKontur: number
  midtansiktForhold: number
  fwhr: number
  tredjedelAvvik: number
  hakeFiltrum: number
  esr: number
  oyeFemtedel: number
  oyeAnsiktBredde: number
  munnNese: number
  neseOyeavstand: number
  leppeForhold: number
}

export type RammeResultat = {
  gyldig: boolean
  veiledning: Veiledning
  vinkel: HodeVinkel
  /** Interpupillary distance as a fraction of the shorter image edge. */
  ipdAndel: number
  delpoeng?: DelpoengKart
  maal?: AnsiktsMaal
  /** Weighted raw structural score before calibration (0–10). */
  raaPoeng?: number
  /** Calibrated structural score (0–10) without expression bonus. */
  strukturPoeng?: number
  /** Expression strengths & bonus (always 0 bonus when no blendshapes were supplied). */
  uttrykk?: MogUttrykkResultat
  /** Final 0–10 frame score = calibrated structure + expression bonus. */
  total?: number
}

export type KvalitetStats = {
  antallRammer: number
  gyldigeRammer: number
  snittAbsYaw: number
  snittAbsPitch: number
  snittIpdAndel: number
  /** Raw structural score standard deviation across valid frames (lower = steadier pose). */
  stabilitet: number
}

export type SamletMaaling = {
  ok: boolean
  total: number
  delpoeng: DelpoengKart
  /** Smoothed, trimmed-mean expression bonus across the capture (score points). */
  uttrykkBonus: number
  kvalitet: KvalitetStats
}

const RAD_TIL_GRADER = 180 / Math.PI

const avrund = (n: number, desimaler = 1) => {
  const f = 10 ** desimaler
  return Math.round(n * f) / f
}

const klem = (n: number, min: number, maks: number) => Math.max(min, Math.min(maks, n))

/**
 * Smooth target-range scoring function returning 0.0–10.0 (legacy symmetric dome, kept for compatibility).
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
 * Asymmetric Gaussian plateau score (0.0–10.0).
 * A flat 10 inside the anthropometric plateau [idealMin, idealMax]. Below it, the score decays as a Gaussian with
 * σ = `sigmaLav`; above it with σ = `sigmaHoy`. One σ outside the plateau gives ≈ 6.1, two σ ≈ 1.4.
 * Asymmetry lets e.g. round eyes be punished harder than slightly too-narrow almond eyes.
 */
export function asymPlateauScore(verdi: number, idealMin: number, idealMax: number, sigmaLav: number, sigmaHoy = sigmaLav): number {
  if (!Number.isFinite(verdi) || sigmaLav <= 0 || sigmaHoy <= 0) return 0
  if (verdi >= idealMin && verdi <= idealMax) return 10
  const z = verdi < idealMin ? (idealMin - verdi) / sigmaLav : (verdi - idealMax) / sigmaHoy
  return avrund(klem(10 * Math.exp(-0.5 * z * z), 0, 10), 2)
}

/** Error function (Abramowitz & Stegun 7.1.26, max error 1.5e-7). Deterministic across browsers. */
function erf(x: number): number {
  const tegn = x < 0 ? -1 : 1
  const a = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * a)
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)
  return tegn * y
}

/** Standard normal cumulative distribution Φ(z). */
export function normalFordeling(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}

/**
 * Population bell-curve calibration: maps the raw weighted structural score (0–10) to a 0–10 percentile-like score.
 * Monotonic, so ranking between two faces never changes — it only stretches the crowded middle apart.
 */
export function kalibrerPoeng(raa: number, snitt = KALIBRERING_SNITT, spredning = KALIBRERING_SPREDNING): number {
  if (!Number.isFinite(raa)) return 0
  const z = (klem(raa, 0, 10) - snitt) / spredning
  return klem(10 * normalFordeling(z), 0, 10)
}

// ---- Pure measurement helpers (exported for tests) ----

type Punkt2D = { x: number; y: number }
type P3 = { x: number; y: number; z: number }

const avstand2D = (a: Punkt2D, b: Punkt2D) => Math.hypot(a.x - b.x, a.y - b.y)

/** Interior angle in degrees at vertex `b` formed by segments b→a and b→c (2D). */
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

/**
 * True 3D mandibular (gonial) angle in degrees at the gonion, between the ramus (gonion → tragion)
 * and the mandibular body (gonion → chin body). Invariant to any 3D rotation, scale and mirroring.
 */
export function compute3DGonialAngle(tragion: Punkt3D, gonion: Punkt3D, hakeKropp: Punkt3D): number {
  const v1 = { x: tragion.x - gonion.x, y: tragion.y - gonion.y, z: (tragion.z ?? 0) - (gonion.z ?? 0) }
  const v2 = { x: hakeKropp.x - gonion.x, y: hakeKropp.y - gonion.y, z: (hakeKropp.z ?? 0) - (gonion.z ?? 0) }
  const l1 = Math.hypot(v1.x, v1.y, v1.z)
  const l2 = Math.hypot(v2.x, v2.y, v2.z)
  if (l1 < 1e-9 || l2 < 1e-9) return 180
  const cos = klem((v1.x * v2.x + v1.y * v2.y + v1.z * v2.z) / (l1 * l2), -1, 1)
  return Math.acos(cos) * RAD_TIL_GRADER
}

/** Palpebral Fissure Ratio: eye width (canthus to canthus) / eye opening height (upper to lower lid). */
export function beregnPFR(ytre: Punkt2D, indre: Punkt2D, topp: Punkt2D, bunn: Punkt2D): number {
  const bredde = avstand2D(ytre, indre)
  const hoyde = Math.max(1e-6, avstand2D(topp, bunn))
  return bredde / hoyde
}

/** Facial width-to-height ratio: bizygomatic width / brow-to-upper-lip height. */
export function beregnFWHR(bizygomatiskBredde: number, brynTilOverleppe: number): number {
  return bizygomatiskBredde / Math.max(1e-6, brynTilOverleppe)
}

/** Eye Separation Ratio: interpupillary distance / bizygomatic (face) width. Ideal ≈ 0.45–0.47. */
export function beregnESR(ipd: number, bizygomatiskBredde: number): number {
  return ipd / Math.max(1e-6, bizygomatiskBredde)
}

// ---- Expressions from blendshapes ----

/** Smooth 0–1 ramp: 0 below `fra`, 1 above `til`, smoothstep in between. */
export function rampe(verdi: number, fra: number, til: number): number {
  if (!Number.isFinite(verdi) || til <= fra) return 0
  const t = klem((verdi - fra) / (til - fra), 0, 1)
  return t * t * (3 - 2 * t)
}

const bs = (b: Blendshapes, navn: string) => {
  const v = b[navn]
  return typeof v === "number" && Number.isFinite(v) ? klem(v, 0, 1) : 0
}

/** Raw 0–1 trigger signal per expression, before the ramp. Gates (no grimace, no blink, closed mouth) zero false bonuses. */
export function uttrykkSignaler(b: Blendshapes): MogUttrykkStyrker {
  const smilL = bs(b, "mouthSmileLeft")
  const smilR = bs(b, "mouthSmileRight")
  const smil = (smilL + smilR) / 2
  const blunkL = bs(b, "eyeBlinkLeft")
  const blunkR = bs(b, "eyeBlinkRight")
  const blunk = (blunkL + blunkR) / 2
  const myse = (bs(b, "eyeSquintLeft") + bs(b, "eyeSquintRight")) / 2
  const press = (bs(b, "mouthPressLeft") + bs(b, "mouthPressRight")) / 2
  const gap = bs(b, "jawOpen")
  const ballong = bs(b, "cheekPuff")
  const videOyne = (bs(b, "eyeWideLeft") + bs(b, "eyeWideRight")) / 2
  const bytteoyne = Math.max(videOyne, bs(b, "browInnerUp") * 0.85)
  const geip = Math.max(
    (bs(b, "mouthFrownLeft") + bs(b, "mouthFrownRight")) / 2,
    bs(b, "mouthShrugLower"),
    bs(b, "mouthRollLower"),
  )
  const grimase = Math.max(
    bs(b, "noseSneerLeft"),
    bs(b, "noseSneerRight"),
    bs(b, "mouthStretchLeft"),
    bs(b, "mouthStretchRight"),
    bs(b, "mouthFunnel"),
    bs(b, "mouthUpperUpLeft"),
    bs(b, "mouthUpperUpRight"),
    bs(b, "mouthLowerDownLeft"),
    bs(b, "mouthLowerDownRight"),
    bs(b, "mouthLeft"),
    bs(b, "mouthRight"),
    bs(b, "jawLeft"),
    bs(b, "jawRight"),
    Math.abs(blunkL - blunkR) * 0.9,
    Math.abs(smilL - smilR) * 0.9,
  )

  // Making an ugly grimace, gaping mouth, bug eyes, or puffed cheeks cancels positive mog bonuses.
  const urolig = Math.max(gap, grimase, ballong, bytteoyne, geip)
  const komposert = urolig < 0.32

  return {
    "the-rock": komposert ? Math.abs(bs(b, "browOuterUpLeft") - bs(b, "browOuterUpRight")) : 0,
    jegeroyne: komposert && blunk < 0.65 ? myse : 0,
    "innsugde-kinn": komposert && gap < 0.15 && smil < 0.18 && ballong < 0.15 ? bs(b, "mouthPucker") : 0,
    mewing: komposert && gap < 0.15 ? Math.max(2 * bs(b, "jawForward"), press) : 0,
    smiler: smil,
    "oppblaste-kinn": ballong,
    "munn-puster": gap,
    grimase,
    bytteoyne,
    "sur-geip": geip,
  }
}

const tommeStyrker = (): MogUttrykkStyrker => ({
  "the-rock": 0,
  jegeroyne: 0,
  "innsugde-kinn": 0,
  mewing: 0,
  smiler: 0,
  "oppblaste-kinn": 0,
  "munn-puster": 0,
  grimase: 0,
  bytteoyne: 0,
  "sur-geip": 0,
})

/** Sums the bonus for given 0–1 expression strengths. */
export function bonusForStyrker(styrker: MogUttrykkStyrker): number {
  let sum = 0
  for (const u of MOG_UTTRYKK) sum += klem(styrker[u.id] ?? 0, 0, 1) * u.maks
  return avrund(klem(sum, MIN_UTTRYKK_BONUS, MAKS_UTTRYKK_BONUS), 3)
}

/**
 * Turns MediaPipe's 52 blendshapes into mog-uttrykk strengths and a score bonus.
 * A resting face earns ~0.0 because every ramp starts well above resting blendshape levels.
 */
export function regnMogUttrykk(b: Blendshapes | null | undefined): MogUttrykkResultat {
  if (!b) return { styrker: tommeStyrker(), bonus: 0 }
  const signaler = uttrykkSignaler(b)
  const styrker = tommeStyrker()
  for (const u of MOG_UTTRYKK) styrker[u.id] = avrund(rampe(signaler[u.id], u.fra, u.til), 3)
  return { styrker, bonus: bonusForStyrker(styrker) }
}

/** One exponential smoothing step: alpha = weight of the new sample (0–1). First sample passes through. */
export function glattEksponentielt(forrige: number | null, ny: number, alpha: number): number {
  if (forrige === null || !Number.isFinite(forrige)) return ny
  const a = klem(alpha, 0, 1)
  return forrige + a * (ny - forrige)
}

/** Exponentially smooths expression strengths frame to frame (so the bonus does not flicker). */
export function glattUttrykk(forrige: MogUttrykkStyrker | null, ny: MogUttrykkStyrker, alpha: number): MogUttrykkStyrker {
  const ut = tommeStyrker()
  for (const u of MOG_UTTRYKK) ut[u.id] = glattEksponentielt(forrige ? forrige[u.id] : null, ny[u.id], alpha)
  return ut
}

/** Live HUD smoothing state for one face. */
export type LivePoengTilstand = {
  struktur: number | null
  styrker: MogUttrykkStyrker | null
}

export type LivePoeng = {
  total: number
  strukturPoeng: number
  bonus: number
  styrker: MogUttrykkStyrker
}

export const LIVE_ALPHA_STRUKTUR = 0.18
export const LIVE_ALPHA_UTTRYKK = 0.35

/**
 * Feeds one detected frame into the live HUD smoother and returns the smoothed score.
 * Structure moves slowly (stable rating); expressions react faster so posing is visibly rewarded.
 * Off-angle frames still update the live score (gently) so the HUD responds immediately on any webcam angle,
 * while official 10 s duel aggregation (`aggregerRammer`) still only counts `gyldig` frontal frames.
 */
export function oppdaterLivePoeng(tilstand: LivePoengTilstand, ramme: RammeResultat): LivePoeng | null {
  if (ramme.veiledning === "ingen-ansikt" || typeof ramme.strukturPoeng !== "number") return null
  const strukturAlpha = ramme.gyldig ? LIVE_ALPHA_STRUKTUR : LIVE_ALPHA_STRUKTUR * 0.45
  tilstand.struktur = glattEksponentielt(tilstand.struktur, ramme.strukturPoeng, strukturAlpha)
  const nyeStyrker = ramme.uttrykk?.styrker ?? tommeStyrker()
  tilstand.styrker = glattUttrykk(tilstand.styrker, nyeStyrker, LIVE_ALPHA_UTTRYKK)
  const bonus = bonusForStyrker(tilstand.styrker)
  return {
    total: avrund(klem(tilstand.struktur + bonus, 0, 10), 1),
    strukturPoeng: avrund(tilstand.struktur, 1),
    bonus: avrund(bonus, 2),
    styrker: tilstand.styrker,
  }
}

// ---- Head pose ----

/**
 * Extracts yaw, pitch, and roll in degrees from a MediaPipe 4×4 facial transformation matrix.
 * MediaPipe's Matrix stores 16 floats in column-major order (OpenGL convention), where
 * R[row][col] = m[col * 4 + row]. For row-major matrices (where translation sits at m[3], m[7], m[11]),
 * we automatically read R[row][col] = m[row * 4 + col].
 */
export function vinkelFraMatrise(matrise: ArrayLike<number>): HodeVinkel {
  if (matrise.length < 16) return { yaw: 0, pitch: 0, roll: 0 }

  const kolonneTransl = Math.abs(matrise[12]) + Math.abs(matrise[13]) + Math.abs(matrise[14])
  const radTransl = Math.abs(matrise[3]) + Math.abs(matrise[7]) + Math.abs(matrise[11])
  const erRadMajor = radTransl > kolonneTransl + 1e-3

  const r = (row: number, col: number) => (erRadMajor ? matrise[row * 4 + col] : matrise[col * 4 + row])

  const r00 = r(0, 0)
  const r10 = r(1, 0)
  const r02 = r(0, 2)
  const r12 = r(1, 2)
  const r22 = r(2, 2)

  const yaw = Math.atan2(r02, r22) * RAD_TIL_GRADER
  const pitch = Math.atan2(-r12, Math.hypot(r02, r22)) * RAD_TIL_GRADER
  const roll = Math.atan2(r10, r00) * RAD_TIL_GRADER

  return {
    yaw: avrund(yaw, 1),
    pitch: avrund(pitch, 1),
    roll: avrund(roll, 1),
  }
}

/** Geometric fallback for estimating yaw, pitch, and roll when no transformation matrix is supplied. */
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
  const pitch = klem((neseRel - 0.23) * 90, -45, 45)

  return { yaw: avrund(yaw, 1), pitch: avrund(pitch, 1), roll: avrund(roll, 1) }
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
 * Normalizes by IPD, corrects head roll, checks frontal pose, computes all 7 sub-scores,
 * calibrates the structural score and adds the mog-uttrykk bonus from blendshapes (if supplied).
 */
export function vurderRamme(
  punkter: readonly Punkt3D[] | null | undefined,
  matrise?: ArrayLike<number> | null,
  bredde = 640,
  hoyde = 480,
  blendshapes?: Blendshapes | null,
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

  if (ipd < 1e-3) {
    return { gyldig: false, veiledning: "for-langt-unna", vinkel: effektivVinkel, ipdAndel }
  }

  let veiledning: Veiledning = "ok"
  if (ipdAndel < MIN_IPD_ANDEL) {
    veiledning = "for-langt-unna"
  } else if (ipdAndel > MAKS_IPD_ANDEL) {
    veiledning = "for-naerme"
  } else if (Math.abs(effektivVinkel.yaw) > MAKS_YAW_GRADER || Math.abs(effektivVinkel.pitch) > MAKS_PITCH_GRADER) {
    veiledning = "snu-rett"
  } else if (Math.abs(effektivVinkel.roll) > MAKS_ROLL_GRADER) {
    veiledning = "vipp-rett"
  }
  const gyldig = veiledning === "ok"

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

  // Raw 3D pixel-space point (MediaPipe z shares the x scale). Angles in 3D are rotation/scale/mirror invariant.
  const p3 = (idx: number): P3 => {
    const p = punkter[idx]
    return { x: p.x * b, y: p.y * h, z: (p.z ?? 0) * b }
  }

  const panne = norm(PUNKTER.panneTopp)
  const bryn = norm(PUNKTER.brynMidt)
  const neseBunn = norm(PUNKTER.neseBunn)
  const overleppe = norm(PUNKTER.overleppeTopp)
  const hake = norm(PUNKTER.hake)
  const rKinn = norm(PUNKTER.hoyreKinnben)
  const lKinn = norm(PUNKTER.venstreKinnben)
  const kinnBredde = Math.max(1e-5, avstand2D(rKinn, lKinn))
  const totalHoyde = Math.max(1e-5, hake.y - panne.y)

  // 1. SYMMETRI: mirrored deviation across 16 left/right pairs, x normalized by face width and y by face height.
  let symSum = 0
  for (const [rIdx, lIdx] of SYMMETRI_PAR) {
    const rP = norm(rIdx)
    const lP = norm(lIdx)
    // Perfect mirror across x = 0 means rP.x === -lP.x and rP.y === lP.y.
    symSum += Math.hypot((rP.x + lP.x) / kinnBredde, (rP.y - lP.y) / totalHoyde)
  }
  const asymmetri = symSum / SYMMETRI_PAR.length
  const symmetri = asymPlateauScore(asymmetri, 0, 0.012, 0.024)

  // 2. ØYEVINKEL: canthal tilt (degrees, positive = outer corner higher) + Palpebral Fissure Ratio.
  const rIndre = norm(PUNKTER.hoyreOyeIndre)
  const rYtre = norm(PUNKTER.hoyreOyeYtre)
  const lIndre = norm(PUNKTER.venstreOyeIndre)
  const lYtre = norm(PUNKTER.venstreOyeYtre)
  const rTopp = norm(PUNKTER.hoyreOyeTopp)
  const rBunn = norm(PUNKTER.hoyreOyeBunn)
  const lTopp = norm(PUNKTER.venstreOyeTopp)
  const lBunn = norm(PUNKTER.venstreOyeBunn)

  const tiltHoyre = Math.atan2(rIndre.y - rYtre.y, Math.max(1e-5, Math.abs(rYtre.x - rIndre.x))) * RAD_TIL_GRADER
  const tiltVenstre = Math.atan2(lIndre.y - lYtre.y, Math.max(1e-5, Math.abs(lYtre.x - lIndre.x))) * RAD_TIL_GRADER
  const canthalTilt = (tiltHoyre + tiltVenstre) / 2
  const pfr = (beregnPFR(rYtre, rIndre, rTopp, rBunn) + beregnPFR(lYtre, lIndre, lTopp, lBunn)) / 2

  const tiltPoeng = asymPlateauScore(canthalTilt, 4.0, 8.0, 3.8, 5.5)
  // Hunter/almond eyes (PFR ≈ 3.0–3.7) reward; round eyes (low PFR) fall off fastest.
  const pfrPoeng = asymPlateauScore(pfr, 3.0, 3.7, 0.42, 0.85)
  const oyevinkel = 0.6 * tiltPoeng + 0.4 * pfrPoeng

  // 3. KJEVELINJE: bigonial/bizygomatic width ratio + 3D gonial angle + 2D jaw contour sharpness.
  const rKjeve = norm(PUNKTER.hoyreKjeveHjorne)
  const lKjeve = norm(PUNKTER.venstreKjeveHjorne)
  const rOvre = norm(PUNKTER.hoyreKjeveOvre)
  const lOvre = norm(PUNKTER.venstreKjeveOvre)
  const kjeveForhold = avstand2D(rKjeve, lKjeve) / kinnBredde

  const gonialVinkel3D =
    (compute3DGonialAngle(p3(PUNKTER.hoyreTragion), p3(PUNKTER.hoyreKjeveHjorne), p3(PUNKTER.hoyreHakeKropp)) +
      compute3DGonialAngle(p3(PUNKTER.venstreTragion), p3(PUNKTER.venstreKjeveHjorne), p3(PUNKTER.venstreHakeKropp))) /
    2
  const kjeveKontur = (vinkelGrader(rOvre, rKjeve, hake) + vinkelGrader(lOvre, lKjeve, hake)) / 2

  const kjeveRatioPoeng = asymPlateauScore(kjeveForhold, 0.78, 0.87, 0.075, 0.11)
  // Sharper (smaller) angles are punished less than soft, obtuse jaws.
  const gonialPoeng = asymPlateauScore(gonialVinkel3D, 118, 132, 13, 9.5)
  const konturPoeng = asymPlateauScore(kjeveKontur, 120, 135, 14, 10)
  const kjevelinje = 0.4 * kjeveRatioPoeng + 0.35 * gonialPoeng + 0.25 * konturPoeng

  // 4. MIDTANSIKT: IPD / eye-line-to-upper-lip ratio + fWHR.
  const midtansiktForhold = 1 / Math.max(1e-5, overleppe.y)
  const fwhr = beregnFWHR(kinnBredde, overleppe.y - bryn.y)
  const midtForholdPoeng = asymPlateauScore(midtansiktForhold, 0.95, 1.08, 0.1, 0.14)
  const fwhrPoeng = asymPlateauScore(fwhr, 1.75, 2.02, 0.18, 0.26)
  const midtansikt = 0.55 * midtForholdPoeng + 0.45 * fwhrPoeng

  // 5. ANSIKTSTREDJEDELER: forehead (10→9), nose (9→2), lower face (2→152) shares + chin-to-philtrum ratio.
  const t1 = Math.max(0, bryn.y - panne.y) / totalHoyde
  const t2 = Math.max(0, neseBunn.y - bryn.y) / totalHoyde
  const t3 = Math.max(0, hake.y - neseBunn.y) / totalHoyde
  // Target shares calibrated for MediaPipe's forehead landmark 10 (slightly below hairline).
  const tredjedelAvvik = (Math.abs(t1 - 0.29) + Math.abs(t2 - 0.35) + Math.abs(t3 - 0.36)) / 3
  const filtrum = Math.max(1e-5, overleppe.y - neseBunn.y)
  const hakeFiltrum = Math.max(0, hake.y - norm(PUNKTER.underleppeBunn).y) / filtrum
  const tredjedelPoeng = asymPlateauScore(tredjedelAvvik, 0, 0.015, 0.025)
  const hakeFiltrumPoeng = asymPlateauScore(hakeFiltrum, 2.05, 2.55, 0.42, 0.7)
  const ansiktstredjedeler = 0.65 * tredjedelPoeng + 0.35 * hakeFiltrumPoeng

  // 6. ØYEAVSTAND: Eye Separation Ratio + facial fifths (intercanthal ≈ eye width ≈ 1/5 face width).
  const esr = beregnESR(1, kinnBredde) // IPD is 1 in canonical coordinates.
  const indreAvstand = Math.abs(lIndre.x - rIndre.x)
  const snittOyeBredde = Math.max(1e-5, (avstand2D(rYtre, rIndre) + avstand2D(lYtre, lIndre)) / 2)
  const oyeFemtedel = indreAvstand / snittOyeBredde
  const oyeAnsiktBredde = snittOyeBredde / kinnBredde
  const esrPoeng = asymPlateauScore(esr, 0.445, 0.475, 0.024, 0.024)
  const femtedelPoeng = asymPlateauScore(oyeFemtedel, 0.96, 1.12, 0.15, 0.19)
  const breddePoeng = asymPlateauScore(oyeAnsiktBredde, 0.195, 0.23, 0.026, 0.03)
  const oyeavstand = 0.4 * esrPoeng + 0.35 * femtedelPoeng + 0.25 * breddePoeng

  // 7. HARMONI: golden-ratio mouth/nose width, nose/intercanthal ratio, lower/upper lip ratio + sub-score balance.
  const neseBredde = Math.max(1e-5, avstand2D(norm(PUNKTER.hoyreNeseVinge), norm(PUNKTER.venstreNeseVinge)))
  const munnNese = avstand2D(norm(PUNKTER.hoyreMunnvik), norm(PUNKTER.venstreMunnvik)) / neseBredde
  const neseOyeavstand = neseBredde / Math.max(1e-5, indreAvstand)
  const overleppeHoyde = Math.max(1e-5, norm(PUNKTER.munnMidt).y - overleppe.y)
  const underleppeHoyde = Math.max(0, norm(PUNKTER.underleppeBunn).y - norm(PUNKTER.underleppeTopp).y)
  const leppeForhold = underleppeHoyde / overleppeHoyde

  const gyldenPoeng = asymPlateauScore(munnNese, GYLDENT_SNITT - 0.1, GYLDENT_SNITT + 0.05, 0.19, 0.24)
  const neseOyePoeng = asymPlateauScore(neseOyeavstand, 0.98, 1.2, 0.15, 0.19)
  const leppePoeng = asymPlateauScore(leppeForhold, 1.4, 1.85, 0.3, 0.45)
  const seksDelpoeng = [symmetri, oyevinkel, kjevelinje, midtansikt, ansiktstredjedeler, oyeavstand]
  const snittSeks = seksDelpoeng.reduce((a, x) => a + x, 0) / seksDelpoeng.length
  const spredningSeks = Math.sqrt(seksDelpoeng.reduce((a, x) => a + (x - snittSeks) ** 2, 0) / seksDelpoeng.length)
  const balansePoeng = asymPlateauScore(spredningSeks, 0, 1.0, 1.8)
  const harmoni = 0.3 * gyldenPoeng + 0.2 * neseOyePoeng + 0.2 * leppePoeng + 0.3 * balansePoeng

  const delpoeng: DelpoengKart = {
    symmetri: avrund(symmetri, 1),
    oyevinkel: avrund(oyevinkel, 1),
    kjevelinje: avrund(kjevelinje, 1),
    midtansikt: avrund(midtansikt, 1),
    ansiktstredjedeler: avrund(ansiktstredjedeler, 1),
    oyeavstand: avrund(oyeavstand, 1),
    harmoni: avrund(harmoni, 1),
  }

  const maal: AnsiktsMaal = {
    asymmetri: avrund(asymmetri, 4),
    canthalTilt: avrund(canthalTilt, 2),
    pfr: avrund(pfr, 3),
    kjeveForhold: avrund(kjeveForhold, 3),
    gonialVinkel3D: avrund(gonialVinkel3D, 1),
    kjeveKontur: avrund(kjeveKontur, 1),
    midtansiktForhold: avrund(midtansiktForhold, 3),
    fwhr: avrund(fwhr, 3),
    tredjedelAvvik: avrund(tredjedelAvvik, 4),
    hakeFiltrum: avrund(hakeFiltrum, 3),
    esr: avrund(esr, 3),
    oyeFemtedel: avrund(oyeFemtedel, 3),
    oyeAnsiktBredde: avrund(oyeAnsiktBredde, 3),
    munnNese: avrund(munnNese, 3),
    neseOyeavstand: avrund(neseOyeavstand, 3),
    leppeForhold: avrund(leppeForhold, 3),
  }

  const raaPoeng = regnRaaPoeng(delpoeng)
  const uttrykk = regnMogUttrykk(blendshapes)

  return {
    gyldig,
    veiledning,
    vinkel: effektivVinkel,
    ipdAndel,
    delpoeng,
    maal,
    raaPoeng,
    strukturPoeng: avrund(kalibrerPoeng(raaPoeng), 2),
    uttrykk,
    total: regnTotal(delpoeng, uttrykk.bonus),
  }
}

/** Weighted raw structural score (0.0–10.0, 2 decimals) from the 7 sub-scores, before calibration. */
export function regnRaaPoeng(delpoeng: DelpoengKart): number {
  let sum = 0
  for (const info of DELPOENG_LISTE) {
    sum += klem(delpoeng[info.id], 0, 10) * info.vekt
  }
  return avrund(klem(sum, 0, 10), 2)
}

/**
 * Final total score (0.0–10.0, 1 decimal): bell-curve calibrated weighted sub-scores plus expression bonus.
 * Deterministic from (delpoeng, bonus), so a received duel report can always be recomputed and verified.
 */
export function regnTotal(delpoeng: DelpoengKart, uttrykkBonus = 0): number {
  const bonus = Number.isFinite(uttrykkBonus) ? klem(uttrykkBonus, MIN_UTTRYKK_BONUS, MAKS_UTTRYKK_BONUS) : 0
  return avrund(klem(kalibrerPoeng(regnRaaPoeng(delpoeng)) + bonus, 0, 10), 1)
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

const tomtKart = (): DelpoengKart => ({
  symmetri: 0,
  oyevinkel: 0,
  kjevelinje: 0,
  midtansikt: 0,
  ansiktstredjedeler: 0,
  oyeavstand: 0,
  harmoni: 0,
})

/**
 * Aggregates all evaluated frames from a ~10 s duel capture into a final deterministic score.
 * Requires at least `minGyldige` frontal frames (default MIN_GYLDIGE_RAMMER).
 * Expression strengths are exponentially smoothed frame to frame, then trimmed-mean averaged,
 * so you have to HOLD a mogging expression for most of the 10 seconds to earn its bonus.
 */
export function aggregerRammer(rammer: readonly RammeResultat[], minGyldige = MIN_GYLDIGE_RAMMER): SamletMaaling {
  const gyldige = rammer.filter(
    (r): r is RammeResultat & { delpoeng: DelpoengKart; total: number } => r.gyldig && !!r.delpoeng && typeof r.total === "number",
  )
  const medAnsikt = rammer.filter((r) => r.veiledning !== "ingen-ansikt")

  const snittAbsYaw = medAnsikt.length ? avrund(medAnsikt.reduce((a, r) => a + Math.abs(r.vinkel.yaw), 0) / medAnsikt.length, 1) : 0
  const snittAbsPitch = medAnsikt.length ? avrund(medAnsikt.reduce((a, r) => a + Math.abs(r.vinkel.pitch), 0) / medAnsikt.length, 1) : 0
  const snittIpdAndel = medAnsikt.length ? avrund(medAnsikt.reduce((a, r) => a + r.ipdAndel, 0) / medAnsikt.length, 3) : 0

  const raa = gyldige.map((r) => (typeof r.raaPoeng === "number" ? r.raaPoeng : regnRaaPoeng(r.delpoeng)))
  const snittRaa = raa.length ? raa.reduce((a, x) => a + x, 0) / raa.length : 0
  const stabilitet = raa.length ? avrund(klem(Math.sqrt(raa.reduce((a, x) => a + (x - snittRaa) ** 2, 0) / raa.length), 0, 10), 2) : 0

  const kvalitet: KvalitetStats = {
    antallRammer: rammer.length,
    gyldigeRammer: gyldige.length,
    snittAbsYaw,
    snittAbsPitch,
    snittIpdAndel,
    stabilitet,
  }

  if (gyldige.length < minGyldige) {
    return { ok: false, total: 0, delpoeng: tomtKart(), uttrykkBonus: 0, kvalitet }
  }

  const delpoeng = {} as DelpoengKart
  for (const info of DELPOENG_LISTE) {
    delpoeng[info.id] = avrund(trimmetSnitt(gyldige.map((r) => r.delpoeng[info.id])), 1)
  }

  let glatt: MogUttrykkStyrker | null = null
  const bonuser: number[] = []
  for (const r of gyldige) {
    glatt = glattUttrykk(glatt, r.uttrykk?.styrker ?? tommeStyrker(), LIVE_ALPHA_UTTRYKK)
    bonuser.push(bonusForStyrker(glatt))
  }
  const uttrykkBonus = avrund(trimmetSnitt(bonuser), 2)

  return {
    ok: true,
    total: regnTotal(delpoeng, uttrykkBonus),
    delpoeng,
    uttrykkBonus,
    kvalitet,
  }
}

/** Returns the sub-score ids sorted from weakest to strongest (deterministic tie-break by DELPOENG_LISTE order). */
export function svakesteDelpoeng(delpoeng: DelpoengKart): DelpoengId[] {
  return [...DELPOENG_LISTE].sort((a, b) => delpoeng[a.id] - delpoeng[b.id]).map((d) => d.id)
}

/** Formats a 0–10 score with Norwegian decimal comma (e.g. "7,4"). */
export function formaterMoggernPoeng(poeng: number): string {
  return poeng.toFixed(1).replace(".", ",")
}

/** Formats a signed bonus with Norwegian decimal comma (e.g. "+0,9", "−0,4"). */
export function formaterBonus(bonus: number): string {
  const tekst = Math.abs(bonus).toFixed(1).replace(".", ",")
  return bonus < 0 ? `−${tekst}` : `+${tekst}`
}
