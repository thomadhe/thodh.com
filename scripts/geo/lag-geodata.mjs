// Rebuilds the geography game data in features/spill/data/geografi/:
//   land.json   - the 197 quiz countries (names, answers, capitals, continent, centre)
//   kart.json   - world map as precomputed SVG paths (Equal Earth, 1000 px wide)
//   former.json - Worldle-style silhouettes (azimuthal equal-area, 200x200 box)
//
// Run: node scripts/geo/lag-geodata.mjs
//
// Sources and licences
//   - Natural Earth 1:50m Admin 0 - Countries, via the `world-atlas` npm package
//     (countries-50m.json, ISC licence for the package; Natural Earth data is public domain).
//   - Tuvalu is missing from the 50m data: scripts/geo/tuvalu.geojson is extracted from
//     Natural Earth 1:10m ne_10m_admin_0_countries (public domain, coordinates rounded to 4 decimals).
//   - Country names, answers and capitals are hand-written facts in scripts/geo/land-data.mjs
//     (Norwegian names follow Språkrådet's recommendations).
//   - Geometry is processed with d3-geo, topojson-client and topojson-simplify (all BSD/ISC).
//
// Territories that are not one of the 197 quiz countries only appear as `bakgrunn`
// (Greenland, Western Sahara, Puerto Rico, ...). Antarctica is left out entirely.
// Somaliland, Northern Cyprus, Hong Kong, Macao and Åland are folded into
// Somalia, Cyprus, China and Finland so those countries have no holes.

import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoArea, geoAzimuthalEqualArea, geoCentroid, geoDistance, geoEqualEarth, geoPath } from "d3-geo";
import { feature, merge } from "topojson-client";
import { presimplify, simplify, sphericalTriangleArea } from "topojson-simplify";
import { ATLAS_NAVN, KONTINENT, LAND_RADER, SLAA_SAMMEN } from "./land-data.mjs";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const UT = path.join(ROOT, "features/spill/data/geografi");

// ---- tuning ---------------------------------------------------------------------------
const KART_BREDDE = 1000;
/** Visvalingam weight (steradians) for the world map; ~0.02 px^2 at 1000 px width. */
const KART_MIN_VEKT = 5e-7;
/** Visvalingam weight (px^2 in the 200x200 box) for silhouettes. */
const FORM_MIN_VEKT = 0.04;
const FORM_BOKS = 200;
const FORM_MARG = 8;
/** Polygons south of this latitude (South Sandwich Is. etc.) are not drawn. */
const SOR_GRENSE = -57;
/** Silhouettes keep islands within this distance (km) of the already kept shape. */
const STANDARD_AVSTAND_KM = 500;
const AVSTAND_KM = {
  KI: 300, // Kiritimati and neighbours; the full chain is invisible at 200 px
  FM: 300,
  MH: 300,
  TV: 60,
  SC: 1200,
  MY: 900, // peninsula and Borneo
};
/** Polygons (by centroid [lng, lat]) that are not part of the recognisable shape. */
const SKJAER = {
  NO: ([, lat]) => lat > 71.5, // Svalbard, Bear Island and Jan Mayen
};
/** Hand-picked centres where the area centroid is a poor reference point. */
const SENTRUM = {
  KI: [1.9, 173.0],
};
const FORM_FJERN_FRA = new Set(["Antarctica"]);

// ---- helpers --------------------------------------------------------------------------
const RAD_KM = 6371;
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-zæø]/g, "");
/** Coarser folding used only to catch collisions that a keyboard-friendly matcher would create. */
const grov = (s) => norm(s).replace(/æ/g, "ae").replace(/ø/g, "o");
const avrund = (v) => Math.round(v * 10) / 10;
const log = (...args) => console.log(...args);

function toMulti(geometry) {
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  if (geometry.type === "Polygon") return [geometry.coordinates];
  throw new Error(`Unexpected geometry ${geometry.type}`);
}

/** d3 wants exterior rings clockwise; flip a polygon that covers more than a hemisphere. */
function rettViklingsretning(multi) {
  return multi.map((poly) => {
    if (geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI) {
      return poly.map((ring) => ring.slice().reverse());
    }
    return poly;
  });
}

function polySentrum(poly) {
  return geoCentroid({ type: "Polygon", coordinates: poly });
}

// ---- reading the sources -----------------------------------------------------------------
const topoKilde = JSON.parse(readFileSync(require.resolve("world-atlas/countries-50m.json"), "utf8"));
const tuvalu = JSON.parse(readFileSync(path.join(ROOT, "scripts/geo/tuvalu.geojson"), "utf8"));

const rader = LAND_RADER.map(([id, navn, en, svar, hovedstad, hovedstadEn, hovedstadSvar, kont]) => {
  if (!KONTINENT[kont]) throw new Error(`Unknown continent for ${id}`);
  return { id, navn, en, svar, hovedstad, hovedstadEn, hovedstadSvar, kontinent: KONTINENT[kont] };
});
if (rader.length !== 197) throw new Error(`Expected 197 countries, got ${rader.length}`);
if (new Set(rader.map((r) => r.id)).size !== 197) throw new Error("Duplicate ids");

/**
 * Per-id MultiPolygon coordinates (quiz countries) plus the background polygons, built from a
 * topology. Pass the raw topology for silhouettes and a simplified one for the world map.
 */
function bygg(topology) {
  const geometrier = topology.objects.countries.geometries;
  const perNavn = new Map(geometrier.map((g) => [g.properties.name, g]));
  const brukt = new Set();
  const land = new Map();

  for (const rad of rader) {
    if (rad.id === "TV") {
      land.set("TV", rettViklingsretning(toMulti(tuvalu.geometry)));
      continue;
    }
    const navn = ATLAS_NAVN[rad.id] ?? rad.en;
    const deler = [navn, ...(SLAA_SAMMEN[rad.id] ?? [])].map((n) => {
      const g = perNavn.get(n);
      if (!g) throw new Error(`world-atlas has no feature named "${n}" (for ${rad.id})`);
      brukt.add(n);
      return g;
    });
    const geometri = deler.length === 1 ? feature(topology, deler[0]).geometry : merge(topology, deler);
    land.set(rad.id, rettViklingsretning(toMulti(geometri)));
  }

  const bakgrunn = [];
  for (const g of geometrier) {
    const navn = g.properties.name;
    if (brukt.has(navn) || FORM_FJERN_FRA.has(navn)) continue;
    bakgrunn.push(...rettViklingsretning(toMulti(feature(topology, g).geometry)));
  }
  return { land, bakgrunn };
}

const rå = bygg(topoKilde);

const forenklet = simplify(presimplify(structuredClone(topoKilde), sphericalTriangleArea), KART_MIN_VEKT);
const kartKilde = bygg(forenklet);

// ---- path emission -------------------------------------------------------------------------
/** Collects projected rings from d3-geo's path stream (handles clipping at the antimeridian). */
function ringSamler() {
  const ringer = [];
  let gjeldende = null;
  return {
    ringer,
    moveTo(x, y) {
      gjeldende = [[x, y]];
      ringer.push(gjeldende);
    },
    lineTo(x, y) {
      gjeldende.push([x, y]);
    },
    closePath() {
      gjeldende = null;
    },
    arc() {},
  };
}

function projiserRinger(projeksjon, multi) {
  const samler = ringSamler();
  geoPath(projeksjon, samler)({ type: "MultiPolygon", coordinates: multi });
  return samler.ringer;
}

/** Remove consecutive duplicates after rounding to tenths; returns null if fewer than 3 points remain. */
function tilTideler(ring, dx = 0, dy = 0) {
  const ut = [];
  for (const [x, y] of ring) {
    const p = [Math.round((x + dx) * 10), Math.round((y + dy) * 10)];
    const forrige = ut[ut.length - 1];
    if (!forrige || forrige[0] !== p[0] || forrige[1] !== p[1]) ut.push(p);
  }
  while (ut.length > 1 && ut[0][0] === ut[ut.length - 1][0] && ut[0][1] === ut[ut.length - 1][1]) ut.pop();
  return ut.length >= 3 ? ut : null;
}

function tall(tideler) {
  const neg = tideler < 0;
  const abs = Math.abs(tideler);
  const hel = Math.floor(abs / 10);
  const frac = abs % 10;
  const s = (hel === 0 ? "" : String(hel)) + (frac === 0 ? "" : `.${frac}`);
  return neg ? `-${s || "0"}` : s || "0";
}

/** Absolute start point, then relative line segments (cheap to store, valid SVG path data). */
function ringTilPath(punkter) {
  let d = `M${tall(punkter[0][0])} ${tall(punkter[0][1])}l`;
  let forrige = "";
  for (let i = 1; i < punkter.length; i++) {
    const dx = tall(punkter[i][0] - punkter[i - 1][0]);
    const dy = tall(punkter[i][1] - punkter[i - 1][1]);
    // A leading minus doubles as separator; otherwise a space is needed after the previous digit.
    const a = dx.startsWith("-") || forrige === "" ? dx : ` ${dx}`;
    const b = dy.startsWith("-") ? dy : ` ${dy}`;
    d += a + b;
    forrige = "x";
  }
  return `${d}z`;
}

function ringBoks(punkter) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of punkter) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1 };
}

function ringAreal(punkter) {
  let sum = 0;
  for (let i = 0; i < punkter.length; i++) {
    const [x0, y0] = punkter[i];
    const [x1, y1] = punkter[(i + 1) % punkter.length];
    sum += x0 * y1 - x1 * y0;
  }
  return Math.abs(sum) / 2;
}

// ---- world map --------------------------------------------------------------------------------
const kartProj = geoEqualEarth().fitWidth(KART_BREDDE, { type: "Sphere" });

/** Drop polygons whose centroid lies far south (sub-Antarctic specks that would stretch the crop). */
const utenSor = (multi) => multi.filter((poly) => polySentrum(poly)[1] > SOR_GRENSE);

const kartRinger = new Map();
for (const [id, multi] of kartKilde.land) kartRinger.set(id, projiserRinger(kartProj, utenSor(multi)));
const bakgrunnRinger = projiserRinger(kartProj, utenSor(kartKilde.bakgrunn));

let minY = Infinity;
let maxY = -Infinity;
for (const ringer of [...kartRinger.values(), bakgrunnRinger]) {
  for (const ring of ringer) {
    for (const [, y] of ring) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const kartHoyde = Math.ceil(maxY - minY);

const kartLand = {};
const kartStats = {};
const brede = [];
for (const rad of rader) {
  const ringer = kartRinger.get(rad.id) ?? [];
  const deler = [];
  let areal = 0;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const ring of ringer) {
    const t = tilTideler(ring, 0, -minY);
    if (!t) continue;
    const boks = ringBoks(t);
    if (boks.x1 - boks.x0 > 6000) brede.push([rad.id, (boks.x1 - boks.x0) / 10]);
    deler.push(ringTilPath(t));
    areal += ringAreal(t) / 100;
    x0 = Math.min(x0, boks.x0 / 10);
    y0 = Math.min(y0, boks.y0 / 10);
    x1 = Math.max(x1, boks.x1 / 10);
    y1 = Math.max(y1, boks.y1 / 10);
  }
  if (deler.length === 0) {
    // Everything collapsed below the 0.1 px grid: draw a 1 px speck at the projected centre.
    const [cx, cy] = geoPath(kartProj).centroid({ type: "MultiPolygon", coordinates: kartKilde.land.get(rad.id) });
    const [sx, sy] = [Math.round(cx * 10), Math.round((cy - minY) * 10)];
    deler.push(`M${tall(sx)} ${tall(sy)}h1v1h-1z`);
    areal = 1;
    x0 = x1 = cx;
    y0 = y1 = cy - minY;
  }
  kartLand[rad.id] = deler.join("");
  kartStats[rad.id] = { areal, bredde: x1 - x0, hoyde: y1 - y0 };
}

const bakgrunnDeler = [];
for (const ring of bakgrunnRinger) {
  const t = tilTideler(ring, 0, -minY);
  if (t) bakgrunnDeler.push(ringTilPath(t));
}

// Centre points for countries that are too small to see or click on the map.
const PUNKT_AREAL_PX = 15;
const PUNKT_SIDE_PX = 6;
const punkter = {};
for (const rad of rader) {
  const s = kartStats[rad.id];
  if (s.areal < PUNKT_AREAL_PX || (s.bredde < PUNKT_SIDE_PX && s.hoyde < PUNKT_SIDE_PX)) {
    const [cx, cy] = geoPath(kartProj).centroid({ type: "MultiPolygon", coordinates: utenSor(kartKilde.land.get(rad.id)) });
    punkter[rad.id] = [avrund(cx), avrund(cy - minY)];
  }
}

// ---- silhouettes --------------------------------------------------------------------------------
function prov(ring, maks) {
  const steg = Math.max(1, Math.floor(ring.length / maks));
  const ut = [];
  for (let i = 0; i < ring.length; i += steg) ut.push(ring[i]);
  return ut;
}

/** Keep the largest polygon plus everything chained to it within `grenseKm`. */
function velgDeler(multi, grenseKm) {
  const info = multi.map((poly) => {
    const prover = prov(poly[0], 48);
    const c = polySentrum(poly);
    let r = 0;
    for (const p of prover) r = Math.max(r, geoDistance(c, p));
    return { poly, areal: geoArea({ type: "Polygon", coordinates: poly }), prover, c, r };
  });
  info.sort((a, b) => b.areal - a.areal);
  const med = [info[0]];
  let gjenstar = info.slice(1);
  const grense = grenseKm / RAD_KM;
  const naer = (a, b) => {
    if (geoDistance(a.c, b.c) - a.r - b.r > grense) return false;
    for (const p of a.prover) for (const q of b.prover) if (geoDistance(p, q) <= grense) return true;
    return false;
  };
  for (let fremgang = true; fremgang && gjenstar.length; ) {
    fremgang = false;
    const neste = [];
    for (const kandidat of gjenstar) {
      if (med.some((m) => naer(m, kandidat))) {
        med.push(kandidat);
        fremgang = true;
      } else {
        neste.push(kandidat);
      }
    }
    gjenstar = neste;
  }
  return { beholdt: med.map((m) => m.poly), droppet: gjenstar };
}

/** Run Visvalingam on projected rings with topojson-simplify (planar triangle area in px^2). */
function forenkleRinger(ringer, minVekt) {
  const topologi = {
    type: "Topology",
    objects: {},
    arcs: ringer.map((ring) => [...ring, ring[0]].map(([x, y]) => [x, y])),
  };
  const ut = simplify(presimplify(topologi), minVekt);
  return ut.arcs.map((arc) => arc.slice(0, -1));
}

const formerStats = {};
const former = {};
const sentrum = {};
const droppet = {};
for (const rad of rader) {
  const grense = AVSTAND_KM[rad.id] ?? STANDARD_AVSTAND_KM;
  const kandidater = utenSor(rå.land.get(rad.id)).filter((poly) => !SKJAER[rad.id]?.(polySentrum(poly)));
  const { beholdt, droppet: bort } = velgDeler(kandidater, grense);
  droppet[rad.id] = bort.map((b) => ({ areal: b.areal, c: b.c }));

  const [lng, lat] = geoCentroid({ type: "MultiPolygon", coordinates: beholdt });
  const [senterLat, senterLng] = SENTRUM[rad.id] ?? [lat, lng];
  sentrum[rad.id] = [avrund(senterLat), avrund(senterLng)];

  const proj = geoAzimuthalEqualArea().rotate([-lng, -lat]).precision(0.1);
  proj.fitExtent(
    [
      [FORM_MARG, FORM_MARG],
      [FORM_BOKS - FORM_MARG, FORM_BOKS - FORM_MARG],
    ],
    { type: "MultiPolygon", coordinates: beholdt },
  );
  const ringer = forenkleRinger(projiserRinger(proj, beholdt), FORM_MIN_VEKT);

  const deler = [];
  const kunSmaa = !ringer.some((ring) => {
    const t = tilTideler(ring);
    if (!t) return false;
    const b = ringBoks(t);
    return b.x1 - b.x0 >= 30 || b.y1 - b.y0 >= 30;
  });
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const ring of ringer) {
    const t = tilTideler(ring);
    if (!t) continue;
    const boks = ringBoks(t);
    // Specks below 0.5 px add bytes but are invisible at 200 px (unless the whole country is specks).
    if (!kunSmaa && boks.x1 - boks.x0 < 5 && boks.y1 - boks.y0 < 5) continue;
    deler.push(ringTilPath(t));
    x0 = Math.min(x0, boks.x0 / 10);
    y0 = Math.min(y0, boks.y0 / 10);
    x1 = Math.max(x1, boks.x1 / 10);
    y1 = Math.max(y1, boks.y1 / 10);
  }
  if (deler.length === 0) throw new Error(`Silhouette for ${rad.id} is empty`);
  former[rad.id] = deler.join("");
  formerStats[rad.id] = { x0, y0, x1, y1, deler: deler.length };
}

// ---- land.json ---------------------------------------------------------------------------------
const unik = (liste, ...utelatt) => {
  const sett = new Set(utelatt.map(norm));
  const ut = [];
  for (const v of liste) {
    const n = norm(v);
    if (!n || sett.has(n)) continue;
    sett.add(n);
    ut.push(v);
  }
  return ut;
};

const landListe = rader
  .map((r) => ({
    id: r.id,
    navn: r.navn,
    en: r.en,
    svar: unik(r.svar, r.navn, r.en),
    hovedstad: r.hovedstad,
    hovedstadEn: r.hovedstadEn,
    hovedstadSvar: unik([r.hovedstadEn, ...r.hovedstadSvar], r.hovedstad),
    kontinent: r.kontinent,
    lat: sentrum[r.id][0],
    lng: sentrum[r.id][1],
  }))
  .sort((a, b) => a.navn.localeCompare(b.navn, "nb"));

// ---- collisions ----------------------------------------------------------------------------------
function sjekkKollisjoner(navn, hent) {
  let feil = 0;
  for (const variant of [norm, grov]) {
    const tilLand = new Map();
    for (const l of landListe) {
      for (const svar of hent(l)) {
        const n = variant(svar);
        const finnes = tilLand.get(n);
        if (finnes && finnes !== l.id) {
          feil++;
          log(`KOLLISJON (${navn}, ${variant === norm ? "norm" : "grov"}): "${svar}" (${l.id}) = ${finnes}`);
        }
        tilLand.set(n, l.id);
      }
    }
  }
  return feil;
}
const feil =
  sjekkKollisjoner("land", (l) => [l.navn, l.en, ...l.svar]) +
  sjekkKollisjoner("hovedstad", (l) => [l.hovedstad, l.hovedstadEn, ...l.hovedstadSvar]);

// ---- writing -------------------------------------------------------------------------------------
mkdirSync(UT, { recursive: true });
const skriv = (fil, data, innrykk) => {
  const tekst = JSON.stringify(data, null, innrykk) + "\n";
  writeFileSync(path.join(UT, fil), tekst);
  log(`${fil}: ${(Buffer.byteLength(tekst) / 1024).toFixed(1)} KB`);
};

skriv("land.json", landListe, 2);
skriv(
  "kart.json",
  { bredde: KART_BREDDE, hoyde: kartHoyde, land: kartLand, bakgrunn: bakgrunnDeler.join(""), punkter },
);
skriv("former.json", former);

// ---- report ---------------------------------------------------------------------------------------
log(`\nKart: ${KART_BREDDE} x ${kartHoyde}`);
log(`Punkter (${Object.keys(punkter).length}): ${Object.keys(punkter).sort().join(" ")}`);
if (brede.length) log("Brede ringer i kartet (mulig antimeridian-feil):", brede.map(([id, w]) => `${id}:${w}`).join(" "));
if (process.argv.includes("--detaljer")) {
  log("\nDroppet fra silhuetter:");
  for (const rad of rader) {
    const d = droppet[rad.id];
    if (d.length) {
      const stor = d.reduce((m, x) => Math.max(m, x.areal), 0);
      log(`  ${rad.id}: ${d.length} deler, største ${(stor * RAD_KM * RAD_KM).toFixed(0)} km2`);
    }
  }
  log("\nKart-areal (px2) / bredde x høyde:");
  for (const id of Object.keys(kartStats).sort((a, b) => kartStats[a].areal - kartStats[b].areal).slice(0, 70)) {
    const s = kartStats[id];
    log(`  ${id} ${s.areal.toFixed(1)} ${s.bredde.toFixed(1)}x${s.hoyde.toFixed(1)}${punkter[id] ? " *" : ""}`);
  }
}
if (feil) {
  console.error(`\n${feil} kollisjoner - rett opp land-data.mjs`);
  process.exitCode = 1;
}
