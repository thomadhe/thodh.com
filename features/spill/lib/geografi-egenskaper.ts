import egenskaperJson from "../data/geografi/egenskaper.json"
import stederJson from "../data/geografi/steder.json"

export type FlaggFarge = "rød" | "hvit" | "blå" | "grønn" | "gul" | "svart" | "oransje"

export type Hav =
  | "Atlanterhavet"
  | "Stillehavet"
  | "Det indiske hav"
  | "Middelhavet"
  | "Karibhavet"
  | "Østersjøen"
  | "Nordsjøen"
  | "Svartehavet"
  | "Rødehavet"
  | "Persiabukta"
  | "Sørkinahavet"
  | "Polhavet"

/** Attributes of one of the 197 sovereign states (key = `Land.id`). null = unknown (no source has a figure). */
export type Egenskaper = {
  // Flag
  /** Main colours (tiny emblem details ignored). */
  flaggFarger: FlaggFarge[]
  /** Any star, also inside a canton or emblem (not suns with rays). */
  flaggStjerne: boolean
  /** Crescent/moon (Nepal's moon counts). */
  flaggManeHalvmane: boolean
  /** A clearly visible animal (eagle, lion, dragon, ...). */
  flaggDyr: boolean
  /** Coat of arms, seal or heraldic emblem. */
  flaggVapen: boolean
  /** Cross or saltire, also a Union Jack canton. */
  flaggKors: boolean
  /** The field is split into parallel horizontal bands. */
  flaggHorisontaleStriper: boolean
  /** The field is split into parallel vertical bands. */
  flaggVertikaleStriper: boolean

  // Geography (the country proper, overseas territories excluded)
  /** No coast on an ocean or sea (Caspian-only states count as landlocked). */
  innlandsstat: boolean
  /** No land border and mainly islands. Australia does not count; Great Britain, Ireland, Indonesia etc. are in `oyDelt`. */
  oy: boolean
  /** Island country in the wider sense: `oy` plus countries that share an island or are linked by a causeway. */
  oyDelt: boolean
  /** CIA World Factbook coastline, km (0 for landlocked). */
  kystKm: number
  hav: Hav[]
  /** Territory lies on both sides of the equator. */
  ekvator: boolean
  /** Any part lies between the tropics. */
  tropene: boolean
  /** CIA World Factbook, metres. */
  hoyestePunktM: number
  /** Forest share of the land area, percent (World Bank/FAO, latest year). */
  skogProsent: number
  /** Pacific Ring of Fire (Wikipedia table, "consensus for inclusion"). */
  ildringen: boolean

  // Politics
  monarki: boolean
  eu: boolean
  nato: boolean
  samveldet: boolean
  arabiskeLiga: boolean
  tidligereSovjet: boolean
  /** The nine nuclear-armed states. */
  atomvapen: boolean
  venstrekjoring: boolean
  /** Official languages, Norwegian names. */
  spraak: string[]
  /** Distinct UTC offsets incl. dependent territories (Wikipedia "List of time zones by country"). */
  tidssoner: number

  // People and economy
  /** UNDP, 2023 data. null: Kosovo, Monaco, North Korea, Vatican City. */
  hdi: number | null
  /** Current US$, World Bank latest year (Taiwan: IMF 2025). null: North Korea, Vatican City. */
  bnpPerInnbygger: number | null
  levealder: number | null
  medianalder: number | null

  // Sport and culture
  /** All-time summer + winter medals under the country's own NOC, through the 2026 Winter Games. */
  olMedaljer: number
  harArrangertOL: boolean
  harArrangertFotballVM: boolean
  harVunnetFotballVM: boolean
  /** Has ever taken part in the Eurovision Song Contest. */
  eurovision: boolean

  // Misc
  /** At least one metro/rapid-transit system (Wikipedia "List of metro systems"). */
  metro: boolean
  /** The capital is not the largest city. null: Nauru (no de jure capital). */
  hovedstadIkkeStorst: boolean | null
}

/** Keyed by `Land.id` (ISO 3166-1 alpha-2, Kosovo "XK"), exactly the 197 sovereign states. */
export const egenskaper: Record<string, Egenskaper> = egenskaperJson as unknown as Record<string, Egenskaper>

/** A place in Heksagonal jakt: a city or a famous landmark / natural site. */
export type Sted = {
  /** Slug, unique across the list. */
  id: string
  /** Norwegian name. */
  navn: string
  /** `Omrade.id` of the state or territory the place is in (can be a territory such as GL, HK or PR). */
  land: string
  lat: number
  lng: number
  type: "by" | "landemerke"
  /** City proper (GeoNames); null for landmarks and a few small towns. */
  befolkning: number | null
}

export const steder: Sted[] = stederJson as Sted[]
