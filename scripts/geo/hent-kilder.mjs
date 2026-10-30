// Fetches the statistical sources for land.json and freezes them in scripts/geo/kilder.json,
// so that lag-geodata.mjs stays reproducible offline (the web sources change every year).
//
// Run (needs network): node scripts/geo/hent-kilder.mjs
// Downloads are cached in %TEMP%/geo-data/dl/ (delete the folder to refresh).
//
// Sources
//   - Population (befolkning): World Bank WDI SP.POP.TOTL, latest year (UN WPP / national statistics);
//     where the World Bank has no figure (Taiwan, Vatican City, most small territories) the latest
//     dated value on Wikidata (P1082, official estimates / censuses).
//   - Area (areal, km2): median of World Bank AG.SRF.TOTL.K2, Wikidata P2046 (every value) and mledoze/countries
//     (derived from Wikipedia). The World Bank series alone is not usable: for some countries (Croatia, Canada, ...)
//     it includes territorial waters. France is overridden to metropolitan France, matching the silhouette.
//   - GDP per capita (bnp, current US$): World Bank NY.GDP.PCAP.CD, latest year. Left out where the World Bank
//     has no figure (Taiwan, Vatican City, most territories, Eritrea, North Korea, South Sudan).
//   - Capital coordinates: Wikidata capital (P36) -> P625, matched against our capital name; GeoNames
//     (cities15000, CC BY 4.0) when Wikidata has none; HOVEDSTAD_POS in omrade-data.mjs by hand for the rest.
//   - Largest cities: GeoNames cities15000 (CC BY 4.0), top 4 by population per country (city proper), with
//     Norwegian names and corrected populations from Wikidata (see byer-wikidata.mjs).
//   - Control borders: mledoze/countries (land borders, from Natural Earth / Wikipedia) - only used by
//     sjekk-geodata.mjs to cross-check the computed neighbours.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { LAND_RADER } from "./land-data.mjs";
import { HOVEDSTAD_POS, OMRADE_RADER } from "./omrade-data.mjs";
import { byerMedWikidata, lesGeonames } from "./byer-wikidata.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DL = path.join(tmpdir(), "geo-data", "dl");
mkdirSync(DL, { recursive: true });
const log = (...a) => console.log(...a);
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9æø]/g, "");

const URL_ML = "https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json";
const URL_GEONAMES = "https://download.geonames.org/export/dump/cities15000.zip";
const wb = (kode, fra) => `https://api.worldbank.org/v2/country/all/indicator/${kode}?format=json&date=${fra}:2025&per_page=20000`;
const UA = "thodh-geo-data/1.0 (https://thodh.com)";

async function hent(url, fil, innhold = "text") {
  const sti = path.join(DL, fil);
  if (!existsSync(sti)) {
    log(`Downloading ${url}`);
    const svar = await fetch(url, { headers: { "User-Agent": UA } });
    if (!svar.ok) throw new Error(`${url}: ${svar.status}`);
    writeFileSync(sti, Buffer.from(await svar.arrayBuffer()));
  }
  return innhold === "json" ? JSON.parse(readFileSync(sti, "utf8")) : sti;
}

async function sparql(sporring) {
  const svar = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(sporring), { headers: { "User-Agent": UA } });
  if (!svar.ok) throw new Error(`Wikidata: ${svar.status}`);
  return (await svar.json()).results.bindings;
}

// ---- ids and names ----------------------------------------------------------------------------
const rader = [
  ...LAND_RADER.map(([id, , , , hovedstad, hovedstadEn, hovedstadSvar]) => ({ id, suveren: true, navn: [hovedstad, hovedstadEn, ...hovedstadSvar] })),
  ...OMRADE_RADER.map(([id, , , , hovedstad, hovedstadEn, hovedstadSvar]) => ({ id, suveren: false, navn: hovedstad ? [hovedstad, hovedstadEn, ...hovedstadSvar] : [] })),
];
const ids = rader.map((r) => r.id);

// ---- mledoze + World Bank ---------------------------------------------------------------------------
const ml = await hent(URL_ML, "mledoze.json", "json");
const a3 = new Map(ml.map((m) => [m.cca2, m.cca3]));
a3.set("XK", "XKX");
const til2 = new Map(ml.map((m) => [m.cca3, m.cca2]));
til2.set("XKX", "XK");

async function wbSerie(kode, fra, fil) {
  const [, rader2] = await hent(wb(kode, fra), fil, "json");
  const ut = new Map();
  for (const r of rader2) {
    if (r.value == null) continue;
    const nåværende = ut.get(r.countryiso3code);
    if (!nåværende || +r.date > nåværende.aar) ut.set(r.countryiso3code, { v: r.value, aar: +r.date });
  }
  return ut;
}
const wbPop = await wbSerie("SP.POP.TOTL", 2018, "wb-pop.json");
const wbAreal = await wbSerie("AG.SRF.TOTL.K2", 2015, "wb-area.json");
const wbBnp = await wbSerie("NY.GDP.PCAP.CD", 2018, "wb-gdp.json");

// ---- Wikidata: population/area for the gaps, capital coordinates --------------------------------------------
const utenPop = ids.filter((id) => !wbPop.get(a3.get(id)));
const wdPopRader = await sparql(`SELECT ?code ?pop ?popDato WHERE {
  VALUES ?code { ${utenPop.map((c) => `"${c}"`).join(" ")} }
  ?item wdt:P297 ?code .
  ?item p:P1082 ?ps . ?ps ps:P1082 ?pop . OPTIONAL { ?ps pq:P585 ?popDato }
}`);
const wdPop = new Map();
for (const b of wdPopRader) {
  const id = b.code.value;
  const aar = b.popDato ? Number(b.popDato.value.slice(0, 4)) : NaN;
  const nå = wdPop.get(id);
  if (!nå || (Number.isFinite(aar) && aar > (nå.aar ?? 0))) wdPop.set(id, { v: Math.round(+b.pop.value), aar: Number.isFinite(aar) && aar > 1900 ? aar : null });
}
const wdArealRader = await sparql(`SELECT ?code ?areal ?rangering WHERE {
  VALUES ?code { ${ids.map((c) => `"${c}"`).join(" ")} }
  ?item wdt:P297 ?code .
  ?item p:P2046 ?s . ?s psn:P2046/wikibase:quantityAmount ?areal ; wikibase:rank ?rangering .
  FILTER NOT EXISTS { ?s pq:P518 ?del }
  FILTER (?rangering != wikibase:DeprecatedRank)
}`);
const wdAreal = new Map();
for (const b of wdArealRader) (wdAreal.get(b.code.value) ?? wdAreal.set(b.code.value, []).get(b.code.value)).push(+b.areal.value / 1e6);
const AREAL_OVERSTYR = { FR: 551695 }; // metropolitan France
const median = (v) => v.slice().sort((a, b) => a - b)[Math.floor((v.length - 1) / 2)];

const wdKapital = await sparql(`SELECT ?code ?capLabel ?coord WHERE {
  VALUES ?code { ${ids.map((c) => `"${c}"`).join(" ")} }
  ?item wdt:P297 ?code .
  ?item p:P36 ?cs . ?cs ps:P36 ?cap . FILTER NOT EXISTS { ?cs pq:P582 ?slutt }
  ?cap wdt:P625 ?coord .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`);
const wdKap = new Map();
for (const b of wdKapital) {
  const m = b.coord.value.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
  if (!m) continue;
  (wdKap.get(b.code.value) ?? wdKap.set(b.code.value, []).get(b.code.value)).push({ navn: b.capLabel.value, pos: [+m[2], +m[1]] });
}

// ---- GeoNames -------------------------------------------------------------------------------------------
const zip = await hent(URL_GEONAMES, "cities15000.zip");
const txt = path.join(DL, "cities15000.txt");
if (!existsSync(txt)) {
  if (process.platform === "win32") execFileSync("powershell", ["-NoProfile", "-Command", `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${DL}' -Force`]);
  else execFileSync("unzip", ["-o", "-q", zip, "-d", DL]);
}
const byer = lesGeonames(txt);

// ---- assemble ------------------------------------------------------------------------------------------------
const runde = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
const land = {};
const advarsler = [];
for (const r of rader) {
  const id = r.id;
  const m = ml.find((x) => x.cca2 === id);
  const kode = a3.get(id);
  const rad = {};

  const pop = wbPop.get(kode);
  if (pop) rad.befolkning = { v: Math.round(pop.v), aar: pop.aar, kilde: "World Bank" };
  else if (wdPop.get(id)) rad.befolkning = { ...wdPop.get(id), kilde: "Wikidata" };
  else advarsler.push(`${id}: mangler befolkning`);

  const arealer = [wbAreal.get(kode)?.v, m?.area, ...(wdAreal.get(id) ?? [])].filter((v) => v != null && v >= 0.1).map((v) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10));
  if (AREAL_OVERSTYR[id]) rad.areal = { v: AREAL_OVERSTYR[id], kilde: "Wikipedia (metropolitan France)" };
  else if (arealer.length) rad.areal = { v: median(arealer), kilde: `median(${arealer.join(", ")})` };
  else advarsler.push(`${id}: mangler areal`);

  const bnp = wbBnp.get(kode);
  if (bnp) rad.bnp = { v: Math.round(bnp.v), aar: bnp.aar };

  // Capital: prefer the Wikidata capital whose name matches ours, otherwise the only one, otherwise GeoNames.
  if (HOVEDSTAD_POS[id]) rad.hovedstadPos = { pos: HOVEDSTAD_POS[id], kilde: "hand" };
  else if (r.navn.length) {
    const navnSett = new Set(r.navn.map(norm));
    const kandidater = wdKap.get(id) ?? [];
    const treff = kandidater.find((k) => navnSett.has(norm(k.navn))) ?? (kandidater.length === 1 ? kandidater[0] : null);
    if (treff) rad.hovedstadPos = { pos: [runde(treff.pos[0], 4), runde(treff.pos[1], 4)], kilde: `Wikidata (${treff.navn})` };
    else {
      const by = (byer.get(id) ?? []).find((b) => [b.navn, b.ascii, ...b.alt.split(",")].some((n) => navnSett.has(norm(n))));
      if (by) rad.hovedstadPos = { pos: [runde(by.lat, 4), runde(by.lng, 4)], kilde: `GeoNames (${by.navn})` };
      else advarsler.push(`${id}: ingen koordinater for hovedstaden (${r.navn[0]}); Wikidata ga ${kandidater.map((k) => k.navn).join("/") || "ingenting"}`);
    }
  }

  rad.kontrollNaboer = (m?.borders ?? []).map((b) => til2.get(b)).filter(Boolean).sort();
  land[id] = rad;
}
const { byer: byerUt, rettelser } = await byerMedWikidata(byer, rader.map((r) => r.id));
for (const r of rettelser) log("RETTET:", r);

const ut = {
  hentet: new Date().toISOString().slice(0, 10),
  kilder: {
    befolkning: "World Bank WDI SP.POP.TOTL (latest year); Wikidata P1082 where missing",
    areal: "median of World Bank AG.SRF.TOTL.K2, Wikidata P2046 and mledoze/countries",
    bnp: "World Bank WDI NY.GDP.PCAP.CD (current US$, latest year)",
    hovedstadPos: "Wikidata P36 -> P625; GeoNames cities15000 (CC BY 4.0); a few by hand",
    byer: "GeoNames cities15000 (CC BY 4.0); Norwegian names and corrected populations from Wikidata (CC0)",
    kontrollNaboer: "mledoze/countries (land borders)",
  },
  land,
  byer: byerUt,
};
writeFileSync(path.join(ROOT, "scripts/geo/kilder.json"), JSON.stringify(ut) + "\n");
log(`kilder.json written (${ids.length} entries)`);
for (const a of advarsler) log("ADVARSEL:", a);
