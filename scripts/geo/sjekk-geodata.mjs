// Validates the generated geography data and writes visual check pages to %TEMP%/geo-check/.
// Run after lag-geodata.mjs: node scripts/geo/sjekk-geodata.mjs

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA = path.join(ROOT, "features/spill/data/geografi");
const lese = (fil) => JSON.parse(readFileSync(path.join(DATA, fil), "utf8"));
const land = lese("land.json");
const kart = lese("kart.json");
const former = lese("former.json");

const feil = [];
const varsler = [];
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-zæø]/g, "");
const grov = (s) => norm(s).replace(/æ/g, "ae").replace(/ø/g, "o");

// ---- structure -------------------------------------------------------------------------------
if (land.length !== 197) feil.push(`land.json har ${land.length} oppføringer`);
const ider = new Set(land.map((l) => l.id));
if (ider.size !== land.length) feil.push("Duplikate id-er i land.json");
const sortert = land.every((l, i) => i === 0 || land[i - 1].navn.localeCompare(l.navn, "nb") <= 0);
if (!sortert) feil.push("land.json er ikke sortert på norsk navn");
const kontinenter = new Set(["Europa", "Asia", "Afrika", "Nord-Amerika", "Sør-Amerika", "Oseania"]);
for (const l of land) {
  if (!/^[A-Z]{2}$/.test(l.id)) feil.push(`${l.id}: ugyldig id`);
  if (!kontinenter.has(l.kontinent)) feil.push(`${l.id}: ukjent kontinent ${l.kontinent}`);
  if (!(l.lat >= -90 && l.lat <= 90 && l.lng >= -180 && l.lng <= 180)) feil.push(`${l.id}: ugyldig lat/lng`);
  for (const k of ["navn", "en", "hovedstad", "hovedstadEn"]) if (!l[k]) feil.push(`${l.id}: mangler ${k}`);
  if (!kart.land[l.id]) feil.push(`${l.id}: mangler kartsti`);
  if (!former[l.id]) feil.push(`${l.id}: mangler silhuett`);
}
for (const id of Object.keys(kart.land)) if (!ider.has(id)) feil.push(`kart.land har ukjent id ${id}`);
for (const id of Object.keys(former)) if (!ider.has(id)) feil.push(`former har ukjent id ${id}`);
for (const id of Object.keys(kart.punkter)) if (!ider.has(id)) feil.push(`punkter har ukjent id ${id}`);

// ---- collisions ------------------------------------------------------------------------------
function kollisjoner(navn, hent) {
  for (const [variant, tittel] of [[norm, "norm"], [grov, "grov"]]) {
    const kart = new Map();
    for (const l of land) {
      for (const svar of hent(l)) {
        const n = variant(svar);
        if (!n) feil.push(`${navn}: ${l.id} har svar uten bokstaver: "${svar}"`);
        const finnes = kart.get(n);
        if (finnes && finnes !== l.id) feil.push(`${navn} (${tittel}): "${svar}" (${l.id}) kolliderer med ${finnes}`);
        kart.set(n, l.id);
      }
    }
  }
}
kollisjoner("land", (l) => [l.navn, l.en, ...l.svar]);
kollisjoner("hovedstad", (l) => [l.hovedstad, l.hovedstadEn, ...l.hovedstadSvar]);
for (const bare of ["kongo", "congo"]) {
  for (const l of land) if ([l.navn, l.en, ...l.svar].some((s) => norm(s) === bare)) feil.push(`Tvetydig "${bare}" brukt av ${l.id}`);
}

// ---- path geometry -------------------------------------------------------------------------------
/** Parses the M/l/h/v/z subset the generator writes into rings of absolute points. */
function lesPath(d) {
  const ringer = [];
  for (const del of d.split("z")) {
    if (!del) continue;
    const m = del.match(/^M(-?[\d.]+) (-?[\d.]+)(.*)$/);
    if (!m) throw new Error(`Uventet path: ${del.slice(0, 40)}`);
    let x = parseFloat(m[1]);
    let y = parseFloat(m[2]);
    const ring = [[x, y]];
    const rest = m[3];
    if (rest.startsWith("l")) {
      const tall = rest.slice(1).match(/-?\d*\.?\d+/g).map(Number);
      if (tall.length % 2) throw new Error("Odde antall koordinater");
      for (let i = 0; i < tall.length; i += 2) {
        x += tall[i];
        y += tall[i + 1];
        ring.push([x, y]);
      }
    } else if (rest) {
      // Speck: h1v1h-1
      ring.push([x + 1, y], [x + 1, y + 1], [x, y + 1]);
    }
    ringer.push(ring);
  }
  return ringer;
}
const boks = (ring) => {
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};
const signert = (ring) => {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[(i + 1) % ring.length];
    s += x0 * y1 - x1 * y0;
  }
  return s / 2;
};

const eps = 0.15;
let storsteKartRing = { id: "", bredde: 0 };
for (const [id, d] of Object.entries(kart.land)) {
  const ringer = lesPath(d);
  let eksteriorAreal = 0;
  for (const ring of ringer) {
    const b = boks(ring);
    if (b.x0 < -eps || b.x1 > kart.bredde + eps || b.y0 < -eps || b.y1 > kart.hoyde + eps) feil.push(`${id}: ring utenfor kartet`);
    if (b.x1 - b.x0 > storsteKartRing.bredde) storsteKartRing = { id, bredde: b.x1 - b.x0 };
    if (b.x1 - b.x0 > 500 || b.y1 - b.y0 > 300) feil.push(`${id}: mistenkelig bred ring (${(b.x1 - b.x0).toFixed(0)}x${(b.y1 - b.y0).toFixed(0)}) - antimeridian?`);
    eksteriorAreal += Math.abs(signert(ring));
  }
  if (eksteriorAreal > 0.2 * kart.bredde * kart.hoyde) feil.push(`${id}: dekker over 20 % av kartet`);
}
for (const ring of lesPath(kart.bakgrunn)) {
  const b = boks(ring);
  if (b.x0 < -eps || b.x1 > kart.bredde + eps || b.y0 < -eps || b.y1 > kart.hoyde + eps) feil.push("bakgrunn: ring utenfor kartet");
  if (b.x1 - b.x0 > 500) feil.push(`bakgrunn: mistenkelig bred ring (${(b.x1 - b.x0).toFixed(0)})`);
}
for (const [id, [x, y]] of Object.entries(kart.punkter)) {
  if (x < 0 || x > kart.bredde || y < 0 || y > kart.hoyde) feil.push(`punkt ${id} utenfor kartet`);
}

const formStats = {};
for (const [id, d] of Object.entries(former)) {
  const ringer = lesPath(d);
  const alle = ringer.flat();
  const b = boks(alle);
  const w = b.x1 - b.x0;
  const h = b.y1 - b.y0;
  formStats[id] = { w, h };
  if (b.x0 < 7.9 || b.y0 < 7.9 || b.x1 > 192.1 || b.y1 > 192.1) feil.push(`${id}: silhuett utenfor 8 px-margin (${b.x0.toFixed(1)},${b.y0.toFixed(1)} - ${b.x1.toFixed(1)},${b.y1.toFixed(1)})`);
  if (Math.max(w, h) < 183 || Math.max(w, h) > 184.3) varsler.push(`${id}: største side ${Math.max(w, h).toFixed(1)} px`);
  if (Math.abs((b.x0 + b.x1) / 2 - 100) > 1 || Math.abs((b.y0 + b.y1) / 2 - 100) > 1) varsler.push(`${id}: ikke sentrert (${((b.x0 + b.x1) / 2).toFixed(1)}, ${((b.y0 + b.y1) / 2).toFixed(1)})`);
}

// ---- report ----------------------------------------------------------------------------------------
const kb = (fil) => (readFileSync(path.join(DATA, fil)).length / 1024).toFixed(1);
console.log(`land.json ${kb("land.json")} KB, kart.json ${kb("kart.json")} KB, former.json ${kb("former.json")} KB`);
console.log(`${land.length} land, ${Object.keys(kart.land).length} kartstier, ${Object.keys(kart.punkter).length} punkter, ${Object.keys(former).length} silhuetter`);
console.log(`Bredeste kartring: ${storsteKartRing.id} ${storsteKartRing.bredde.toFixed(1)} px`);
for (const v of varsler) console.log("varsel:", v);
for (const f of feil) console.log("FEIL:", f);

// ---- visual check pages ---------------------------------------------------------------------------------
const ut = path.join(tmpdir(), "geo-check");
mkdirSync(ut, { recursive: true });
const farge = (i) => `hsl(${(i * 47) % 360} 55% 62%)`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const kartSvg = `<svg viewBox="0 0 ${kart.bredde} ${kart.hoyde}" width="${kart.bredde}" height="${kart.hoyde}" style="background:#dbe9f4">
<path d="${kart.bakgrunn}" fill="#c9c9c9" stroke="#fff" stroke-width=".3"/>
${land.map((l, i) => `<path d="${kart.land[l.id]}" fill="${farge(i)}" stroke="#333" stroke-width=".3"><title>${esc(l.navn)}</title></path>`).join("\n")}
${Object.entries(kart.punkter).map(([id, [x, y]]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="none" stroke="#c00" stroke-width=".7"><title>${id}</title></circle>`).join("\n")}
</svg>`;
const tabell = land
  .map((l) => `<tr><td>${l.id}</td><td>${esc(l.navn)}</td><td>${esc(l.en)}</td><td>${esc(l.svar.join(", "))}</td><td>${esc(l.hovedstad)}</td><td>${esc(l.hovedstadSvar.join(", "))}</td><td>${l.kontinent}</td><td>${l.lat}, ${l.lng}</td><td>${kart.punkter[l.id] ? "punkt " + kart.punkter[l.id].join(",") : ""}</td></tr>`)
  .join("\n");
writeFileSync(
  path.join(ut, "kart.html"),
  `<!doctype html><meta charset="utf-8"><title>Kart</title><style>body{font:12px system-ui;margin:12px}td{padding:1px 6px;border-bottom:1px solid #eee}</style>
<h1>Kart (${land.length} land, ${Object.keys(kart.punkter).length} punkter)</h1>${kartSvg}
<h2>Alle ${land.length}</h2><table>${tabell}</table>`,
);

const tilfeldig = [...land].sort(() => Math.random() - 0.5).slice(0, 20);
const ekstra = ["VA", "MC", "SM", "LI", "TV", "MT", "SG", "KI", "FJ", "RU", "US", "FR", "ID", "CL", "NO", "CA", "MH", "FM", "MV", "SC", "KM", "MY", "NZ", "GQ", "ES", "PT", "IT", "NL", "CN", "IN", "JP", "GB"].map((id) => land.find((l) => l.id === id));
const celle = (l) =>
  `<figure><svg viewBox="0 0 200 200" width="200" height="200" style="background:#fff;border:1px solid #ccc"><path d="${former[l.id]}" fill="#222"/></svg><figcaption>${l.id} ${esc(l.navn)}</figcaption></figure>`;
writeFileSync(
  path.join(ut, "former.html"),
  `<!doctype html><meta charset="utf-8"><title>Former</title><style>body{font:12px system-ui;margin:12px}figure{display:inline-block;margin:6px}</style>
<h1>20 tilfeldige</h1>${tilfeldig.map(celle).join("")}<h1>Utsatte tilfeller</h1>${ekstra.map(celle).join("")}`,
);
console.log(`Sjekksider: ${path.join(ut, "kart.html")}, ${path.join(ut, "former.html")}`);
if (feil.length) process.exitCode = 1;
