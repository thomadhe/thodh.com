import { norge } from "./norge"
import { verden } from "./verden"
import { historie } from "./historie"
import { sport } from "./sport"
import { rommet } from "./rommet"
import { teknologi } from "./teknologi"
import { kultur } from "./kultur"
import { okonomi } from "./okonomi"
import { kropp } from "./kropp"
import { rekorder } from "./rekorder"
import { hverdag } from "./hverdag"
import { natur } from "./natur"
import { dyr } from "./dyr"
import type { GjSporsmal } from "../gjettelos/typer"

/**
 * Questions used only in Gjetteløs-duell, never in the daily game. Every id has the "d-" prefix after the category, so it
 * cannot collide with the daily bank.
 */
export const gjettelosDuellBank: GjSporsmal[] = [
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
  ...dyr,
]
