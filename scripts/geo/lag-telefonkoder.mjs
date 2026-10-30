#!/usr/bin/env node
// Henter landskoder for telefon (Wikidata P474, CC0) for de 197 statene og skriver
// features/spill/data/geografi/telefon.json: { "NO": "+47", "JM": "+1 876", … }.
//
// Bruk: node scripts/geo/lag-telefonkoder.mjs

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const UT = path.join(ROOT, "features/spill/data/geografi/telefon.json")
const UA = "thodh.com-spill/1.0 (thodhel@gmail.com)"

// Where Wikidata lists several codes (or a stray one), the one people actually dial.
const VALGT = { DO: "+1809", TR: "+90", VA: "+39" }

const sporring = "SELECT ?iso ?kode WHERE { ?land wdt:P297 ?iso; wdt:P474 ?kode. }"
const svar = await fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(sporring)}`, {
  headers: { "User-Agent": UA, Accept: "application/sparql-results+json" },
})
if (!svar.ok) throw new Error(`Wikidata svarte ${svar.status}`)
const koder = new Map()
for (const b of (await svar.json()).results.bindings) {
  const liste = koder.get(b.iso.value) ?? []
  liste.push(b.kode.value.replace(/[^+\d]/g, ""))
  koder.set(b.iso.value, liste)
}

const land = JSON.parse(fs.readFileSync(path.join(ROOT, "features/spill/data/geografi/land.json"), "utf8")).filter((l) => l.suveren)
const ut = {}
const mangler = []
for (const l of land) {
  const kode = VALGT[l.id] ?? koder.get(l.id)?.sort((a, b) => a.length - b.length || a.localeCompare(b))[0]
  if (!kode) {
    mangler.push(l.id)
    continue
  }
  // North American numbers: +1 plus the area code, written apart.
  ut[l.id] = /^\+1\d{3}$/.test(kode) ? `+1 ${kode.slice(2)}` : kode
}
fs.writeFileSync(UT, JSON.stringify(ut, null, 1) + "\n")
console.log(`${Object.keys(ut).length} koder${mangler.length ? `, mangler: ${mangler.join(", ")}` : ""}`)
