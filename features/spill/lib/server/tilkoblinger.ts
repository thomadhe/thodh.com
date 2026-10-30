import "server-only"

import { dagNummer, stokk } from "../dag"
import { land, type Land } from "../geografi"
import { egenskaper } from "../geografi-egenskaper"

// Tilkoblinger (our GeoConnections): 16 countries, four hidden groups of four. Every day a puzzle is
// built from the country facts: four categories from different families, and for each four
// well-known countries that belong to that category and to none of the other three.

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

export type Gruppe = { navn: string; niva: 1 | 2 | 3 | 4; ider: string[] }

function bygg(dato: string, forsok: number): Gruppe[] | null {
  const valgt: Kategori[] = []
  for (const k of stokk(kategorier, `tilkoblinger:${dato}:${forsok}`)) {
    if (valgt.some((v) => v.familie === k.familie)) continue
    valgt.push(k)
    if (valgt.length === 4) break
  }
  if (valgt.length < 4) return null
  const brukt = new Set<string>()
  const grupper: Gruppe[] = []
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

/** Today's four groups (easiest first) and the 16 countries in a shuffled order. */
export function dagensTilkoblinger(dato: string) {
  for (let forsok = 0; forsok < 200; forsok++) {
    const grupper = bygg(dato, forsok)
    if (grupper) return { grupper, rekke: stokk(grupper.flatMap((g) => g.ider), `tilkoblinger:${dato}:rekke`) }
  }
  throw new Error("Tilkoblinger: fant ingen gyldig oppgave")
}

/** Puzzle number, for the share text. */
export const tilkoblingerNr = (dato: string) => dagNummer(dato) + 1
