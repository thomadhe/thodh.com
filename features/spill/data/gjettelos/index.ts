import { historie } from "./historie"
import { hverdag } from "./hverdag"
import { kropp } from "./kropp"
import { kultur } from "./kultur"
import { natur } from "./natur"
import { norge } from "./norge"
import { okonomi } from "./okonomi"
import { rekorder } from "./rekorder"
import { rommet } from "./rommet"
import { sport } from "./sport"
import { teknologi } from "./teknologi"
import type { GjSporsmal } from "./typer"
import { verden } from "./verden"

/** The whole bank. The order does not matter; the day plan (plan.ts) picks questions by id. */
export const gjettelosSporsmal: GjSporsmal[] = [
  ...norge,
  ...verden,
  ...historie,
  ...sport,
  ...rommet,
  ...teknologi,
  ...kultur,
  ...okonomi,
  ...kropp,
  ...rekorder,
  ...hverdag,
  ...natur,
]
