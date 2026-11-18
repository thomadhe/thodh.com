import { filmTvOgMusikk } from "./film-tv-og-musikk"
import { geografi } from "./geografi"
import { historieOgNorge } from "./historie-og-norge"
import { hverdagOgSprak } from "./hverdag-og-sprak"
import { matOgDrikke } from "./mat-og-drikke"
import { naturOgVitenskap } from "./natur-og-vitenskap"
import { sportOgFritid } from "./sport-og-fritid"
import type { StegernSporsmal } from "../stegern/typer"

/**
 * Prompts for the 6/7-stegern duels only, never the daily page. Broad categories with long answer lists, so
 * Startpistolen can go many turns on one prompt without running out of different answers.
 */
export const stegernDuellBank: StegernSporsmal[] = [
  ...geografi,
  ...matOgDrikke,
  ...filmTvOgMusikk,
  ...sportOgFritid,
  ...naturOgVitenskap,
  ...hverdagOgSprak,
  ...historieOgNorge,
]
