/** Daily games: one puzzle per day, with calendar and stored results. */
export type SpillId = "mer-eller-mindre" | "anelseslos" | "stavebien" | "sanglos" | "omriss" | "canvas"
/** Free-play quizzes without a daily puzzle. */
export type QuizId = "verdens-land" | "hovedsteder"

export type Spill<Id extends string = SpillId> = {
  id: Id
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
    kort: "Hva er størst?",
    regel: "Velg den som har mest. Fem kategorier, fem runder.",
    ikon: "⇅",
    farge: "bg-emerald-600 text-white",
  },
  {
    id: "anelseslos",
    navn: "Anelsesløs",
    href: "/spill/anelseslos",
    kort: "Finn det hemmelige ordet.",
    regel: "Gjett engelske ord. Tallet viser hvor nær du er – 1 er riktig.",
    ikon: "?",
    farge: "bg-amber-500 text-neutral-950",
  },
  {
    id: "stavebien",
    navn: "Stavebien",
    href: "/spill/stavebien",
    kort: "Hør ordet. Stav det.",
    regel: "Fem engelske ord, fra lett til vanskelig. Tre liv.",
    ikon: "Aa",
    farge: "bg-yellow-300 text-neutral-950",
  },
  {
    id: "sanglos",
    navn: "Sangløs",
    href: "/spill/sanglos",
    kort: "Kjenner du låta på 0,13 sekunder?",
    regel: "Gjett låta. Hver feil gir deg litt mer av den.",
    ikon: "♪",
    farge: "bg-violet-600 text-white",
  },
  {
    id: "omriss",
    navn: "Omriss",
    href: "/spill/omriss",
    kort: "Hvilket land er dette?",
    regel: "Gjett landet ut fra formen. Seks forsøk, med avstand og retning som hint.",
    ikon: "◆",
    farge: "bg-sky-500 text-neutral-950",
  },
  {
    id: "canvas",
    navn: "Canvas",
    href: "/spill/canvas",
    kort: "Hvilket flagg skjuler seg bak rutene?",
    regel: "Gjett landet bak flagget. Første gjetning er i blinde, og for hvert feil svar åpner flere ruter seg. Seks forsøk.",
    ikon: "▦",
    farge: "bg-rose-500 text-white",
  },
]

export const quizer: Spill<QuizId>[] = [
  {
    id: "verdens-land",
    navn: "Verdens land",
    href: "/spill/verdens-land",
    kort: "Hvor mange av verdens 197 land klarer du?",
    regel: "Skriv land. 15 minutter.",
    ikon: "◍",
    farge: "bg-cyan-400 text-neutral-950",
  },
  {
    id: "hovedsteder",
    navn: "Hovedsteder",
    href: "/spill/hovedsteder",
    kort: "Hovedstaden i alle verdens land.",
    regel: "Skriv hovedsteder. 15 minutter.",
    ikon: "★",
    farge: "bg-fuchsia-400 text-neutral-950",
  },
]

export function finnSpill(id: SpillId | QuizId): Spill<SpillId | QuizId> {
  return [...spill, ...quizer].find((s) => s.id === id)!
}
