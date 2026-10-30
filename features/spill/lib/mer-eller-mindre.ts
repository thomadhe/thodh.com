import type { MerEllerMindreCategory, MerEllerMindreItem } from "../data/types"
import { artisterLyttere } from "../data/mer-eller-mindre/artister-lyttere"
import { artisterLytterNorden } from "../data/mer-eller-mindre/artister-lyttere-norden"
import { avstandOslo } from "../data/mer-eller-mindre/avstand-oslo"
import { dyrVekt } from "../data/mer-eller-mindre/dyr-vekt"
import { fakta } from "../data/mer-eller-mindre/fakta"
import { filmerImdb } from "../data/mer-eller-mindre/filmer-imdb"
import { hoyde } from "../data/mer-eller-mindre/hoyde"
import { hvaVeierMest } from "../data/mer-eller-mindre/hva-veier-mest"
import { hvaKomForst } from "../data/mer-eller-mindre/hva-kom-forst"
import { landAreal } from "../data/mer-eller-mindre/land-areal"
import { landBefolkning } from "../data/mer-eller-mindre/land-befolkning"
import { kuriositeter } from "../data/mer-eller-mindre/kuriositeter"
import { levealder } from "../data/mer-eller-mindre/levealder"
import { matKalorier } from "../data/mer-eller-mindre/mat-kalorier"
import { norskeKommuner } from "../data/mer-eller-mindre/norske-kommuner"
import { oppkjop } from "../data/mer-eller-mindre/oppkjop"
import { overgangssummer } from "../data/mer-eller-mindre/overgangssummer"
import { priserNorge } from "../data/mer-eller-mindre/priser-norge"
import { ran } from "../data/mer-eller-mindre/ran"
import { sangerStrommer } from "../data/mer-eller-mindre/sanger-strommer"
import { sangerStrommerNorden } from "../data/mer-eller-mindre/sanger-strommer-norden"
import { serierImdb } from "../data/mer-eller-mindre/serier-imdb"
import { toppfart } from "../data/mer-eller-mindre/toppfart"
import bilder from "../data/mer-eller-mindre/bilder.json"
import { dagNummer, iRotasjon, stokk } from "./dag"

/**
 * Five fixed slots in a fixed order (music, film and TV, prices, countries, trivia). Slots with several
 * categories rotate between them day by day. The music slot keeps Nordic artists and songs in their own
 * categories so they never meet global superstars.
 */
const PLASSER: MerEllerMindreCategory[][] = [
  [artisterLyttere, sangerStrommer, artisterLytterNorden, sangerStrommerNorden],
  [filmerImdb, serierImdb],
  [kuriositeter, ran, oppkjop, overgangssummer, priserNorge],
  [landBefolkning, landAreal],
  [dyrVekt, hoyde, matKalorier, hvaKomForst, norskeKommuner, avstandOslo, toppfart, hvaVeierMest, levealder, fakta],
]

export const kategorier: MerEllerMindreCategory[] = PLASSER.flat()

export const KATEGORIER_PER_DAG = PLASSER.length
export const RUNDER_PER_KATEGORI = 5
/** Items reserved per category per day; extra room so every pair can meet the separation rule. */
const VINDU = 16

/** An item with its picture, when one was found (scripts/spill/hent-bilder.mjs). */
export type MelItem = MerEllerMindreItem & { bilde?: string; kilde?: string }

export type MelRunde = { a: MelItem; b: MelItem; /** 0 = a wins, 1 = b wins */ fasit: 0 | 1 }

export type MelKategori = Omit<MerEllerMindreCategory, "items" | "separation"> & {
  runder: MelRunde[]
  /** Posters are portrait; everything else is shown square. */
  bildeformat: "portrett" | "kvadrat"
}

const bildeKart = bilder as Record<string, { src: string; kilde?: string } | undefined>

function medBilde(k: MerEllerMindreCategory, item: MerEllerMindreItem): MelItem {
  const b = bildeKart[`${k.id}::${item.name}`]
  return b ? { ...item, bilde: b.src, kilde: b.kilde } : item
}

function godtPar(k: MerEllerMindreCategory, a: MerEllerMindreItem, b: MerEllerMindreItem) {
  if (k.separation.kind === "difference") return Math.abs(a.value - b.value) >= k.separation.value
  const [lav, hoy] = a.value < b.value ? [a.value, b.value] : [b.value, a.value]
  return lav > 0 && hoy / lav >= k.separation.value
}

/** Greedy chain where every neighbour pair is far enough apart; tries each start until one is long enough. */
function byggKjede(k: MerEllerMindreCategory, kandidater: MerEllerMindreItem[]) {
  const lengde = RUNDER_PER_KATEGORI + 1
  let beste: MerEllerMindreItem[] = []
  for (let s = 0; s < kandidater.length && beste.length < lengde; s++) {
    const igjen = kandidater.filter((_, i) => i !== s)
    const kjede = [kandidater[s]]
    while (kjede.length < lengde) {
      const j = igjen.findIndex((x) => godtPar(k, kjede.at(-1)!, x))
      if (j < 0) break
      kjede.push(igjen.splice(j, 1)[0])
    }
    if (kjede.length > beste.length) beste = kjede
  }
  return beste
}

/**
 * Like More/less: six items in a chain, so the right card of one round is the left card of the next
 * (and its value is already known). Built from the category's rotation window for this day.
 */
function lagRunder(k: MerEllerMindreCategory, dag: number): MelRunde[] {
  const vindu = Array.from({ length: Math.min(VINDU, k.items.length) }, (_, i) => iRotasjon(k.items, dag * VINDU + i, k.id))
  // A window can straddle two shuffles; drop the rare repeat.
  const ledige = vindu.filter((x, i) => vindu.findIndex((y) => y.name === x.name) === i)
  let kjede = byggKjede(k, ledige)
  // Fallback for rare unlucky windows: the whole category in a date-seeded order.
  if (kjede.length <= RUNDER_PER_KATEGORI) kjede = byggKjede(k, stokk(k.items, `${k.id}:reserve:${dag}`))
  return kjede.slice(1).map((b, i) => {
    const a = kjede[i]
    const aVinner = k.winner === "higher" ? a.value > b.value : a.value < b.value
    return { a, b, fasit: aVinner ? 0 : 1 }
  })
}

export function dagensMerEllerMindre(dato: string): MelKategori[] {
  const dag = dagNummer(dato)
  return PLASSER.map((plass, i) => {
    const k = iRotasjon(plass, dag, `plass:${i}`)
    const { items: _items, separation: _sep, ...meta } = k
    void _items
    void _sep
    const runder = lagRunder(k, dag).map((r) => ({ ...r, a: medBilde(k, r.a), b: medBilde(k, r.b) }))
    const bildeformat = k === filmerImdb || k === serierImdb ? "portrett" : "kvadrat"
    return { ...meta, runder, bildeformat }
  })
}
