import "server-only"

import { emoviFilmer } from "../../data/emovi/filmer"
import plakater from "../../data/emovi/plakater.json"
import { dagNummer, iRotasjon } from "../dag"

/** Today's film. The page only gets the emojis; guesses and hints go through /spill/api/emovi. */
export function dagensFilm(dato: string) {
  return iRotasjon(emoviFilmer, dagNummer(dato), "emovi")
}

/** The film's poster from English Wikipedia (non-free, hotlinked), shown once the game is over. */
export function plakat(id: string): string | null {
  return (plakater as Record<string, { src: string }>)[id]?.src ?? null
}

export const enkelTittel = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9æøå]/g, "")
