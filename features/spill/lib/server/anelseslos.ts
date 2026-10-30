import "server-only"

import { readFileSync } from "node:fs"
import path from "node:path"
import { dagNummer, iRotasjon } from "../dag"
import { hemmeligeOrd } from "./hemmelige-ord"

// Word vectors: an ensemble whose cosine is the weighted mean of three models' cosines (1 : 1 : 0.5):
// GloVe (Pennington, Socher & Manning 2014; Common Crawl 42B/840B and Wikipedia+Gigaword 6B, PDDL 1.0),
// mxbai-embed-large-v1 (Mixedbread, Apache 2.0) and Qwen3-Embedding-0.6B (Qwen team, Alibaba, Apache 2.0)
// embedding each word alone ("Given a word, retrieve words that are related to it in meaning or topic").
// GloVe keeps the associations, the sentence models add categories (lettuce ~ vegetable, food). Distilled to
// 300 dims by matching each word's neighbour ranking. Vocabulary: 25,000 common English lemmas chosen with
// WordNet 3.0 (© 2006 Princeton University); inflections and British spellings map to their lemma via
// forms.tsv. L2-normalised, quantised to int8.
const MAPPE = path.join(process.cwd(), "features", "spill", "data", "anelseslos")
const DIM = 300

type Modell = { ord: string[]; indeks: Map<string, number>; former: Map<string, number>; vektorer: Int8Array }
let modell: Modell | null = null

function lastModell(): Modell {
  if (modell) return modell
  // Tolerate CRLF in case a Windows checkout rewrote the line endings.
  const ord = readFileSync(path.join(MAPPE, "vocab.txt"), "utf8").split(/\r?\n/)
  const indeks = new Map(ord.map((o, i) => [o, i]))
  const former = new Map<string, number>()
  for (const linje of readFileSync(path.join(MAPPE, "forms.tsv"), "utf8").split(/\r?\n/)) {
    const tab = linje.indexOf("\t")
    if (tab > 0) former.set(linje.slice(0, tab), Number(linje.slice(tab + 1)))
  }
  const fil = readFileSync(path.join(MAPPE, "vectors.bin"))
  const vektorer = new Int8Array(fil.buffer, fil.byteOffset, fil.byteLength)
  if (vektorer.length !== ord.length * DIM) throw new Error("Anelsesløs: vektorfilen passer ikke med ordlisten")
  modell = { ord, indeks, former, vektorer }
  return modell
}

type Rangering = { hemmelig: number; plass: Int32Array; rekkefolge: Int32Array }
const buffer = new Map<string, Rangering>()

export function hemmeligIndeks(dato: string) {
  const m = lastModell()
  const ord = iRotasjon(hemmeligeOrd, dagNummer(dato), "anelseslos")
  const i = m.indeks.get(ord)
  if (i === undefined) throw new Error(`Anelsesløs: "${ord}" mangler i ordlisten`)
  return i
}

function rangering(dato: string): Rangering {
  const lagret = buffer.get(dato)
  if (lagret) return lagret
  const m = lastModell()
  const h = hemmeligIndeks(dato)
  const n = m.ord.length
  const v = m.vektorer
  const likhet = new Float64Array(n)
  const ho = h * DIM
  for (let i = 0; i < n; i++) {
    let sum = 0
    const o = i * DIM
    for (let k = 0; k < DIM; k++) sum += v[ho + k] * v[o + k]
    likhet[i] = sum
  }
  likhet[h] = Infinity
  const rekkefolge = Int32Array.from({ length: n }, (_, i) => i).sort((a, b) => likhet[b] - likhet[a] || a - b)
  const plass = new Int32Array(n)
  rekkefolge.forEach((ordIndeks, p) => (plass[ordIndeks] = p + 1))
  const r = { hemmelig: h, plass, rekkefolge }
  buffer.set(dato, r)
  // Keep a handful of recent days in memory (today plus archive browsing).
  if (buffer.size > 8) buffer.delete(buffer.keys().next().value!)
  return r
}

export function normaliser(ord: string) {
  return ord.normalize("NFC").trim().toLowerCase()
}

export type GjettSvar =
  | { ok: true; ord: string; avstand: number }
  | { ok: false; feil: "ugyldig" | "ukjent"; melding: string }

export function gjett(dato: string, input: string): GjettSvar {
  const ord = normaliser(input)
  if (!/^[a-z]{2,22}$/.test(ord)) {
    return { ok: false, feil: "ugyldig", melding: "Skriv ett engelsk ord med bare bokstavene a–z." }
  }
  const m = lastModell()
  const i = m.indeks.get(ord) ?? m.former.get(ord)
  if (i === undefined) return { ok: false, feil: "ukjent", melding: `Kjenner ikke «${ord}». Prøv et annet ord.` }
  return { ok: true, ord: m.ord[i], avstand: rangering(dato).plass[i] }
}

/** A word roughly halfway between the best guess and the answer, never one already guessed. */
export function hint(dato: string, beste: number | null, gjettet: string[]) {
  const m = lastModell()
  const r = rangering(dato)
  const brukt = new Set(gjettet.map(normaliser))
  const mal = beste === null ? 500 : Math.max(2, Math.floor(beste / 2))
  if (beste !== null && mal >= beste) return null
  const ovre = beste === null ? m.ord.length : beste
  for (let p = mal; p >= 2; p--) {
    const o = m.ord[r.rekkefolge[p - 1]]
    if (!brukt.has(o)) return { ord: o, avstand: p }
  }
  for (let p = mal + 1; p < ovre; p++) {
    const o = m.ord[r.rekkefolge[p - 1]]
    if (!brukt.has(o)) return { ord: o, avstand: p }
  }
  return null
}

export function fasit(dato: string) {
  const m = lastModell()
  const r = rangering(dato)
  return { ord: m.ord[r.hemmelig], naermeste: Array.from(r.rekkefolge.slice(1, 11), (i) => m.ord[i]) }
}

export function antallOrd() {
  return lastModell().ord.length
}
