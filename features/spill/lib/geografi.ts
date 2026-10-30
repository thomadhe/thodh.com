import landJson from "../data/geografi/land.json"

export type Land = {
  /** ISO 3166-1 alpha-2 (Kosovo is "XK"). */
  id: string
  /** Norwegian Bokmål name. */
  navn: string
  en: string
  /** Extra accepted answers beyond `navn` and `en`. */
  svar: string[]
  hovedstad: string
  hovedstadEn: string
  /** Extra accepted capital answers (includes the English name). */
  hovedstadSvar: string[]
  kontinent: "Europa" | "Asia" | "Afrika" | "Nord-Amerika" | "Sør-Amerika" | "Oseania"
  lat: number
  lng: number
}

export const land: Land[] = landJson as Land[]
