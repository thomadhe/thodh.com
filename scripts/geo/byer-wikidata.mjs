// The biggest cities per country from GeoNames cities15000 (CC BY 4.0), checked against Wikidata (CC0):
//   - Name: the Norwegian (Bokmål) label where Wikidata has one (Antwerp -> Antwerpen, Gothenburg -> Göteborg),
//     otherwise the GeoNames name.
//   - Population: GeoNames sometimes gives a city the figure for its whole province or county (Takeo,
//     Kakamega, Borama). Where even the largest figure Wikidata has for the same place (matched by GeoNames id,
//     P1566) is less than half, that figure is used. (The largest, not the latest: some items also carry
//     figures for a district or an old census.)
//
// Used by hent-kilder.mjs. Run on its own to refresh only the `byer` part of kilder.json from the cached
// GeoNames file (needs network for Wikidata): node scripts/geo/byer-wikidata.mjs

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const UA = "thodh-geo-data/1.0 (https://thodh.com)";
const KANDIDATER = 10;
const runde = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
const sov = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]/g, "");

// GeoNames population is the province's and Wikidata has nothing to correct it with (GeoNames id -> figure).
const FOLKETALL = { 1821940: 39186 }; // Takeo, Cambodia (2019 census, town)
// Norwegian names Wikidata doesn't give us through the GeoNames link (GeoNames name -> name).
const NAVN = { Naples: "Napoli", Turin: "Torino", "Homyel'": "Homel", Chattogram: "Chittagong", Andijon: "Andizjan" };

/** GeoNames cities15000.txt -> Map(country -> cities sorted by population), with the GeoNames id. */
export function lesGeonames(fil) {
  const byer = new Map();
  for (const linje of readFileSync(fil, "utf8").split("\n")) {
    const k = linje.split("\t");
    if (k.length < 15 || k[6] !== "P" || k[7] === "PPLX") continue;
    const by = { gid: k[0], navn: k[1], ascii: k[2], alt: k[3], lat: +k[4], lng: +k[5], land: k[8], folketall: +k[14] };
    (byer.get(by.land) ?? byer.set(by.land, []).get(by.land)).push(by);
  }
  for (const liste of byer.values()) liste.sort((a, b) => b.folketall - a.folketall);
  return byer;
}

async function sparql(sporring) {
  for (let forsok = 0; forsok < 5; forsok++) {
    const svar = await fetch("https://query.wikidata.org/sparql", {
      method: "POST",
      headers: { "User-Agent": UA, Accept: "application/sparql-results+json", "Content-Type": "application/x-www-form-urlencoded" },
      body: `query=${encodeURIComponent(sporring)}`,
    });
    if (svar.ok) return (await svar.json()).results.bindings;
    await sov(3000 * (forsok + 1));
  }
  throw new Error("Wikidata svarer ikke");
}

/** GeoNames id -> the Wikidata items carrying it: { nb, en, folketall } each (largest stated population). */
async function wikidata(gider) {
  const ut = new Map();
  for (let i = 0; i < gider.length; i += 300) {
    const verdier = gider.slice(i, i + 300).map((g) => `"${g}"`).join(" ");
    const rader = await sparql(`SELECT ?gid ?item ?nb ?en ?pop WHERE {
      VALUES ?gid { ${verdier} }
      ?item wdt:P1566 ?gid .
      OPTIONAL { ?item rdfs:label ?nb FILTER(lang(?nb) = "nb") }
      OPTIONAL { ?item rdfs:label ?en FILTER(lang(?en) = "en") }
      OPTIONAL { ?item p:P1082/ps:P1082 ?pop }
    }`);
    for (const r of rader) {
      const elementer = ut.get(r.gid.value) ?? ut.set(r.gid.value, new Map()).get(r.gid.value);
      const f = elementer.get(r.item.value) ?? { nb: null, en: null, folketall: null };
      if (r.nb) f.nb = r.nb.value.replace(/\s*\(.*\)$/, "");
      if (r.en) f.en = r.en.value.replace(/\s*\(.*\)$/, "");
      if (r.pop) f.folketall = Math.max(f.folketall ?? 0, Math.round(+r.pop.value));
      elementer.set(r.item.value, f);
    }
  }
  return ut;
}

/** The top 4 per country, Norwegian names and corrected populations. Returns { byer, rettelser }. */
export async function byerMedWikidata(byerPerLand, ider) {
  const kandidater = new Map(ider.map((id) => [id, (byerPerLand.get(id) ?? []).slice(0, KANDIDATER)]));
  const wd = await wikidata([...new Set([...kandidater.values()].flat().map((b) => b.gid))]);
  const byer = {};
  const rettelser = [];
  for (const [id, liste] of kandidater) {
    const rettet = liste.map((b) => {
      // Some GeoNames ids sit on the wrong Wikidata item (Graz on its old town, Espoo on its centre, Oslo on
      // historic Christiania): only trust an item whose English name is the city's GeoNames name.
      const w = [...(wd.get(b.gid)?.values() ?? [])].find((e) => e.en && [b.navn, b.ascii].some((n) => norm(n) === norm(e.en))) ?? null;
      let folketall = FOLKETALL[b.gid] ?? b.folketall;
      // Lower only to a plausible figure: a stray tiny value (Zliten: 200) is a data error of its own.
      if (w?.folketall && folketall > 2 * w.folketall && w.folketall >= Math.max(1000, folketall * 0.02)) {
        rettelser.push(`${id} ${b.navn}: ${folketall} -> ${w.folketall} (Wikidata)`);
        folketall = w.folketall;
      }
      return { navn: NAVN[b.navn] ?? (w?.nb || b.navn), folketall, lat: runde(b.lat, 3), lng: runde(b.lng, 3) };
    });
    byer[id] = rettet.sort((a, b) => b.folketall - a.folketall).slice(0, 4);
  }
  return { byer, rettelser };
}

// Run on its own: refresh `byer` in kilder.json from the cached GeoNames download.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fil = path.join(tmpdir(), "geo-data", "dl", "cities15000.txt");
  if (!existsSync(fil)) throw new Error(`Mangler ${fil}; kjør hent-kilder.mjs først`);
  const kilderFil = path.join(path.dirname(fileURLToPath(import.meta.url)), "kilder.json");
  const kilder = JSON.parse(readFileSync(kilderFil, "utf8"));
  const { byer, rettelser } = await byerMedWikidata(lesGeonames(fil), Object.keys(kilder.byer));
  kilder.byer = byer;
  kilder.kilder.byer = "GeoNames cities15000 (CC BY 4.0); Norwegian names and corrected populations from Wikidata (CC0)";
  writeFileSync(kilderFil, JSON.stringify(kilder) + "\n");
  console.log(`byer oppdatert for ${Object.keys(byer).length} områder`);
  for (const r of rettelser) console.log("RETTET:", r);
}
