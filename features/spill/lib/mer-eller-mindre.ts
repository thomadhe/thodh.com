import type { MerEllerMindreCategory, MerEllerMindreItem } from "../data/types"
import { artisterAlder } from "../data/mer-eller-mindre/artister-alder"
import { artisterLyttere } from "../data/mer-eller-mindre/artister-lyttere"
import { avstandOslo } from "../data/mer-eller-mindre/avstand-oslo"
import { dyrVekt } from "../data/mer-eller-mindre/dyr-vekt"
import { filmerImdb } from "../data/mer-eller-mindre/filmer-imdb"
import { filmerInntekter } from "../data/mer-eller-mindre/filmer-inntekter"
import { hoyde } from "../data/mer-eller-mindre/hoyde"
import { hvaKomForst } from "../data/mer-eller-mindre/hva-kom-forst"
import { landAreal } from "../data/mer-eller-mindre/land-areal"
import { landBefolkning } from "../data/mer-eller-mindre/land-befolkning"
import { matKalorier } from "../data/mer-eller-mindre/mat-kalorier"
import { norskeKommuner } from "../data/mer-eller-mindre/norske-kommuner"
import { sangerStrommer } from "../data/mer-eller-mindre/sanger-strommer"
import { serierImdb } from "../data/mer-eller-mindre/serier-imdb"
import bilder from "../data/mer-eller-mindre/bilder.json"
import { dagNummer, iRotasjon, stokk } from "./dag"

/**
 * Same daily shape as More/Less: five fixed slots in a fixed order (people, streams, ratings, money,
 * trivia). Slots with several categories rotate between them day by day.
 */
const PLASSER: MerEllerMindreCategory[][] = [
  [artisterLyttere],
  [sangerStrommer],
  [filmerImdb, serierImdb],
  [filmerInntekter],
  [landBefolkning, dyrVekt, hoyde, matKalorier, hvaKomForst, landAreal, artisterAlder, norskeKommuner, avstandOslo],
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

/** Picks 5 well-separated pairs from the category's rotation window for this day. */
function lagRunder(k: MerEllerMindreCategory, dag: number): MelRunde[] {
  const vindu = Array.from({ length: Math.min(VINDU, k.items.length) }, (_, i) => iRotasjon(k.items, dag * VINDU + i, k.id))
  // A window can straddle two shuffles; drop the rare repeat.
  const ledige = vindu.filter((x, i) => vindu.findIndex((y) => y.name === x.name) === i)
  const runder: MelRunde[] = []
  while (runder.length < RUNDER_PER_KATEGORI && ledige.length > 1) {
    const a = ledige.shift()!
    const j = ledige.findIndex((b) => b.name !== a.name && godtPar(k, a, b))
    if (j < 0) continue
    const [b] = ledige.splice(j, 1)
    const aVinner = k.winner === "higher" ? a.value > b.value : a.value < b.value
    runder.push({ a, b, fasit: aVinner ? 0 : 1 })
  }
  // Fallback for rare unlucky windows: scan the whole category with a date-seeded order.
  if (runder.length < RUNDER_PER_KATEGORI) {
    const brukt = new Set(runder.flatMap((r) => [r.a.name, r.b.name]))
    const resten = stokk(k.items, `${k.id}:reserve:${dag}`).filter((x) => !brukt.has(x.name))
    for (let i = 0; i < resten.length && runder.length < RUNDER_PER_KATEGORI; i++) {
      const a = resten[i]
      if (brukt.has(a.name)) continue
      const b = resten.slice(i + 1).find((x) => !brukt.has(x.name) && godtPar(k, a, x))
      if (!b) continue
      brukt.add(a.name).add(b.name)
      const aVinner = k.winner === "higher" ? a.value > b.value : a.value < b.value
      runder.push({ a, b, fasit: aVinner ? 0 : 1 })
    }
  }
  return runder
}

export function dagensMerEllerMindre(dato: string): MelKategori[] {
  const dag = dagNummer(dato)
  return PLASSER.map((plass, i) => {
    const k = iRotasjon(plass, dag, `plass:${i}`)
    const { items: _items, separation: _sep, ...meta } = k
    void _items
    void _sep
    const runder = lagRunder(k, dag).map((r) => ({ ...r, a: medBilde(k, r.a), b: medBilde(k, r.b) }))
    const bildeformat = k === filmerImdb || k === serierImdb || k === filmerInntekter ? "portrett" : "kvadrat"
    return { ...meta, runder, bildeformat }
  })
}
