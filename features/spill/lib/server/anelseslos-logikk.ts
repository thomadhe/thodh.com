// Anelsesløs on the server: the word model, the day's ranking and guess lookup. Kept free of "server-only" so the
// tests can import it; only server code (./anelseslos.ts) uses it, and that file decides which word is secret.
//
// Word vectors: an ensemble whose cosine is the weighted mean of three models' cosines (1 : 1 : 0.5):
// GloVe (Pennington, Socher & Manning 2014; Common Crawl 42B/840B and Wikipedia+Gigaword 6B, PDDL 1.0),
// mxbai-embed-large-v1 (Mixedbread, Apache 2.0) and Qwen3-Embedding-0.6B (Qwen team, Alibaba, Apache 2.0)
// embedding each word alone ("Given a word, retrieve words that are related to it in meaning or topic").
// GloVe keeps the associations, the sentence models add categories (lettuce ~ vegetable, food). Distilled to
// 300 dims by matching each word's neighbour ranking. Vocabulary: about 15,000 everyday English lemmas chosen with
// WordNet 3.0 (© 2006 Princeton University) and kept at Zipf frequency ≥ 2.9 in wordfreq (Robyn Speer; code
// Apache-2.0, data CC BY-SA 4.0); inflections and British spellings map to their lemma via
// forms.tsv. L2-normalised, quantised to int8.
//
// Missing words are added by hand in extra-words.tsv, one per line: the word, a tab, three or more existing
// vocabulary words that mean nearly the same (space-separated), and optionally a tab and the word's own
// inflections, e.g.
//   duvet<TAB>quilt blanket bedding<TAB>duvets
// Its vector is the mean of the anchors' vectors, so against any answer it scores the mean of their scores. Extra
// words can be guessed and get the place they would have among the vocabulary, but they never take a place, a
// hint or a spot in the answer's top ten, so adding one does not move any other word. Pick anchors that are close
// in meaning, not just in topic; `npm test` checks that every anchor exists and that the word is new.
import { readFileSync } from "node:fs"
import path from "node:path"

export const DIM = 300
const MAPPE = path.join(process.cwd(), "features", "spill", "data", "anelseslos")

export type Modell = {
  ord: string[]
  indeks: Map<string, number>
  former: Map<string, number>
  vektorer: Int8Array
  /** Hand-added words (extra-words.tsv), guessable but outside the ranking. */
  ekstra: Map<string, { ord: string; vektor: Float64Array }>
}
let modell: Modell | null = null

function linjer(fil: string) {
  // Tolerate CRLF in case a Windows checkout rewrote the line endings.
  return readFileSync(path.join(MAPPE, fil), "utf8").split(/\r?\n/)
}

function lesEkstra(ord: string[], indeks: Map<string, number>, former: Map<string, number>, vektorer: Int8Array) {
  const ekstra = new Map<string, { ord: string; vektor: Float64Array }>()
  for (const linje of linjer("extra-words.tsv")) {
    if (!linje.trim() || linje.startsWith("#")) continue
    const [ordet, ankerfelt = "", formfelt = ""] = linje.split("\t").map((d) => d.trim())
    const ankre = ankerfelt.split(/\s+/).filter(Boolean)
    if (!/^[a-z]{2,22}$/.test(ordet) || ankre.length < 3) throw new Error(`Anelsesløs: ugyldig ekstraord-linje «${linje}»`)
    // The plain mean, not renormalised: its dot product with any word is the mean of the anchors' dot products,
    // so the word ranks among its anchors. A renormalised mean sits closer to everything and jumps above them all.
    const vektor = new Float64Array(DIM)
    for (const a of ankre) {
      const i = indeks.get(a)
      if (i === undefined) throw new Error(`Anelsesløs: ankeret «${a}» for «${ordet}» finnes ikke i ordlisten`)
      for (let k = 0; k < DIM; k++) vektor[k] += vektorer[i * DIM + k] / ankre.length
    }
    for (const f of [ordet, ...formfelt.split(/\s+/).filter(Boolean)]) {
      if (indeks.has(f) || former.has(f) || ekstra.has(f)) throw new Error(`Anelsesløs: «${f}» finnes allerede`)
      ekstra.set(f, { ord: ordet, vektor })
    }
  }
  return ekstra
}

export function lastModell(): Modell {
  if (modell) return modell
  const ord = linjer("vocab.txt")
  const indeks = new Map(ord.map((o, i) => [o, i]))
  const former = new Map<string, number>()
  for (const linje of linjer("forms.tsv")) {
    const tab = linje.indexOf("\t")
    if (tab > 0) former.set(linje.slice(0, tab), Number(linje.slice(tab + 1)))
  }
  const fil = readFileSync(path.join(MAPPE, "vectors.bin"))
  const vektorer = new Int8Array(fil.buffer, fil.byteOffset, fil.byteLength)
  if (vektorer.length !== ord.length * DIM) throw new Error("Anelsesløs: vektorfilen passer ikke med ordlisten")
  modell = { ord, indeks, former, vektorer, ekstra: lesEkstra(ord, indeks, former, vektorer) }
  return modell
}

/** Dot product of the vector at `vektor[start…]` with every vocabulary word. */
function likheter(m: Modell, vektor: Int8Array | Float64Array, start = 0) {
  const n = m.ord.length
  const v = m.vektorer
  const ut = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    let sum = 0
    const o = i * DIM
    for (let k = 0; k < DIM; k++) sum += vektor[start + k] * v[o + k]
    ut[i] = sum
  }
  return ut
}

const synkende = (poeng: Float64Array) => Int32Array.from({ length: poeng.length }, (_, i) => i).sort((a, b) => poeng[b] - poeng[a] || a - b)

// --- Spelling look-alikes -------------------------------------------------------------------------------------
// The vectors carry some spelling noise: GloVe learns from typos and the sentence models see a lone word as
// sub-word pieces, so a near-spelling twin with another meaning can land in the top ten. A twin is demoted only
// when the words around the answer do not back it up, and never when it is a form of the answer
// (happy/happiness, bake/baker).

/** Optimal string alignment distance, capped: returns maks + 1 as soon as it is clearly larger. */
export function stavavstand(a: string, b: string, maks = 2) {
  if (Math.abs(a.length - b.length) > maks) return maks + 1
  let forrige2: number[] = []
  let forrige = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const rad = [i]
    let minst = i
    for (let j = 1; j <= b.length; j++) {
      let d = Math.min(forrige[j] + 1, rad[j - 1] + 1, forrige[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, forrige2[j - 2] + 1)
      rad.push(d)
      minst = Math.min(minst, d)
    }
    if (minst > maks) return maks + 1
    forrige2 = forrige
    forrige = rad
  }
  return forrige[b.length]
}

/** One edit apart (two for words of four letters or more): server/sever, gee/wee, plan/plane. */
export function erStavetvilling(a: string, b: string) {
  const kortest = Math.min(a.length, b.length)
  if (kortest < 3 || a === b) return false
  const d = stavavstand(a, b, 2)
  return d <= 1 || (d === 2 && kortest >= 4)
}

const ENDELSER = new Set(
  ("s es y ly ely ily ity ty ic ics ical ically ism ist ists ian al ally ance ant ancy ence ent ency ion ions ation " +
    "ations ition or ors er ers ive ively ure ment ness ed ing ous ously ful less able ably ible ise ize ate ated " +
    "ating ish let ling ery en ey ify")
    .split(" ")
    .concat(""),
)
const FORSTAVELSER = ["un", "non", "in", "im", "il", "ir", "dis", "mis", "re", "de", "anti", "sub", "over", "under", "out", "up", "down", "pre", "post", "en", "em", "co", "a"]

function endelserPasser(ta: string, tb: string): boolean {
  if (ENDELSER.has(ta) && ENDELSER.has(tb)) return true
  // Silent e (bake/baker) and y → i (happy/happiness).
  if ((ta === "e" && tb !== "" && ENDELSER.has(tb)) || (tb === "e" && ta !== "" && ENDELSER.has(ta))) return true
  const yi = (y: string, i: string) => y[0] === "y" && i[0] === "i" && ENDELSER.has(y.slice(1)) && ENDELSER.has(i.slice(1))
  return yi(ta, tb) || yi(tb, ta)
}

function sammeStamme(a: string, b: string) {
  let felles = 0
  while (felles < Math.min(a.length, b.length) && a[felles] === b[felles]) felles++
  for (let k = felles; k >= Math.max(3, felles - 3); k--) {
    const ta = a.slice(k)
    const tb = b.slice(k)
    if (endelserPasser(ta, tb)) return true
    // Doubled consonant at the joint: stop/stopping.
    if (ta[0] === a[k - 1] && endelserPasser(ta.slice(1), tb)) return true
    if (tb[0] === b[k - 1] && endelserPasser(ta, tb.slice(1))) return true
  }
  return false
}

/** Same word family by regular affixes: care/careful, happy/happiness, bake/baker, compress/compressor. */
export function erSammeOrdfamilie(a: string, b: string) {
  if (a === b || sammeStamme(a, b)) return true
  for (const [x, y] of [[a, b], [b, a]]) {
    for (const p of FORSTAVELSER) {
      const rest = y.slice(p.length)
      if (y.startsWith(p) && rest.length >= 3 && (rest === x || sammeStamme(x, rest))) return true
    }
  }
  return false
}

const TWILLINGSOK = 300 // look for twins among the answer's 300 nearest words
const STOTTENABOER = 20 // the backing comes from this many nearest words that are not twins themselves
const TERSKEL = 8 // demote only when the backing place is at least 8 times worse than the place

/** The nearest `antall` words to `a` that are not its twins (nor `a` itself), nearest first. */
function naboerUtenTvillinger(m: Modell, a: number, likhet: Float64Array, antall: number) {
  // Keep a short sorted list instead of sorting the whole vocabulary; twins are rare enough to over-fetch.
  const plass = antall + 20
  const beste: number[] = []
  for (let i = 0; i < likhet.length; i++) {
    if (i === a || (beste.length === plass && likhet[i] <= likhet[beste[plass - 1]])) continue
    let j = beste.length === plass ? plass - 1 : beste.length
    while (j > 0 && likhet[beste[j - 1]] < likhet[i]) {
      beste[j] = beste[j - 1]
      j--
    }
    beste[j] = i
    if (beste.length > plass) beste.length = plass
  }
  return beste.filter((q) => !erStavetvilling(m.ord[q], m.ord[a])).slice(0, antall)
}

/** Each vocabulary word's closeness to the centre of these words: a smoothed meaning of the word they surround. */
function stottepoeng(m: Modell, naboer: number[]) {
  const senter = new Float64Array(DIM)
  for (const q of naboer) for (let k = 0; k < DIM; k++) senter[k] += m.vektorer[q * DIM + k]
  return likheter(m, senter)
}

/** 1 + the number of words other than `a` and `mal` whose backing beats `mal`'s, counting no further than `tak`. */
function plassEtter(poeng: Float64Array, a: number, mal: number, tak = Infinity) {
  let foran = 0
  for (let i = 0; i < poeng.length && foran < tak; i++) if (i !== a && i !== mal && poeng[i] > poeng[mal]) foran++
  return foran + 1
}

export type Nedflytting = { ord: number; fra: number; til: number }

/**
 * Twins of the answer that the neighbourhood does not back up, with their new place. For a twin at place p the
 * backing place S is where it would rank by closeness to the centre of the answer's nearest non-twin words, and
 * the same the other way round (the answer among the twin's neighbours); the better of the two counts. When S is
 * at least 8p the twin moves to √(p·S), halfway on a log scale: a twin at #3 with backing #128 drops to about
 * #20, while relatives with real backing (co-hyponyms like two fruits) stay put. Places count from 1 = the
 * nearest word after the answer.
 */
export function nedflyttinger(m: Modell, hemmelig: number, likhet: Float64Array, rekkefolge: Int32Array): Nedflytting[] {
  const svar = m.ord[hemmelig]
  const tvillinger: { b: number; p: number }[] = []
  for (let p = 1; p <= TWILLINGSOK && p < rekkefolge.length; p++) {
    const o = m.ord[rekkefolge[p]]
    if (erStavetvilling(svar, o) && !erSammeOrdfamilie(svar, o) && m.former.get(o) !== hemmelig) tvillinger.push({ b: rekkefolge[p], p })
  }
  if (!tvillinger.length) return []
  const ut: Nedflytting[] = []
  const fram = stottepoeng(m, naboerUtenTvillinger(m, hemmelig, likhet, STOTTENABOER))
  for (const { b, p } of tvillinger) {
    const sFram = plassEtter(fram, hemmelig, b)
    if (sFram < TERSKEL * p) continue
    const tilbake = stottepoeng(m, naboerUtenTvillinger(m, b, likheter(m, m.vektorer, b * DIM), STOTTENABOER))
    const s = Math.min(sFram, plassEtter(tilbake, b, hemmelig, sFram))
    if (s >= TERSKEL * p) ut.push({ ord: b, fra: p, til: Math.round(Math.sqrt(p * s)) })
  }
  return ut
}

export type Rangering = {
  hemmelig: number
  /** Place of every vocabulary word, 1 = the answer. */
  plass: Int32Array
  /** Vocabulary indices by place: rekkefolge[0] is the answer. */
  rekkefolge: Int32Array
  /** Score by place, descending, for placing extra words. */
  poengEtterPlass: Float64Array
  nedflyttet: Nedflytting[]
}

export function byggRangering(m: Modell, hemmelig: number, { demp = true } = {}): Rangering {
  const likhet = likheter(m, m.vektorer, hemmelig * DIM)
  likhet[hemmelig] = Infinity
  let rekkefolge = synkende(likhet)
  const nedflyttet = demp ? nedflyttinger(m, hemmelig, likhet, rekkefolge) : []
  let poeng = likhet
  if (nedflyttet.length) {
    // Scores are whole numbers, so half a point puts a twin right after the word now at its new place.
    poeng = Float64Array.from(likhet)
    for (const { ord, til } of nedflyttet) poeng[ord] = likhet[rekkefolge[Math.min(til, rekkefolge.length - 1)]] - 0.5
    rekkefolge = synkende(poeng)
  }
  const plass = new Int32Array(rekkefolge.length)
  rekkefolge.forEach((ordIndeks, p) => (plass[ordIndeks] = p + 1))
  const poengEtterPlass = Float64Array.from(rekkefolge, (i) => poeng[i])
  return { hemmelig, plass, rekkefolge, poengEtterPlass, nedflyttet }
}

const buffer = new Map<number, Rangering>()

export function rangering(hemmelig: number): Rangering {
  const lagret = buffer.get(hemmelig)
  if (lagret) return lagret
  const r = byggRangering(lastModell(), hemmelig)
  buffer.set(hemmelig, r)
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

export function gjettMot(hemmelig: number, input: string): GjettSvar {
  const ord = normaliser(input)
  if (!/^[a-z]{2,22}$/.test(ord)) {
    return { ok: false, feil: "ugyldig", melding: "Skriv ett engelsk ord med bare bokstavene a–z." }
  }
  const m = lastModell()
  const i = m.indeks.get(ord) ?? m.former.get(ord)
  if (i !== undefined) return { ok: true, ord: m.ord[i], avstand: rangering(hemmelig).plass[i] }
  const ekstra = m.ekstra.get(ord)
  if (!ekstra) return { ok: false, feil: "ukjent", melding: `Kjenner ikke «${ord}». Prøv et annet ord.` }
  return { ok: true, ord: ekstra.ord, avstand: ekstraPlass(m, rangering(hemmelig), ekstra.vektor) }
}

/** The place an extra word would take: right after the last vocabulary word that is closer (the answer is always closer). */
export function ekstraPlass(m: Modell, r: Rangering, vektor: Float64Array) {
  let poeng = 0
  const h = r.hemmelig * DIM
  for (let k = 0; k < DIM; k++) poeng += vektor[k] * m.vektorer[h + k]
  // poengEtterPlass is descending; count the places scoring higher.
  let lav = 0
  let hoy = r.poengEtterPlass.length
  while (lav < hoy) {
    const midt = (lav + hoy) >> 1
    if (r.poengEtterPlass[midt] > poeng) lav = midt + 1
    else hoy = midt
  }
  return lav + 1
}
