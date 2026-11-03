// 6/7-stegern on the server: the day's prompts, answer matching and the question 6 check.
// Kept free of "server-only" so the tests can import it; only server code (./stegern.ts) uses it.

import { stegernDager } from "../../data/stegern"
import type { StegernDag, StegernSporsmal } from "../../data/stegern/typer"
import { dagNummer, erGyldigDato, iDagOslo, tilfeldig } from "../dag"
import { land, omrader, type Kontinent } from "../geografi"
import { NORMALE, STEGERN_START, type Nivaa, type Vurdering } from "../stegern"

/**
 * Lowercase letters and digits only: "Côte d'Ivoire" → "cotedivoire", "Østerrike" → "osterrike",
 * "Ålesund" = "Aalesund" → "alesund". A leading "en", "ei" or "et" is dropped ("en banan" → "banan").
 */
export function normaliser(s: string) {
  const t = s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/ß/g, "ss")
    // Keep "C#" and "C++" apart from "C".
    .replace(/#/g, " sharp")
    .replace(/\+/g, " pluss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^(?:en|ei|et) (?=\S)/, "")
  return t.replace(/ /g, "").replace(/aa/g, "a")
}

/** Damerau-Levenshtein distance (optimal string alignment), giving up once it exceeds `maks`. */
export function avstand(a: string, b: string, maks = Infinity) {
  if (Math.abs(a.length - b.length) > maks) return maks + 1
  let forrige2: number[] = []
  let forrige = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const rad = [i]
    let minst = i
    for (let j = 1; j <= b.length; j++) {
      const kost = a[i - 1] === b[j - 1] ? 0 : 1
      let d = Math.min(forrige[j] + 1, rad[j - 1] + 1, forrige[j - 1] + kost)
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

/** Typos allowed for an answer of this length: none up to three letters, one up to eight, then two. */
export function toleranse(lengde: number) {
  return lengde <= 3 ? 0 : lengde <= 8 ? 1 : 2
}

// Plural and definite endings tried when the bare stem is an answer ("katter" → "katt", "eplet" → "eple").
const ENDELSER = ["ene", "ane", "er", "ar", "en", "et", "r", "s", "e"]

type Alternativ = { vis: string; nokler: string[]; nivaa: Exclude<Nivaa, 0>; geo: boolean }
export type Oppgave = {
  tekst: string
  alternativer: Alternativ[]
  indeks: Map<string, number>
  streng: boolean
  nei: Set<string>
}

const kontinenter = new Set<string>(["Europa", "Asia", "Afrika", "Nord-Amerika", "Sør-Amerika", "Oseania"])
const landEtterId = new Map(omrader.map((o) => [o.id, o]))

function landNavn(id: string) {
  const o = landEtterId.get(id)
  if (!o) throw new Error(`Ukjent land: ${id}`)
  return { vis: o.navn, navn: [o.navn, o.en, ...o.svar] }
}

function hovedstadNavn(id: string) {
  const o = landEtterId.get(id)
  if (!o?.hovedstad) throw new Error(`Ukjent hovedstad: ${id}`)
  return { vis: o.hovedstad, navn: [o.hovedstad, o.hovedstadEn, ...o.hovedstadSvar] }
}

/** Expands a prompt's answer string into answers with tiers and a lookup from normalised text. */
export function byggOppgave(s: StegernSporsmal): Oppgave {
  const grupper = s.svar.split("|")
  if (grupper.length !== 5) throw new Error(`Fem nivåer trengs: ${s.tekst}`)
  const alternativer: Alternativ[] = []
  const brukteLand = new Set<string>()
  const brukteHovedsteder = new Set<string>()
  const utfyll: [string, Alternativ["nivaa"]][] = []
  let forbokstav: string | null = null

  grupper.forEach((gruppe, g) => {
    const nivaa = (g + 1) as Alternativ["nivaa"]
    for (const token of gruppe.split(",").map((t) => t.trim()).filter(Boolean)) {
      if (token.startsWith("@")) {
        utfyll.push([token, nivaa])
        if (token.startsWith("@start:")) forbokstav = normaliser(token.slice(7))
        continue
      }
      const [forste, ...ekstra] = token.split("/").map((t) => t.trim())
      if (/^#[A-Z]{2}$/.test(forste)) {
        const id = forste.slice(1)
        const l = landNavn(id)
        brukteLand.add(id)
        alternativer.push({ vis: l.vis, nokler: [...l.navn, ...ekstra], nivaa, geo: true })
      } else if (/^\$[A-Z]{2}$/.test(forste)) {
        const id = forste.slice(1)
        const h = hovedstadNavn(id)
        brukteHovedsteder.add(id)
        alternativer.push({ vis: h.vis, nokler: [...h.navn, ...ekstra], nivaa, geo: true })
      } else {
        alternativer.push({ vis: forste, nokler: [forste, ...ekstra], nivaa, geo: false })
      }
    }
  })

  for (const [token, nivaa] of utfyll) {
    const [type, verdi] = token.slice(1).split(":")
    if (type === "naboer") {
      const o = landEtterId.get(verdi)
      if (!o) throw new Error(`Ukjent land: ${verdi}`)
      for (const id of o.naboer) {
        if (brukteLand.has(id) || !landEtterId.get(id)?.suveren) continue
        brukteLand.add(id)
        const l = landNavn(id)
        alternativer.push({ vis: l.vis, nokler: l.navn, nivaa, geo: true })
      }
    } else if (type === "kontinent" || type === "hovedstad") {
      if (!kontinenter.has(verdi)) throw new Error(`Ukjent kontinent: ${verdi}`)
      for (const l of land) {
        if (l.kontinent !== (verdi as Kontinent)) continue
        if (type === "kontinent" && !brukteLand.has(l.id)) {
          brukteLand.add(l.id)
          alternativer.push({ vis: l.navn, nokler: landNavn(l.id).navn, nivaa, geo: true })
        } else if (type === "hovedstad" && !brukteHovedsteder.has(l.id)) {
          brukteHovedsteder.add(l.id)
          const h = hovedstadNavn(l.id)
          alternativer.push({ vis: h.vis, nokler: h.navn, nivaa, geo: true })
        }
      }
    } else if (type === "start") {
      const b = normaliser(verdi)
      for (const l of land) {
        if (brukteLand.has(l.id) || !normaliser(l.navn).startsWith(b)) continue
        brukteLand.add(l.id)
        alternativer.push({ vis: l.navn, nokler: landNavn(l.id).navn, nivaa, geo: true })
      }
    } else {
      throw new Error(`Ukjent utfylling: ${token}`)
    }
  }

  const indeks = new Map<string, number>()
  alternativer.forEach((a, i) => {
    a.nokler = [...new Set(a.nokler.map(normaliser).filter((k) => k && (!forbokstav || k.startsWith(forbokstav))))]
    // The first answer to claim a text keeps it ("Kongo" stays with whichever Congo came first).
    for (const k of a.nokler) if (!indeks.has(k)) indeks.set(k, i)
  })
  const nei = new Set((s.nei ?? "").split(",").map(normaliser).filter(Boolean))
  return { tekst: s.tekst, alternativer, indeks, streng: s.streng ?? false, nei }
}

/** Hand-written texts claimed by two different answers in one prompt, which would make matching ambiguous. */
export function konflikter(s: StegernSporsmal) {
  const o = byggOppgave(s)
  const sett = new Map<string, number>()
  const ut: string[] = []
  o.alternativer.forEach((a, i) => {
    for (const k of a.nokler) {
      const j = sett.get(k)
      if (j !== undefined && j !== i && !(a.geo && o.alternativer[j].geo)) ut.push(k)
      else sett.set(k, i)
    }
  })
  return ut
}

const bygde = new Map<StegernSporsmal, Oppgave>()
function oppgave(s: StegernSporsmal) {
  let o = bygde.get(s)
  if (!o) bygde.set(s, (o = byggOppgave(s)))
  return o
}

let kjenteOrd: Set<string> | null = null
/** Every answer in the bank plus every country and capital: a real word is never read as a typo of another. */
function kjente() {
  if (kjenteOrd) return kjenteOrd
  const ord = new Set<string>()
  for (const d of stegernDager) {
    for (const s of [...d.sporsmal, d.finale]) {
      const o = oppgave(s)
      o.indeks.forEach((_, k) => ord.add(k))
      o.nei.forEach((k) => ord.add(k))
    }
  }
  for (const o of omrader) for (const n of [o.navn, o.en, ...o.svar, o.hovedstad, o.hovedstadEn, ...o.hovedstadSvar]) if (n) ord.add(normaliser(n))
  return (kjenteOrd = ord)
}

/** Index of the answer a text matches, or null. Exact first, then inflected forms, then small typos. */
export function finnAlternativ(o: Oppgave, tekst: string): number | null {
  const t = normaliser(tekst)
  if (!t) return null
  const direkte = o.indeks.get(t)
  if (direkte !== undefined) return direkte
  if (o.nei.has(t) || o.streng) return null
  for (const e of ENDELSER) {
    if (!t.endsWith(e) || t.length - e.length < 4) continue
    const i = o.indeks.get(t.slice(0, -e.length))
    if (i !== undefined) return i
  }
  if (kjente().has(t)) return null
  let best: number | null = null
  let bestAvstand = Infinity
  for (const [k, i] of o.indeks) {
    // Typos rarely hit the first letter, and requiring it keeps "Mali" from passing as "Bali".
    if (k[0] !== t[0]) continue
    const tol = toleranse(k.length)
    const d = avstand(t, k, tol)
    if (d > tol) continue
    if (d < bestAvstand || (d === bestAvstand && best !== null && o.alternativer[i].nivaa < o.alternativer[best].nivaa)) {
      best = i
      bestAvstand = d
    }
  }
  return best
}

function vurderOppgave(o: Oppgave, tekst: string): Vurdering {
  const i = finnAlternativ(o, tekst)
  const a = i === null ? null : o.alternativer[i]
  const etter = (n: number) => o.alternativer.filter((x) => x.nivaa === n).map((x) => x.vis)
  const vanligste = [...etter(1), ...etter(2)].slice(0, 4)
  const sjeldneste = [5, 4, 3]
    .flatMap(etter)
    .filter((v) => !vanligste.includes(v))
    .slice(0, 4)
  return { nivaa: a?.nivaa ?? 0, treff: a?.vis ?? null, vanligste, sjeldneste, antall: o.alternativer.length }
}

export function kanSpillesStegern(dato: string, iDag = iDagOslo()) {
  return erGyldigDato(dato) && dato >= STEGERN_START && dato <= iDag
}

/** The bank runs in order from the start date and starts over when it runs out. */
export function dagFor(dato: string): StegernDag {
  const n = dagNummer(dato) - dagNummer(STEGERN_START)
  return stegernDager[((n % stegernDager.length) + stegernDager.length) % stegernDager.length]
}

/** The five normal prompts; the final and question 6 are only told when they come up. */
export function dagensSporsmal(dato: string) {
  return dagFor(dato).sporsmal.map((s) => s.tekst)
}

/** Which earlier question (1–5) question 6 asks about. */
export function sjetteNr(dato: string) {
  return 1 + Math.floor(tilfeldig(`stegern:sjette:${dato}`)() * NORMALE)
}

/** nr 0–4 are the normal prompts, 6 is the final. */
export function vurderSvar(dato: string, nr: number, tekst: string): Vurdering {
  const dag = dagFor(dato)
  const s = nr === 6 ? dag.finale : dag.sporsmal[nr]
  return vurderOppgave(oppgave(s), tekst)
}

// What counts as saying "nothing" when the earlier answer was left blank.
const INGENTING = new Set(
  ["", "ingenting", "ingen ting", "ingen", "ikke noe", "ikkeno", "tomt", "blankt", "blank", "pass", "ingen svar", "svarte ikke", "jeg svarte ikke", "jeg svarte ingenting", "hoppet over", "nada", "null", "-"].map(normaliser),
)

/**
 * Question 6: did the player give the same answer as on question `sjetteNr`? The same accepted answer counts
 * in any of its forms ("USA" then "Amerika"); otherwise the text itself must match, with a typo or two.
 * A blank answer back then is repeated by answering blank (or "ingenting") now.
 */
export function erGjentatt(dato: string, tidligere: string, svar: string) {
  const s = dagFor(dato).sporsmal[sjetteNr(dato) - 1]
  const a = normaliser(tidligere)
  const b = normaliser(svar)
  if (!a) return INGENTING.has(b)
  if (a === b) return true
  const o = oppgave(s)
  const ia = finnAlternativ(o, tidligere)
  if (ia !== null && ia === finnAlternativ(o, svar)) return true
  return b[0] === a[0] && avstand(a, b, toleranse(a.length)) <= toleranse(a.length)
}

export function finaleTekst(dato: string) {
  return dagFor(dato).finale.tekst
}
