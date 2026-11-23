// Pure Rizzler Finisher gesture detection, constants, and Realtime payload parsing for Moggern.
// Detects an index finger pointing at / tracing the chin, jawline, or "shush" lip zone using MediaPipe's
// 21-point Hand Landmarker together with the 478-point Face Landmarker. Runs 100% locally in the browser.

import { erHeltall, erObjekt, erTekst } from "../duell/rom"
import { PUNKTER, type Punkt3D } from "./poeng"

/** Score bonus for landing a clean Rizzler Finisher without breaking character. */
export const RIZZLER_BONUS = 0.4
/** Score penalty if the player smiles or laughs while charging the Rizzler Finisher. */
export const RIZZLER_FEIL_STRAFF = -0.3
/** How long the finger-on-jawline / shush pose must be held to fire (ms). */
export const RIZZLER_HOLD_MS = 650
/** Grace period (ms) for transient MediaPipe hand-tracking flickers before resetting the charge bar. */
export const RIZZLER_GLIPP_MS = 650
/** Finisher unlocks for everyone during the final 7 seconds of a 15 s round (even when trailing). */
export const RIZZLER_VINDU_MS = 7000
/** Smile blendshape strength (0–1) that breaks character and triggers "Rizz failed!". */
export const RIZZLER_SMIL_TERSKEL = 0.55
/** Minimum live score to unlock the Rizzler Finisher in Solo-test mode (0 = always unlocked in final window). */
export const RIZZLER_SOLO_MIN_POENG = 0

const HAND_HANDLED = 0
const HAND_PEKE_MCP = 5
const HAND_PEKE_PIP = 6
const HAND_PEKE_TIPP = 8
const HAND_ANDRE_TIPPER = [12, 16, 20] as const

/** Chin, jawline, cheek-jaw, and "shush" lip/nose anchor points on the 478-point face mesh. */
const KJEVELINJE_ANKERE = [
  PUNKTER.hake,
  PUNKTER.hoyreHakeKropp,
  PUNKTER.venstreHakeKropp,
  PUNKTER.hoyreKjeveNedre,
  PUNKTER.venstreKjeveNedre,
  PUNKTER.hoyreKjeveHjorne,
  PUNKTER.venstreKjeveHjorne,
  PUNKTER.underleppeBunn,
  PUNKTER.overleppeTopp,
  PUNKTER.munnMidt,
  PUNKTER.hoyreMunnvik,
  PUNKTER.venstreMunnvik,
  PUNKTER.neseTipp,
  PUNKTER.hoyreKinnben,
  PUNKTER.venstreKinnben,
] as const

/** Max distance from index fingertip to nearest jawline/chin/lip anchor, as a fraction of cheekbone width. */
const MAKS_AVSTAND_ANDEL = 0.52

export type RizzlerPoseResultat = {
  aktiv: boolean
  /** Closest fingertip-to-jawline distance divided by face width (lower = closer). */
  avstandAndel: number | null
}

/**
 * Checks whether any detected hand is holding an extended index finger (or 2-finger jawline trace)
 * near the chin, jawline, or lips ("shush" 🤫 or jawline-trace 👉) without being a flat open palm.
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
    const pekeMcp = hand[HAND_PEKE_MCP]
    const pekePip = hand[HAND_PEKE_PIP]
    const pekeTipp = hand[HAND_PEKE_TIPP]
    if (!handledd || !pekePip || !pekeTipp) continue

    const avstand2D = (a: Punkt3D, c: Punkt3D) => Math.hypot((a.x - c.x) * b, (a.y - c.y) * h)
    const avstand3D = (a: Punkt3D, c: Punkt3D) =>
      Math.hypot((a.x - c.x) * b, (a.y - c.y) * h, ((a.z ?? 0) - (c.z ?? 0)) * b)

    // 1. Index finger must be extended (checks 3D length too so pointing straight toward the chin/camera still locks on).
    const pekeLengde = avstand3D(pekeTipp, handledd)
    const pipLengde = avstand3D(pekePip, handledd)
    const utstraktFraHandledd = pekeLengde >= 8 && pekeLengde > pipLengde * 1.02
    const utstraktFraKnoke =
      !!pekeMcp && avstand3D(pekeTipp, pekeMcp) > avstand3D(pekePip, pekeMcp) * 1.08
    if (!utstraktFraHandledd && !utstraktFraKnoke) continue

    // 2. Reject a flat open palm (all three of middle/ring/pinky stretched as far as the index finger),
    //    while allowing both 1-finger shush/point and 2-finger jawline trace.
    let krollet = 0
    for (const tippIdx of HAND_ANDRE_TIPPER) {
      const t = hand[tippIdx]
      if (!t) continue
      if (avstand3D(t, handledd) < pekeLengde * 0.95) krollet += 1
    }
    if (krollet < 2) continue

    // 3. Measure closest 2D screen distance from index tip to any chin / jawline / shush-lip anchor.
    let minPx = Number.POSITIVE_INFINITY
    for (const ankerIdx of KJEVELINJE_ANKERE) {
      const anker = ansikt[ankerIdx]
      if (!anker) continue
      const d = avstand2D(pekeTipp, anker)
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
