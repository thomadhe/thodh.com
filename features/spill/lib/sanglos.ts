// Shared constants for Sangløs (safe for client and server).

export type SangKategori = "alle" | "rock" | "hiphop"

export const SANG_KATEGORIER: { id: SangKategori; navn: string }[] = [
  { id: "alle", navn: "Alle" },
  { id: "rock", navn: "Rock" },
  { id: "hiphop", navn: "Hip hop" },
]

/** Seconds of audio unlocked per attempt (same steps as Songless). */
export const TRINN = [0.13, 0.53, 2, 8, 15] as const

export function erSangKategori(x: unknown): x is SangKategori {
  return x === "alle" || x === "rock" || x === "hiphop"
}
