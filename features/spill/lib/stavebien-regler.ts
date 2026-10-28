import type { StavebienWord } from "../data/types"

// Client-safe rules; the word list itself stays in stavebien.ts on the server.
export const LIV = 3

export function erRiktigStavet(svar: string, ord: StavebienWord) {
  const s = svar.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ")
  return [ord.word, ...(ord.alternatives ?? [])].some((o) => o.normalize("NFC").toLowerCase() === s)
}
