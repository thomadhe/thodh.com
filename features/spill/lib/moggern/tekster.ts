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
  tittelEn: string
  minPoeng: number
  maksPoeng: number
  linje: string
  linjeEn: string
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
    tittelEn: "Gigamogger",
    minPoeng: 9.0,
    maksPoeng: 10.0,
    linje: "Kameraet knelte og ba om autograf. Ren statistisk anomalitet.",
    linjeEn: "The webcam knelt and asked for an autograph. Pure statistical anomaly.",
    farge: "bg-lime-400 text-[#18191b]",
  },
  {
    id: "sheeshern",
    tittel: "Sheeshern",
    tittelEn: "Certified Mogger",
    minPoeng: 8.0,
    maksPoeng: 8.9,
    linje: "Sheesh. Linsa måtte blunke to ganger for å sjekke om det var filter.",
    linjeEn: "Sheesh. The lens had to blink twice to make sure there wasn't a filter on.",
    farge: "bg-emerald-400 text-[#18191b]",
  },
  {
    id: "aura-farmer",
    tittel: "Aura-farmer",
    tittelEn: "Aura Farmer",
    minPoeng: 7.0,
    maksPoeng: 7.9,
    linje: "Høster aura uten å prøve engang. Solid kjeve-til-lys-forhold.",
    linjeEn: "Farming aura without even trying. Strong jaw-to-lighting ratio.",
    farge: "bg-cyan-400 text-[#18191b]",
  },
  {
    id: "mid-mogger",
    tittel: "Mid-mogger",
    tittelEn: "Mid-Mogger",
    minPoeng: 6.0,
    maksPoeng: 6.9,
    linje: "Over snittet i vennegjengen, men ikke si opp dagjobben helt ennå.",
    linjeEn: "Above average in the group chat, but don't quit your day job just yet.",
    farge: "bg-sky-400 text-[#18191b]",
  },
  {
    id: "normie",
    tittel: "Normie",
    tittelEn: "Normie",
    minPoeng: 5.0,
    maksPoeng: 5.9,
    linje: "Trygg, klassisk, og akkurat midt på treet. Det finnes håp i godt lys.",
    linjeEn: "Safe, classic, right down the middle. There is hope with better lighting.",
    farge: "bg-amber-300 text-[#18191b]",
  },
  {
    id: "venstredude",
    tittel: "Venstredude",
    tittelEn: "Sub-5 NPC",
    minPoeng: 4.0,
    maksPoeng: 4.9,
    linje: "Litt skjev vinkel eller litt sliten tirsdag? Vi skylder på webkameraet.",
    linjeEn: "Awkward angle or rough Tuesday? Let's just blame the webcam.",
    farge: "bg-orange-400 text-[#18191b]",
  },
  {
    id: "chopped",
    tittel: "Chopped",
    tittelEn: "Chopped",
    minPoeng: 3.0,
    maksPoeng: 3.9,
    linje: "Huff da. Kalkulatoren trenger et øyeblikk for seg selv etter denne runden.",
    linjeEn: "Oof. The calculator needs a moment alone after that round.",
    farge: "bg-rose-400 text-[#18191b]",
  },
  {
    id: "bjeffern",
    tittel: "Bjeffern",
    tittelEn: "Cooked Beyond Repair",
    minPoeng: 0.0,
    maksPoeng: 2.9,
    linje: "Voff. Enten gjorde du grimase med vilje, eller så er kameraet montert i gulvet.",
    linjeEn: "Woof. Either you threw the round with a grimace or your camera is mounted on the floor.",
    farge: "bg-red-500 text-white",
  },
] as const

/** Returns the rank title for a 0–10 total score. */
export function rangForPoeng(poeng: number, sprak: "no" | "en" = "no"): RangTittel {
  const avrundet = Math.round(Math.max(0, Math.min(10, poeng)) * 10) / 10
  let treff: RangTittel = RANG_TITLER[RANG_TITLER.length - 1]
  for (const r of RANG_TITLER) {
    if (avrundet >= r.minPoeng) {
      treff = r
      break
    }
  }
  return sprak === "en" ? { ...treff, tittel: treff.tittelEn, linje: treff.linjeEn } : treff
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
  sprak: "no" | "en" = "no",
): string {
  const diff = Math.round(Math.abs(spillerA.poeng - spillerB.poeng) * 10) / 10
  if (diff < 0.1) {
    return sprak === "en"
      ? `Tie! ${spillerA.navn} and ${spillerB.navn} landed on exactly ${formaterMoggernPoeng(spillerA.poeng, "en")} points.`
      : `Uavgjort! ${spillerA.navn} og ${spillerB.navn} landet på eksakt ${formaterMoggernPoeng(spillerA.poeng)} poeng.`
  }
  const [vinner, taper] = spillerA.poeng > spillerB.poeng ? [spillerA, spillerB] : [spillerB, spillerA]
  const diffTekst = formaterMoggernPoeng(diff, sprak)
  if (sprak === "en") {
    if (diff >= 2.5) return `${vinner.navn} brutally mogged ${taper.navn} by ${diffTekst} points.`
    if (diff <= 0.3) return `${vinner.navn} barely edged out and mogged ${taper.navn} by ${diffTekst} points.`
    return `${vinner.navn} mogged ${taper.navn} by ${diffTekst} points.`
  }
  if (diff >= 2.5) {
    return `${vinner.navn} total-mogget ${taper.navn} med ${diffTekst} poeng.`
  }
  if (diff <= 0.3) {
    return `${vinner.navn} snek seg forbi og mogget ${taper.navn} med ${diffTekst} poeng.`
  }
  return `${vinner.navn} mogget ${taper.navn} med ${diffTekst} poeng.`
}

// ---- Practical tips ("Slik mogger du mer" / "How to mog harder") ----

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

const PRAKTISKE_TIPS_PER_DELPOENG_EN: Record<DelpoengId, readonly string[]> = {
  symmetri: [
    "Put your light source straight in front (window or lamp behind the screen) — side light makes faces read as less symmetrical.",
    "Square your shoulders and neck so your head isn't leaning slightly to one side.",
    "A relaxed, composed expression gives much steadier symmetry readings than twitching mid-round.",
  ],
  oyevinkel: [
    "Raise your camera to eye level or slightly above — low laptop angles drag canthal tilt down.",
    "Relax your forehead and look directly into the lens instead of down at the screen.",
    "Good sleep, hydration, and tidy brows do more for your gaze than any camera trick.",
  ],
  kjevelinje: [
    "Push your chin slightly forward and down toward the lens — classic portrait photographer trick for instant jaw definition.",
    "Keep your teeth lightly together, tongue on the roof of your mouth, and sit up straight.",
    "A haircut or beard line that frames the jaw edge makes a huge visual difference.",
  ],
  midtansikt: [
    "Back up to about arm's length from the camera — close wide-angle lenses stretch the midface.",
    "Place the camera at eye height so the angle doesn't elongate or compress your midface.",
    "Sleep and water cut puffiness and sharpen midface contrast on camera.",
  ],
  ansiktstredjedeler: [
    "Keep the camera straight at eye level — looking down into a laptop exaggerates the forehead.",
    "Experiment with how your hair frames your forehead — the right cut balances thirds instantly.",
    "Frame your whole head comfortably and stay steady so forehead-to-chin proportions read cleanly.",
  ],
  oyeavstand: [
    "Look straight into the actual camera lens during the capture instead of peeking at your opponent.",
    "Avoid leaning too close to a wide-angle webcam — it distorts eye spacing relative to your cheekbones.",
    "Keep your head level and centered while the 15-second timer counts down.",
  ],
  harmoni: [
    "Combine straight posture, front lighting, and an eye-level camera — it lifts every single sub-score at once.",
    "Hold a calm, steady expression throughout the 15 seconds for a cleaner average.",
    "Simple skincare, plenty of water, and real sleep beat any webcam angle.",
  ],
}

const LIVSSTIL_TIPS: readonly string[] = [
  "Hverdagstips: 7–8 timer søvn og et ekstra glass vann gjør overraskende mye for dagsformen foran kamera.",
  "Hverdagstips: Enkel hudpleie (rens + fuktighetskrem) og ryddige bryn/skjeggkant gir umiddelbart skarpere uttrykk.",
  "Hverdagstips: En klipp eller skjeggform som rammer inn kjeven slår alle kameratriks.",
]

const LIVSSTIL_TIPS_EN: readonly string[] = [
  "Daily tip: 7–8 hours of sleep and an extra glass of water work wonders on camera.",
  "Daily tip: Basic skincare (cleanser + moisturizer) and clean brows/jawline edges instantly sharpen your look.",
  "Daily tip: A haircut or beard trim that frames the jaw beats every camera hack.",
]

const KVALITET_TIPS = {
  overeksponert: "Skru ned lyset litt eller flytt deg bort fra sterkt motlys/direkte lampe så bildet ikke blir utvasket.",
  undereksponert: "Slå på en lampe foran deg eller snu deg mot et vindu — kameraet trenger frontlys for å måle riktig.",
  forLangtUnna: "Fyll mer av bildet neste gang — sitt omtrent én armlengde fra kameraet.",
  forNaerme: "Sitt litt lenger unna kameraet (armlengde) så vidvinkelen ikke forvrenger proporsjonene.",
  ustabil: "Hold hodet helt rolig og se rett i linsa gjennom alle 15 sekundene for jevnere måling.",
} as const

const KVALITET_TIPS_EN = {
  overeksponert: "Dial down the brightness or step away from harsh backlight so the image isn't washed out.",
  undereksponert: "Turn on a lamp in front of you or face a window — the camera needs front light to read cleanly.",
  forLangtUnna: "Fill more of the frame next time — sit roughly one arm's length from the camera.",
  forNaerme: "Sit a little further back (arm's length) so wide-angle distortion doesn't warp your proportions.",
  ustabil: "Keep your head steady and look straight into the lens for the full 15 seconds.",
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

const UTTRYKK_DOM_TEKSTER_EN: Record<MogUttrykkId, { sterk: string; middels: string }> = {
  "the-rock": {
    sterk: "Held the People's Eyebrow for almost the entire round.",
    middels: "Flashed a solid 'The Rock' eyebrow mid-round.",
  },
  jegeroyne: {
    sterk: "Locked in Hunter Eyes for most of the round — ice-cold focus.",
    middels: "Squeezed in solid Hunter Eyes seconds along the way.",
  },
  "innsugde-kinn": {
    sterk: "Full Blue Steel cheek-suck from start to finish.",
    middels: "Snuck in a little Blue Steel for extra points.",
  },
  mewing: {
    sterk: "Mewed with monk-like discipline all the way through.",
    middels: "Kept the jaw tight with a solid mewing effort.",
  },
  smiler: {
    sterk: "Couldn't stop grinning — cost precious mog points!",
    middels: "Let a smile slip mid-round and lost a bit of aura.",
  },
  "oppblaste-kinn": {
    sterk: "Ran full blowfish cheeks for most of the round.",
    middels: "Puffed the cheeks out mid-round and softened the jaw.",
  },
  "munn-puster": {
    sterk: "Mouth hung open half the round — peak anti-mewing!",
    middels: "Dropped the jaw open a bit and lost points.",
  },
  grimase: {
    sterk: "Delivered pure grimace self-sabotage almost the entire round.",
    middels: "Scrunched the face or pulled a grimace that dragged the average down.",
  },
  bytteoyne: {
    sterk: "Full wide-eyed panic aura for most of the round.",
    middels: "Opened the eyes a little too wide mid-round.",
  },
  "sur-geip": {
    sterk: "Held a heavy frown for most of the measurement.",
    middels: "Slipped into a frown that cost a few tenths.",
  },
}

/**
 * Summarizes the dominant facial expression held during a 15 s round (or null if the player stayed mostly neutral).
 * Picks the expression with the biggest weighted impact among those held above 0.18 trimmed-mean strength.
 */
export function uttrykkDom(
  uttrykkSnitt?: Partial<Record<MogUttrykkId, number>> | null,
  sprak: "no" | "en" = "no",
): UttrykkDom | null {
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
  const tabell = sprak === "en" ? UTTRYKK_DOM_TEKSTER_EN : UTTRYKK_DOM_TEKSTER
  const t = tabell[best.info.id]
  return {
    id: best.info.id,
    navn: sprak === "en" ? best.info.navnEn : best.info.navn,
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

export const LYS_DISSER_EN: Record<Exclude<LysStatus, "ok">, readonly string[]> = {
  overeksponert: [
    "Overexposed to the moon — you're glowing like a phone screen at 100% brightness at 3 AM.",
    "So washed out the webcam thought you were a drywall sample. Close the blinds a bit!",
    "That lighting is a literal flashbang. Turn slightly away from the window before the rematch!",
    "You're shining so hard on camera your opponent needs sunglasses. Dial the lamp back one notch.",
  ],
  undereksponert: [
    "Electricity prices can't be THAT high — treat yourself to one desk lamp?",
    "Sitting so far in the dark you look like a locked fighter nobody has unlocked yet.",
    "Batman called and asked for his cave back. Flip a light on before the next round!",
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
    "Venstre og høyre halvdel jobber i forskjellige tidssoner. Rett opp hodet og skru på frontlys!",
    "Speilbildet ditt tok en kreativ frihet. Sitt rett foran linsa med jevnt lys neste runde!",
  ],
  midtansikt: [
    "Lang vei fra øyne til overleppe — enten er det kameraet helt oppi nesa, eller så må vi ringe en arkitekt.",
    "Fra øyne til overleppe må man nesten betale bompenger underveis. Gå ett skritt bakover fra linsa!",
    "Vidvinkelen dro midtansiktet ditt inn i neste uke. Én armlengde fra kameraet redder deg!",
    "Midtansiktet søkte om egen bussrute. Litt mer avstand til kameraet gjør underverker!",
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
    "Det gyldne snitt så på kalkulatoren og ba om sykemelding. Rett lys og rolig blikk neste runde!",
    "Alle delene er fine hver for seg — de bare glemte å bli enige om felles gruppeprosjekt.",
    "Geometrien kjører jazzimprovisasjon i dag. Prøv nøytralt blikk i øyehøyde på omkampen!",
  ],
}

export const DELPOENG_DISSER_EN: Record<DelpoengId, readonly string[]> = {
  oyevinkel: [
    "Negative canthal tilt? Two-for-one flight to Turkey incoming.",
    "Eyes sloping down like a Monday morning in November. Raise the webcam before booking Istanbul.",
    "That eye tilt screams 'needs a double espresso'. Lift the lens up to eye level!",
    "Gravity is paying zero rent on those eye corners. Raise your camera and lock in!",
  ],
  kjevelinje: [
    "Jawline status: called in sick today. Time for a 3 AM YouTube mewing marathon.",
    "Chin went into witness protection behind the neck. Push it slightly forward next round!",
    "Jawline so soft the webcam flagged it as a freshly baked brioche bun. Sit up and lock in!",
    "Zero sharp edges detected — completely toddler-safe, terrible for the mog.",
    "Your neck and chin have officially merged into one municipality. Raise the camera a notch!",
  ],
  symmetri: [
    "Picasso called — one of his portraits walked out of the museum.",
    "Your left and right sides live in two different zip codes. Turn on front lighting!",
    "Assembled without reading the IKEA manual. Level your head and light from the front!",
    "Left side and right side are operating in different time zones. Straighten up and light evenly!",
    "Your mirror reflection took some creative liberties. Center your face in front light next round!",
  ],
  midtansikt: [
    "Long road from eyes to upper lip — either the webcam is glued to your nose or we need an architect.",
    "You practically need a toll pass to get from eyes to upper lip. Take one step back from the lens!",
    "That wide-angle lens stretched your midface into next week. Back up one arm's length!",
    "Your midface just applied for its own bus route. A little more camera distance works wonders!",
  ],
  ansiktstredjedeler: [
    "Forehead, nose, and chin are fighting over square footage. Raise the camera immediately.",
    "One third went back for seconds at the buffet and left the other two starving.",
    "Those facial thirds look like someone sliced a birthday cake in the dark. Eye-level camera next round!",
  ],
  oyeavstand: [
    "Your eyes are either in a long-distance relationship or sharing a studio apartment. Back up from the lens!",
    "With that eye spacing … honestly, just wear sunglasses.",
  ],
  harmoni: [
    "Leonardo da Vinci tried sketching you and accidentally invented abstract art. Front lighting helps!",
    "The Golden Ratio looked at the calculator and called in sick. Eye-level camera next round!",
    "Every feature is solid solo — they just forgot to coordinate the group project.",
    "Your facial geometry is playing free-form jazz today. Try a calm neutral look on the rematch!",
  ],
}

export const COOKED_DISSER: readonly string[] = [
  "Du er cooked … kom deg på seminar med Datingcoach Norge.",
  "Noen må jo dra ned snittet for resten av oss.",
  "Det her kvalifiserer nesten til egenmelding.",
  "Bare lukk kameraet og lat som denne runden aldri skjedde.",
]

export const COOKED_DISSER_EN: readonly string[] = [
  "You are officially cooked … time to sign up for a looksmaxxing bootcamp.",
  "Hey, someone has to keep the bell curve humble for the rest of us.",
  "That score practically qualifies for a paid sick day.",
  "Close the webcam and pretend this round never happened.",
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
  sprak?: "no" | "en"
}): TipsOgDiss {
  const { delpoeng, lysStatus, kvalitet, total, moggetMed, fro, sprak = "no" } = input
  const en = sprak === "en"
  const kvalTips = en ? KVALITET_TIPS_EN : KVALITET_TIPS
  const delTips = en ? PRAKTISKE_TIPS_PER_DELPOENG_EN : PRAKTISKE_TIPS_PER_DELPOENG
  const livTips = en ? LIVSSTIL_TIPS_EN : LIVSSTIL_TIPS
  const lysDisser = en ? LYS_DISSER_EN : LYS_DISSER
  const cookedDisser = en ? COOKED_DISSER_EN : COOKED_DISSER
  const delDisser = en ? DELPOENG_DISSER_EN : DELPOENG_DISSER

  const svakeste = svakesteDelpoeng(delpoeng)
  const tips: string[] = []

  const leggTil = (t: string) => {
    if (!tips.includes(t)) tips.push(t)
  }

  // 1. Capture quality / lighting tip first if relevant.
  if (lysStatus === "overeksponert") {
    leggTil(kvalTips.overeksponert)
  } else if (lysStatus === "undereksponert") {
    leggTil(kvalTips.undereksponert)
  } else if (kvalitet?.snittIpdAndel !== undefined && kvalitet.snittIpdAndel > 0 && kvalitet.snittIpdAndel < 0.14) {
    leggTil(kvalTips.forLangtUnna)
  } else if (kvalitet?.snittIpdAndel !== undefined && kvalitet.snittIpdAndel > 0.38) {
    leggTil(kvalTips.forNaerme)
  } else if (kvalitet?.stabilitet !== undefined && kvalitet.stabilitet > 0.55) {
    leggTil(kvalTips.ustabil)
  }

  // 2. Practical tips for the weakest sub-scores.
  for (let i = 0; i < svakeste.length && tips.length < 3; i++) {
    const id = svakeste[i]
    const kandidat = velgMedFro(delTips[id], `${fro}:tips:${id}:${i}`)
    leggTil(kandidat)
  }

  // 3. Ensure at least one light lifestyle tip if we still have room (up to 3 tips total).
  if (tips.length < 3) {
    leggTil(velgMedFro(livTips, `${fro}:livsstil`))
  }

  // Roast selection: lighting roast takes precedence when exposure is genuinely blown out or dark.
  if (lysStatus === "overeksponert" || lysStatus === "undereksponert") {
    return {
      tips: tips.slice(0, 3),
      diss: velgMedFro(lysDisser[lysStatus], `${fro}:lys:${lysStatus}`),
      dissFraLys: true,
    }
  }

  // Hard-mogged (lost by >= 1.5 pts) or low total (< 4.5): deliver a general "cooked" roast.
  const hardtMogget = moggetMed !== undefined && moggetMed >= 1.5
  const lavScore = total !== undefined && total < 4.5
  if (hardtMogget || lavScore) {
    return {
      tips: tips.slice(0, 3),
      diss: velgMedFro(cookedDisser, `${fro}:cooked`),
      dissFraLys: false,
    }
  }

  // Prefer more intuitive categories over facial thirds and eye spacing unless they are clearly far weaker.
  const hovedKandidater = svakeste.filter((id) => id !== "ansiktstredjedeler" && id !== "oyeavstand")
  let dissKategori = svakeste[0]
  const beholdSpesial =
    (dissKategori === "ansiktstredjedeler" || dissKategori === "oyeavstand") &&
    (!hovedKandidater[0] || delpoeng[hovedKandidater[0]] - delpoeng[dissKategori] >= (dissKategori === "oyeavstand" ? 2.2 : 1.8))

  if (!beholdSpesial && hovedKandidater.length > 0) {
    const forste = hovedKandidater[0]
    const andre = hovedKandidater[1]
    // Rotate deterministically between the two weakest categories across rematches when they are close (<= 0.8 pts).
    if (andre && delpoeng[andre] - delpoeng[forste] <= 0.8) {
      dissKategori = velgMedFro([forste, andre], `${fro}:kategori`)
    } else {
      dissKategori = forste
    }
  }

  return {
    tips: tips.slice(0, 3),
    diss: velgMedFro(delDisser[dissKategori], `${fro}:diss:${dissKategori}`),
    dissFraLys: false,
  }
}

export const ANSVARSFRASKRIVELSE_PAAMINNELSE =
  "Husk: Alt her er tull — ingen vitenskap, ingen opptak, og tallene sier null om verdien din."

export const ANSVARSFRASKRIVELSE_PAAMINNELSE_EN =
  "Remember: Everything here is a joke — zero science, no recordings, and these numbers say nothing about your worth."
