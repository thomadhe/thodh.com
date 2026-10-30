import landJson from "../data/geografi/land.json"
import byerJson from "../data/geografi/byer.json"

export type Kontinent = "Europa" | "Asia" | "Afrika" | "Nord-Amerika" | "Sør-Amerika" | "Oseania"

export type Valuta = {
  /** Norwegian name, e.g. "euro" or "norsk krone". */
  navn: string
  /** ISO 4217 code. */
  kode: string
}

/** One of the four most populous cities (the city proper, from GeoNames; English/local name). */
export type By = {
  navn: string
  folketall: number
  lat: number
  lng: number
}

/** A sovereign state or a territory (Greenland, Puerto Rico, Hong Kong, ...). */
export type Omrade = {
  /** ISO 3166-1 alpha-2 (Kosovo is "XK"). */
  id: string
  /** Norwegian Bokmål name. */
  navn: string
  en: string
  /** Extra accepted answers beyond `navn` and `en`. */
  svar: string[]
  /** Empty for the few `liten` territories without a capital (Bouvetøya, Tokelau, ...). */
  hovedstad: string
  hovedstadEn: string
  /** Extra accepted capital answers (includes the English name). */
  hovedstadSvar: string[]
  /** Territories without a continent of their own (Antarctic islands) get the nearest of the six. */
  kontinent: Kontinent
  lat: number
  lng: number
  /** True for the 197 quiz countries. */
  suveren: boolean
  /** Sovereign state a territory belongs to (`id`). Missing for Western Sahara and for sovereign states. */
  tilhorer?: string
  /** Tiny or unrecognisable silhouette: skip as a daily answer. Only set on territories. */
  liten?: true
  /** flagcdn.com code (lower-case ISO 3166-1 alpha-2, "xk" for Kosovo). */
  flagg: string
  /** Ids that share a land border (symmetric; includes territories such as French Guiana for Brazil). */
  naboer: string[]
  /** Nearest entries across the sea (not land neighbours), nearest first, at most 7. Computed, not hand-curated. */
  naboerSjo: string[]
  /** Latest estimate. */
  befolkning: number
  befolkningAar?: number
  /** km2 */
  areal: number
  /** null only for uninhabited territories (Bouvetøya, Heard- og McDonaldøyene). */
  valuta: Valuta | null
  /** Norwegian names of the most widely spoken languages, most spoken first (at most three). */
  sprak: string[]
  /** [lat, lng] of the capital; missing when there is no capital. */
  hovedstadPos?: [number, number]
  /** GDP per capita in current US$ (World Bank). Missing for Taiwan, Vatican City and most territories. */
  bnp?: number
  bnpAar?: number
}

/** The 197 sovereign states used by the map quizzes. */
export type Land = Omrade & { suveren: true; tilhorer?: undefined; liten?: undefined; valuta: Valuta }

/** A non-sovereign territory (Worldle also accepts these as answers). */
export type Territorium = Omrade & { suveren: false }

/** All 248 entries: the 197 states first, then the 51 territories. */
export const omrader: Omrade[] = landJson as Omrade[]

/** Exactly the 197 sovereign states (Verdens land, Hovedsteder, ...). Territories are never in here. */
export const land: Land[] = omrader.filter((o): o is Land => o.suveren)

export const territorier: Territorium[] = omrader.filter((o): o is Territorium => !o.suveren)

/** Top cities by population, keyed by id (all 248 entries; fewer than four for the smallest places). */
export const storeByer: Record<string, By[]> = byerJson
