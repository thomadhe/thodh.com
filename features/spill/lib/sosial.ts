// Shared types, rules and helpers for game history, daily/monthly leaderboards, friends and duel challenges.
// Pure TypeScript without React, Next or Node imports, so both client components, server routes and tests use it.

import { formaterDato, iDagOslo, leggTilDager, START_DATO } from "./dag"
import { spill, type Spill, type SpillId } from "./spill"

export function spillEtterId(id: string): Spill | undefined {
  return spill.find((s) => s.id === id)
}

// ---- Display names & friend codes ----

/** Unambiguous characters for 6-character personal friend codes (no vowels, no 0/1). */
export const VENNEKODE_TEGN = "BCDFGHJKLMNPQRSTVWXZ23456789"
export const VENNEKODE_LENGDE = 6
export const VISNINGSNAVN_MIN = 2
export const VISNINGSNAVN_MAKS = 24

/** Server-measured solve times are clamped to 1 s – 4 hours to avoid 0 s or forgotten-tab outliers. */
export const TID_MIN_SEK = 1
export const TID_MAKS_SEK = 14_400

export function lagVennekode(tall: () => number = () => crypto.getRandomValues(new Uint32Array(1))[0]) {
  return Array.from({ length: VENNEKODE_LENGDE }, () => VENNEKODE_TEGN[tall() % VENNEKODE_TEGN.length]).join("")
}

export function normaliserVennekode(s: string) {
  return s.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
}

export function erGyldigVennekode(s: unknown): s is string {
  return typeof s === "string" && s.length === VENNEKODE_LENGDE && [...s].every((c) => VENNEKODE_TEGN.includes(c))
}

export function rensVisningsnavn(s: string) {
  return s
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
}

export function validerVisningsnavn(s: string): { ok: true; navn: string } | { ok: false; feil: string } {
  const navn = rensVisningsnavn(s)
  if (navn.length < VISNINGSNAVN_MIN) return { ok: false, feil: `Visningsnavnet må ha minst ${VISNINGSNAVN_MIN} tegn.` }
  if (navn.length > VISNINGSNAVN_MAKS) return { ok: false, feil: `Visningsnavnet kan ha maks ${VISNINGSNAVN_MAKS} tegn.` }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(navn)) return { ok: false, feil: "Bruk et visningsnavn, ikke e-postadresse." }
  return { ok: true, navn }
}

// ---- Time, day & month formatting ----

export function klemTidSek(sek: number | null | undefined): number | null {
  if (typeof sek !== "number" || !Number.isFinite(sek) || sek <= 0) return null
  return Math.max(TID_MIN_SEK, Math.min(TID_MAKS_SEK, Math.round(sek)))
}

export function formaterTidSek(sek: number | null | undefined): string {
  if (sek === null || sek === undefined || !Number.isFinite(sek)) return "–"
  const s = Math.max(0, Math.round(sek))
  if (s < 60) return `${s} s`
  const t = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (t > 0) return `${t} t ${String(m).padStart(2, "0")} m`
  return `${m} m ${String(r).padStart(2, "0")} s`
}

export const FORSTE_DATO = START_DATO
export const FORSTE_MANED = START_DATO.slice(0, 7) // "2026-10"

export function gjeldendeManed(iDag = iDagOslo()) {
  return iDag.slice(0, 7)
}

export function erGyldigManed(m: unknown): m is string {
  return typeof m === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) && m >= FORSTE_MANED
}

export function manedGrenser(maned: string): { fra: string; til: string } {
  const [aar, mnd] = maned.split("-").map(Number)
  const sisteDag = new Date(Date.UTC(aar, mnd, 0)).getUTCDate()
  return {
    fra: `${maned}-01`,
    til: `${maned}-${String(sisteDag).padStart(2, "0")}`,
  }
}

export function flyttManed(maned: string, steg: number): string {
  const [aar, mnd] = maned.split("-").map(Number)
  const d = new Date(Date.UTC(aar, mnd - 1 + steg, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

export function formaterManed(maned: string): string {
  const [aar, mnd] = maned.split("-").map(Number)
  const tekst = new Intl.DateTimeFormat("nb-NO", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(aar, mnd - 1, 1)),
  )
  return tekst.charAt(0).toUpperCase() + tekst.slice(1)
}

export function formaterTavleDato(dato: string, iDag = iDagOslo()): string {
  const kort = formaterDato(dato, "kort")
  if (dato === iDag) return `I dag · ${kort}`
  if (dato === leggTilDager(iDag, -1)) return `I går · ${kort}`
  const aar = dato.slice(0, 4)
  return aar === iDag.slice(0, 4) ? kort : `${kort} ${aar}`
}

// ---- Leaderboard games & metrics ----

/** Games with server-side answer judging and server-verified results. */
export const SERVER_SPILL = [
  "anelseslos",
  "67-stegern",
  "gjettelos",
  "soket",
  "emovi",
  "tilkoblinger",
  "sanglos",
  "heksagonal-jakt",
] as const

export type ServerSpillId = (typeof SERVER_SPILL)[number]

/** Active flagship server-verified games featured on leaderboards and counted in Seierherre. */
export const TAVLE_SPILL = ["anelseslos", "67-stegern", "gjettelos"] as const satisfies readonly ServerSpillId[]
export type TavleSpillId = (typeof TAVLE_SPILL)[number]

export function erTavleSpill(id: string): id is TavleSpillId {
  return (TAVLE_SPILL as readonly string[]).includes(id)
}

/** Client-checked games: server-recomputed for personal history, excluded from leaderboards because answers/hints live on the client. */
export const KLIENT_SPILL = ["omriss", "canvas", "rusle", "mer-eller-mindre", "stavebien", "havet"] as const
export type KlientSpillId = (typeof KLIENT_SPILL)[number]

export function erServerSpill(id: string): id is ServerSpillId {
  return (SERVER_SPILL as readonly string[]).includes(id)
}

export type TavleMetrikk = "lost" | "tid" | "hint" | "forsok" | "feil" | "poeng"
export type TavleOmfang = "global" | "venner"
export type TavlePeriode = "dag" | "maned"
export type TavleValg = "totalt" | TavleSpillId

export type TavleSpillMeta = {
  id: ServerSpillId
  metrikker: readonly TavleMetrikk[]
  standard: TavleMetrikk
  dagMetrikker: readonly TavleMetrikk[]
  dagStandard: TavleMetrikk
  /** "vunnet" counts wins; "fullfort" counts completed days (for score-based games). */
  lostRegel: "vunnet" | "fullfort"
  lostEtikett: string
  poengEnhet?: string
}

export const TAVLE_META: Record<ServerSpillId, TavleSpillMeta> = {
  anelseslos: {
    id: "anelseslos",
    metrikker: ["lost", "tid", "hint", "forsok"],
    standard: "lost",
    dagMetrikker: ["forsok", "tid", "hint"],
    dagStandard: "forsok",
    lostRegel: "vunnet",
    lostEtikett: "Flest løste",
  },
  soket: {
    id: "soket",
    metrikker: ["lost", "forsok", "tid"],
    standard: "lost",
    dagMetrikker: ["forsok", "tid"],
    dagStandard: "forsok",
    lostRegel: "vunnet",
    lostEtikett: "Flest løste",
  },
  emovi: {
    id: "emovi",
    metrikker: ["lost", "hint", "tid"],
    standard: "lost",
    dagMetrikker: ["hint", "tid"],
    dagStandard: "hint",
    lostRegel: "vunnet",
    lostEtikett: "Flest løste",
  },
  tilkoblinger: {
    id: "tilkoblinger",
    metrikker: ["lost", "feil", "tid"],
    standard: "lost",
    dagMetrikker: ["feil", "tid"],
    dagStandard: "feil",
    lostRegel: "vunnet",
    lostEtikett: "Flest løste",
  },
  "67-stegern": {
    id: "67-stegern",
    metrikker: ["lost", "poeng"],
    standard: "lost",
    dagMetrikker: ["poeng"],
    dagStandard: "poeng",
    lostRegel: "fullfort",
    lostEtikett: "Flest dager",
    poengEnhet: "m",
  },
  gjettelos: {
    id: "gjettelos",
    metrikker: ["lost", "poeng"],
    standard: "lost",
    dagMetrikker: ["poeng"],
    dagStandard: "poeng",
    lostRegel: "fullfort",
    lostEtikett: "Flest dager",
    poengEnhet: "p",
  },
  sanglos: {
    id: "sanglos",
    metrikker: ["lost", "poeng"],
    standard: "lost",
    dagMetrikker: ["poeng"],
    dagStandard: "poeng",
    lostRegel: "vunnet",
    lostEtikett: "Flest 3/3",
    poengEnhet: "/3",
  },
  "heksagonal-jakt": {
    id: "heksagonal-jakt",
    metrikker: ["lost", "poeng"],
    standard: "lost",
    dagMetrikker: ["poeng"],
    dagStandard: "poeng",
    lostRegel: "fullfort",
    lostEtikett: "Flest dager",
    poengEnhet: "p",
  },
}

export function metrikkEtikett(spillId: ServerSpillId, m: TavleMetrikk, periode: TavlePeriode = "maned"): string {
  switch (m) {
    case "lost":
      return TAVLE_META[spillId].lostEtikett
    case "tid":
      return "Kortest tid"
    case "hint":
      return "Færrest hint"
    case "forsok":
      return spillId === "anelseslos" ? "Færrest gjetninger" : "Færrest forsøk"
    case "feil":
      return "Færrest feil"
    case "poeng":
      if (periode === "dag") {
        return spillId === "67-stegern" ? "Lengde (m)" : spillId === "sanglos" ? "Riktige" : "Poeng"
      }
      return spillId === "67-stegern" ? "Høyest snitt (m)" : spillId === "sanglos" ? "Snitt riktige" : "Høyest snitt"
  }
}

export type SpillResultatRad = {
  spill_id: SpillId
  dato: string
  status: "vunnet" | "tapt" | "ferdig"
  etikett: string
  poeng: number | null
  forsok: number | null
  hint_antall: number
  tid_sek: number | null
  verifisert: boolean
  opprettet_kl: string
}

export type TavleOppforing = {
  plass: number
  brukerId: string
  visningsnavn: string
  erMeg: boolean
  lost: number
  fullfort: number
  snittTidSek: number | null
  snittHint: number | null
  snittForsok: number | null
  snittFeil: number | null
  snittPoeng: number | null
  verdiTekst: string
}

export type TotaltOppforing = {
  plass: number
  brukerId: string
  visningsnavn: string
  erMeg: boolean
  poeng: number
  seiere: number
  dagsseiere: number
  spilt: number
}

export type SpillVinnerKort = {
  spillId: ServerSpillId
  vinnere: { brukerId: string; visningsnavn: string; erMeg: boolean }[]
  verdiTekst: string
  deltakere: number
}

export type ProfilInfo = {
  userId: string
  visningsnavn: string | null
  vennekode: string | null
}

export type VennOppforing = {
  vennskapId: string
  brukerId: string
  visningsnavn: string
  status: "venter" | "godtatt"
  retning: "sendt" | "mottatt"
  opprettetKl: string
}

// ---- Duel challenges ----

export const DUELL_SPILL = ["67-stegern", "gjettelos", "moggern"] as const
export type DuellSpillId = (typeof DUELL_SPILL)[number]
export type DuellModus = "runder" | "pistol"

export const DUELL_MODUS_VALG: Record<DuellSpillId, readonly { id: DuellModus; navn: string; kort: string }[]> = {
  "67-stegern": [
    { id: "runder", navn: "Vanlig duell", kort: "5 spørsmål samtidig, lengste hopp vinner" },
    { id: "pistol", navn: "Startpistolen", kort: "Varm potet med skjult lunte og liv" },
  ],
  gjettelos: [{ id: "runder", navn: "Vanlig duell", kort: "5 tallspørsmål, nærmest fasit vinner" }],
  moggern: [{ id: "runder", navn: "1v1 med kamera", kort: "15 s kameraduell med venner, høyeste poengsum mogger" }],
}

export type DuellUtfordring = {
  id: string
  avsenderId: string
  avsenderNavn: string
  mottakerId: string
  mottakerNavn: string
  spillId: DuellSpillId
  modus: DuellModus
  romkode: string
  status: "venter" | "godtatt" | "avslatt" | "avbrutt"
  opprettetKl: string
  utloperKl: string
}

export function duellRomLenke(spillId: DuellSpillId, romkode: string, modus: DuellModus = "runder") {
  if (spillId === "67-stegern") {
    return modus === "pistol" ? `/spill/67-stegern/duell/${romkode}?modus=pistol` : `/spill/67-stegern/duell/${romkode}`
  }
  if (spillId === "moggern") {
    return `/spill/moggern/${romkode}`
  }
  return `/spill/gjettelos/duell/${romkode}`
}

export function duellSpillKortNavn(spillId: DuellSpillId) {
  if (spillId === "67-stegern") return "6/7-stegern"
  if (spillId === "moggern") return "Moggern"
  return "Gjetteløs"
}

export function duellSpillNavn(spillId: DuellSpillId, modus: DuellModus) {
  if (spillId === "67-stegern") return modus === "pistol" ? "6/7-stegern · Startpistolen" : "6/7-stegern"
  if (spillId === "moggern") return "Moggern (kamera)"
  return "Gjetteløs"
}

/** Opaque Realtime wakeup channel name (payload carries only a ping, never private data). */
export const utfordringVarselKanal = (userId: string) => `spill-utfordring-varsel:${userId}`

/** True when the user is already inside the duel room for `romkode`. */
export function erIRom(pathname: string, romkode: string): boolean {
  const ren = pathname.replace(/\/+$/, "").toUpperCase()
  const kode = romkode.trim().toUpperCase()
  return Boolean(kode) && (ren.endsWith(`/${kode}`) || ren.includes(`/${kode}/`))
}

export type UtfordringVarselKort = {
  type: "innkommende" | "godtatt"
  utfordring: DuellUtfordring
}

/**
 * Selects which duel challenges should appear as floating pop-ups right now:
 * - Hidden on `/spill/dueller` (already the full challenge inbox)
 * - Excludes expired pending challenges, dismissed IDs, and rooms the user is already inside
 * - Includes newly accepted outgoing challenges so the challenger gets notified too
 */
export function velgSynligeUtfordringVarsler({
  pathname,
  innkommende,
  utgaende,
  godtatteVarselIder,
  skjulteIder,
  naMs = Date.now(),
  maks = 3,
}: {
  pathname: string
  innkommende: readonly DuellUtfordring[]
  utgaende: readonly DuellUtfordring[]
  godtatteVarselIder: ReadonlySet<string>
  skjulteIder: ReadonlySet<string>
  naMs?: number
  maks?: number
}): { synlige: UtfordringVarselKort[]; skjulteFlere: number } {
  const renSti = pathname.replace(/\/+$/, "")
  if (renSti === "/spill/dueller") return { synlige: [], skjulteFlere: 0 }

  const kort: UtfordringVarselKort[] = []

  for (const u of innkommende) {
    if (u.status !== "venter") continue
    if (new Date(u.utloperKl).getTime() <= naMs) continue
    if (skjulteIder.has(u.id)) continue
    if (erIRom(renSti, u.romkode)) continue
    kort.push({ type: "innkommende", utfordring: u })
  }

  for (const u of utgaende) {
    if (u.status !== "godtatt") continue
    if (!godtatteVarselIder.has(u.id)) continue
    if (skjulteIder.has(`godtatt:${u.id}`)) continue
    if (erIRom(renSti, u.romkode)) continue
    kort.push({ type: "godtatt", utfordring: u })
  }

  kort.sort((a, b) => Date.parse(b.utfordring.opprettetKl) - Date.parse(a.utfordring.opprettetKl))
  return {
    synlige: kort.slice(0, maks),
    skjulteFlere: Math.max(0, kort.length - maks),
  }
}
