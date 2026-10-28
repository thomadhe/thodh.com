// Shared data shapes for the daily games. Data files only import types from here.

export type MerEllerMindreItem = {
  /** Display name, e.g. "Taylor Swift" or "Japan". */
  name: string
  /** The compared value in `MerEllerMindreCategory.unit`. */
  value: number
  /** Optional short context shown under the name, e.g. "Film · 1994". Max ~30 chars. */
  detail?: string
  /** One emoji used as the card illustration. */
  emoji: string
}

export type MerEllerMindreCategory = {
  id: string
  /** Short Norwegian title, e.g. "Spotify-lyttere". */
  title: string
  /** Question shown above the two cards, e.g. "Hvem har flest månedlige lyttere?" */
  question: string
  /** "higher" = the larger value wins; "lower" = the smaller value wins (e.g. "Hva kom først?"). */
  winner: "higher" | "lower"
  /** How values are formatted. */
  format: "integer" | "decimal" | "year" | "compact"
  /** Unit label appended after the value, e.g. "lyttere", "moh.", "kcal". Empty string for none. */
  unit: string
  /**
   * Minimum separation for a pair to be used, so that approximate data never decides a round.
   * For ratio: larger / smaller must be >= value. For difference: |a - b| must be >= value.
   */
  separation: { kind: "ratio" | "difference"; value: number }
  /** Short source and freshness note shown in the UI. */
  source: string
  items: MerEllerMindreItem[]
}

export type StavebienWord = {
  /** Correct Bokmål spelling, lowercase unless a proper noun. */
  word: string
  /** 1 (easy) to 5 (very hard). */
  level: 1 | 2 | 3 | 4 | 5
  /** Short original Norwegian definition that does not contain the word itself. */
  definition: string
  /** Original example sentence. Use "___" where the word appears. */
  sentence: string
  /** Short origin note, e.g. "Fra fransk". */
  origin: string
  /** Common accepted alternative Bokmål spellings, if any. */
  alternatives?: string[]
}

export type SanglosSong = {
  /** Stable id, kebab-case: "a-ha-take-on-me". */
  id: string
  title: string
  artist: string
  year: number
  /** Apple iTunes trackId with a working preview (verified with the lookup API, country=no). */
  trackId: number
  category: "norsk" | "internasjonal" | "klassiker"
}
