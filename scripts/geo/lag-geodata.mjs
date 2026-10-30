// Rebuilds the geography game data in features/spill/data/geografi/:
//   land.json   - the 197 quiz countries (names, answers, capitals, continent, centre)
//   kart.json   - world map as precomputed SVG paths (Equal Earth, 1000 px wide)
//   former.json - Worldle-style silhouettes (azimuthal equal-area, 200x200 box, 1:10m detail)
//
// Run: node scripts/geo/lag-geodata.mjs
//
// Sources and licences
//   - Natural Earth 1:50m Admin 0 - Countries, via the `world-atlas` npm package
//     (countries-50m.json, ISC licence for the package; Natural Earth data is public domain).
//   - Silhouettes (former.json) use the full Natural Earth 1:10m Admin 0 - Countries
//     (ne_10m_admin_0_countries.geojson, v5.1.2, public domain) from the nvkelso/natural-earth-vector
//     mirror. The file is downloaded to %TEMP%/geo-10m/ on first run (or pass --ne10=<path>).
//     It is projected with at most a 0.05 px Douglas-Peucker pass, so fjords and archipelagos stay.
//   - Tuvalu is missing from the 50m data (only used for kart.json): scripts/geo/tuvalu.geojson is extracted from
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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoArea, geoAzimuthalEqualArea, geoCentroid, geoContains, geoDistance, geoEqualEarth, geoPath } from "d3-geo";
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
/** Silhouettes: Douglas-Peucker tolerance (px in the 200x200 box) on the 1:10m rings. */
const FORM_TOLERANSE_PX = 0.05;
/** Silhouettes: islands (and lakes/holes) smaller than this many px^2 are dust and dropped. */
const FORM_MIN_AREAL_PX2 = 0.3;
/** Countries made only of specks (Maldives, Tuvalu, ...) keep rings down to this size instead. */
const FORM_MIN_AREAL_SMAA_PX2 = 0.02;
/** ...and every ring is drawn at least this big (px^2), otherwise the country would be blank. */
const FORM_MIN_OY_PX2 = 8;
/** ...when their largest ring is smaller than this. */
const FORM_SMAA_LAND_PX2 = 40;
const NE10_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_countries.geojson";
/** 1:10m features (ADM0_A3) folded into a quiz country so it has no holes: Cyprus' sovereign bases and buffer zone, Baikonur, ... */
const NE10_SLAA_SAMMEN = {
  SO: ["SOL"], // Somaliland
  CY: ["CYN", "CNM", "ESB", "WSB"], // N. Cyprus, U.N. buffer zone, Dhekelia, Akrotiri
  CN: ["HKG", "MAC"],
  FI: ["ALD"],
  KZ: ["KAB"], // Baikonur cosmodrome, leased to Russia
};
/** 1:10m features that share a quiz country's ISO_A2_EH (offshore/leased pieces) but are not the country itself. */
const NE10_IKKE_LAND = ["BRI", "CLP", "IOA", "CSI", "ATC"];
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

/** Round to 1/`skala` px and remove consecutive duplicates; returns null if fewer than 3 points remain. */
function tilHeltall(ring, dx = 0, dy = 0, skala = 10) {
  const ut = [];
  for (const [x, y] of ring) {
    const p = [Math.round((x + dx) * skala), Math.round((y + dy) * skala)];
    const forrige = ut[ut.length - 1];
    if (!forrige || forrige[0] !== p[0] || forrige[1] !== p[1]) ut.push(p);
  }
  while (ut.length > 1 && ut[0][0] === ut[ut.length - 1][0] && ut[0][1] === ut[ut.length - 1][1]) ut.pop();
  return ut.length >= 3 ? ut : null;
}

/** Integer in 1/`skala` px (10 or 100) as the shortest SVG number: 15 -> "1.5", 5 -> ".5", 0 -> "0". */
function tall(heltall, skala = 10) {
  const neg = heltall < 0;
  const abs = Math.abs(heltall);
  const hel = Math.floor(abs / skala);
  const frac = abs % skala;
  const desimaler = String(skala).length - 1;
  const s = (hel === 0 ? "" : String(hel)) + (frac === 0 ? "" : `.${String(frac).padStart(desimaler, "0").replace(/0+$/, "")}`);
  return neg ? `-${s || "0"}` : s || "0";
}

/** Absolute start point, then relative line segments (cheap to store, valid SVG path data). */
function ringTilPath(punkter, skala = 10) {
  let d = `M${tall(punkter[0][0], skala)} ${tall(punkter[0][1], skala)}l`;
  let forrige = "";
  for (let i = 1; i < punkter.length; i++) {
    const dx = tall(punkter[i][0] - punkter[i - 1][0], skala);
    const dy = tall(punkter[i][1] - punkter[i - 1][1], skala);
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
    const t = tilHeltall(ring, 0, -minY);
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
  const t = tilHeltall(ring, 0, -minY);
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
function velgDeler(multi, grenseKm, maksProver = 48) {
  const info = multi.map((poly) => {
    const prover = prov(poly[0], maksProver);
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

/** Selection rules shared by the 50m centre points and the 1:10m silhouettes. */
function velgForm(id, multi, maksProver) {
  const kandidater = utenSor(multi).filter((poly) => !SKJAER[id]?.(polySentrum(poly)));
  return velgDeler(kandidater, AVSTAND_KM[id] ?? STANDARD_AVSTAND_KM, maksProver);
}

// Centre points in land.json come from the 1:50m selection, so they do not move with the silhouettes.
const sentrum = {};
for (const rad of rader) {
  const { beholdt } = velgForm(rad.id, rå.land.get(rad.id), 48);
  const [lng, lat] = geoCentroid({ type: "MultiPolygon", coordinates: beholdt });
  const [senterLat, senterLng] = SENTRUM[rad.id] ?? [lat, lng];
  sentrum[rad.id] = [avrund(senterLat), avrund(senterLng)];
}

// ---- 1:10m source ----------------------------------------------------------------------------------
async function lesNe10() {
  const arg = process.argv.find((a) => a.startsWith("--ne10="))?.slice("--ne10=".length);
  const fil = arg ?? path.join(tmpdir(), "geo-10m", "dl", "ne_10m_admin_0_countries.geojson");
  if (!existsSync(fil)) {
    log(`Downloading ${NE10_URL}`);
    const svar = await fetch(NE10_URL);
    if (!svar.ok) throw new Error(`Download failed: ${svar.status}`);
    mkdirSync(path.dirname(fil), { recursive: true });
    writeFileSync(fil, Buffer.from(await svar.arrayBuffer()));
  }
  return JSON.parse(readFileSync(fil, "utf8")).features;
}

/**
 * Edge-matched dissolve: directed edges that also occur reversed (shared borders, or the two halves of
 * a polygon cut at the antimeridian) are removed and the rest is chained into new rings. Natural Earth
 * neighbours share their border vertices exactly, so no geometry library is needed. Orientation is kept:
 * an exterior ring encloses less than a hemisphere, a hole more.
 */
function smeltSammen(multi) {
  const nokkel = ([x, y]) => `${x === -180 ? 180 : x},${y}`;
  const kanter = new Map();
  multi.forEach((poly, pi) => {
    for (const ring of poly) for (let i = 0; i + 1 < ring.length; i++) kanter.set(`${nokkel(ring[i])}>${nokkel(ring[i + 1])}`, pi);
  });
  const forelder = multi.map((_, i) => i);
  const rot = (i) => {
    while (forelder[i] !== i) i = forelder[i] = forelder[forelder[i]];
    return i;
  };
  const beroert = new Set();
  let parede = 0;
  for (const [k, pi] of kanter) {
    const [a, b] = k.split(">");
    const tvilling = kanter.get(`${b}>${a}`);
    if (tvilling === undefined) continue;
    parede++;
    beroert.add(pi);
    forelder[rot(pi)] = rot(tvilling);
  }
  if (!parede) return { multi, parede };

  const grupper = new Map();
  for (const pi of beroert) {
    const r = rot(pi);
    if (!grupper.has(r)) grupper.set(r, []);
    grupper.get(r).push(pi);
  }
  const ut = multi.filter((_, pi) => !beroert.has(pi));
  for (const medlemmer of grupper.values()) {
    const fraStart = new Map();
    const kanterUt = [];
    for (const pi of medlemmer) {
      for (const ring of multi[pi]) {
        for (let i = 0; i + 1 < ring.length; i++) {
          if (kanter.has(`${nokkel(ring[i + 1])}>${nokkel(ring[i])}`)) continue;
          const kant = { a: ring[i], b: ring[i + 1], brukt: false };
          kanterUt.push(kant);
          const k = nokkel(kant.a);
          if (!fraStart.has(k)) fraStart.set(k, []);
          fraStart.get(k).push(kant);
        }
      }
    }
    const eksteriorer = [];
    const hull = [];
    for (const start of kanterUt) {
      if (start.brukt) continue;
      const ring = [];
      let kant = start;
      while (kant) {
        kant.brukt = true;
        ring.push(kant.a);
        if (nokkel(kant.b) === nokkel(start.a)) break;
        kant = fraStart.get(nokkel(kant.b))?.find((k) => !k.brukt);
        if (!kant) throw new Error("Dissolve left an open ring");
      }
      ring.push(ring[0]);
      (geoArea({ type: "Polygon", coordinates: [ring] }) > 2 * Math.PI ? hull : eksteriorer).push(ring);
    }
    const polygoner = eksteriorer.map((e) => [e]);
    for (const h of hull) {
      const eier = polygoner.find((p) => h.slice(0, 8).some((punkt) => geoContains({ type: "Polygon", coordinates: [p[0]] }, punkt)));
      if (!eier) throw new Error("Dissolve produced a hole without an exterior");
      eier.push(h);
    }
    ut.push(...polygoner);
  }
  return { multi: ut, parede };
}

/** Map a quiz country to its 1:10m features (ISO_A2_EH is also used by leased/offshore pieces of France, Brazil, ...). */
const ne10Alle = await lesNe10();
const ne10PerA3 = new Map(ne10Alle.map((f) => [f.properties.ADM0_A3, f]));
const ne10Delmengder = new Set([...Object.values(NE10_SLAA_SAMMEN).flat(), ...NE10_IKKE_LAND]);
function ne10Land(id) {
  const hoved = ne10Alle.filter((f) => f.properties.ISO_A2_EH === id && !ne10Delmengder.has(f.properties.ADM0_A3));
  if (hoved.length !== 1) throw new Error(`Expected one 1:10m feature for ${id}, found ${hoved.length}`);
  const ekstra = (NE10_SLAA_SAMMEN[id] ?? []).map((a3) => {
    const f = ne10PerA3.get(a3);
    if (!f) throw new Error(`1:10m has no ${a3} (for ${id})`);
    return f;
  });
  return [hoved[0], ...ekstra].flatMap((f) => rettViklingsretning(toMulti(f.geometry)));
}

// ---- 1:10m silhouettes -----------------------------------------------------------------------------
/** Spherical area (steradians) of one ring, whether it is an exterior or a hole. */
function ringSr(ring) {
  const a = geoArea({ type: "Polygon", coordinates: [ring] });
  return a > 2 * Math.PI ? 4 * Math.PI - a : a;
}

/** Douglas-Peucker on a closed ring (no repeated end point); every dropped point is within `eps` of the result. */
function dp(punkter, eps) {
  const n = punkter.length;
  if (n <= 4) return punkter;
  const p = (i) => punkter[i % n];
  const avstand = (q, a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / len2));
    return Math.hypot(q[0] - (a[0] + t * dx), q[1] - (a[1] + t * dy));
  };
  let fjernest = 1;
  let maks = -1;
  for (let i = 1; i < n; i++) {
    const d = Math.hypot(punkter[i][0] - punkter[0][0], punkter[i][1] - punkter[0][1]);
    if (d > maks) {
      maks = d;
      fjernest = i;
    }
  }
  const behold = new Uint8Array(n + 1);
  behold[0] = behold[fjernest] = 1;
  const stabel = [[0, fjernest], [fjernest, n]];
  while (stabel.length) {
    const [fra, til] = stabel.pop();
    let storst = -1;
    let ved = -1;
    for (let i = fra + 1; i < til; i++) {
      const d = avstand(p(i), p(fra), p(til));
      if (d > storst) {
        storst = d;
        ved = i;
      }
    }
    if (storst > eps) {
      behold[ved] = 1;
      stabel.push([fra, ved], [ved, til]);
    }
  }
  return punkter.filter((_, i) => behold[i]);
}

const former = {};
const formerStats = {};
const droppet = {};
for (const rad of rader) {
  const { multi, parede } = smeltSammen(ne10Land(rad.id));
  const { beholdt, droppet: bort } = velgForm(rad.id, multi, 200);
  droppet[rad.id] = bort.map((b) => ({ areal: b.areal, c: b.c }));

  const [lng, lat] = geoCentroid({ type: "MultiPolygon", coordinates: beholdt });
  const proj = geoAzimuthalEqualArea().rotate([-lng, -lat]).precision(0.1);
  const passe = (polygoner) =>
    proj.fitExtent(
      [
        [FORM_MARG, FORM_MARG],
        [FORM_BOKS - FORM_MARG, FORM_BOKS - FORM_MARG],
      ],
      { type: "MultiPolygon", coordinates: polygoner },
    ).scale();

  // Pass 1: size every ring in px^2 and drop dust (islands and lakes), then refit to what is left.
  const k = passe(beholdt);
  const px2 = (ring) => ringSr(ring) * k * k;
  const storst = Math.max(...beholdt.map((poly) => px2(poly[0])));
  const minAreal = storst < FORM_SMAA_LAND_PX2 ? FORM_MIN_AREAL_SMAA_PX2 : FORM_MIN_AREAL_PX2;
  const renset = beholdt
    .filter((poly) => px2(poly[0]) >= minAreal)
    .map((poly) => [poly[0], ...poly.slice(1).filter((hull) => px2(hull) >= minAreal)]);
  passe(renset);

  const deler = [];
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let ringer = projiserRinger(proj, renset);
  if (minAreal === FORM_MIN_AREAL_SMAA_PX2) {
    // Atoll and island nations (Maldives, Marshall Islands, ...) are invisible at true size in 200 px:
    // grow every speck about its centre to a minimum size, then refit the lot to the padded box.
    ringer = ringer.map((ring) => {
      const b = ringBoks(ring);
      const [cx, cy] = [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
      const f = Math.max(1, Math.sqrt(FORM_MIN_OY_PX2 / Math.max(ringAreal(ring), 1e-6)));
      return f === 1 ? ring : ring.map(([x, y]) => [cx + (x - cx) * f, cy + (y - cy) * f]);
    });
    const b = ringBoks(ringer.flat());
    const f = (FORM_BOKS - 2 * FORM_MARG) / Math.max(b.x1 - b.x0, b.y1 - b.y0);
    const [cx, cy] = [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
    ringer = ringer.map((ring) => ring.map(([x, y]) => [FORM_BOKS / 2 + (x - cx) * f, FORM_BOKS / 2 + (y - cy) * f]));
  }
  for (const ring of ringer) {
    const eps = Math.min(FORM_TOLERANSE_PX, 0.15 * Math.sqrt(ringAreal(ring)));
    const t = tilHeltall(dp(ring, eps), 0, 0, 100);
    if (!t) continue;
    const boks = ringBoks(t);
    deler.push(ringTilPath(t, 100));
    x0 = Math.min(x0, boks.x0 / 100);
    y0 = Math.min(y0, boks.y0 / 100);
    x1 = Math.max(x1, boks.x1 / 100);
    y1 = Math.max(y1, boks.y1 / 100);
  }
  if (deler.length === 0) throw new Error(`Silhouette for ${rad.id} is empty`);
  former[rad.id] = deler.join("");
  formerStats[rad.id] = { x0, y0, x1, y1, deler: deler.length, droppetDeler: beholdt.length - renset.length, parede };
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
  log("\nSilhuetter (bytes, ringer, støvøyer droppet, sammensmeltede kanter):");
  for (const id of Object.keys(former).sort((a, b) => former[b].length - former[a].length)) {
    const st = formerStats[id];
    if (former[id].length > 40000 || st.parede || st.droppetDeler > 50) {
      log(`  ${id} ${former[id].length} B, ${st.deler} ringer, ${st.droppetDeler} droppet, ${st.parede} kanter`);
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
