// Shared "how close are you" colours (Clueless-style): red → orange → yellow → green, blending smoothly.

/** Points of [input, hue]; inputs must be increasing. Linear between points, clamped at the ends. */
export type Fargeanker = [number, number][]

export function fargetone(anker: Fargeanker, x: number) {
  if (x <= anker[0][0]) return anker[0][1]
  for (let i = 1; i < anker.length; i++) {
    const [x1, h1] = anker[i]
    const [x0, h0] = anker[i - 1]
    if (x <= x1) return h0 + ((x - x0) / (x1 - x0)) * (h1 - h0)
  }
  return anker[anker.length - 1][1]
}

/** Saturated enough to read as red/orange/yellow/green on the dark game pages, dark enough for white text. */
export function naerhetsfarge(hue: number) {
  // Yellows look washed out at the same lightness, so they get a touch more saturation.
  const metning = hue > 40 && hue < 70 ? 72 : 62
  return `hsl(${hue.toFixed(0)} ${metning}% 42%)`
}
