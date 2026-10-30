import "server-only"

import attraksjoner from "../../data/geografi/attraksjoner.json"
import former from "../../data/geografi/former.json"
import kart from "../../data/geografi/kart.json"
import telefonkoder from "../../data/geografi/telefon.json"
import { dagNummer, stokk } from "../dag"
import { land, storeByer, type Land } from "../geografi"
import { egenskaper } from "../geografi-egenskaper"
import { normaliser } from "../geografi-svar"

// Tilkoblinger (our GeoConnections): 16 tiles, four hidden groups of four. Two kinds of day:
// - Land day (most days, like GeoConnections): each group is one country, shown four ways. Which four
//   ways changes daily: flag, outline, capital, a famous sight, a big city, currency, domain, phone code, …
// - Category day (about one in three): 16 countries with flag and name; four categories from
//   different families, each with four countries that fit it and none of the other three.

type Kategori = { id: string; navn: string; familie: string; niva: 1 | 2 | 3 | 4; passer: (l: Land) => boolean }

const e = (l: Land) => egenskaper[l.id]
const navnet = (l: Land) => l.navn.toLowerCase()

const KONTINENTER = ["Europa", "Asia", "Afrika", "Nord-Amerika", "Sør-Amerika", "Oseania"] as const
const HAV = ["Middelhavet", "Karibhavet", "Østersjøen", "Svartehavet", "Rødehavet", "Persiabukta", "Sørkinahavet"] as const
const SPRAK = ["spansk", "fransk", "portugisisk", "arabisk", "engelsk", "tysk", "russisk"] as const
const NABOER = ["CN", "DE", "RU", "BR", "FR", "IN", "TR", "SA", "ZA", "AT", "TZ", "CD", "SD"]

const kategorier: Kategori[] = [
  ...KONTINENTER.map((k): Kategori => ({ id: `kont-${k}`, navn: `Ligger i ${k}`, familie: "kontinent", niva: 1, passer: (l) => l.kontinent === k })),
  ...NABOER.map((id): Kategori => {
    const nabo = land.find((l) => l.id === id)!
    return { id: `nabo-${id}`, navn: `Grenser til ${nabo.navn}`, familie: "nabo", niva: 2, passer: (l) => l.naboer.includes(id) }
  }),
  ...HAV.map((h): Kategori => ({ id: `hav-${h}`, navn: `Kyst mot ${h}`, familie: "hav", niva: 2, passer: (l) => e(l).hav.includes(h) })),
  ...SPRAK.map((s): Kategori => ({ id: `sprak-${s}`, navn: `${s[0].toUpperCase()}${s.slice(1)} er offisielt språk`, familie: "sprak", niva: 2, passer: (l) => e(l).spraak.includes(s) })),
  { id: "flagg-stjerne", navn: "Stjerne i flagget", familie: "flagg", niva: 2, passer: (l) => e(l).flaggStjerne },
  { id: "flagg-mane", navn: "Måne i flagget", familie: "flagg", niva: 3, passer: (l) => e(l).flaggManeHalvmane },
  { id: "flagg-dyr", navn: "Dyr i flagget", familie: "flagg", niva: 3, passer: (l) => e(l).flaggDyr },
  { id: "flagg-kors", navn: "Kors i flagget", familie: "flagg", niva: 2, passer: (l) => e(l).flaggKors },
  { id: "flagg-rodhvit", navn: "Flagget er bare rødt og hvitt", familie: "flagg", niva: 3, passer: (l) => e(l).flaggFarger.length === 2 && e(l).flaggFarger.includes("rød") && e(l).flaggFarger.includes("hvit") },
  { id: "flagg-vertikal", navn: "Loddrette striper i flagget", familie: "flagg", niva: 3, passer: (l) => e(l).flaggVertikaleStriper },
  { id: "innland", navn: "Uten kyst", familie: "geo", niva: 2, passer: (l) => e(l).innlandsstat },
  { id: "oy", navn: "Øyland", familie: "geo", niva: 2, passer: (l) => e(l).oy },
  { id: "ekvator", navn: "Ekvator går gjennom landet", familie: "geo", niva: 3, passer: (l) => e(l).ekvator },
  { id: "ildringen", navn: "Ligger i Ildringen", familie: "geo", niva: 4, passer: (l) => e(l).ildringen },
  { id: "monarki", navn: "Har kongehus", familie: "politikk", niva: 3, passer: (l) => e(l).monarki },
  { id: "venstre", navn: "Kjører på venstre side", familie: "politikk", niva: 3, passer: (l) => e(l).venstrekjoring },
  { id: "sovjet", navn: "Var en del av Sovjetunionen", familie: "politikk", niva: 2, passer: (l) => e(l).tidligereSovjet },
  { id: "samveldet", navn: "Med i Samveldet", familie: "politikk", niva: 3, passer: (l) => e(l).samveldet },
  { id: "nato", navn: "Med i NATO", familie: "org", niva: 2, passer: (l) => e(l).nato },
  { id: "euro", navn: "Bruker euro", familie: "org", niva: 1, passer: (l) => l.valuta.kode === "EUR" },
  { id: "dollar", navn: "Valutaen heter dollar", familie: "valuta", niva: 3, passer: (l) => /dollar/i.test(l.valuta.navn) && l.valuta.kode !== "EUR" },
  { id: "franc", navn: "Valutaen heter franc", familie: "valuta", niva: 4, passer: (l) => /franc/i.test(l.valuta.navn) },
  { id: "stan", navn: "Navnet slutter på -stan", familie: "navn", niva: 1, passer: (l) => navnet(l).endsWith("stan") },
  { id: "fire", navn: "Navnet har fire bokstaver", familie: "navn", niva: 4, passer: (l) => /^[a-zæøå]{4}$/.test(navnet(l)) },
  { id: "samme-bokstav", navn: "Hovedstaden starter på samme bokstav", familie: "navn", niva: 4, passer: (l) => Boolean(l.hovedstad) && l.hovedstad[0].toLowerCase() === navnet(l)[0] },
  { id: "ol", navn: "Har arrangert OL", familie: "sport", niva: 3, passer: (l) => e(l).harArrangertOL },
  { id: "vm", navn: "Har vunnet fotball-VM", familie: "sport", niva: 2, passer: (l) => e(l).harVunnetFotballVM },
  { id: "atom", navn: "Har atomvåpen", familie: "politikk", niva: 3, passer: (l) => e(l).atomvapen },
]

// Countries most players know; smaller ones are still allowed when a category needs them.
const kjent = (l: Land) => l.befolkning >= 2_000_000

/** Photo credit for a famous sight (CC licences need it). */
export type Kreditt = { navn: string; fotograf: string; lisens: string; kilde: string }
/** `detaljer` is shown when the group is found: the country names, or what the tiles said. */
export type Gruppe = { navn: string; niva: 1 | 2 | 3 | 4; ider: string[]; detaljer: string; kreditt?: Kreditt }
/** What the page gets for a tile. Images come from /spill/api/tilkoblinger/bilde so the URL says nothing. */
export type Brikke = { id: string; slag: "flagg" | "omriss" | "foto" | "tekst"; tekst?: string; etikett?: string }
/** Server side: which country and how it is shown. */
type Rute = { land: string; visning: Visning }

type KategoriGruppe = { navn: string; niva: 1 | 2 | 3 | 4; ider: string[] }

function bygg(dato: string, forsok: number): KategoriGruppe[] | null {
  const valgt: Kategori[] = []
  for (const k of stokk(kategorier, `tilkoblinger:${dato}:${forsok}`)) {
    if (valgt.some((v) => v.familie === k.familie)) continue
    valgt.push(k)
    if (valgt.length === 4) break
  }
  if (valgt.length < 4) return null
  const brukt = new Set<string>()
  const grupper: KategoriGruppe[] = []
  for (const k of valgt) {
    // Members fit their own category and none of the other three, so every group has one answer.
    const eksklusive = land.filter((l) => k.passer(l) && !brukt.has(l.id) && valgt.every((a) => a === k || !a.passer(l)))
    const kjente = eksklusive.filter(kjent)
    const pulje = kjente.length >= 4 ? kjente : eksklusive
    if (pulje.length < 4) return null
    const ider = stokk(pulje, `tilkoblinger:${dato}:${forsok}:${k.id}`).slice(0, 4).map((l) => l.id)
    ider.forEach((id) => brukt.add(id))
    grupper.push({ navn: k.navn, niva: k.niva, ider })
  }
  return grupper.sort((a, b) => a.niva - b.niva)
}

// ---------------------------------------------------------------------------------------------
// Land days
// ---------------------------------------------------------------------------------------------

type Visning = "flagg" | "omriss" | "foto" | "hovedstad" | "by" | "valuta" | "domene" | "folketall" | "areal" | "sprak" | "telefon" | "koordinater"
type Attraksjon = Kreditt & { bilde: string }
const severdigheter = attraksjoner as Record<string, Attraksjon>
const formKart = former as Record<string, string>
const telefon = telefonkoder as Record<string, string>
const smaa = new Set(Object.keys((kart as { punkter: Record<string, unknown> }).punkter))

const tall = (n: number) => n.toLocaleString("nb-NO")
const tresiffer = (n: number) => Number(n.toPrecision(n >= 1000 ? 3 : 2))
function folketall(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toLocaleString("nb-NO", { maximumFractionDigits: 1 })} mrd.`
  if (n >= 1e6) return `${(n / 1e6).toLocaleString("nb-NO", { maximumFractionDigits: n >= 1e7 ? 0 : 1 })} mill.`
  return tall(tresiffer(n))
}
/** Drop the transliteration marks some city names carry (Ḩawallī → Hawalli); keep ordinary accents. */
const rensBy = (navn: string) => navn.normalize("NFD").replace(/[̣̱̄]|(?<=h)̧/gi, "").normalize("NFC")

/** A text that names the country (Kuwait by, Panama City, Tunis/Tunisia) gives the group away. */
function avslorer(tekst: string, l: Land) {
  const t = normaliser(tekst)
  return [l.navn, l.en].some((n) => {
    const stamme = normaliser(n).slice(0, 5)
    return stamme.length >= 4 && t.includes(stamme)
  })
}

/** The biggest city that isn't the capital (judged by position too, since spellings differ: Dusjanbe/Dushanbe). */
function storBy(l: Land) {
  const hoved = normaliser(l.hovedstad)
  const [hlat, hlng] = l.hovedstadPos ?? [l.lat, l.lng]
  const by = (storeByer[l.id] ?? []).find((b) => {
    const n = normaliser(b.navn)
    const naer = Math.abs(b.lat - hlat) < 0.3 && Math.abs(b.lng - hlng) < 0.3
    return b.folketall >= 500_000 && !naer && !n.includes(hoved) && !hoved.includes(n)
  })
  return by && !avslorer(by.navn, l) ? rensBy(by.navn) : null
}

const ETIKETT: Partial<Record<Visning, string>> = {
  hovedstad: "Hovedstad",
  by: "By",
  valuta: "Valuta",
  domene: "Domene",
  folketall: "Folketall",
  areal: "Areal",
  sprak: "Språk",
  telefon: "Telefonkode",
  koordinater: "Midt i landet",
}

/** The tile text for a country, or null if this way of showing it doesn't work for that country. */
function tekstFor(l: Land, v: Visning): string | null {
  switch (v) {
    case "hovedstad":
      return l.hovedstad && !avslorer(l.hovedstad, l) ? l.hovedstad : null
    case "by":
      return storBy(l)
    case "valuta":
      // The ISO code (SEK) rather than the name ("svensk krone"), which would give the country away.
      return l.valuta.kode
    case "domene":
      return `.${l.id === "GB" ? "uk" : l.id.toLowerCase()}`
    case "folketall":
      return folketall(l.befolkning)
    case "areal":
      return `${tall(tresiffer(l.areal))} km²`
    case "telefon":
      return telefon[l.id] ?? null
    case "koordinater": {
      const grad = (v: number, pluss: string, minus: string) => `${Math.abs(Math.round(v))}° ${v >= 0 ? pluss : minus}`
      return `${grad(l.lat, "N", "S")}, ${grad(l.lng, "Ø", "V")}`
    }
    case "sprak": {
      const s = l.sprak.slice(0, 2)
      const tekst = s.join(" og ")
      return tekst ? tekst[0].toUpperCase() + tekst.slice(1) : null
    }
    default:
      return null
  }
}

function kanVises(l: Land, v: Visning) {
  if (v === "flagg") return true
  if (v === "omriss") return Boolean(formKart[l.id]) && !smaa.has(l.id) && l.areal >= 10_000
  if (v === "foto") return Boolean(severdigheter[l.id])
  return tekstFor(l, v) !== null
}

/** Four countries must not share a currency or a language, and their numbers must be far enough apart to tell. */
function forenlige(valgte: Land[], visninger: Visning[]) {
  for (let i = 0; i < valgte.length; i++) {
    for (let j = i + 1; j < valgte.length; j++) {
      const [a, b] = [valgte[i], valgte[j]]
      if (visninger.includes("valuta") && a.valuta.kode === b.valuta.kode) return false
      if (visninger.includes("sprak") && a.sprak.some((s) => b.sprak.includes(s))) return false
      if (visninger.includes("telefon") && telefon[a.id] === telefon[b.id]) return false
      if (visninger.includes("koordinater") && Math.abs(a.lat - b.lat) + Math.abs(a.lng - b.lng) < 8) return false
      if (visninger.includes("folketall") && Math.max(a.befolkning, b.befolkning) / Math.min(a.befolkning, b.befolkning) < 1.3) return false
      if (visninger.includes("areal") && Math.max(a.areal, b.areal) / Math.min(a.areal, b.areal) < 1.3) return false
    }
  }
  return true
}

/** Photos and capitals come up most often. Phone codes and coordinates join from 31 Oct; earlier days stay as they were. */
const ANDRE: Visning[] = ["foto", "foto", "foto", "hovedstad", "hovedstad", "by", "valuta", "domene", "folketall", "areal", "sprak"]
const ANDRE_FRA_31_OKT: Visning[] = [...ANDRE, "telefon", "koordinater"]
const kjentNok = (l: Land) => l.befolkning >= 1_000_000

function byggLanddag(dato: string, forsok: number) {
  const fro = `tilkoblinger:land:${dato}:${forsok}`
  // At least one picture of the country itself (flag or outline), sometimes both.
  const antallBilder = stokk([1, 1, 2], `${fro}:antall`)[0]
  const bilder = stokk<Visning>(["flagg", "omriss"], `${fro}:bilde`).slice(0, antallBilder)
  const andre = dato >= "2026-10-31" ? ANDRE_FRA_31_OKT : ANDRE
  const visninger = [...bilder, ...new Set(stokk(andre, `${fro}:andre`))].slice(0, 4)
  const kandidater = stokk(
    land.filter((l) => kjentNok(l) && visninger.every((v) => kanVises(l, v))),
    `${fro}:land`,
  )
  const valgte: Land[] = []
  for (const l of kandidater) {
    if (forenlige([...valgte, l], visninger)) valgte.push(l)
    if (valgte.length === 4) break
  }
  if (valgte.length < 4) return null
  // Colours by how well known the country is, roughly: biggest economy first.
  const storrelse = (l: Land) => (l.bnp ?? 1000) * l.befolkning
  valgte.sort((a, b) => storrelse(b) - storrelse(a))
  return { valgte, visninger }
}

// ---------------------------------------------------------------------------------------------
// The day's puzzle
// ---------------------------------------------------------------------------------------------

export type Tilkoblingsoppgave = { slag: "land" | "kategori"; grupper: Gruppe[]; brikker: Brikke[]; ruter: Map<string, Rute> }

/** Every third day is a category day; the rest are land days. */
export const erKategoridag = (dato: string) => dagNummer(dato) % 3 === 1

const finn = (id: string) => land.find((l) => l.id === id)!

function brikkeFor(r: Rute, slag: "land" | "kategori", id: string): Brikke {
  const l = finn(r.land)
  if (slag === "kategori") return { id, slag: r.visning === "omriss" ? "omriss" : "flagg", tekst: l.navn }
  if (r.visning === "flagg" || r.visning === "omriss" || r.visning === "foto") return { id, slag: r.visning }
  return { id, slag: "tekst", tekst: tekstFor(l, r.visning)!, etikett: ETIKETT[r.visning] }
}

function kreditt(id: string): Kreditt | undefined {
  const a = severdigheter[id]
  return a ? { navn: a.navn, fotograf: a.fotograf, lisens: a.lisens, kilde: a.kilde } : undefined
}

function sett(dato: string, slag: "land" | "kategori", ruterIGrupper: Rute[][], meta: Omit<Gruppe, "ider">[]): Tilkoblingsoppgave {
  // Tile ids are handed out after shuffling, so they say nothing about the groups.
  const blandet = stokk(
    ruterIGrupper.flatMap((rs, g) => rs.map((r) => ({ r, g }))),
    `tilkoblinger:${dato}:rekke`,
  )
  const ruter = new Map<string, Rute>()
  const ider: string[][] = ruterIGrupper.map(() => [])
  const brikker = blandet.map(({ r, g }, i) => {
    const id = `b${i}`
    ruter.set(id, r)
    ider[g].push(id)
    return brikkeFor(r, slag, id)
  })
  return { slag, brikker, ruter, grupper: meta.map((m, g) => ({ ...m, ider: ider[g] })) }
}

function lagOppgave(dato: string): Tilkoblingsoppgave {
  if (!erKategoridag(dato)) {
    for (let forsok = 0; forsok < 200; forsok++) {
      const dag = byggLanddag(dato, forsok)
      if (!dag) continue
      const { valgte, visninger } = dag
      return sett(
        dato,
        "land",
        valgte.map((l) => visninger.map((visning) => ({ land: l.id, visning }))),
        valgte.map((l, i) => ({
          navn: l.navn,
          niva: (i + 1) as 1 | 2 | 3 | 4,
          detaljer: visninger
            .map((v) => (v === "foto" ? severdigheter[l.id].navn : v === "flagg" || v === "omriss" ? null : tekstFor(l, v)))
            .filter(Boolean)
            .join(" · "),
          kreditt: visninger.includes("foto") ? kreditt(l.id) : undefined,
        })),
      )
    }
  }
  for (let forsok = 0; forsok < 200; forsok++) {
    const grupper = bygg(dato, forsok)
    if (!grupper) continue
    // Outlines instead of flags on some category days, unless a category is about flags.
    const omriss =
      !grupper.some((g) => g.navn.includes("flagg")) &&
      stokk([true, false], `tilkoblinger:${dato}:omriss`)[0] &&
      grupper.every((g) => g.ider.every((id) => kanVises(finn(id), "omriss")))
    const visning: Visning = omriss ? "omriss" : "flagg"
    return sett(
      dato,
      "kategori",
      grupper.map((g) => g.ider.map((id) => ({ land: id, visning }))),
      grupper.map((g) => ({ navn: g.navn, niva: g.niva, detaljer: g.ider.map((id) => finn(id).navn).join(", ") })),
    )
  }
  throw new Error("Tilkoblinger: fant ingen gyldig oppgave")
}

const lager = new Map<string, Tilkoblingsoppgave>()

/** Today's puzzle: groups (easiest first), the 16 tiles in a shuffled order, and what each tile is. */
export function dagensTilkoblinger(dato: string): Tilkoblingsoppgave {
  const lagret = lager.get(dato)
  if (lagret) return lagret
  const oppgave = lagOppgave(dato)
  lager.set(dato, oppgave)
  if (lager.size > 16) lager.delete(lager.keys().next().value!)
  return oppgave
}

/** Where a tile's picture comes from: a flag code, an outline path or a photo URL. */
export function bildeFor(dato: string, brikke: string) {
  const r = dagensTilkoblinger(dato).ruter.get(brikke)
  if (!r) return null
  const l = finn(r.land)
  if (r.visning === "omriss") return { slag: "omriss" as const, form: formKart[l.id] }
  if (r.visning === "foto") return { slag: "foto" as const, url: severdigheter[l.id].bilde }
  return { slag: "flagg" as const, flagg: l.flagg }
}

/** Puzzle number, for the share text. */
export const tilkoblingerNr = (dato: string) => dagNummer(dato) + 1
