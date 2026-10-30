#!/usr/bin/env node
// Henter filmplakaten til hver Emovi-film fra engelsk Wikipedia (ikke-frie plakater, hotlink, som
// filmkortene i «Mer eller mindre») og skriver features/spill/data/emovi/plakater.json:
// { "<film-id>": { src, kilde } }. Filmer uten sikkert treff utelates; spillet viser da ingen plakat.
//
// Bruk: node scripts/spill/hent-plakater.mjs

import { build } from "esbuild"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const UT = path.join(ROOT, "features/spill/data/emovi/plakater.json")
const UA = "thodh.com-spill/1.0 (thodhel@gmail.com)"
const sov = (ms) => new Promise((r) => setTimeout(r, ms))

async function lastFilmer() {
  const fil = path.join(os.tmpdir(), "emovi-filmer.mjs")
  await build({ entryPoints: [path.join(ROOT, "features/spill/data/emovi/filmer.ts")], outfile: fil, bundle: true, format: "esm", platform: "node", logLevel: "silent" })
  return (await import(pathToFileURL(fil).href + `?t=${Date.now()}`)).emoviFilmer
}

async function hent(params) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&${params}`
  for (let forsok = 0; forsok < 6; forsok++) {
    await sov(80)
    const svar = await fetch(url, { headers: { "User-Agent": UA } }).catch(() => null)
    if (svar?.ok) return svar.json()
    await sov(2000 * (forsok + 1))
  }
  throw new Error(`ga opp: ${url}`)
}

const FELT = "prop=pageimages|description|pageprops&piprop=thumbnail|name&pithumbsize=400&pilicense=any&redirects=1"

/**
 * A film page from the right year (±1 for festival vs. release), not a disambiguation page. The year
 * may be in the page title ("Dune (2021 film)") or in the short description ("2006 mockumentary …").
 */
function erFilm(side, aar) {
  if (!side || side.missing || !side.thumbnail?.source || (side.pageprops && "disambiguation" in side.pageprops)) return false
  const d = side.description ?? ""
  const aarstall = [aar - 1, aar, aar + 1].map(String)
  if (aarstall.some((a) => side.title.includes(`(${a} `))) return true
  return /film|movie|animated|mockumentary|comedy|drama|thriller|horror|musical/i.test(d) && aarstall.some((a) => d.includes(a))
}

const kilde = (side) => `https://en.wikipedia.org/wiki/File:${encodeURIComponent(side.pageimage).replace(/%2C/g, ",")}`

async function slaOpp(film) {
  const en = film.originaltittel ?? film.tittel
  const kandidater = [`${en} (${film.aar} film)`, `${en} (film)`, en, `${en} (${film.aar} American film)`]
  const data = await hent(`${FELT}&titles=${encodeURIComponent(kandidater.join("|"))}`)
  const omdirigert = new Map([...(data.query?.normalized ?? []), ...(data.query?.redirects ?? [])].map((r) => [r.from, r.to]))
  const sider = new Map((data.query?.pages ?? []).map((p) => [p.title, p]))
  for (const k of kandidater) {
    let t = k
    for (let i = 0; i < 4 && omdirigert.has(t); i++) t = omdirigert.get(t)
    const side = sider.get(t)
    if (erFilm(side, film.aar)) return side
  }
  // Reserve: søk.
  const sok = await hent(`${FELT.replace("&redirects=1", "")}&generator=search&gsrnamespace=0&gsrlimit=5&gsrsearch=${encodeURIComponent(`${en} ${film.aar} film`)}`)
  const treff = (sok.query?.pages ?? []).sort((a, b) => a.index - b.index)
  return treff.find((s) => erFilm(s, film.aar)) ?? null
}

const filmer = await lastFilmer()
const ut = {}
const mangler = []
for (const film of filmer) {
  const side = await slaOpp(film)
  if (side) ut[film.id] = { src: side.thumbnail.source.replace(/\?.*$/, ""), kilde: kilde(side), side: side.title }
  else mangler.push(film.id)
}
fs.writeFileSync(UT, JSON.stringify(Object.fromEntries(Object.entries(ut).map(([id, { src, kilde }]) => [id, { src, kilde }])), null, 1) + "\n")
fs.writeFileSync(path.join(os.tmpdir(), "emovi-plakater-rapport.tsv"), Object.entries(ut).map(([id, p]) => `${id}\t${p.side}\t${p.kilde}`).join("\n"))
console.log(`${Object.keys(ut).length} plakater, ${mangler.length} mangler: ${mangler.join(", ")}`)
