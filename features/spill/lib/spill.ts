/** Daily games: one puzzle per day, with calendar and stored results. */
export type SpillId = "mer-eller-mindre" | "anelseslos" | "stavebien" | "sanglos" | "omriss" | "canvas" | "soket" | "emovi" | "rusle" | "tilkoblinger" | "havet" | "heksagonal-jakt" | "67-stegern" | "gjettelos"
/** Free-play quizzes without a daily puzzle. */
export type QuizId = "verdens-land" | "hovedsteder"
/** Standalone multiplayer duels without a daily puzzle. */
export type DuellSpillId = "moggern"

export type Spill<Id extends string = SpillId> = {
  id: Id
  navn: string
  href: string
  kort: string
  regel: string
  en: {
    navn: string
    kort: string
    regel: string
  }
  /** True when the underlying daily puzzle prompts/answers are in Norwegian. */
  norskInnhold?: true
  ikon: string
  /** Tailwind classes for the game's accent tile. */
  farge: string
  /** First day with a puzzle, for games that came after the shared START_DATO. */
  start?: string
}

export const spill: Spill[] = [
  {
    id: "mer-eller-mindre",
    navn: "Mer eller mindre",
    href: "/spill/mer-eller-mindre",
    kort: "Hva er størst?",
    regel: "Velg den som har mest. Fem kategorier, fem runder.",
    en: {
      navn: "More or Less",
      kort: "Which one is bigger?",
      regel: "Pick the higher one. Five categories, five rounds.",
    },
    norskInnhold: true,
    ikon: "⇅",
    farge: "bg-emerald-600 text-white",
  },
  {
    id: "anelseslos",
    navn: "Anelsesløs",
    href: "/spill/anelseslos",
    kort: "Finn det hemmelige ordet.",
    regel: "Gjett engelske ord. Tallet viser hvor nær du er – 1 er riktig.",
    en: {
      navn: "Clueless",
      kort: "Find the secret word.",
      regel: "Guess English words. The number shows how close you are — 1 is the answer.",
    },
    ikon: "?",
    farge: "bg-amber-500 text-neutral-950",
  },
  {
    id: "stavebien",
    navn: "Stavebien",
    href: "/spill/stavebien",
    kort: "Hør ordet. Stav det.",
    regel: "Fem engelske ord, fra lett til vanskelig. Tre liv.",
    en: {
      navn: "Spelling Bee",
      kort: "Hear the word. Spell it.",
      regel: "Five English words, from easy to hard. Three lives.",
    },
    ikon: "Aa",
    farge: "bg-yellow-300 text-neutral-950",
  },
  {
    id: "sanglos",
    navn: "Sangløs",
    href: "/spill/sanglos",
    kort: "Kjenner du låta på 0,13 sekunder?",
    regel: "Gjett låta. Hver feil gir deg litt mer av den.",
    en: {
      navn: "Songless",
      kort: "Name the song in 0.13 seconds?",
      regel: "Guess the track. Each miss unlocks a bit more of it.",
    },
    ikon: "♪",
    farge: "bg-violet-600 text-white",
  },
  {
    id: "omriss",
    navn: "Omriss",
    href: "/spill/omriss",
    kort: "Hvilket land er dette?",
    regel: "Gjett landet ut fra formen. Seks forsøk, med avstand og retning som hint.",
    en: {
      navn: "Outline",
      kort: "Which country is this?",
      regel: "Guess the country from its silhouette. Six tries, with distance and direction hints.",
    },
    ikon: "◆",
    farge: "bg-sky-500 text-neutral-950",
  },
  {
    id: "canvas",
    navn: "Canvas",
    href: "/spill/canvas",
    kort: "Hvilket flagg skjuler seg bak rutene?",
    regel: "Gjett landet bak flagget. Første gjetning er i blinde, og for hvert feil svar åpner flere ruter seg. Seks forsøk.",
    en: {
      navn: "Canvas",
      kort: "Which flag hides behind the tiles?",
      regel: "Guess the country behind the flag. Your first guess is blind, and each miss reveals more tiles. Six tries.",
    },
    ikon: "▦",
    farge: "bg-rose-500 text-white",
  },
  {
    id: "soket",
    navn: "Søket",
    href: "/spill/soket",
    kort: "Hva søker folk egentlig etter?",
    regel: "Gjett ordet som fullfører søket. Grønt og gult som i Wordle, seks forsøk.",
    en: {
      navn: "The Search",
      kort: "What are people actually searching for?",
      regel: "Guess the word that completes the search query. Green and yellow like Wordle, six tries.",
    },
    norskInnhold: true,
    ikon: "⌕",
    farge: "bg-blue-500 text-white",
  },
  {
    id: "emovi",
    navn: "Emovi",
    href: "/spill/emovi",
    kort: "Fem emojier, én film.",
    regel: "Gjett filmen. Tre liv: feil svar og hint koster ett liv hver.",
    en: {
      navn: "Emovi",
      kort: "Five emojis, one movie.",
      regel: "Guess the movie. Three lives: wrong guesses and hints cost one life each.",
    },
    ikon: "🎬",
    farge: "bg-orange-400 text-neutral-950",
  },
  {
    id: "rusle",
    navn: "Rusle",
    href: "/spill/rusle",
    kort: "Fra ett land til et annet, over landegrensene.",
    regel: "Nevn landene imellom. Jo nærmere korteste vei, jo bedre.",
    en: {
      navn: "Wander",
      kort: "Travel from one country to another across land borders.",
      regel: "Name the countries in between. Closer to the shortest path scores higher.",
    },
    ikon: "↝",
    farge: "bg-teal-500 text-neutral-950",
  },
  {
    id: "tilkoblinger",
    navn: "Tilkoblinger",
    href: "/spill/tilkoblinger",
    kort: "Seksten ruter, fire grupper.",
    regel: "Finn fire grupper på fire: ett land vist på fire måter, eller fire land med noe til felles. Fire feil, og det er over.",
    en: {
      navn: "Connections",
      kort: "Sixteen tiles, four groups.",
      regel: "Find four groups of four: one country shown four ways, or four countries with something in common. Four mistakes and it's over.",
    },
    norskInnhold: true,
    ikon: "▤",
    farge: "bg-fuchsia-500 text-white",
  },
  {
    id: "havet",
    navn: "Havet",
    href: "/spill/havet",
    kort: "Ni land, ni kategorier. Hvor passer de best?",
    regel: "Plasser hvert land i en kategori. Hver kategori brukes én gang, og du kan ikke angre.",
    en: {
      navn: "The Ocean",
      kort: "Nine countries, nine categories. Where do they fit best?",
      regel: "Assign each country to a category. Every category is used once, with no undo.",
    },
    norskInnhold: true,
    ikon: "≋",
    farge: "bg-blue-600 text-white",
  },
  {
    id: "heksagonal-jakt",
    navn: "Heksagonal jakt",
    href: "/spill/heksagonal-jakt",
    kort: "Finn stedene på kartet.",
    regel: "Trykk på sekskanten der stedet ligger. Varmt eller kaldt forteller hvor nær du er.",
    en: {
      navn: "Hex Hunt",
      kort: "Find the places on the map.",
      regel: "Tap the hexagon where the place is located. Hot or cold tells you how close you are.",
    },
    norskInnhold: true,
    ikon: "⬢",
    farge: "bg-orange-500 text-white",
  },
  {
    id: "67-stegern",
    navn: "6/7-stegern",
    href: "/spill/67-stegern",
    kort: "Sjeldne svar, lange hopp.",
    regel: "Nevn noe som passer. Jo sjeldnere svaret er, jo lengre hopper Stegern. Husker du svaret ditt når spørsmål 6 spør, får du en finale.",
    en: {
      navn: "6/7-Stegern",
      kort: "Rare answers, long leaps.",
      regel: "Name something that fits. The rarer the answer, the further Stegern leaps. Remember your answer for question 6 to reach the finale.",
    },
    norskInnhold: true,
    ikon: "67",
    farge: "bg-[#2b2d31] text-lime-400",
    start: "2026-11-02",
  },
  {
    id: "gjettelos",
    navn: "Gjetteløs",
    href: "/spill/gjettelos",
    kort: "Hvor mange? Hvor høy? Hvilket år?",
    regel: "Fem tallspørsmål. Gjett så nær du kan: riktig gir 100 poeng, dobbelt eller halvparten 74,6, og 10× bom 26,4.",
    en: {
      navn: "Guessless",
      kort: "How many? How tall? What year?",
      regel: "Five number questions. Guess as close as you can: exact gives 100 points, double or half gives 74.6, and 10× off gives 26.4.",
    },
    norskInnhold: true,
    ikon: "≈",
    farge: "bg-indigo-400 text-neutral-950",
    start: "2026-11-16",
  },
]

export const quizer: Spill<QuizId>[] = [
  {
    id: "verdens-land",
    navn: "Verdens land",
    href: "/spill/verdens-land",
    kort: "Hvor mange av verdens 197 land klarer du?",
    regel: "Skriv land. 15 minutter.",
    en: {
      navn: "World Countries",
      kort: "How many of the world's 197 countries can you name?",
      regel: "Type countries. 15 minutes.",
    },
    ikon: "◍",
    farge: "bg-cyan-400 text-neutral-950",
  },
  {
    id: "hovedsteder",
    navn: "Hovedsteder",
    href: "/spill/hovedsteder",
    kort: "Hovedstaden i alle verdens land.",
    regel: "Skriv hovedsteder. 15 minutter.",
    en: {
      navn: "Capitals",
      kort: "The capital of every country in the world.",
      regel: "Type capitals. 15 minutes.",
    },
    ikon: "★",
    farge: "bg-fuchsia-400 text-neutral-950",
  },
]

export const duellSpill: Spill<DuellSpillId>[] = [
  {
    id: "moggern",
    navn: "Moggern",
    href: "/spill/moggern",
    kort: "1v1 kameraduell med venner.",
    regel: "Gå inn i et privat rom med én venn, slå på kameraet og hold blikket i 15 sekunder. Alt er tull, video går direkte mellom nettleserne og ingenting lagres.",
    en: {
      navn: "Moggern",
      kort: "1v1 camera duel with friends.",
      regel: "Join a private room with a friend, turn on your camera, and hold eye contact for 15 seconds. It's all for laughs — video goes directly between browsers and nothing is stored.",
    },
    ikon: "◈",
    farge: "bg-lime-400 text-neutral-950",
  },
]

export function finnSpill(id: SpillId | QuizId | DuellSpillId): Spill<SpillId | QuizId | DuellSpillId> {
  return [...spill, ...quizer, ...duellSpill].find((s) => s.id === id)!
}

export function spillTekst(s: Spill<SpillId | QuizId | DuellSpillId>, sprak: "no" | "en") {
  return sprak === "en" ? s.en : { navn: s.navn, kort: s.kort, regel: s.regel }
}
