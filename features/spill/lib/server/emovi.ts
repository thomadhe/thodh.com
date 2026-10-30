import "server-only"

import { emoviFilmer } from "../../data/emovi/filmer"
import { dagNummer, iRotasjon } from "../dag"

/** Today's film. The page only gets the emojis; guesses and hints go through /spill/api/emovi. */
export function dagensFilm(dato: string) {
  return iRotasjon(emoviFilmer, dagNummer(dato), "emovi")
}

export const enkelTittel = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9æøå]/g, "")
