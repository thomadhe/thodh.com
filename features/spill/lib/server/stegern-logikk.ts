// 6/7-stegern on the server: the day's prompts, answer matching and the question 6 check.
// Kept free of "server-only" so the tests can import it; only server code (./stegern.ts) uses it.

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { stegernDager } from "../../data/stegern"
import { stegernDuellBank } from "../../data/stegern-duell"
import type { StegernDag, StegernSporsmal } from "../../data/stegern/typer"
import { dagNummer, erGyldigDato, iDagOslo, iRotasjon, leggTilDager, tilfeldig } from "../dag"
import { land, omrader, type Kontinent } from "../geografi"
import { NORMALE, STEGERN_START, type Nivaa, type Vurdering } from "../stegern"
import { signer as signerDom } from "./duell-signatur"

/** The words of a text in lowercase letters and digits, with the leading article dropped ("en banan" → ["banan"]). */
function ord(s: string) {
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
  return t ? t.split(" ") : []
}

/**
 * Lowercase letters and digits only: "Côte d'Ivoire" → "cotedivoire", "Østerrike" → "osterrike",
 * "Ålesund" = "Aalesund" → "alesund". A leading "en", "ei" or "et" is dropped ("en banan" → "banan").
 */
export function normaliser(s: string) {
  return ord(s).join("").replace(/aa/g, "a")
}

const ROMERSK = /^x{0,3}(?:ix|iv|v?i{0,3})$/
const ROMERTALL: Record<string, number> = { i: 1, v: 5, x: 10 }
function romersk(t: string) {
  let n = 0
  for (let i = 0; i < t.length; i++) {
    const v = ROMERTALL[t[i]]
    n += i + 1 < t.length && v < ROMERTALL[t[i + 1]] ? -v : v
  }
  return n
}

// Norwegian ordinals mapped to their Arabic digits so "Olav den fjerde", "Olav IV" and "Olav 4." all unify.
// "åttende" is marked before accent stripping so it stays distinct from "attende" (18).
const ORDENSTALL: Record<string, string> = {
  forste: "1",
  andre: "2",
  annen: "2",
  tredje: "3",
  fjerde: "4",
  femte: "5",
  sjette: "6",
  sjuende: "7",
  syvende: "7",
  aattende: "8",
  niende: "9",
  tiende: "10",
  ellevte: "11",
  tolvte: "12",
  trettende: "13",
  fjortende: "14",
  femtende: "15",
  sekstende: "16",
  syttende: "17",
  attende: "18",
  nittende: "19",
  tjuende: "20",
  tyvende: "20",
}

const ARTIKLER = new Set(["the", "den", "det", "de", "a", "an"])
const TITLER = new Set([
  "kong",
  "dronning",
  "kronprins",
  "kronprinsesse",
  "prins",
  "prinsesse",
  "keiser",
  "keiserinne",
  "tsar",
  "tsarina",
  "farao",
  "sir",
  "lord",
  "lady",
  "dr",
  "doktor",
  "prof",
  "professor",
  "kaptein",
  "captain",
  "sankt",
  "st",
  "pave",
  "president",
  "general",
  "admiral",
  "oberst",
  "mr",
  "mrs",
  "ms",
  "miss",
  "herr",
  "fru",
  "frk",
  "onkel",
  "tante",
  "grev",
  "greve",
  "baron",
  "hertug",
  "master",
  "mester",
])
const VITAMIN = /^(?:[acdek]|b\d{0,2})$/

/**
 * Words with Roman numerals, Arabic digits, Norwegian ordinals, "&"/"og"/"and" conjunctions, syv/sju, tyve/tjue
 * and "vitamin X"/"X-vitamin" order unified ("Olav den fjerde" → ["olav", "4"], "gin & tonic" = "gin og tonic").
 */
function ordKanon(s: string) {
  const pre = s
    .toLowerCase()
    .replace(/åttende/g, "aattende")
    .replace(/\s*&\s*/g, " og ")
  const ra = ord(pre).flatMap((w) => {
    const m = /^([a-z]{2,})(\d+)$/.exec(w)
    return m ? [m[1], m[2]] : [w]
  })
  const ut: string[] = []
  for (let i = 0; i < ra.length; i++) {
    const w = ra[i]
    if (w === "and" && i > 0 && i + 1 < ra.length) {
      ut.push("og")
      continue
    }
    if (w === "syv") {
      ut.push("sju")
      continue
    }
    if (w === "tyve") {
      ut.push("tjue")
      continue
    }
    if (w === "den" && i > 0 && i + 1 < ra.length) {
      const neste = ra[i + 1]
      if (ORDENSTALL[neste]) {
        ut.push(ORDENSTALL[neste])
        i++
        continue
      }
      if (/^\d+$/.test(neste)) {
        ut.push(neste)
        i++
        continue
      }
    }
    if (i === 0 && ra.length > 1 && ORDENSTALL[w]) {
      ut.push(ORDENSTALL[w])
    } else if (/^\d+$/.test(w)) {
      ut.push(w)
    } else if (i > 0 && w !== "i" && ROMERSK.test(w)) {
      ut.push(String(romersk(w)))
    } else {
      ut.push(w)
    }
  }
  if (ut.length === 2 && ut[0] === "vitamin" && VITAMIN.test(ut[1])) return [ut[1], "vitamin"]
  return ut
}

/** Phonetic key unifying common Norwegian/English spelling variants (c/k/ch/ck, ph/f, oe/ø, ae/ä, w/v, z/s). */
function fonetisk(s: string) {
  return s.replace(/ph/g, "f").replace(/ch/g, "k").replace(/ck/g, "k").replace(/c/g, "k").replace(/oe/g, "o").replace(/ae/g, "a").replace(/w/g, "v").replace(/z/g, "s")
}

/** Canonical key unifying Roman numerals, Arabic digits, Norwegian ordinals and &/og/and. */
export function kanoniser(s: string) {
  return ordKanon(s).join("").replace(/aa/g, "a")
}

/**
 * The numbers in a text, Roman numerals and Norwegian ordinals included: "Rocky II" and "Rocky 2" → "2",
 * "Henrik VIII" and "Henrik den åttende" → "8". A lone "i" is the preposition, not 1. Numbers are never typos of each other.
 */
export function tallIOrd(s: string) {
  return ordKanon(s)
    .filter((w) => /^\d+$/.test(w))
    .map((w) => String(Number(w)))
    .join(" ")
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

/** Typos allowed for an answer of this length: none up to 3 letters, 1 up to 8, 2 up to 15, then 3. */
export function toleranse(lengde: number) {
  return lengde <= 3 ? 0 : lengde <= 8 ? 1 : lengde <= 15 ? 2 : 3
}

// Plural and definite endings tried when the bare stem is a common noun in the list ("katter" → "katt",
// "eplet" → "eple"). A single letter only comes off a stem of five letters or more.
const ENDELSER = ["ene", "ane", "er", "ar", "en", "et", "r", "s", "e"]
const FLERTALL_ENDELSER = ["ene", "ane", "er", "ar", "r"]

// Subject-anchored category nouns players naturally append/prepend (or swap) in Norwegian compounds:
// e.g. "marinara saus" ↔ "marinara", "bearnaisesaus" ↔ "bearnaise", "teriyaki" ↔ "teriyakisaus",
// "vaniljeis" ↔ "vanilje", "brieost" ↔ "brie", "pizza margherita" ↔ "margherita", "ragdollkatt" ↔ "ragdoll".
type KatRegel = { re: RegExp; suff: string[]; pref?: string[]; fuge?: boolean; kort?: boolean }
const KATEGORI_REGLER: KatRegel[] = [
  { re: /^Nevn en (?:type |kjent )?saus\b/i, suff: ["saus", "sauce", "dressing"], pref: ["sauce"], fuge: true, kort: true },
  { re: /^Nevn en (?:type |kjent )?ost\b/i, suff: ["ost", "cheese"], fuge: true, kort: true },
  { re: /^Nevn en (?:type )?pizza\b/i, suff: ["pizza"], pref: ["pizza"], kort: true },
  { re: /^Nevn en issmak\b/i, suff: ["iskrem", "sorbet", "is"] },
  { re: /^Nevn en (?:type )?suppe\b/i, suff: ["suppe", "soup"], fuge: true },
  { re: /^Nevn en (?:type )?salat\b/i, suff: ["salat", "salad"], fuge: true },
  { re: /^Nevn en (?:type )?kake\b/i, suff: ["kake", "cake"], fuge: true },
  { re: /^Nevn en småkake eller kjeks\b/i, suff: ["smakake", "cookies", "biscuit", "cookie", "kjeks"], kort: true },
  { re: /^Nevn en (?:type )?(?:te|tesort)\b/i, suff: ["tea", "te"], kort: true },
  { re: /^Nevn en (?:ølstil|type øl)\b/i, suff: ["beer", "ol"], kort: true },
  { re: /^Nevn en (?:type )?vin\b/i, suff: ["wine", "vin"], kort: true },
  { re: /^Nevn en druesort\b/i, suff: ["druer", "drue"], kort: true },
  { re: /^Nevn en kattrase\b/i, suff: ["katt"] },
  { re: /^Nevn en hunderase\b/i, suff: ["hund"] },
  { re: /^Nevn en hesterase\b/i, suff: ["hest"], fuge: true },
  { re: /^Nevn en haiart\b/i, suff: ["hai"] },
  { re: /^Nevn en selart\b/i, suff: ["sel"] },
  { re: /^Nevn en (?:rov|kråke)?fugl\b/i, suff: ["fugl"] },
  { re: /^Nevn en fisk\b/i, suff: ["fisk"] },
  { re: /^Nevn en sopp\b/i, suff: ["sopp"] },
  { re: /^Nevn en (?:blomst|stueplante)\b/i, suff: ["blomst", "plante"] },
  { re: /^Nevn et (?:type )?tre\b/i, suff: ["tre"], fuge: true },
  { re: /^Nevn en nøtt\b/i, suff: ["notter", "nott"] },
  { re: /^Nevn en (?:sitrus)?frukt\b/i, suff: ["frukt"] },
  { re: /^Nevn et bær\b/i, suff: ["baer", "bar"] },
  { re: /^Nevn en type brød\b|^Nevn et brød\b/i, suff: ["brod"] },
  { re: /^Nevn en (?:type )?pasta/i, suff: ["pasta"] },
  { re: /^Nevn en nudelrett\b/i, suff: ["noodles", "nudler", "nudel"] },
  { re: /^Nevn en type grøt\b/i, suff: ["grot"], fuge: true },
  { re: /^Nevn en pai eller terte\b/i, suff: ["terte", "pai"] },
  { re: /^Nevn en type pannekake\b/i, suff: ["pannekaker", "pannekake"] },
  { re: /^Nevn en (?:type )?brus\b/i, suff: ["soda", "brus"] },
  { re: /^Nevn en (?:type )?sjokolade\b/i, suff: ["sjokolade"] },
  { re: /^Nevn en (?:type )?kaffe/i, suff: ["coffee", "kaffe"] },
  { re: /^Nevn et (?:type )?krydder\b/i, suff: ["krydder", "pulver"] },
  { re: /^Nevn en (?:type )?dans\b/i, suff: ["dance", "dans"], fuge: true },
  { re: /^Nevn en (?:type )?farge\b/i, suff: ["farge"] },
  { re: /^Nevn et rom\b/i, suff: ["vaerelse", "varelse", "rom"], fuge: true },
  { re: /^Nevn en musikksjanger\b/i, suff: ["musikk", "music"] },
  { re: /^Nevn et språk\b/i, suff: ["sprak"] },
  {
    re: /^Nevn en (?:kjent )?(?:norsk |spansk |tysk |engelsk |italiensk |fransk )?fotballklubb\b/i,
    suff: ["fotballklubb", "afc", "fc", "fk", "bk", "sk", "if", "il", "ik", "ac", "sc", "cf"],
    pref: ["afc", "fc", "fk", "bk", "sk", "if", "il", "ik", "ac", "sc", "cf"],
    kort: true,
  },
  { re: /^Nevn en stavkirke\b/i, suff: ["stavkirke", "kirke"], kort: true },
  { re: /^Nevn et (?:norsk |kjent )?fjell\b|^Nevn en norsk fjelltopp\b/i, suff: ["fjellet", "fjell"], pref: ["mount", "mt"] },
  { re: /^Nevn en vulkan\b/i, suff: ["vulkanen", "vulkan"], pref: ["mount", "mt"] },
  { re: /^Nevn en (?:norsk |kjent )?fjord\b/i, suff: ["fjorden", "fjord"] },
  { re: /^Nevn en (?:kjent )?(?:norsk )?foss\b/i, suff: ["fallene", "fossen", "falls", "foss"], kort: true },
  { re: /^Nevn en (?:kjent )?(?:norsk )?(?:bro|bru)\b/i, suff: ["bridge", "broen", "brua", "bro", "bru"] },
  { re: /^Nevn en (?:norsk |kjent )?elv\b/i, suff: ["elven", "elva", "elv"], pref: ["river"] },
  { re: /^Nevn en (?:norsk |kjent )?innsjø\b/i, suff: ["innsjoen", "innsjo", "sjoen", "sjo"], pref: ["lake"] },
  { re: /^Nevn en (?:norsk |gresk |kjent )?øy\b/i, suff: ["island", "oyen", "oya", "oy"] },
  { re: /^Nevn et norsk skisted\b/i, suff: ["alpinsenter", "skianlegg", "skisenter"], kort: true },
]

type Alternativ = { vis: string; nokler: string[]; nivaa: Exclude<Nivaa, 0>; geo: boolean }
export type Oppgave = {
  tekst: string
  alternativer: Alternativ[]
  indeks: Map<string, number>
  /** Canonical keys (unified Roman/Arabic/ordinal numbers, &/og/and, vitamin order). */
  kanonIndeks: Map<string, number>
  /** Title-stripped keys for people/character prompts ("Sir Isaac Newton" → "isaacnewton"), checked before kjente(). */
  tittelIndeks: Map<string, number>
  /** Article-stripped keys ("The Dark Knight" → "darkknight"), checked only when input is not in kjente(). */
  loyseIndeks: Map<string, number>
  /** Phonetic keys (`${fonetisk(key)}|${tall}`), checked only when input is not in kjente(). */
  fonetiskIndeks: Map<string, number>
  /** Optional category noun rule for suffix/prefix stripping & swapping ("bearnaisesaus" ↔ "bearnaise"). */
  katRegel: KatRegel | null
  /** Stems of stored answers after stripping the prompt's category noun ("teriyakisaus" → "teriyaki"). */
  katStammer: Map<string, number>
  /** Keys of lowercase common nouns, the only answers that are inflected. */
  boyelige: Map<string, number>
  /** Singular stems of stored plural common nouns ("sokker" → "sokk", "bønner" → "bønne"). */
  boyeligeStammer: Map<string, number>
  /** The numbers in each key (see `tallIOrd`). */
  tall: Map<string, string>
  kanonTall: Map<string, string>
  /** Whether the prompt is about people/characters/royalty, so a leading title ("Kong ", "Sir ", "Kaptein ") is optional. */
  harTittel: boolean
  /** Whether the prompt restricts answers to a specific starting letter. */
  forbokstav: boolean
  streng: boolean
  nei: Set<string>
}

const kontinenter = new Set<string>(["Europa", "Asia", "Afrika", "Nord-Amerika", "Sør-Amerika", "Oseania"])
const landEtterId = new Map(omrader.map((o) => [o.id, o]))

// Common misspellings that are real words elsewhere in the bank, so the typo rule would not catch them.
const EKSTRA_LANDNAVN: Record<string, string[]> = { LI: ["Lichtenstein"] }

function landNavn(id: string) {
  const o = landEtterId.get(id)
  if (!o) throw new Error(`Ukjent land: ${id}`)
  return { vis: o.navn, navn: [o.navn, o.en, ...o.svar, ...(EKSTRA_LANDNAVN[id] ?? [])] }
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
  const kanonIndeks = new Map<string, number>()
  const tittelIndeks = new Map<string, number>()
  const loyseIndeks = new Map<string, number>()
  const fonetiskIndeks = new Map<string, number>()
  const katStammer = new Map<string, number>()
  const boyelige = new Map<string, number>()
  const boyeligeStammer = new Map<string, number>()
  const tall = new Map<string, string>()
  const kanonTall = new Map<string, string>()
  const streng = s.streng ?? false
  const nei = new Set((s.nei ?? "").split(",").map(normaliser).filter(Boolean))
  const harTittel =
    /\b(konge|dronning|kongefamilien|keiser|farao|person|figur|nordmann|skurk|helt|pirat|president|statsminister|vitenskapsperson|forfatter|komponist|skuespiller|artist|utøver|spiller|oppdagelsesreisende|nobelprisvinner|viking|bibelen|apostel|gud|gudinne|heks|trollmann|robot|bjørn|hund|katt)\b/i.test(
      s.tekst,
    )
  const katRegel = streng ? null : (KATEGORI_REGLER.find((r) => r.re.test(s.tekst)) ?? null)

  const leggTilKanon = (kk: string, tVal: string, i: number) => {
    if (!kk || (forbokstav && !kk.startsWith(forbokstav)) || nei.has(kk) || kanonIndeks.has(kk)) return
    kanonIndeks.set(kk, i)
    kanonTall.set(kk, tVal)
  }

  const leggTilTittel = (tk: string, i: number) => {
    if (!tk || tk.length < 5 || (forbokstav && !tk.startsWith(forbokstav)) || nei.has(tk) || tittelIndeks.has(tk)) return
    tittelIndeks.set(tk, i)
  }

  const leggTilLoyse = (lk: string, i: number) => {
    if (!lk || lk.length < 4 || (forbokstav && !lk.startsWith(forbokstav)) || nei.has(lk) || loyseIndeks.has(lk)) return
    loyseIndeks.set(lk, i)
  }

  const leggTilFonetisk = (kk: string, tVal: string, i: number) => {
    if (!kk || kk.length < 5 || forbokstav) return
    const fk = `${fonetisk(kk)}|${tVal}`
    if (!fonetiskIndeks.has(fk)) fonetiskIndeks.set(fk, i)
  }

  const leggTilKatStamme = (k: string, i: number) => {
    if (!katRegel) return
    for (const w of katRegel.suff) {
      if (k.endsWith(w) && k.length - w.length >= 4) {
        const st = k.slice(0, -w.length)
        if (!nei.has(st) && !katStammer.has(st)) katStammer.set(st, i)
        if (katRegel.fuge && (st.endsWith("s") || st.endsWith("e")) && st.length >= 5) {
          const st2 = st.slice(0, -1)
          if (!nei.has(st2) && !katStammer.has(st2)) katStammer.set(st2, i)
        }
      }
    }
    if (!forbokstav && katRegel.pref) {
      for (const w of katRegel.pref) {
        if (k.startsWith(w) && k.length - w.length >= 4) {
          const st = k.slice(w.length)
          if (!nei.has(st) && !katStammer.has(st)) katStammer.set(st, i)
        }
      }
    }
  }

  alternativer.forEach((a, i) => {
    if (forbokstav && !normaliser(a.vis).startsWith(forbokstav)) a.vis = a.nokler.find((n) => normaliser(n).startsWith(forbokstav!)) ?? a.vis
    const nokler: string[] = []
    for (const n of a.nokler) {
      const k = normaliser(n)
      if (!k || (forbokstav && !k.startsWith(forbokstav)) || nokler.includes(k)) continue
      nokler.push(k)
      // The first answer to claim a text keeps it ("Kongo" stays with whichever Congo came first).
      if (!indeks.has(k)) {
        indeks.set(k, i)
        tall.set(k, tallIOrd(n))
        leggTilKatStamme(k, i)
        if (!a.geo && /^[a-zæøå]/.test(n)) {
          boyelige.set(k, i)
          for (const e of FLERTALL_ENDELSER) {
            if (!k.endsWith(e) || k.length - e.length < (e.length === 1 ? 5 : 4)) continue
            const stamme = k.slice(0, -e.length)
            if (!boyeligeStammer.has(stamme)) boyeligeStammer.set(stamme, i)
            if (e === "er" && stamme.length >= 4 && !stamme.endsWith("e") && !boyeligeStammer.has(stamme + "e")) {
              boyeligeStammer.set(stamme + "e", i)
            }
          }
        }
      }
      if (!streng) {
        const w = ordKanon(n)
        const tVal = w
          .filter((x) => /^\d+$/.test(x))
          .map((x) => String(Number(x)))
          .join(" ")
        const kk = w.join("").replace(/aa/g, "a")
        leggTilKanon(kk, tVal, i)
        leggTilFonetisk(kk, tVal, i)
        if (!forbokstav && w.length > 1) {
          if (ARTIKLER.has(w[0])) {
            const uten = w.slice(1).join("").replace(/aa/g, "a")
            leggTilLoyse(uten, i)
          }
          if (harTittel && TITLER.has(w[0])) {
            const uten = w.slice(1).join("").replace(/aa/g, "a")
            if (w.length >= 3) leggTilTittel(uten, i)
            else if (uten.length >= 5) leggTilLoyse(uten, i)
          }
        }
      }
    }
    a.nokler = nokler
  })
  return {
    tekst: s.tekst,
    alternativer,
    indeks,
    kanonIndeks,
    tittelIndeks,
    loyseIndeks,
    fonetiskIndeks,
    katRegel,
    katStammer,
    boyelige,
    boyeligeStammer,
    tall,
    kanonTall,
    harTittel,
    forbokstav: Boolean(forbokstav),
    streng,
    nei,
  }
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

/** Match an input that appends/prepends the prompt's category word ("bearnaisesaus" → "bearnaise", "pizza margherita" → "margherita"). */
function finnKatTreff(o: Oppgave, sok: string, tVal: string, medFuzzy: boolean): number | undefined {
  const regel = o.katRegel
  if (!regel) return undefined
  const sokStamme = (st: string): number | undefined => {
    if (o.nei.has(st)) return undefined
    const eksakt = o.indeks.get(st) ?? o.kanonIndeks.get(st) ?? o.katStammer.get(st)
    if (eksakt !== undefined) return eksakt
    if (!medFuzzy || st.length < 4) return undefined
    if (st.length >= 5) {
      const fon = o.fonetiskIndeks.get(`${fonetisk(st)}|${tVal}`)
      if (fon !== undefined) return fon
    }
    let best: number | undefined
    let bestD = Infinity
    for (const [k, i] of o.indeks) {
      if (k[0] !== st[0] || o.tall.get(k) !== tVal) continue
      const tol = Math.min(1, toleranse(k.length))
      if (tol === 0) continue
      const d = avstand(st, k, tol)
      if (d <= tol && (d < bestD || (d === bestD && best !== undefined && o.alternativer[i].nivaa < o.alternativer[best].nivaa))) {
        best = i
        bestD = d
      }
    }
    return best
  }
  for (const w of regel.suff) {
    if (sok.endsWith(w) && sok.length - w.length >= 3) {
      const st = sok.slice(0, -w.length)
      const treff = sokStamme(st)
      if (treff !== undefined) return treff
      if (regel.fuge && (st.endsWith("s") || st.endsWith("e")) && st.length >= 4) {
        const treff2 = sokStamme(st.slice(0, -1))
        if (treff2 !== undefined) return treff2
      }
    }
  }
  if (!o.forbokstav && regel.pref) {
    for (const w of regel.pref) {
      if (sok.startsWith(w) && sok.length - w.length >= 3) {
        const treff = sokStamme(sok.slice(w.length))
        if (treff !== undefined) return treff
      }
    }
  }
  return undefined
}

/**
 * Index of the answer a text matches, or null. Exact first, then canonical number/ordinal/conjunction/title/article
 * and category-noun compound forms, then loose article, phonetic spelling, inflected common nouns and small typos.
 * A real word from elsewhere in the bank ("Irak" when only Iran fits) is never loosely matched, inflected or read as a typo.
 */
export function finnAlternativ(o: Oppgave, tekst: string): number | null {
  const t = normaliser(tekst)
  if (!t) return null
  const direkte = o.indeks.get(t)
  if (direkte !== undefined) return direkte
  if (o.nei.has(t) || o.streng) return null

  const treffKanonDirekte = o.kanonIndeks.get(t) ?? o.tittelIndeks.get(t)
  if (treffKanonDirekte !== undefined) return treffKanonDirekte

  // Canonical exact match: unifies Roman numerals, Arabic digits, Norwegian ordinals, "&"/"og"/"and",
  // "vitamin X"/"X-vitamin", and leading articles/titles typed by the player.
  // Skip multi-word/digit parsing on plain single-word inputs (keeps hot lookup paths O(1)).
  let kt = t
  let tall: string | null = null
  if (/[\s\d&.-]/.test(tekst)) {
    const wKanon = ordKanon(tekst)
    kt = wKanon.join("").replace(/aa/g, "a")
    tall = wKanon
      .filter((x) => /^\d+$/.test(x))
      .map((x) => String(Number(x)))
      .join(" ")
    if (kt && kt !== t) {
      const treffKanon = o.kanonIndeks.get(kt) ?? o.tittelIndeks.get(kt)
      if (treffKanon !== undefined) return treffKanon
    }
    if (wKanon.length > 1 && ARTIKLER.has(wKanon[0])) {
      const uten = wKanon.slice(1).join("").replace(/aa/g, "a")
      if (uten.length >= 4 && !o.nei.has(uten)) {
        const treff = o.kanonIndeks.get(uten) ?? o.indeks.get(uten)
        if (treff !== undefined) return treff
      }
    }
    if (o.harTittel && wKanon.length > 1 && TITLER.has(wKanon[0])) {
      const uten = wKanon.slice(1).join("").replace(/aa/g, "a")
      if (uten.length >= 4 && !o.nei.has(uten)) {
        const treff = o.kanonIndeks.get(uten) ?? o.indeks.get(uten) ?? o.tittelIndeks.get(uten) ?? o.loyseIndeks.get(uten)
        if (treff !== undefined) return treff
      }
    }
  }

  const tVal = tall ?? ""
  const katEksakt = finnKatTreff(o, t, tVal, false) ?? (kt !== t ? finnKatTreff(o, kt, tVal, false) : undefined)
  if (katEksakt !== undefined) return katEksakt

  if (kjente().has(t)) return null

  if (o.katRegel?.kort && t.length >= 6) {
    const fraKatStamme = o.katStammer.get(t) ?? (kt !== t ? o.katStammer.get(kt) : undefined)
    if (fraKatStamme !== undefined) return fraKatStamme
  }
  const katFuzzy = finnKatTreff(o, t, tVal, true) ?? (kt !== t ? finnKatTreff(o, kt, tVal, true) : undefined)
  if (katFuzzy !== undefined) return katFuzzy

  const loyse = o.loyseIndeks.get(kt) ?? (kt !== t ? o.loyseIndeks.get(t) : undefined)
  if (loyse !== undefined) return loyse

  if (kt.length >= 5) {
    const fon = o.fonetiskIndeks.get(`${fonetisk(kt)}|${tVal}`)
    if (fon !== undefined) return fon
  }

  for (const e of ENDELSER) {
    if (!t.endsWith(e) || t.length - e.length < (e.length === 1 ? 5 : 4)) continue
    const st = t.slice(0, -e.length)
    const i = o.boyelige.get(st)
    if (i !== undefined) return i
    // Doubled-consonant definite/plural stems ("soverommet" → "soverom", "kammen" → "kam").
    if (e.length >= 2 && st.length >= 4 && st[st.length - 1] === st[st.length - 2] && /[bdfgklmnpt]$/.test(st)) {
      const i2 = o.boyelige.get(st.slice(0, -1))
      if (i2 !== undefined) return i2
    }
  }
  // Feminine/neuter "-a" definite ending ("stua" → "stue", "hytta" → "hytte", "boka" → "bok").
  if (t.endsWith("a") && t.length >= 4) {
    const st = t.slice(0, -1)
    const i = o.boyelige.get(st) ?? o.boyelige.get(st + "e")
    if (i !== undefined) return i
  }
  const fraFlertall = o.boyeligeStammer.get(t)
  if (fraFlertall !== undefined) return fraFlertall

  let best: number | null = null
  let bestAvstand = Infinity
  const sjekkKart = (kart: Map<string, number>, tallKart: Map<string, string>, sok: string) => {
    for (const [k, i] of kart) {
      // Typos rarely hit the first letter, and requiring it keeps "Mali" from passing as "Bali".
      if (k[0] !== sok[0] || tallKart.get(k) !== tVal) continue
      const tol = toleranse(k.length)
      if (tol === 0) continue
      const d = avstand(sok, k, tol)
      if (d > tol) continue
      if (d < bestAvstand || (d === bestAvstand && best !== null && o.alternativer[i].nivaa < o.alternativer[best].nivaa)) {
        best = i
        bestAvstand = d
      }
    }
  }
  sjekkKart(o.indeks, o.tall, t)
  if (kt && kt !== t) sjekkKart(o.kanonIndeks, o.kanonTall, kt)
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

/** Whether the date replays a day from an earlier round of the bank. */
export function erRepris(dato: string) {
  return dagNummer(dato) - dagNummer(STEGERN_START) >= stegernDager.length
}

// Receipts keep question 6 and the final honest without storing anything: the server signs each answer it
// judged, question 6 only checks an earlier answer that carries its receipt, and the final needs the ticket
// question 6 hands out. STEGERN_HEMMELIGHET can set the key; otherwise it is derived from SJAKK_GATEWAY_KEY,
// which Vercel already has, so the chess key itself never signs anything here. Without either (local
// development) the key lives for this process only.
let hemmelighet: Buffer | null = null
function nokkel() {
  if (hemmelighet) return hemmelighet
  const kilde = process.env.STEGERN_HEMMELIGHET || process.env.SJAKK_GATEWAY_KEY
  return (hemmelighet = kilde ? createHmac("sha256", kilde).update("67-stegern:kvittering").digest() : randomBytes(32))
}

const signer = (tekst: string) => createHmac("sha256", nokkel()).update(tekst).digest("base64url")

function stemmer(signatur: unknown, tekst: string) {
  if (typeof signatur !== "string") return false
  const a = Buffer.from(signatur)
  const b = Buffer.from(signer(tekst))
  return a.length === b.length && timingSafeEqual(a, b)
}

/** The receipt for answer `svar` to normal prompt `nr` (0–4) on `dato`. */
export const kvittering = (dato: string, nr: number, svar: string) => signer(`${dato}|${nr}|${normaliser(svar)}`)
export const harKvittering = (dato: string, nr: number, svar: string, k: unknown) => stemmer(k, `${dato}|${nr}|${normaliser(svar)}`)

/** The ticket to the final, handed out when question 6 is right. */
export const finaleBillett = (dato: string) => signer(`${dato}|finale`)
export const harFinaleBillett = (dato: string, b: unknown) => stemmer(b, `${dato}|finale`)

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
  return b[0] === a[0] && tallIOrd(tidligere) === tallIOrd(svar) && avstand(a, b, toleranse(a.length)) <= toleranse(a.length)
}

export function finaleTekst(dato: string) {
  return dagFor(dato).finale.tekst
}

/** Days ahead whose prompts a duel never uses, so it cannot spoil them once the bank starts over. */
export const DUELL_SPERRE_DAGER = 14

/**
 * The days a duel may take prompts from: only days before today, one per day in the bank, and never a bank day
 * that comes up again today or within DUELL_SPERRE_DAGER days.
 */
export function duellDager(iDag = iDagOslo()) {
  const sperret = new Set(Array.from({ length: DUELL_SPERRE_DAGER + 1 }, (_, k) => dagFor(leggTilDager(iDag, k))))
  const sett = new Set<StegernDag>()
  const ut: string[] = []
  // Newest first, so a bank day that repeats is used from its latest date.
  for (let d = leggTilDager(iDag, -1); d >= STEGERN_START; d = leggTilDager(d, -1)) {
    const dag = dagFor(d)
    if (sperret.has(dag) || sett.has(dag)) continue
    sett.add(dag)
    ut.push(d)
  }
  return ut.reverse()
}

export type DuellSporsmal = { dato: string; nr: number; tekst: string }

/** Prompts of the duel bank are addressed with this in place of a date; `nr` is then the index in the bank. */
export const BANK = "bank"

/** A duel prompt by its address: a bank prompt, or prompt `nr` of an earlier day. */
function duellOppgaveFor(dato: string, nr: number): StegernSporsmal {
  return dato === BANK ? stegernDuellBank[nr] : dagFor(dato).sporsmal[nr]
}

/**
 * Every prompt a duel may use now: the whole duel bank, which the daily game never plays, and the five prompts of
 * each earlier day that duellDager allows.
 */
export function duellPulje(iDag = iDagOslo()): { dato: string; nr: number }[] {
  const bank = stegernDuellBank.map((_, nr) => ({ dato: BANK, nr }))
  const dager = duellDager(iDag).flatMap((dato) => Array.from({ length: NORMALE }, (_, nr) => ({ dato, nr })))
  return [...bank, ...dager]
}

/**
 * The prompts for round `runde` of the duel in room `kode`. Each round walks on through one shuffle of the pool,
 * so a room sees every prompt once before any comes back. Answers are judged by address, as on the daily page.
 */
export function duellSporsmal(kode: string, runde: number, iDag = iDagOslo(), antall = NORMALE): DuellSporsmal[] {
  const pulje = duellPulje(iDag)
  if (!pulje.length) return []
  const salt = `stegern:duell:${kode}`
  const n = Math.min(antall, pulje.length)
  return Array.from({ length: n }, (_, i) => {
    const { dato, nr } = iRotasjon(pulje, runde * n + i, salt)
    return { dato, nr, tekst: duellOppgaveFor(dato, nr).tekst }
  })
}

/** Whether a duel may use this prompt now. Yesterday's list counts too, for a round that began before midnight. */
export function erDuellSporsmal(dato: string, nr: number, iDag = iDagOslo()) {
  if (!Number.isInteger(nr) || nr < 0) return false
  if (dato === BANK) return nr < stegernDuellBank.length
  return nr < NORMALE && (duellDager(iDag).includes(dato) || duellDager(leggTilDager(iDag, -1)).includes(dato))
}

/**
 * The signed verdict for a duel answer: what the player wrote, its tier, who wrote it, for which question of which
 * round in which room, and when the server judged it. Other players trust only this, never a tier a client claims.
 */
export function stegernDuellDom(p: { kode: string; runde: number; i: number; dato: string; nr: number; id: string; svar: string }, na = Date.now()) {
  const v = vurderOppgave(oppgave(duellOppgaveFor(p.dato, p.nr)), p.svar)
  const dom = signerDom({ s: "stegern", k: p.kode, r: p.runde, i: p.i, d: p.dato, nr: p.nr, id: p.id, t: p.svar, n: v.nivaa, tr: v.treff, ts: na })
  return { dom, vurdering: v }
}
