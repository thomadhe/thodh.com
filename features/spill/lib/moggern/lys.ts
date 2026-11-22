// Exposure / lighting check for Moggern.
//
// IMPORTANT: This module ONLY inspects frame-wide grayscale luminance (Rec. 709 Y) and highlight/shadow
// clipping to detect washed-out (overexposed) or too-dark (underexposed) camera feeds. It NEVER inspects
// RGB hue, chroma, or skin tone/colour, and it NEVER affects the numeric Moggern score.

export type LysStatus = "ok" | "overeksponert" | "undereksponert"

export type LysAnalyse = {
  status: LysStatus
  /** Mean grayscale luminance (0–255). */
  snittLys: number
  /** Share of pixels clipped near white (Y >= 242). */
  andelOvereksponert: number
  /** Share of pixels crushed near black (Y <= 38). */
  andelUndereksponert: number
  /** Luminance standard deviation (0–128), low values indicate flat/washed-out or pitch-black frames. */
  kontrast: number
}

export const OVEREKSPONERT_TERSKEL_Y = 242
export const UNDEREKSPONERT_TERSKEL_Y = 38

/**
 * Evaluates exposure strictly from an array of grayscale luminance values (0–255).
 * Pure and deterministic so it can be unit-tested without a browser canvas.
 */
export function analyserLuminans(luminans: ArrayLike<number>): LysAnalyse {
  const n = luminans.length
  if (n === 0) {
    return { status: "ok", snittLys: 128, andelOvereksponert: 0, andelUndereksponert: 0, kontrast: 40 }
  }

  let sum = 0
  let sumKv = 0
  let over = 0
  let under = 0

  for (let i = 0; i < n; i++) {
    const y = Math.max(0, Math.min(255, luminans[i]))
    sum += y
    sumKv += y * y
    if (y >= OVEREKSPONERT_TERSKEL_Y) over++
    if (y <= UNDEREKSPONERT_TERSKEL_Y) under++
  }

  const snittLys = sum / n
  const varians = Math.max(0, sumKv / n - snittLys * snittLys)
  const kontrast = Math.sqrt(varians)
  const andelOvereksponert = over / n
  const andelUndereksponert = under / n

  let status: LysStatus = "ok"
  if ((andelOvereksponert >= 0.28 && snittLys >= 195) || snittLys >= 218) {
    status = "overeksponert"
  } else if (snittLys <= 58 || (andelUndereksponert >= 0.65 && snittLys <= 75)) {
    status = "undereksponert"
  }

  return {
    status,
    snittLys: Math.round(snittLys * 10) / 10,
    andelOvereksponert: Math.round(andelOvereksponert * 1000) / 1000,
    andelUndereksponert: Math.round(andelUndereksponert * 1000) / 1000,
    kontrast: Math.round(kontrast * 10) / 10,
  }
}

/**
 * Converts an RGBA pixel buffer (e.g. from canvas ImageData.data) directly to Rec. 709 grayscale
 * luminance and runs the exposure check. Never inspects colour channels separately or skin tone.
 */
export function analyserRgbaLys(rgba: ArrayLike<number>, steg = 1): LysAnalyse {
  const pikselSteg = Math.max(1, Math.floor(steg))
  const antallPiksler = Math.floor(rgba.length / 4)
  if (antallPiksler === 0) return analyserLuminans([])
  const ut: number[] = []
  for (let i = 0; i < antallPiksler; i += pikselSteg) {
    const o = i * 4
    const y = 0.2126 * rgba[o] + 0.7152 * rgba[o + 1] + 0.0722 * rgba[o + 2]
    ut.push(y)
  }
  return analyserLuminans(ut)
}

/**
 * Combines multiple per-frame lighting checks from a duel into one final lighting verdict.
 * Only flags overexposed or underexposed when at least 60% of sampled frames show the issue.
 */
export function samleLysStatus(analyser: readonly LysAnalyse[]): LysStatus {
  if (analyser.length === 0) return "ok"
  let over = 0
  let under = 0
  for (const a of analyser) {
    if (a.status === "overeksponert") over++
    else if (a.status === "undereksponert") under++
  }
  if (over / analyser.length >= 0.6) return "overeksponert"
  if (under / analyser.length >= 0.6) return "undereksponert"
  return "ok"
}
