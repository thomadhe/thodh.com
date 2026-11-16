import type { Kategori, Vansk } from "../../lib/gjettelos"

export type GjSporsmal = {
  /** "<kategori>:<slug>", unique in the bank and used by the day plan. Never change one that has been played. */
  id: string
  kategori: Kategori
  /** 1 most people get close, 2 needs some knowledge, 3 hard. */
  vansk: Vansk
  tekst: string
  /** Shown next to the field and the answer: "meter", "innbyggere", "kr". "årstall" for years. */
  enhet: string
  fasit: number
  /** The answer is a year, scored by how long ago it was (see poengFor). */
  aarstall: boolean
  /** The answer is rounded ("ca."). */
  ca: boolean
  /** The year the number is for, when it changes over time. */
  per?: string
  /** Name of the source, or a URL. */
  kilde: string
  /** A short extra fact shown with the answer. */
  info?: string
}

type Ekstra = { ca?: boolean; per?: string; info?: string }
/** [slug, difficulty, question, unit, answer, source, extras]. A unit of "årstall" makes it a year question. */
export type Rad = [slug: string, vansk: Vansk, tekst: string, enhet: string, fasit: number, kilde: string, ekstra?: Ekstra]

export function lag(kategori: Kategori, rader: Rad[]): GjSporsmal[] {
  return rader.map(([slug, vansk, tekst, enhet, fasit, kilde, ekstra = {}]) => ({
    id: `${kategori}:${slug}`,
    kategori,
    vansk,
    tekst,
    enhet,
    fasit,
    aarstall: enhet === "årstall",
    ca: ekstra.ca ?? false,
    ...(ekstra.per ? { per: ekstra.per } : {}),
    kilde,
    ...(ekstra.info ? { info: ekstra.info } : {}),
  }))
}
