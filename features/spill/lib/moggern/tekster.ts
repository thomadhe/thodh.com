// Rank titles, win lines, practical "Slik mogger du mer" tips, and playful over-the-top roasts ("disser")
// for Moggern. Selection is 100% deterministic from a duel seed so both players see the exact same lines.

import type { LysStatus } from "./lys"
import {
  formaterMoggernPoeng,
  MOG_UTTRYKK,
  svakesteDelpoeng,
  type DelpoengId,
  type DelpoengKart,
  type KvalitetStats,
  type MogUttrykkId,
} from "./poeng"

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
    farge: "bg-lime-400 text-[#18191b]",
  },
  {
    id: "sheeshern",
    tittel: "Sheeshern",
    minPoeng: 8.0,
    maksPoeng: 8.9,
    linje: "Sheesh. Linsa måtte blunke to ganger for å sjekke om det var filter.",
    farge: "bg-emerald-400 text-[#18191b]",
  },
  {
    id: "aura-farmer",
    tittel: "Aura-farmer",
    minPoeng: 7.0,
    maksPoeng: 7.9,
    linje: "Høster aura uten å prøve engang. Solid kjeve-til-lys-forhold.",
    farge: "bg-cyan-400 text-[#18191b]",
  },
  {
    id: "mid-mogger",
    tittel: "Mid-mogger",
    minPoeng: 6.0,
    maksPoeng: 6.9,
    linje: "Over snittet i vennegjengen, men ikke si opp dagjobben helt ennå.",
    farge: "bg-sky-400 text-[#18191b]",
  },
  {
    id: "normie",
    tittel: "Normie",
    minPoeng: 5.0,
    maksPoeng: 5.9,
    linje: "Trygg, klassisk, og akkurat midt på treet. Det finnes håp i godt lys.",
    farge: "bg-amber-300 text-[#18191b]",
  },
  {
    id: "venstredude",
    tittel: "Venstredude",
    minPoeng: 4.0,
    maksPoeng: 4.9,
    linje: "Litt skjev vinkel eller litt sliten tirsdag? Vi skylder på webkameraet.",
    farge: "bg-orange-400 text-[#18191b]",
  },
  {
    id: "chopped",
    tittel: "Chopped",
    minPoeng: 3.0,
    maksPoeng: 3.9,
    linje: "Huff da. Kalkulatoren trenger et øyeblikk for seg selv etter denne runden.",
    farge: "bg-rose-400 text-[#18191b]",
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
    "Hold et avslappet uttrykk og sitt rolig gjennom de 15 sekundene så målingen blir stabil.",
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
  ustabil: "Hold hodet helt rolig og se rett i linsa gjennom alle 15 sekundene for jevnere måling.",
} as const

// ---- Expression verdict summary ----

export type UttrykkDom = {
  id: MogUttrykkId
  navn: string
  tekst: string
  positiv: boolean
}

const UTTRYKK_DOM_TEKSTER: Record<MogUttrykkId, { sterk: string; middels: string }> = {
  "the-rock": {
    sterk: "Kjørte «The Rock»-brynet gjennom nesten hele runden.",
    middels: "Dro fram et stødig «The Rock»-bryn underveis.",
  },
  jegeroyne: {
    sterk: "Holdt Jegerøyne store deler av runden — iskald fokus.",
    middels: "Fikk inn gode Jegerøyne-sekunder underveis.",
  },
  "innsugde-kinn": {
    sterk: "Full Blue Steel med innsugde kinn hele veien.",
    middels: "Lirket inn litt Blue Steel-kinn for ekstra poeng.",
  },
  mewing: {
    sterk: "Mewet hardt og disiplinert gjennom hele målingen.",
    middels: "Holdt kjeven stram med solid mewing-innsats.",
  },
  smiler: {
    sterk: "Klarte ikke la være å glise — kostet dyrebare mog-poeng!",
    middels: "Snek inn et smil underveis som trakk ned litt.",
  },
  "oppblaste-kinn": {
    sterk: "Kjørte ballongkinn store deler av runden.",
    middels: "Blåste opp kinnene underveis og myket opp kjevelinja.",
  },
  "munn-puster": {
    sterk: "Hadde åpen munn gjennom store deler av runden — anti-mewing!",
    middels: "Slapp kjeven litt åpen underveis, noe som kostet poeng.",
  },
  grimase: {
    sterk: "Leverte ren grimase-sabotasje gjennom nesten hele runden.",
    middels: "Rynket nesa eller dro en grimase som dro snittet ned.",
  },
  bytteoyne: {
    sterk: "Kjørte kuleøyne og panikk-aura store deler av runden.",
    middels: "Sperret opp øynene litt for mye underveis.",
  },
  "sur-geip": {
    sterk: "Holdt sur geip gjennom store deler av målingen.",
    middels: "Dro på seg en liten sur geip som kostet poeng.",
  },
}

/**
 * Summarizes the dominant facial expression held during a 15 s round (or null if the player stayed mostly neutral).
 * Picks the expression with the biggest weighted impact among those held above 0.18 trimmed-mean strength.
 */
export function uttrykkDom(uttrykkSnitt?: Partial<Record<MogUttrykkId, number>> | null): UttrykkDom | null {
  if (!uttrykkSnitt) return null
  let best: { info: (typeof MOG_UTTRYKK)[number]; styrke: number; effekt: number } | null = null
  for (const u of MOG_UTTRYKK) {
    const styrke = uttrykkSnitt[u.id] ?? 0
    if (styrke < 0.18) continue
    const effekt = Math.abs(styrke * u.maks)
    if (!best || effekt > best.effekt) {
      best = { info: u, styrke, effekt }
    }
  }
  if (!best) return null
  const t = UTTRYKK_DOM_TEKSTER[best.info.id]
  return {
    id: best.info.id,
    navn: best.info.navn,
    tekst: best.styrke >= 0.48 ? t.sterk : t.middels,
    positiv: best.info.maks > 0,
  }
}

// ---- Over-the-top playful roasts ("disser") ----

export const LYS_DISSER: Record<Exclude<LysStatus, "ok">, readonly string[]> = {
  overeksponert: [
    "Ser ut som du ikke har sett sola siden juni. Brunkrem er noe for deg (eller skru ned lyset).",
    "Overeksponert til tusen — du lyser som en mobilskjerm på 100 % i mørket. Demp lampa litt?",
    "Så utvasket bilde at kameraet trodde du var en hvit vegg. Trekk for gardina før neste runde.",
    "Du skinner så sterkt på kamera at man trenger solbriller for å duellere mot deg. Demp lyset ett hakk.",
    "Det lyset der er rein flashbang. Snu deg litt bort fra vinduet før neste runde!",
  ],
  undereksponert: [
    "Strømprisene kan umulig være så høye at du ikke har råd til én skrivebordslampe?",
    "Du sitter så mørkt at du ser ut som en opplåsbar karakter man ikke har råd til ennå.",
    "Batman ringte og spurte om han kan få tilbake hula si. Slå på taklampa før neste runde!",
  ],
}

export const DELPOENG_DISSER: Record<DelpoengId, readonly string[]> = {
  oyevinkel: [
    "Negativ øyevinkel? Kanthoplastikk i Tyrkia, 2-for-1.",
    "Øynene peker nedover som mandag morgen i november. Prøv høyere kamera før du bestiller fly til Istanbul.",
    "Øyevinkelen skriker «trenger dobbel espresso». Løft linsa litt — eller kjøp en rull med teip.",
    "Øyekrokene henger så tungt at tyngdekraften burde betale husleie. Løft kameraet opp i øyehøyde!",
    "Øyevinkelen sa god natt midt på dagen. Kamera i øyehøyde og litt skarpere blikk neste runde!",
  ],
  kjevelinje: [
    "Kjevelinje: bestill kjeveoperasjon. Eller tygg tyggis i fire timer om dagen.",
    "Kjeven tok egenmelding i dag. På tide med mewing-maraton på YouTube klokka 03:00.",
    "Haka gikk i dekning bak halsen. Strekk den frem neste runde — eller invester i industri-tyggegummi.",
    "Kjevelinja var så myk at kameraet trodde du var en fersk hvetebolle. Skyv haka ørlite frem!",
    "Halsen og haka har slått seg sammen til én kommune. Rett ryggen og løft kameraet litt opp!",
    "Kjeven møtte ikke opp på jobb i dag. Én pakke Extra om dagen og haka litt frem neste runde!",
    "Ingen skarpe kanter funnet — super trygt for småbarn, men dårlig for moggen. Stram til!",
  ],
  symmetri: [
    "Picasso ringte — karakteren fra maleriet hans har rømt.",
    "Symmetrien har to forskjellige postnumre. Slå på lyset forfra før kalkulatoren blir sjøsyk.",
    "Ansiktet ditt ser ut som det ble satt sammen uten IKEA-bruksanvisning. Rett opp hodet og lyset!",
  ],
  midtansikt: [
    "Lang vei fra øyne til overleppe — enten er det kameraet helt oppi nesa, eller så må vi ringe en arkitekt.",
    "Fra øyne til overleppe må man nesten betale bompenger underveis. Gå ett skritt bakover fra linsa!",
  ],
  ansiktstredjedeler: [
    "Panne, nese og hake krangler om kvadratmeterne. Ny sveis eller høyere kamera anbefales umiddelbart.",
    "Ansiktstredjedelene gikk ikke opp i 3-gangen. Pannelugg-sesongen starter i morgen.",
    "Én tredjedel forsynte seg dobbelt på buffeten og lot de to andre sulte. Løft kameraet opp!",
    "Tredjedelene ser ut som når noen deler en kake i mørket. Sitt rett foran linsa neste runde!",
    "Panna og haka fikk aldri samme budsjett. Hold kameraet i øyehøyde så blir fordelinga mye jevnere!",
  ],
  oyeavstand: [
    "Øynene dine har enten langdistanseforhold eller deler én liten hybel. Sitt litt lenger fra linsa!",
    "Den øyeavstanden … bruk solbriller du.",
  ],
  harmoni: [
    "Leonardo da Vinci prøvde å tegne deg og endte opp med abstrakt kunst. Frontlys hjelper!",
  ],
}

export const COOKED_DISSER: readonly string[] = [
  "Du er cooked … kom deg på seminar med Datingcoach Norge.",
  "Noen må jo dra ned snittet for resten av oss.",
  "Det her kvalifiserer nesten til egenmelding.",
  "Bare lukk kameraet og lat som denne runden aldri skjedde.",
]

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
  /** Final 0–10 score — triggers general "cooked" roasts when very low (< 4.5). */
  total?: number
  /** Points lost by in a 1v1 duel (> 0 when the opponent won). */
  moggetMed?: number
  fro: string
}): TipsOgDiss {
  const { delpoeng, lysStatus, kvalitet, total, moggetMed, fro } = input
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

  // Hard-mogged (lost by >= 1.5 pts) or low total (< 4.5): deliver a general "cooked" roast.
  const hardtMogget = moggetMed !== undefined && moggetMed >= 1.5
  const lavScore = total !== undefined && total < 4.5
  if (hardtMogget || lavScore) {
    return {
      tips: tips.slice(0, 3),
      diss: velgMedFro(COOKED_DISSER, `${fro}:cooked`),
      dissFraLys: false,
    }
  }

  // Prefer more intuitive categories over abstract facial thirds unless facial thirds is clearly far weaker.
  let dissKategori = svakeste[0]
  if (dissKategori === "ansiktstredjedeler" && svakeste[1] && delpoeng[svakeste[1]] - delpoeng.ansiktstredjedeler < 1.8) {
    dissKategori = svakeste[1]
  }

  return {
    tips: tips.slice(0, 3),
    diss: velgMedFro(DELPOENG_DISSER[dissKategori], `${fro}:diss:${dissKategori}`),
    dissFraLys: false,
  }
}

export const ANSVARSFRASKRIVELSE_PAAMINNELSE =
  "Husk: Alt her er tull — ingen vitenskap, ingen opptak, og tallene sier null om verdien din."
