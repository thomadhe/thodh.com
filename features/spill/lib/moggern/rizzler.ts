// Pure Rizzler Finisher gesture detection, constants, and Realtime payload parsing for Moggern.
// Detects an index finger pointing at / tracing the chin, jawline, or "shush" lip zone using MediaPipe's
// 21-point Hand Landmarker together with the 478-point Face Landmarker. Runs 100% locally in the browser.

import { erHeltall, erObjekt, erTekst } from "../duell/rom"
import { PUNKTER, type Punkt3D } from "./poeng"

/** Score bonus for landing a clean Rizzler Finisher without breaking character. */
export const RIZZLER_BONUS = 0.4
/** Score penalty if the player smiles or laughs while charging the Rizzler Finisher. */
export const RIZZLER_FEIL_STRAFF = -0.3
/** How long the finger-on-jawline / shush pose must be held continuously to fire (ms). */
export const RIZZLER_HOLD_MS = 1100
/** Finisher unlocks during the final 6 seconds of a 15 s round. */
export const RIZZLER_VINDU_MS = 6000
/** Smile blendshape strength (0–1) that breaks character and triggers "Rizz failed!". */
export const RIZZLER_SMIL_TERSKEL = 0.45
/** Minimum live score to unlock the Rizzler Finisher in Solo-test mode. */
export const RIZZLER_SOLO_MIN_POENG = 6.0

const HAND_HANDLED = 0
const HAND_PEKE_PIP = 6
const HAND_PEKE_TIPP = 8
const HAND_ANDRE_TIPPER = [12, 16, 20] as const

/** Chin, jawline, and "shush" lip anchor points on the 478-point face mesh. */
const KJEVELINJE_ANKERE = [
  PUNKTER.hake,
  PUNKTER.hoyreHakeKropp,
  PUNKTER.venstreHakeKropp,
  PUNKTER.hoyreKjeveNedre,
  PUNKTER.venstreKjeveNedre,
  PUNKTER.hoyreKjeveHjorne,
  PUNKTER.venstreKjeveHjorne,
  PUNKTER.underleppeBunn,
  PUNKTER.munnMidt,
] as const

/** Max distance from index fingertip to nearest jawline/chin anchor, as a fraction of cheekbone width. */
const MAKS_AVSTAND_ANDEL = 0.34

export type RizzlerPoseResultat = {
  aktiv: boolean
  /** Closest fingertip-to-jawline distance divided by face width (lower = closer). */
  avstandAndel: number | null
}

/**
 * Checks whether any detected hand is holding an extended index finger near the chin, jawline, or lips
 * ("shush" 🤫 or jawline-trace 👉) without being a flat open palm.
 */
export function erRizzlerPose(
  hender: readonly (readonly Punkt3D[])[] | null | undefined,
  ansikt: readonly Punkt3D[] | null | undefined,
  bredde = 640,
  hoyde = 480,
): RizzlerPoseResultat {
  if (!hender?.length || !ansikt || ansikt.length < 468) {
    return { aktiv: false, avstandAndel: null }
  }
  const b = bredde > 0 ? bredde : 640
  const h = hoyde > 0 ? hoyde : 480

  const rKinn = ansikt[PUNKTER.hoyreKinnben]
  const lKinn = ansikt[PUNKTER.venstreKinnben]
  if (!rKinn || !lKinn) return { aktiv: false, avstandAndel: null }

  const ansiktBredde = Math.hypot((lKinn.x - rKinn.x) * b, (lKinn.y - rKinn.y) * h)
  if (ansiktBredde < 16) return { aktiv: false, avstandAndel: null }

  let besteAndel: number | null = null

  for (const hand of hender) {
    if (!hand || hand.length < 21) continue
    const handledd = hand[HAND_HANDLED]
    const pekePip = hand[HAND_PEKE_PIP]
    const pekeTipp = hand[HAND_PEKE_TIPP]
    if (!handledd || !pekePip || !pekeTipp) continue

    const avstand = (a: Punkt3D, c: Punkt3D) => Math.hypot((a.x - c.x) * b, (a.y - c.y) * h)

    // 1. Index finger must be extended away from the wrist past its middle joint.
    const pekeLengde = avstand(pekeTipp, handledd)
    const pipLengde = avstand(pekePip, handledd)
    if (pekeLengde < 10 || pekeLengde <= pipLengde * 1.1) continue

    // 2. At least two of middle/ring/pinky must be noticeably more curled than the index finger
    //    so waving an open hand near the face does not falsely trigger.
    let krøllet = 0
    for (const tippIdx of HAND_ANDRE_TIPPER) {
      const t = hand[tippIdx]
      if (!t) continue
      if (avstand(t, handledd) < pekeLengde * 0.9) krøllet += 1
    }
    if (krøllet < 2) continue

    // 3. Measure closest distance from index tip to any chin / jawline / shush-lip anchor.
    let minPx = Number.POSITIVE_INFINITY
    for (const ankerIdx of KJEVELINJE_ANKERE) {
      const anker = ansikt[ankerIdx]
      if (!anker) continue
      const d = avstand(pekeTipp, anker)
      if (d < minPx) minPx = d
    }

    const andel = minPx / ansiktBredde
    if (besteAndel === null || andel < besteAndel) besteAndel = andel
    if (andel <= MAKS_AVSTAND_ANDEL) {
      return { aktiv: true, avstandAndel: Math.round(andel * 1000) / 1000 }
    }
  }

  return {
    aktiv: false,
    avstandAndel: besteAndel !== null ? Math.round(besteAndel * 1000) / 1000 : null,
  }
}

/**
 * Strictly parses a finisherBonus value from a received duel report.
 * Only 0, RIZZLER_BONUS (+0.4), or RIZZLER_FEIL_STRAFF (-0.3) are accepted.
 */
export function lesFinisherBonus(x: unknown): number | null {
  if (x === undefined || x === null) return 0
  if (typeof x !== "number" || !Number.isFinite(x)) return null
  if (Math.abs(x) < 1e-6) return 0
  if (Math.abs(x - RIZZLER_BONUS) < 1e-6) return RIZZLER_BONUS
  if (Math.abs(x - RIZZLER_FEIL_STRAFF) < 1e-6) return RIZZLER_FEIL_STRAFF
  return null
}

export type RizzlerHendelse = {
  runde: number
  av: string
  type: "utlost" | "feilet"
  navn: string
}

/** Validates a live Realtime broadcast announcing a landed or failed Rizzler Finisher. */
export function lesRizzlerHendelse(x: unknown): RizzlerHendelse | null {
  if (!erObjekt(x)) return null
  if (!erHeltall(x.runde, 0, 999) || !erTekst(x.av, 40) || !x.av || !erTekst(x.navn, 24)) return null
  if (x.type !== "utlost" && x.type !== "feilet") return null
  return { runde: x.runde, av: x.av, type: x.type, navn: x.navn }
}
