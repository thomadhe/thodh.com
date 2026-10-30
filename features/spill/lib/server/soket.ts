import "server-only"

import { soketOppgaver } from "../../data/soket/oppgaver"
import { dagNummer, iRotasjon } from "../dag"

/** Today's search. Only the prompt and the word length go to the page; guesses are checked here. */
export function dagensSok(dato: string) {
  return iRotasjon(soketOppgaver, dagNummer(dato), "soket")
}
