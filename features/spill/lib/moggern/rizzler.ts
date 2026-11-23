// Pure Rizzler Finisher gesture detection, constants, and Realtime payload parsing for Moggern.
// Detects an index finger pointing at / tracing the chin, jawline, or "shush" lip zone using MediaPipe's
// 21-point Hand Landmarker together with the 478-point Face Landmarker. Runs 100% locally in the browser.

import { erHeltall, erObjekt, erTekst } from "../duell/rom"
import { PUNKTER, type Punkt3D } from "./poeng"

/** Score bonus (+0.2) for landing a clean Rizzler Finisher on top of the locked total score. */
export const RIZZLER_BONUS = 0.2
/** Score penalty if the player smiles or laughs while charging the Rizzler Finisher. */
export const RIZZLER_FEIL_STRAFF = -0.3
/** How long the finger-on-jawline / shush pose must be held continuously to fire (ms). */
export const RIZZLER_HOLD_MS = 950
/** Brief grace period (ms) for single-frame hand-tracking hiccups before resetting charge. */
export const RIZZLER_GLIPP_MS = 380
/** Finisher unlocks at 13 seconds elapsed in a 15 s round (final 2 seconds remaining). */
export const RIZZLER_VINDU_MS = 2000
/** Heads-up countdown shown 3 seconds before unlock (from 10 s to 13 s elapsed) when qualified. */
export const RIZZLER_FORVARSEL_MS = 5000
/** Extra grace time (ms) past 15 s if the player already started charging the Rizzler before time expired. */
export const RIZZLER_EKSTRATID_MS = 2000
/** Smile blendshape strength (0–1) that breaks character and triggers "Rizz failed!". */
export const RIZZLER_SMIL_TERSKEL = 0.48
/** Minimum live score to qualify for the Rizzler Finisher in Solo-test mode. */
export const RIZZLER_SOLO_MIN_POENG = 6.0

const HAND_HANDLED = 0
const HAND_PEKE_MCP = 5
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
  PUNKTER.overleppeTopp,
  PUNKTER.munnMidt,
  PUNKTER.hoyreMunnvik,
  PUNKTER.venstreMunnvik,
] as const

/** Max distance from index fingertip to nearest jawline/chin/lip anchor, as a fraction of cheekbone width. */
const MAKS_AVSTAND_ANDEL = 0.4

export type RizzlerPoseStatus = "aktiv" | "for-langt-unna" | "aapen-hand" | "ingen-hand"

export type RizzlerPoseResultat = {
  aktiv: boolean
  status: RizzlerPoseStatus
  /** Closest fingertip-to-jawline distance divided by face width (lower = closer). */
  avstandAndel: number | null
  /** Best detected index fingertip [0, 1] for rendering the live visual guide on the camera tile. */
  pekeTipp: Punkt3D | null
}

/**
 * Checks whether any detected hand is holding an extended index finger (or 2-finger jawline trace)
 * near the chin, jawline, or lips ("shush" 🤫 or jawline-trace 👉) without being a flat open palm.
 * Also returns actionable status + fingertip position so the UI can visually guide hand placement.
 */
export function erRizzlerPose(
  hender: readonly (readonly Punkt3D[])[] | null | undefined,
  ansikt: readonly Punkt3D[] | null | undefined,
  bredde = 640,
  hoyde = 480,
): RizzlerPoseResultat {
  if (!hender?.length || !ansikt || ansikt.length < 468) {
    return { aktiv: false, status: "ingen-hand", avstandAndel: null, pekeTipp: null }
  }
  const b = bredde > 0 ? bredde : 640
  const h = hoyde > 0 ? hoyde : 480

  const rKinn = ansikt[PUNKTER.hoyreKinnben]
  const lKinn = ansikt[PUNKTER.venstreKinnben]
  if (!rKinn || !lKinn) {
    return { aktiv: false, status: "ingen-hand", avstandAndel: null, pekeTipp: null }
  }

  const ansiktBredde = Math.hypot((lKinn.x - rKinn.x) * b, (lKinn.y - rKinn.y) * h)
  if (ansiktBredde < 16) {
    return { aktiv: false, status: "ingen-hand", avstandAndel: null, pekeTipp: null }
  }

  let besteAndel: number | null = null
  let besteTipp: Punkt3D | null = null
  let settAapenHand = false
  let aapenTipp: Punkt3D | null = null

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
    const utstraktFraHandledd = pekeLengde >= 9 && pekeLengde > pipLengde * 1.04
    const utstraktFraKnoke =
      !!pekeMcp && avstand3D(pekeTipp, pekeMcp) > avstand3D(pekePip, pekeMcp) * 1.1
    if (!utstraktFraHandledd && !utstraktFraKnoke) continue

    // 2. Reject a flat open palm (all three of middle/ring/pinky stretched as far as the index finger),
    //    while allowing both 1-finger shush/point and 2-finger jawline trace.
    let krollet = 0
    for (const tippIdx of HAND_ANDRE_TIPPER) {
      const t = hand[tippIdx]
      if (!t) continue
      if (avstand3D(t, handledd) < pekeLengde * 0.93) krollet += 1
    }
    if (krollet < 2) {
      settAapenHand = true
      aapenTipp ??= pekeTipp
      continue
    }

    // 3. Measure closest 2D screen distance from index tip to any chin / jawline / shush-lip anchor.
    let minPx = Number.POSITIVE_INFINITY
    for (const ankerIdx of KJEVELINJE_ANKERE) {
      const anker = ansikt[ankerIdx]
      if (!anker) continue
      const d = avstand2D(pekeTipp, anker)
      if (d < minPx) minPx = d
    }

    const andel = minPx / ansiktBredde
    if (besteAndel === null || andel < besteAndel) {
      besteAndel = andel
      besteTipp = pekeTipp
    }
    if (andel <= MAKS_AVSTAND_ANDEL) {
      return {
        aktiv: true,
        status: "aktiv",
        avstandAndel: Math.round(andel * 1000) / 1000,
        pekeTipp,
      }
    }
  }

  if (besteAndel !== null) {
    return {
      aktiv: false,
      status: "for-langt-unna",
      avstandAndel: Math.round(besteAndel * 1000) / 1000,
      pekeTipp: besteTipp,
    }
  }

  if (settAapenHand) {
    return { aktiv: false, status: "aapen-hand", avstandAndel: null, pekeTipp: aapenTipp }
  }

  return { aktiv: false, status: "ingen-hand", avstandAndel: null, pekeTipp: null }
}

/**
 * Strictly parses a finisherBonus value from a received duel report.
 * Only 0, RIZZLER_BONUS (+0.2), or RIZZLER_FEIL_STRAFF (-0.3) are accepted.
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
  type: "start" | "utlost" | "feilet"
  navn: string
}

/** Validates a live Realtime broadcast announcing a started (score-locked), landed, or failed Rizzler Finisher. */
export function lesRizzlerHendelse(x: unknown): RizzlerHendelse | null {
  if (!erObjekt(x)) return null
  if (!erHeltall(x.runde, 0, 999) || !erTekst(x.av, 40) || !x.av || !erTekst(x.navn, 24)) return null
  if (x.type !== "start" && x.type !== "utlost" && x.type !== "feilet") return null
  return { runde: x.runde, av: x.av, type: x.type, navn: x.navn }
}
