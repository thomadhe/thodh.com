// Rank titles, win lines, practical "Slik mogger du mer" tips, and playful over-the-top roasts ("disser")
// for Moggern. Selection is 100% deterministic from a duel seed so both players see the exact same lines.

import type { LysStatus } from "./lys"
import { formaterMoggernPoeng, svakesteDelpoeng, type DelpoengId, type DelpoengKart, type KvalitetStats } from "./poeng"

export type RangTittel = {
  id: string
  tittel: string
  minPoeng: number
  maksPoeng: number
  linje: string
  /** Tailwind accent badge classes for the reveal card. */
  farge: string
}

/**
 * Exact 8 rank titles mapped from total 0–10 score (rounded to 1 decimal).
 * 0–2,9: Bjeffern · 3–3,9: Chopped · 4–4,9: Venstredude · 5–5,9: Normie ·
 * 6–6,9: Mid-mogger · 7–7,9: Aura-farmer · 8–8,9: Sheeshern · 9+: Gigamogger
 */
export const RANG_TITLER: readonly RangTittel[] = [
  {
    id: "gigamogger",
    tittel: "Gigamogger",
    minPoeng: 9.0,
    maksPoeng: 10.0,
    linje: "Kameraet knelte og ba om autograf. Ren statistisk anomalitet.",
    farge: "bg-lime-400 text-neutral-950",
  },
  {
    id: "sheeshern",
    tittel: "Sheeshern",
    minPoeng: 8.0,
    maksPoeng: 8.9,
    linje: "Sheesh. Linsa måtte blunke to ganger for å sjekke om det var filter.",
    farge: "bg-emerald-400 text-neutral-950",
  },
  {
    id: "aura-farmer",
    tittel: "Aura-farmer",
    minPoeng: 7.0,
    maksPoeng: 7.9,
    linje: "Høster aura uten å prøve engang. Solid kjeve-til-lys-forhold.",
    farge: "bg-cyan-400 text-neutral-950",
  },
  {
    id: "mid-mogger",
    tittel: "Mid-mogger",
    minPoeng: 6.0,
    maksPoeng: 6.9,
    linje: "Over snittet i vennegjengen, men ikke si opp dagjobben helt ennå.",
    farge: "bg-sky-400 text-neutral-950",
  },
  {
    id: "normie",
    tittel: "Normie",
    minPoeng: 5.0,
    maksPoeng: 5.9,
    linje: "Trygg, klassisk, og akkurat midt på treet. Det finnes håp i godt lys.",
    farge: "bg-amber-300 text-neutral-950",
  },
  {
    id: "venstredude",
    tittel: "Venstredude",
    minPoeng: 4.0,
    maksPoeng: 4.9,
    linje: "Litt skjev vinkel eller litt sliten tirsdag? Vi skylder på webkameraet.",
    farge: "bg-orange-400 text-neutral-950",
  },
  {
    id: "chopped",
    tittel: "Chopped",
    minPoeng: 3.0,
    maksPoeng: 3.9,
    linje: "Huff da. Kalkulatoren trenger et øyeblikk for seg selv etter denne runden.",
    farge: "bg-rose-400 text-neutral-950",
  },
  {
    id: "bjeffern",
    tittel: "Bjeffern",
    minPoeng: 0.0,
    maksPoeng: 2.9,
    linje: "Voff. Enten gjorde du grimase med vilje, eller så er kameraet montert i gulvet.",
    farge: "bg-red-500 text-white",
  },
] as const

/** Returns the rank title for a 0–10 total score. */
export function rangForPoeng(poeng: number): RangTittel {
  const avrundet = Math.round(Math.max(0, Math.min(10, poeng)) * 10) / 10
  for (const r of RANG_TITLER) {
    if (avrundet >= r.minPoeng) return r
  }
  return RANG_TITLER[RANG_TITLER.length - 1]
}

/** Deterministic FNV-1a 32-bit hash for seeded tips & roast picks. */
export function hashFro(tekst: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function velgMedFro<T>(liste: readonly T[], fro: string): T {
  return liste[hashFro(fro) % liste.length]
}

/** Win line shown prominently on the result screen, e.g. "Ola mogget Kari med 1,4 poeng". */
export function vinnerLinje(
  spillerA: { navn: string; poeng: number },
  spillerB: { navn: string; poeng: number },
): string {
  const diff = Math.round(Math.abs(spillerA.poeng - spillerB.poeng) * 10) / 10
  if (diff < 0.1) {
    return `Uavgjort! ${spillerA.navn} og ${spillerB.navn} landet på eksakt ${formaterMoggernPoeng(spillerA.poeng)} poeng.`
  }
  const [vinner, taper] = spillerA.poeng > spillerB.poeng ? [spillerA, spillerB] : [spillerB, spillerA]
  const diffTekst = formaterMoggernPoeng(diff)
  if (diff >= 2.5) {
    return `${vinner.navn} total-mogget ${taper.navn} med ${diffTekst} poeng.`
  }
  if (diff <= 0.3) {
    return `${vinner.navn} snek seg forbi og mogget ${taper.navn} med ${diffTekst} poeng.`
  }
  return `${vinner.navn} mogget ${taper.navn} med ${diffTekst} poeng.`
}

// ---- Practical tips ("Slik mogger du mer") ----

const PRAKTISKE_TIPS_PER_DELPOENG: Record<DelpoengId, readonly string[]> = {
  symmetri: [
    "Plasser lyset rett forfra (vindu eller lampe bak skjermen) — sidelys får ansiktet til å se skjevere ut for kameraet.",
    "Rett opp skuldre og nakke så hodet ikke lener litt mot den ene siden.",
    "Et avslappet, nøytralt uttrykk eller et lite, jevnt smil gir mye jevnere måling enn å heve ett øyenbryn.",
  ],
  oyevinkel: [
    "Løft kameraet opp i øyehøyde eller ørlite over — kamera nedenfra får øyevinkelen til å falle.",
    "Slapp av i pannen og se rett inn i linsa, ikke ned på skjermen.",
    "God søvn, nok vann og ryddige øyenbryn gjør mer for blikket enn man tror.",
  ],
  kjevelinje: [
    "Skyv haka ørlite frem og litt ned mot linsa — klassisk fotograf-triks som definerer kjevelinja med én gang.",
    "Hold kjeven avslappet med tennene lett sammen og rett rygg.",
    "En frisyre eller skjeggtrim som rammer inn kjeven (skarpe linjer under kjevekanten) løfter profilen tydelig.",
  ],
  midtansikt: [
    "Trekk kameraet litt lenger unna (armlengde) — vidvinkel helt nært strekker midten av ansiktet.",
    "Sett kameraet i øyehøyde så vinkelen ikke forlenger eller komprimerer midtansiktet.",
    "Nok vann og søvn demper trøtte øyne og gir friskere kontrast i midtansiktet.",
  ],
  ansiktstredjedeler: [
    "Hold kameraet rett foran deg i øyehøyde — ser du ned i laptopen blir pannen kunstig stor i bildet.",
    "Prøv hvordan håret rammer inn pannen — riktig sveis balanserer tredjedelene lynraskt.",
    "Fyll passe mye av bildet og sitt rolig slik at hele ansiktet fra panne til hake måles rent.",
  ],
  oyeavstand: [
    "Se rett inn i selve kameralinsa under hele målingen i stedet for å titte på motstanderen nederst på skjermen.",
    "Unngå å sitte for nært webkameraet — vidvinkel forskyver øyeavstanden mot kinnene.",
    "Hold hodet helt frontalt uten å vri deg til siden mens nedtellingen går.",
  ],
  harmoni: [
    "Kombiner rett holdning, frontlys og kamera i øyehøyde — det løfter alle delpoengene samtidig.",
    "Gi et lite, avslappet smil og hold deg rolig i de 10 sekundene så målingen blir stabil.",
    "En enkel hudpleierutine, vann og nok søvn gir friskere ansikt og bedre dagsform på kamera.",
  ],
}

const LIVSSTIL_TIPS: readonly string[] = [
  "Hverdagstips: 7–8 timer søvn og et ekstra glass vann gjør overraskende mye for dagsformen foran kamera.",
  "Hverdagstips: Enkel hudpleie (rens + fuktighetskrem) og ryddige bryn/skjeggkant gir umiddelbart skarpere uttrykk.",
  "Hverdagstips: En klipp eller skjeggform som rammer inn kjeven slår alle kameratriks.",
]

const KVALITET_TIPS = {
  overeksponert: "Skru ned lyset litt eller flytt deg bort fra sterkt motlys/direkte lampe så bildet ikke blir utvasket.",
  undereksponert: "Slå på en lampe foran deg eller snu deg mot et vindu — kameraet trenger frontlys for å måle riktig.",
  forLangtUnna: "Fyll mer av bildet neste gang — sitt omtrent én armlengde fra kameraet.",
  forNaerme: "Sitt litt lenger unna kameraet (armlengde) så vidvinkelen ikke forvrenger proporsjonene.",
  ustabil: "Hold hodet helt rolig og se rett i linsa gjennom alle 10 sekundene for jevnere måling.",
} as const

// ---- Over-the-top playful roasts ("disser") ----

export const LYS_DISSER: Record<Exclude<LysStatus, "ok">, readonly string[]> = {
  overeksponert: [
    "Ser ut som du ikke har sett sola siden juni. Brunkrem er noe for deg (eller skru ned lyset).",
    "Overeksponert til tusen — du lyser som en mobilskjerm på 100 % i mørket. Demp lampa litt?",
    "Så utvasket bilde at kameraet trodde du var en hvit vegg. Trekk for gardina før neste runde.",
  ],
  undereksponert: [
    "For mørkt, er du i bunker?",
    "Har strømmen gått, eller duellerer du fra en kjeller uten vinduer?",
    "Kameraet målte 80 % mørke og 20 % ren viljestyrke. Slå på én lampe til neste runde.",
  ],
}

export const DELPOENG_DISSER: Record<DelpoengId, readonly string[]> = {
  oyevinkel: [
    "Negativ øyevinkel? Kanthoplastikk i Tyrkia, 2-for-1.",
    "Øynene peker nedover som mandag morgen i november. Prøv høyere kamera før du bestiller fly til Istanbul.",
    "Øyevinkelen skriker «trenger dobbel espresso». Løft linsa litt — eller kjøp en rull med teip.",
  ],
  kjevelinje: [
    "Kjevelinje: bestill kjeveoperasjon. Eller tygg tyggis i fire timer om dagen.",
    "Kjeven tok egenmelding i dag. På tide med mewing-maraton på YouTube klokka 03:00.",
    "Haka gikk i dekning bak halsen. Strekk den frem neste runde — eller invester i industri-tyggegummi.",
  ],
  symmetri: [
    "Venstre og høyre side møttes aldri i kalenderen. Ring Picasso, han savner stilen din.",
    "Symmetrien har to forskjellige postnumre. Slå på lyset forfra før kalkulatoren blir sjøsyk.",
    "Høyre halvdel og venstre halvdel kjører hvert sitt soloprosjekt. Litt frontlys fikser halvparten!",
  ],
  midtansikt: [
    "Midtansiktet går over to tidssoner. Trekk deg litt bakover fra vidvinkelen!",
    "Lang vei fra øyne til overleppe — enten er det kameraet helt oppi nesa, eller så må vi ringe en arkitekt.",
    "Midtansikt-varsel: hold kameraet på armlengdes avstand før du booker time i utlandet.",
  ],
  ansiktstredjedeler: [
    "Tredjedelene ble fordelt som en skikkelig urettferdig pizzadeling.",
    "Panne, nese og hake krangler om kvadratmeterne. Ny sveis eller høyere kamera anbefales umiddelbart.",
    "Ansiktstredjedelene gikk ikke opp i 3-gangen. Pannelugg-sesongen starter i morgen.",
  ],
  oyeavstand: [
    "Øyeavstanden betyr at 3D-briller må spesialbestilles fra fabrikk.",
    "Øynene sitter i hvert sitt fylke (eller på fanget til hverandre). Prøv å se rett i linsa!",
    "Ansiktsfemtedelene fikk kalkulatoren til å svette. Rett opp blikket neste runde.",
  ],
  harmoni: [
    "Harmoni-måleren ga opp og begynte å spille frijazz i stedet.",
    "Proporsjonene kjører helt egen takt — maks sjarm, null geometri.",
    "Kalkulatoren skjønner seg ikke på deg ennå. Rett ryggen og gi et glis i neste runde!",
  ],
}

export type TipsOgDiss = {
  /** 2–3 practical, constructive tips based on capture quality and weakest sub-scores. */
  tips: string[]
  /** One clearly absurd, playful roast line. */
  diss: string
  /** Whether the roast came from the lighting check (only exposure, never skin colour). */
  dissFraLys: boolean
}

/**
 * Deterministically picks 2–3 practical tips and 1 over-the-top roast line for a duel result.
 * Lighting roasts are triggered ONLY by overexposed/underexposed grayscale luminance, never by skin colour.
 */
export function lagTipsOgDiss(input: {
  delpoeng: DelpoengKart
  lysStatus: LysStatus
  kvalitet?: Partial<KvalitetStats>
  fro: string
}): TipsOgDiss {
  const { delpoeng, lysStatus, kvalitet, fro } = input
  const svakeste = svakesteDelpoeng(delpoeng)
  const tips: string[] = []

  const leggTil = (t: string) => {
    if (!tips.includes(t)) tips.push(t)
  }

  // 1. Capture quality / lighting tip first if relevant.
  if (lysStatus === "overeksponert") {
    leggTil(KVALITET_TIPS.overeksponert)
  } else if (lysStatus === "undereksponert") {
    leggTil(KVALITET_TIPS.undereksponert)
  } else if (kvalitet?.snittIpdAndel !== undefined && kvalitet.snittIpdAndel > 0 && kvalitet.snittIpdAndel < 0.14) {
    leggTil(KVALITET_TIPS.forLangtUnna)
  } else if (kvalitet?.snittIpdAndel !== undefined && kvalitet.snittIpdAndel > 0.38) {
    leggTil(KVALITET_TIPS.forNaerme)
  } else if (kvalitet?.stabilitet !== undefined && kvalitet.stabilitet > 0.55) {
    leggTil(KVALITET_TIPS.ustabil)
  }

  // 2. Practical tips for the weakest sub-scores.
  for (let i = 0; i < svakeste.length && tips.length < 3; i++) {
    const id = svakeste[i]
    const kandidat = velgMedFro(PRAKTISKE_TIPS_PER_DELPOENG[id], `${fro}:tips:${id}:${i}`)
    leggTil(kandidat)
  }

  // 3. Ensure at least one light lifestyle tip if we still have room (up to 3 tips total).
  if (tips.length < 3) {
    leggTil(velgMedFro(LIVSSTIL_TIPS, `${fro}:livsstil`))
  }

  // Roast selection: lighting roast takes precedence when exposure is genuinely blown out or dark.
  if (lysStatus === "overeksponert" || lysStatus === "undereksponert") {
    return {
      tips: tips.slice(0, 3),
      diss: velgMedFro(LYS_DISSER[lysStatus], `${fro}:lys:${lysStatus}`),
      dissFraLys: true,
    }
  }

  const svakest = svakeste[0]
  return {
    tips: tips.slice(0, 3),
    diss: velgMedFro(DELPOENG_DISSER[svakest], `${fro}:diss:${svakest}`),
    dissFraLys: false,
  }
}

export const ANSVARSFRASKRIVELSE_PAAMINNELSE =
  "Husk: Alt her er tull — ingen vitenskap, ingen opptak, og tallene sier null om verdien din."
