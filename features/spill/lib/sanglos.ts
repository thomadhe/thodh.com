// Shared constants for Sangløs (safe for client and server).

export type SangKategori = "norsk" | "internasjonal" | "klassiker"

export const SANG_KATEGORIER: { id: SangKategori; navn: string }[] = [
  { id: "norsk", navn: "Norsk" },
  { id: "internasjonal", navn: "Internasjonalt" },
  { id: "klassiker", navn: "Klassikere" },
]

/** Seconds of audio unlocked per attempt. */
export const TRINN = [0.1, 0.5, 1, 3, 7, 15] as const

export function erSangKategori(x: unknown): x is SangKategori {
  return x === "norsk" || x === "internasjonal" || x === "klassiker"
}
