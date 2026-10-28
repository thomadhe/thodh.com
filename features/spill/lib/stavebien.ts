import type { StavebienWord } from "../data/types"
import { stavebienOrd } from "../data/stavebien/ord"
import { dagNummer, iRotasjon } from "./dag"

export const ORD_PER_NIVA = 2

const perNiva = ([1, 2, 3, 4, 5] as const).map((n) => stavebienOrd.filter((o) => o.level === n))

/** Ten words for the day, two per level from easy to hard. Each level rotates through all its words. */
export function dagensStavebien(dato: string): StavebienWord[] {
  const dag = dagNummer(dato)
  return perNiva.flatMap((liste, i) =>
    Array.from({ length: ORD_PER_NIVA }, (_, j) => iRotasjon(liste, dag * ORD_PER_NIVA + j, `stavebien:${i + 1}`)),
  )
}

export function antallStaveord() {
  return stavebienOrd.length
}

