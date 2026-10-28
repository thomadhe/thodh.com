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
import { dagNummer, iRotasjon, stokk } from "./dag"

export const kategorier: MerEllerMindreCategory[] = [
  artisterLyttere,
  sangerStrommer,
  artisterAlder,
  filmerImdb,
  filmerInntekter,
  serierImdb,
  landBefolkning,
  landAreal,
  norskeKommuner,
  avstandOslo,
  hoyde,
  dyrVekt,
  matKalorier,
  hvaKomForst,
]

export const KATEGORIER_PER_DAG = 5
export const RUNDER_PER_KATEGORI = 5
/** Items reserved per category per day; extra room so every pair can meet the separation rule. */
const VINDU = 16

export type MelRunde = { a: MerEllerMindreItem; b: MerEllerMindreItem; /** 0 = a wins, 1 = b wins */ fasit: 0 | 1 }

export type MelKategori = Omit<MerEllerMindreCategory, "items" | "separation"> & { runder: MelRunde[] }

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
  // Categories rotate too: each one shows up before any comes back, five per day.
  const valgte: MerEllerMindreCategory[] = []
  for (let n = dag * KATEGORIER_PER_DAG; valgte.length < KATEGORIER_PER_DAG; n++) {
    const k = iRotasjon(kategorier, n, "kategorier")
    if (!valgte.includes(k)) valgte.push(k)
  }
  return valgte.map((k) => {
    const { items: _items, separation: _sep, ...meta } = k
    void _items
    void _sep
    return { ...meta, runder: lagRunder(k, dag) }
  })
}
