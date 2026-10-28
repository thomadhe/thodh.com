export type SpillId = "mer-eller-mindre" | "anelseslos" | "stavebien" | "sanglos"

export type Spill = {
  id: SpillId
  navn: string
  href: string
  kort: string
  regel: string
  ikon: string
  /** Tailwind classes for the game's accent tile. */
  farge: string
}

export const spill: Spill[] = [
  {
    id: "mer-eller-mindre",
    navn: "Mer eller mindre",
    href: "/spill/mer-eller-mindre",
    kort: "Hva er størst? Ikke tenk for lenge.",
    regel: "Velg det alternativet som har mest. Fem kategorier, fem runder i hver.",
    ikon: "⇅",
    farge: "bg-emerald-600 text-white",
  },
  {
    id: "anelseslos",
    navn: "Anelsesløs",
    href: "/spill/anelseslos",
    kort: "Finn det hemmelige engelske ordet. Hver gjetning bringer deg nærmere.",
    regel: "Skriv et engelsk ord. Tallet viser hvor langt unna betydningen er det hemmelige ordet – 1 er riktig.",
    ikon: "?",
    farge: "bg-amber-500 text-neutral-950",
  },
  {
    id: "stavebien",
    navn: "Stavebien",
    href: "/spill/stavebien",
    kort: "Hør ordet og stav det riktig. Det blir vanskeligere.",
    regel: "Lytt til ordet og skriv det. Fem ord, ett fra hvert nivå, og tre liv.",
    ikon: "Æ",
    farge: "bg-yellow-300 text-neutral-950",
  },
  {
    id: "sanglos",
    navn: "Sangløs",
    href: "/spill/sanglos",
    kort: "Du kan denne sangen – men klarer du den på 0,13 sekunder?",
    regel: "Lytt til et lite utdrag og gjett sangen. Hver feil eller hopp låser opp mer av låta.",
    ikon: "♪",
    farge: "bg-violet-600 text-white",
  },
]

export function finnSpill(id: SpillId) {
  return spill.find((s) => s.id === id)!
}
