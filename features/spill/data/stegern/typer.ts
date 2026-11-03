// Question bank for 6/7-stegern. Server only: the page never imports these files.

/**
 * One open prompt with its accepted answers. `svar` lists answers in five tiers separated by "|", from the
 * most common (1) to the rarest (5); answers within a tier are separated by "," and aliases by "/" (the first
 * alias is the one shown). Country tokens: "#DE" is a country with all its names, "$DE" its capital, and
 * "@naboer:DE", "@kontinent:Afrika", "@hovedstad:Europa" and "@start:B" fill in the rest of a set in the tier
 * they stand in.
 */
export type StegernSporsmal = {
  tekst: string
  svar: string
  /** Exact matches only (no typo tolerance or inflection), for rhymes, letters and the like. */
  streng?: boolean
  /** Real words that look like an answer but are wrong, rejected even when a typo would match. */
  nei?: string
}

/** One day: five normal prompts and the final, which is only played after question 6 unlocks it. */
export type StegernDag = { sporsmal: [StegernSporsmal, StegernSporsmal, StegernSporsmal, StegernSporsmal, StegernSporsmal]; finale: StegernSporsmal }

export const sp = (tekst: string, svar: string, ekstra: Omit<Partial<StegernSporsmal>, "tekst" | "svar"> = {}): StegernSporsmal => ({ tekst, svar, ...ekstra })

export const dag = (a: StegernSporsmal, b: StegernSporsmal, c: StegernSporsmal, d: StegernSporsmal, e: StegernSporsmal, finale: StegernSporsmal): StegernDag => ({
  sporsmal: [a, b, c, d, e],
  finale,
})
