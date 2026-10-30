// Validates the generated geography data (197 quiz countries + 51 territories) and writes visual check
// pages to %TEMP%/geo-check/. Run after lag-geodata.mjs: node scripts/geo/sjekk-geodata.mjs

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA = path.join(ROOT, "features/spill/data/geografi");
const lese = (fil) => JSON.parse(readFileSync(path.join(DATA, fil), "utf8"));
const alle = lese("land.json");
const kart = lese("kart.json");
const former = lese("former.json");
const byer = lese("byer.json");
const kilder = JSON.parse(readFileSync(path.join(ROOT, "scripts/geo/kilder.json"), "utf8"));
/** The 197 quiz countries; everything the map quizzes use. */
const land = alle.filter((l) => l.suveren);
const omrader = alle.filter((l) => !l.suveren);

const feil = [];
const varsler = [];
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-zæø]/g, "");
const grov = (s) => norm(s).replace(/æ/g, "ae").replace(/ø/g, "o");

// ---- structure -------------------------------------------------------------------------------
if (land.length !== 197) feil.push(`land.json har ${land.length} suverene land (forventet 197)`);
if (omrader.length !== 51) feil.push(`land.json har ${omrader.length} territorier (forventet 51)`);
if (!alle.slice(0, 197).every((l) => l.suveren) || !alle.slice(197).every((l) => !l.suveren)) feil.push("land.json: de 197 suverene landene må komme først, så territoriene");
const alleIder = new Set(alle.map((l) => l.id));
const ider = new Set(land.map((l) => l.id));
if (alleIder.size !== alle.length) feil.push("Duplikate id-er i land.json");
for (const gruppe of [land, omrader]) {
  const sortert = gruppe.every((l, i) => i === 0 || gruppe[i - 1].navn.localeCompare(l.navn, "nb") <= 0);
  if (!sortert) feil.push("land.json er ikke sortert på norsk navn innen gruppen");
}
const kontinenter = new Set(["Europa", "Asia", "Afrika", "Nord-Amerika", "Sør-Amerika", "Oseania"]);
const erTall = (v) => typeof v === "number" && Number.isFinite(v);
for (const l of alle) {
  if (!/^[A-Z]{2}$/.test(l.id)) feil.push(`${l.id}: ugyldig id`);
  if (!kontinenter.has(l.kontinent)) feil.push(`${l.id}: ukjent kontinent ${l.kontinent}`);
  if (!(l.lat >= -90 && l.lat <= 90 && l.lng >= -180 && l.lng <= 180)) feil.push(`${l.id}: ugyldig lat/lng`);
  for (const k of ["navn", "en"]) if (!l[k]) feil.push(`${l.id}: mangler ${k}`);
  // Only places without a capital (uninhabited, Tokelau, ...) may leave it empty, and those are `liten`.
  if (!l.hovedstad || !l.hovedstadEn) {
    if (l.suveren || !l.liten) feil.push(`${l.id}: mangler hovedstad (tillatt bare for liten: true)`);
    if (l.hovedstadPos) feil.push(`${l.id}: hovedstadPos uten hovedstad`);
  } else if (!l.hovedstadPos) feil.push(`${l.id}: mangler hovedstadPos`);
  if (!former[l.id]) feil.push(`${l.id}: mangler silhuett`);
  if (l.suveren && !kart.land[l.id]) feil.push(`${l.id}: mangler kartsti`);
  if (!l.suveren && kart.land[l.id]) feil.push(`${l.id}: territorier skal ikke ha kartsti (bare bakgrunn)`);

  // extra fields
  if (typeof l.suveren !== "boolean") feil.push(`${l.id}: suveren mangler`);
  if (l.flagg !== l.id.toLowerCase()) feil.push(`${l.id}: flagg ${l.flagg} er ikke id-en med små bokstaver`);
  if (l.suveren && (l.tilhorer || l.liten)) feil.push(`${l.id}: suverene land skal ikke ha tilhorer/liten`);
  if (!l.suveren && (l.tilhorer ? !ider.has(l.tilhorer) : l.id !== "EH")) feil.push(`${l.id}: ukjent eller manglende tilhorer (${l.tilhorer})`);
  if (l.liten !== undefined && l.liten !== true) feil.push(`${l.id}: liten er bare true eller utelatt`);
  if (!Number.isInteger(l.befolkning) || l.befolkning < 0) feil.push(`${l.id}: ugyldig befolkning ${l.befolkning}`);
  if (l.befolkningAar !== undefined && !(l.befolkningAar >= 2000 && l.befolkningAar <= 2030)) feil.push(`${l.id}: ugyldig befolkningAar`);
  if (!erTall(l.areal) || l.areal <= 0) feil.push(`${l.id}: ugyldig areal ${l.areal}`);
  if (l.valuta === null) {
    if (l.suveren) feil.push(`${l.id}: suverene land må ha valuta`);
  } else if (!l.valuta?.navn || !/^[A-Z]{3}$/.test(l.valuta?.kode ?? "")) feil.push(`${l.id}: ugyldig valuta`);
  if (!Array.isArray(l.sprak) || (l.suveren && l.sprak.length === 0) || l.sprak.length > 3) feil.push(`${l.id}: ugyldig sprak`);
  if (l.hovedstadPos && !(Array.isArray(l.hovedstadPos) && l.hovedstadPos[0] >= -90 && l.hovedstadPos[0] <= 90 && l.hovedstadPos[1] >= -180 && l.hovedstadPos[1] <= 180)) feil.push(`${l.id}: ugyldig hovedstadPos`);
  if (l.bnp !== undefined && (!erTall(l.bnp) || l.bnp <= 0 || !l.bnpAar)) feil.push(`${l.id}: ugyldig bnp`);
  if (l.suveren && l.befolkning < 100) feil.push(`${l.id}: mistenkelig lav befolkning`);
}
for (const id of Object.keys(kart.land)) if (!ider.has(id)) feil.push(`kart.land har ukjent id ${id}`);
for (const id of Object.keys(former)) if (!alleIder.has(id)) feil.push(`former har ukjent id ${id}`);
for (const id of Object.keys(kart.punkter)) if (!ider.has(id)) feil.push(`punkter har ukjent id ${id}`);

// ---- neighbours -----------------------------------------------------------------------------------
const perId = new Map(alle.map((l) => [l.id, l]));
for (const l of alle) {
  for (const [felt, liste] of [["naboer", l.naboer], ["naboerSjo", l.naboerSjo]]) {
    if (!Array.isArray(liste)) {
      feil.push(`${l.id}: ${felt} mangler`);
      continue;
    }
    if (new Set(liste).size !== liste.length) feil.push(`${l.id}: duplikater i ${felt}`);
    for (const n of liste) if (!perId.has(n)) feil.push(`${l.id}: ${felt} har ukjent id ${n}`);
    if (liste.includes(l.id)) feil.push(`${l.id}: er nabo til seg selv i ${felt}`);
  }
  for (const n of l.naboer ?? []) if (!perId.get(n)?.naboer?.includes(l.id)) feil.push(`naboer er ikke symmetriske: ${l.id} -> ${n}`);
  for (const n of l.naboerSjo ?? []) if (l.naboer?.includes(n)) feil.push(`${l.id}: ${n} står både i naboer og naboerSjo`);
  if (l.naboer?.length === 0 && l.naboerSjo?.length === 0) feil.push(`${l.id}: ingen naboer i det hele tatt`);
}
// Cross-check against the independent land-border list in kilder.json (mledoze/countries). Only these differences
// are known and accepted: fixed links Natural Earth lacks, and a border the control list gets wrong.
const KJENTE_AVVIK = new Set(["FR-GB", "DK-SE", "MY-SG", "BH-SA", "IN-LK"]);
const par = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
for (const l of alle) {
  const kontroll = new Set(kilder.land[l.id]?.kontrollNaboer ?? []);
  const mine = new Set(l.naboer);
  for (const n of kontroll) if (!mine.has(n) && !KJENTE_AVVIK.has(par(l.id, n))) feil.push(`nabo mangler: ${l.id}-${n} (står i kontrolllisten)`);
  for (const n of mine) if (!kontroll.has(n) && !KJENTE_AVVIK.has(par(l.id, n)) && perId.get(n)) varsler.push(`nabo utenfor kontrolllisten: ${l.id}-${n}`);
}

// ---- cities ---------------------------------------------------------------------------------------
for (const id of alleIder) if (!byer[id]) feil.push(`byer.json mangler ${id}`);
for (const id of Object.keys(byer)) if (!alleIder.has(id)) feil.push(`byer.json har ukjent id ${id}`);
for (const [id, liste] of Object.entries(byer)) {
  if (liste.length > 4) feil.push(`${id}: flere enn 4 byer`);
  if (!liste.every((b, i) => i === 0 || liste[i - 1].folketall >= b.folketall)) feil.push(`${id}: byene er ikke sortert på folketall`);
  for (const b of liste) if (!b.navn || !erTall(b.folketall) || !(b.lat >= -90 && b.lat <= 90 && b.lng >= -180 && b.lng <= 180)) feil.push(`${id}: ugyldig by ${JSON.stringify(b)}`);
}
for (const l of land) if (l.befolkning > 400000 && byer[l.id]?.length < 4) varsler.push(`${l.id}: bare ${byer[l.id].length} byer`);

// ---- collisions ------------------------------------------------------------------------------
/**
 * Answers must resolve to one entry. Country names are checked over all 248 entries; capitals over the 197
 * (a territory that shares its capital name with another entry is only a warning, the capital quiz never asks it).
 */
function kollisjoner(navn, liste, hent, bareVarsel = () => false) {
  for (const [variant, tittel] of [[norm, "norm"], [grov, "grov"]]) {
    const kart = new Map();
    for (const l of liste) {
      for (const svar of hent(l)) {
        const n = variant(svar);
        if (!n) {
          if (svar !== "") feil.push(`${navn}: ${l.id} har svar uten bokstaver: "${svar}"`);
          continue;
        }
        const finnes = kart.get(n);
        if (finnes && finnes !== l.id) (bareVarsel(l.id, finnes) ? varsler : feil).push(`${navn} (${tittel}): "${svar}" (${l.id}) kolliderer med ${finnes}`);
        kart.set(n, l.id);
      }
    }
  }
}
kollisjoner("land", alle, (l) => [l.navn, l.en, ...l.svar]);
kollisjoner("hovedstad", alle, (l) => [l.hovedstad, l.hovedstadEn, ...l.hovedstadSvar], (a, b) => !(ider.has(a) && ider.has(b)));
for (const bare of ["kongo", "congo"]) {
  for (const l of alle) if ([l.navn, l.en, ...l.svar].some((s) => norm(s) === bare)) feil.push(`Tvetydig "${bare}" brukt av ${l.id}`);
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
  // Inverted or broken outlines: the biggest ring must carry the net winding, and fill must not flood the box.
  const areal = ringer.map(signert);
  const netto = areal.reduce((a, b) => a + b, 0);
  const storst = areal.reduce((m, a) => (Math.abs(a) > Math.abs(m) ? a : m), 0);
  if (Math.sign(storst) !== Math.sign(netto)) feil.push(`${id}: største ring og samlet fyll har motsatt retning`);
  if (Math.abs(netto) > 0.98 * w * h) feil.push(`${id}: fyller hele boksen (${Math.abs(netto).toFixed(0)} px2)`);
  if (Math.abs(netto) < 0.001 * 184 * 184) varsler.push(`${id}: nesten tom silhuett (${Math.abs(netto).toFixed(2)} px2)`);
  for (const ring of ringer) if (ring.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) feil.push(`${id}: ugyldig koordinat`);
  if (b.x0 < 7.9 || b.y0 < 7.9 || b.x1 > 192.1 || b.y1 > 192.1) feil.push(`${id}: silhuett utenfor 8 px-margin (${b.x0.toFixed(1)},${b.y0.toFixed(1)} - ${b.x1.toFixed(1)},${b.y1.toFixed(1)})`);
  if (Math.max(w, h) < 183 || Math.max(w, h) > 184.3) varsler.push(`${id}: største side ${Math.max(w, h).toFixed(1)} px`);
  if (Math.abs((b.x0 + b.x1) / 2 - 100) > 1 || Math.abs((b.y0 + b.y1) / 2 - 100) > 1) varsler.push(`${id}: ikke sentrert (${((b.x0 + b.x1) / 2).toFixed(1)}, ${((b.y0 + b.y1) / 2).toFixed(1)})`);
}

// ---- report ----------------------------------------------------------------------------------------
const kb = (fil) => (readFileSync(path.join(DATA, fil)).length / 1024).toFixed(1);
console.log(`land.json ${kb("land.json")} KB, kart.json ${kb("kart.json")} KB, former.json ${kb("former.json")} KB`);
console.log(`${land.length} land + ${omrader.length} territorier, ${Object.keys(kart.land).length} kartstier, ${Object.keys(kart.punkter).length} punkter, ${Object.keys(former).length} silhuetter`);
const antall = (f) => alle.filter(f).length;
console.log(`Felt: ${antall((l) => l.bnp)} med bnp, ${antall((l) => l.liten)} liten, ${antall((l) => l.hovedstadPos)} med hovedstadPos, ${antall((l) => l.naboer.length)} med landnaboer, ${antall((l) => l.naboerSjo.length)} med sjønaboer`);
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

// Large, outline-only view of the countries where 1:10m detail matters most (fjords, archipelagos).
const detaljland = ["NO", "CL", "ID", "GR", "HR", "PH", "JP", "DK", "GB", "CA"].map((id) => land.find((l) => l.id === id));
const stor = (l) =>
  `<figure><svg viewBox="0 0 200 200" width="420" height="420" style="background:#fff;border:1px solid #ccc"><path d="${former[l.id]}" fill="#223" stroke="#223" stroke-width=".15"/></svg><figcaption>${l.id} ${esc(l.navn)} (${(former[l.id].length / 1024).toFixed(1)} KB)</figcaption></figure>`;
writeFileSync(
  path.join(ut, "former-10m.html"),
  `<!doctype html><meta charset="utf-8"><title>Former 1:10m</title><style>body{font:12px system-ui;margin:12px}figure{display:inline-block;margin:6px}</style>
<h1>1:10m-silhuetter (${(readFileSync(path.join(DATA, "former.json")).length / 1024 / 1024).toFixed(2)} MB totalt)</h1>${detaljland.map(stor).join("")}`,
);
writeFileSync(
  path.join(ut, "former-alle.html"),
  `<!doctype html><meta charset="utf-8"><title>Alle former</title><style>body{font:11px system-ui;margin:8px}figure{display:inline-block;margin:3px}</style>
${land.map(celle).join("")}`,
);
const omradeCelle = (l) =>
  `<figure><svg viewBox="0 0 200 200" width="200" height="200" style="background:#fff;border:1px solid ${l.liten ? "#e88" : "#ccc"}"><path d="${former[l.id]}" fill="#222"/></svg><figcaption>${l.id} ${esc(l.navn)}${l.liten ? " (liten)" : ""}</figcaption></figure>`;
writeFileSync(
  path.join(ut, "former-omrader.html"),
  `<!doctype html><meta charset="utf-8"><title>Territorier</title><style>body{font:11px system-ui;margin:8px}figure{display:inline-block;margin:3px}</style>
<h1>${omrader.length} territorier (rød ramme: liten: true)</h1>${omrader.map(omradeCelle).join("")}`,
);
console.log(`Sjekksider: ${["kart.html", "former.html", "former-10m.html", "former-alle.html", "former-omrader.html"].map((f) => path.join(ut, f)).join(", ")}`);
if (feil.length) process.exitCode = 1;
