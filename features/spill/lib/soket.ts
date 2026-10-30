// Søket (our Searchle): guess the word that completes a search, Wordle-style. Client-safe helpers.

export const SOKET_FORSOK = 6

/** "riktig" = right letter, right place; "plass" = in the word, elsewhere; "ikke" = not in the word. */
export type Bokstavsvar = "riktig" | "plass" | "ikke"

export const normaliserSok = (s: string) => s.normalize("NFC").trim().toLowerCase()

/** Wordle colouring with correct handling of repeated letters (greens first, then yellows from what is left). */
export function vurderOrd(svar: string, gjett: string): Bokstavsvar[] {
  const fasit = [...svar]
  const ord = [...gjett]
  const ut: Bokstavsvar[] = ord.map(() => "ikke")
  const igjen = new Map<string, number>()
  ord.forEach((b, i) => {
    if (fasit[i] === b) ut[i] = "riktig"
    else igjen.set(fasit[i], (igjen.get(fasit[i]) ?? 0) + 1)
  })
  ord.forEach((b, i) => {
    if (ut[i] === "riktig") return
    const n = igjen.get(b) ?? 0
    if (n > 0) {
      ut[i] = "plass"
      igjen.set(b, n - 1)
    }
  })
  return ut
}
