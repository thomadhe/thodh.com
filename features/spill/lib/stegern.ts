// 6/7-stegern: shared rules and scoring. The answer lists live on the server.

/** The first day with a puzzle. */
export const STEGERN_START = "2026-11-02"
export const NORMALE = 5
/** Seconds per question when the clock is on. */
export const SEKUNDER = 30

export type Nivaa = 0 | 1 | 2 | 3 | 4 | 5

/** Tier 0 is a miss; 1 is what everybody says and 5 the rarest valid answers. Jumps are in decimetres. */
export const NIVAAER: Record<Nivaa, { navn: string; farge: string; emoji: string; dm: number }> = {
  0: { navn: "Bom", farge: "#f43f5e", emoji: "❌", dm: 4 },
  1: { navn: "Folkelig", farge: "#38bdf8", emoji: "🟦", dm: 30 },
  2: { navn: "Grei", farge: "#34d399", emoji: "🟩", dm: 45 },
  3: { navn: "Snedig", farge: "#fde047", emoji: "🟨", dm: 60 },
  4: { navn: "Sjelden", farge: "#fb923c", emoji: "🟧", dm: 75 },
  5: { navn: "Unikum", farge: "#e879f9", emoji: "🟪", dm: 90 },
}

/** The final counts 1.7 times, so a perfect day is exactly 67 metres. */
export const FINALE_FAKTOR = 1.7
/** Remembering your answer on question 6 is worth a 6.7 m jump. */
export const GJENTA_DM = 67

export function hoppDm(nivaa: Nivaa, finale = false) {
  return Math.round(NIVAAER[nivaa].dm * (finale ? FINALE_FAKTOR : 1))
}

export const MAKS_DM = NORMALE * hoppDm(5) + GJENTA_DM + hoppDm(5, true)

export function meter(dm: number) {
  return `${(dm / 10).toLocaleString("nb-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m`
}

/** What the server says about one answer. */
export type Vurdering = {
  nivaa: Nivaa
  /** The accepted answer the text matched, as it is shown. */
  treff: string | null
  vanligste: string[]
  sjeldneste: string[]
  antall: number
}
