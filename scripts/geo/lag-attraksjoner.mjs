// Builds features/spill/data/geografi/attraksjoner.json: one famous attraction per country, with a freely licensed
// Wikimedia Commons photo (thumbnail 500px wide; Commons only serves standard widths), for the "attraction photo" tile in Tilkoblinger (GeoConnections).
//
// Run (needs network): node scripts/geo/lag-attraksjoner.mjs
// API responses are cached in %TEMP%/attraksjoner/ (delete the folder to refresh).
//
// Per country the landmark is hand-picked ([id, Norwegian name, English Wikipedia article, optional Commons file]).
// The photo is the article's lead image (pageimages) unless a Commons file is given explicitly (when the lead image
// is a map, a drawing, shows text/flags, or is not freely licensed). Only CC0 / CC BY / CC BY-SA / public domain are accepted.
// Every thumbnail URL is verified to return 200 and an image content type. Countries that fail end up in the skip list.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "features/spill/data/geografi/attraksjoner.json");
const LAND = JSON.parse(readFileSync(path.join(ROOT, "features/spill/data/geografi/land.json"), "utf8"));
const CACHE = path.join(tmpdir(), "attraksjoner");
mkdirSync(CACHE, { recursive: true });
const UA = "thodh.com-geo/1.0 (https://thodh.com; thodhel@gmail.com) node-fetch";
const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// [id, norsk navn, engelsk Wikipedia-artikkel, valgfri Commons-fil (uten "File:")]
const KANDIDATER = [
  ["AF", "Minareten i Jam", "Minaret of Jam"],
  ["AL", "Berat", "Berat"],
  ["DZ", "Den store moskeen i Alger", "Great Mosque of Algiers", "Djamaâ El-Djazaïr - 20240405 212406834.jpg"],
  ["AD", "Casa de la Vall", "Casa de la Vall"],
  ["AO", "Calandula-fossene", "Calandula Falls"],
  ["AG", "Nelson's Dockyard", "Nelson's Dockyard"],
  ["AR", "Perito Moreno-breen", "Perito Moreno Glacier"],
  ["AM", "Khor Virap-klosteret", "Khor Virap"],
  ["AZ", "Flame Towers", "Flame Towers", "Flame towers from Baku boulevard.JPG"],
  ["AU", "Operahuset i Sydney", "Sydney Opera House"],
  ["BH", "Bahrain World Trade Center", "Bahrain World Trade Center", "Bahrain World trade Center .jpg"],
  ["BD", "Ahsan Manzil", "Ahsan Manzil"],
  ["BY", "Mir slott", "Mir Castle Complex"],
  ["BE", "Atomium", "Atomium"],
  ["BZ", "Great Blue Hole", "Great Blue Hole"],
  ["BT", "Tigerreiret (Paro Taktsang)", "Paro Taktsang"],
  ["BO", "Salar de Uyuni", "Salar de Uyuni", "Reflection on the Salar de Uyuni, bolivia.jpg"],
  ["BA", "Stari Most", "Stari Most"],
  ["BR", "Kristusstatuen i Rio", "Christ the Redeemer (statue)"],
  ["BN", "Omar Ali Saifuddien-moskeen", "Omar Ali Saifuddien Mosque"],
  ["BG", "Rila-klosteret", "Rila Monastery"],
  ["CA", "CN Tower", "CN Tower", "Toronto - ON - CN Tower bei Nacht.jpg"],
  ["CL", "Moai på Påskeøya", "Moai"],
  ["CO", "Castillo San Felipe de Barajas", "Castillo San Felipe de Barajas"],
  ["CR", "Arenal-vulkanen", "Arenal Volcano"],
  ["CU", "El Capitolio", "El Capitolio"],
  ["DK", "Nyhavn", "Nyhavn"],
  ["AE", "Burj Khalifa", "Burj Khalifa"],
  ["EC", "Cotopaxi", "Cotopaxi"],
  ["EG", "Pyramidene i Giza", "Great Pyramid of Giza"],
  ["CI", "Basilikaen i Yamoussoukro", "Basilica of Our Lady of Peace, Yamoussoukro", "Basilique notre Dame de la Paix de Yamoussoukro 9.jpg"],
  ["EE", "Gamlebyen i Tallinn", "Tallinn Old Town"],
  ["ET", "Klippekirkene i Lalibela", "Rock-Hewn Churches, Lalibela"],
  ["PH", "Chocolate Hills", "Chocolate Hills"],
  ["FI", "Helsinki domkirke", "Helsinki Cathedral"],
  ["FR", "Eiffeltårnet", "Eiffel Tower"],
  ["GE", "Gergeti treenighetskirke", "Gergeti Trinity Church"],
  ["GH", "Cape Coast Castle", "Cape Coast Castle"],
  ["GT", "Tikal", "Tikal"],
  ["GY", "Kaieteur-fossen", "Kaieteur Falls"],
  ["HT", "Citadelle Laferrière", "Citadelle Laferrière"],
  ["GR", "Parthenon", "Parthenon"],
  ["HN", "Copán", "Copán"],
  ["IN", "Taj Mahal", "Taj Mahal"],
  ["ID", "Borobudur", "Borobudur"],
  ["IQ", "Den store moskeen i Samarra", "Great Mosque of Samarra"],
  ["IR", "Persepolis", "Persepolis"],
  ["IE", "Moherklippene", "Cliffs of Moher"],
  ["IS", "Hallgrímskirkja", "Hallgrímskirkja"],
  ["IL", "Masada", "Masada"],
  ["JM", "Dunn's River Falls", "Dunn's River Falls"],
  ["JP", "Fuji", "Mount Fuji"],
  ["YE", "Shibam", "Shibam"],
  ["JO", "Petra", "Petra"],
  ["KH", "Angkor Wat", "Angkor Wat"],
  ["KZ", "Baiterek", "Bayterek Tower", "Baiterek.jpg"],
  ["KE", "Mount Kenya", "Mount Kenya"],
  ["CN", "Den kinesiske mur", "Great Wall of China"],
  ["KG", "Burana-tårnet", "Burana Tower"],
  ["HR", "Bymurene i Dubrovnik", "Walls of Dubrovnik"],
  ["KW", "Kuwait Towers", "Kuwait Towers", "Kuwait towers.jpg"],
  ["LA", "Pha That Luang", "Pha That Luang"],
  ["LV", "Frihetsmonumentet i Riga", "Freedom Monument (Riga)"],
  ["LB", "Baalbek", "Baalbek"],
  ["LY", "Leptis Magna", "Leptis Magna"],
  ["LI", "Slottet i Vaduz", "Vaduz Castle", "Vaduz Castle 1.jpg"],
  ["LT", "Trakai slott", "Trakai Island Castle"],
  ["LU", "Adolphe-broen", "Adolphe Bridge"],
  ["MG", "Baobab-alleen", "Avenue of the Baobabs"],
  ["MY", "Petronas-tårnene", "Petronas Towers", "Kuala Lumpur Malaysia Petronas-Twin-Towers-01.jpg"],
  ["ML", "Den store moskeen i Djenné", "Great Mosque of Djenné"],
  ["MT", "Valletta", "Valletta"],
  ["MA", "Hassan II-moskeen", "Hassan II Mosque", "Sunshine on mosque Hassan II in Casablanca, Morocco - Flickr - Milamber's portfolio.jpg"],
  ["MR", "Richat-strukturen", "Richat Structure"],
  ["MU", "Le Morne Brabant", "Le Morne Brabant"],
  ["MX", "Chichén Itzá", "El Castillo, Chichen Itza"],
  ["FM", "Nan Madol", "Nan Madol"],
  ["MD", "Orheiul Vechi", "Orheiul Vechi"],
  ["MC", "Casinoet i Monte Carlo", "Monte Carlo Casino"],
  ["MN", "Djengis Khan-statuen", "Genghis Khan Equestrian Statue"],
  ["ME", "Sveti Stefan", "Sveti Stefan"],
  ["MM", "Shwedagon-pagoden", "Shwedagon Pagoda"],
  ["NA", "Deadvlei", "Deadvlei", "Dead Vlei, Sossusvlei, Namibia, 2018-08-06, DD 085.jpg"],
  ["NL", "Vindmøllene i Kinderdijk", "Kinderdijk"],
  ["NP", "Boudhanath", "Boudhanath"],
  ["NZ", "Milford Sound", "Milford Sound"],
  ["NG", "Zuma Rock", "Zuma Rock"],
  ["KP", "Juche-tårnet", "Juche Tower"],
  ["MK", "Kaneo-kirken ved Ohridsjøen", "Church of St. John at Kaneo"],
  ["NO", "Preikestolen", "Preikestolen", "Preikestolen - Pulpit Rock.jpg"],
  ["OM", "Sultan Qaboos-moskeen", "Sultan Qaboos Grand Mosque", "Muscat, moschea del sultano qaboos, esterno 01.jpg"],
  ["PK", "Badshahi-moskeen", "Badshahi Mosque"],
  ["PA", "Panamakanalen", "Panama Canal", "Miraflores Locks, Panama Canal, Panama.jpg"],
  ["PE", "Machu Picchu", "Machu Picchu"],
  ["PL", "Malbork slott", "Malbork Castle"],
  ["PT", "Belém-tårnet", "Belém Tower"],
  ["QA", "Museet for islamsk kunst", "Museum of Islamic Art, Doha", "IslamicArtMuseumDohaSkyline.jpg"],
  ["RO", "Bran slott", "Bran Castle"],
  ["RU", "Vasilijkatedralen", "Saint Basil's Cathedral"],
  ["KN", "Brimstone Hill Fortress", "Brimstone Hill Fortress National Park"],
  ["LC", "Pitons", "Pitons", "Petit Piton and Gros Piton (46916689791).jpg"],
  ["SM", "Guaita-tårnet", "Guaita"],
  ["SA", "Kingdom Centre", "Kingdom Centre"],
  ["SN", "Monumentet for den afrikanske renessansen", "African Renaissance Monument", "African Renaissance Monument Dakar 2025.jpg"],
  ["RS", "Sankt Sava-kirken", "Church of Saint Sava"],
  ["SC", "Anse Source d'Argent", "Anse Source d'Argent", "Anse Source d'Argent - La Digue - Seychelles - 10.jpg"],
  ["SG", "Marina Bay Sands", "Marina Bay Sands"],
  ["SK", "Slottet i Bratislava", "Bratislava Castle"],
  ["SI", "Bledsjøen", "Lake Bled"],
  ["ES", "Sagrada Família", "Sagrada Família"],
  ["LK", "Sigiriya", "Sigiriya"],
  ["GB", "Big Ben", "Big Ben"],
  ["SD", "Pyramidene i Meroë", "Pyramids of Meroë"],
  ["CH", "Kapellbrücke i Luzern", "Chapel Bridge"],
  ["SE", "Stockholm slott", "Stockholm Palace"],
  ["SY", "Palmyra", "Palmyra"],
  ["ZA", "Taffelfjellet", "Table Mountain"],
  ["KR", "Gyeongbokgung", "Gyeongbokgung", "Gwanghwamun is the main gate to the south of Gyeongbokgung Palace.jpg"],
  ["TW", "Taipei 101", "Taipei 101", "Taipei Taiwan Taipei-101-Tower-01.jpg"],
  ["TZ", "Kilimanjaro", "Mount Kilimanjaro"],
  ["TH", "Wat Arun", "Wat Arun"],
  ["CZ", "Karlsbroen", "Charles Bridge", "Charles Bridge Covid.jpg"],
  ["TN", "Amfiteatret i El Djem", "Amphitheatre of El Jem"],
  ["TM", "Darvaza-krateret", "Darvaza gas crater"],
  ["TR", "Hagia Sofia", "Hagia Sophia"],
  ["DE", "Brandenburger Tor", "Brandenburg Gate"],
  ["UA", "Kyiv-Pechersk Lavra", "Kyiv Pechersk Lavra"],
  ["HU", "Parlamentsbygningen i Budapest", "Hungarian Parliament Building"],
  ["UY", "Palacio Salvo", "Palacio Salvo", "Palacio Salvo Montevideo-Uruguay.JPG"],
  ["US", "Frihetsgudinnen", "Statue of Liberty"],
  ["UZ", "Registan", "Registan"],
  ["VA", "Peterskirken", "St. Peter's Basilica"],
  ["VE", "Angelfossen", "Angel Falls"],
  ["VN", "Ha Long-bukta", "Hạ Long Bay"],
  ["ZW", "Great Zimbabwe", "Great Zimbabwe"],
  ["TL", "Cristo Rei i Dili", "Cristo Rei of Dili"],
  ["AT", "Schönbrunn", "Schönbrunn Palace"],
  ["IT", "Colosseum", "Colosseum"],
  ["CY", "Kourion", "Kourion", "Panorama View of the antique town of Kourion (Curium).jpg"],
  ["BF", "Moskeen i Bani", "Sudano-Sahelian architecture"],
  ["BW", "Okavangodeltaet", "Okavango Delta"],
  ["LS", "Maletsunyane-fossen", "Maletsunyane Falls"],
  ["DJ", "Assalsjøen", "Lake Assal (Djibouti)"],
  ["BS", "Atlantis Paradise Island", "Atlantis Paradise Island"],
  ["DO", "Alcázar de Colón", "Alcázar de Colón"],
  ["SV", "Izalco-vulkanen", "Izalco Volcano"],
  ["NI", "Katedralen i León", "León Cathedral, Nicaragua"],
  ["PW", "Rock Islands", "Rock Islands Southern Lagoon", "Rock-Islands-Palau-1-2016-aerial-view-Luka-Peternel.jpg"],
  ["CM", "Mount Cameroon", "Mount Cameroon"],
  ["CV", "Pico do Fogo", "Pico do Fogo"],
  ["GM", "Kunta Kinteh-øya", "Kunta Kinteh Island"],
  ["MW", "Malawisjøen", "Lake Malawi"],
  ["UG", "Bwindi-skogen", "Bwindi Impenetrable National Park"],
  ["RW", "Nyungwe-skogen", "Nyungwe National Park"],
  ["XK", "Gazimestan-monumentet", "Gazimestan"],
  ["ER", "Fiat Tagliero-bygningen", "Fiat Tagliero Building"],
  ["PS", "Fødselskirken i Betlehem", "Church of the Nativity"],
  ["MV", "Hukuru-moskeen", "Hukuru Miskiy"],
  ["BB", "Harrison's Cave", "Harrison's Cave"],
  ["GD", "Grand Etang", "Grand Etang Lake"],
];

// Candidates that were looked over and rejected (photo with text/flag, not recognisable, shared with a neighbour...).
const AVVIS = new Set("AD BB BF BS BW CM CY DJ DO ER GM HN KE MW SV UG XK".split(" "));



async function api(host, params) {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  const key = path.join(CACHE, "api-" + createHash("sha1").update(url).digest("hex") + ".json");
  if (existsSync(key)) return JSON.parse(readFileSync(key, "utf8"));
  for (let forsok = 0; forsok < 5; forsok++) {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (r.status === 429 || r.status >= 500) { await sleep(2000 * (forsok + 1)); continue; }
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    const j = await r.json();
    writeFileSync(key, JSON.stringify(j));
    await sleep(250);
    return j;
  }
  throw new Error("API feilet: " + url);
}

// Commons only serves standard thumbnail widths (400px gives HTTP 400), so 500px it is; drop the tracking query, use the upload host.
const tynnUrl = (u) => u.replace("://thumb.wikimedia.org/", "://upload.wikimedia.org/").replace(/\?.*$/, "");
const bolker = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const strip = (s) => (s ?? "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const TILLATT = /^(CC0|CC BY( |-)|CC BY-SA|Public domain|PD|Copyrighted free use|Attribution)/i;
function lisensOk(kort) {
  if (!kort) return false;
  if (/NC|ND|GFDL$|fair use|non-free/i.test(kort) && !/CC BY/i.test(kort)) return false;
  if (/-NC|-ND/i.test(kort)) return false;
  return TILLATT.test(kort);
}

async function leadBilder(titler) {
  const ut = {}; // artikkel -> filnavn
  for (const gr of bolker(titler, 40)) {
    const j = await api("en.wikipedia.org", { action: "query", prop: "pageimages", piprop: "name", redirects: "1", titles: gr.join("|") });
    const fraTil = {};
    for (const n of j.query.normalized ?? []) fraTil[n.from] = n.to;
    for (const n of j.query.redirects ?? []) fraTil[n.from] = n.to;
    const side = {};
    for (const p of j.query.pages) side[p.title] = p.pageimage;
    for (const t of gr) {
      let x = t;
      for (let i = 0; i < 3 && fraTil[x]; i++) x = fraTil[x];
      ut[t] = side[x] ?? null;
    }
  }
  return ut;
}

async function filInfo(filer) {
  const ut = {};
  for (const gr of bolker(filer, 40)) {
    const j = await api("commons.wikimedia.org", {
      action: "query", prop: "imageinfo", iiprop: "url|extmetadata|mime|size", iiurlwidth: "500",
      titles: gr.map((f) => "File:" + f).join("|"),
    });
    const fraTil = {};
    for (const n of j.query.normalized ?? []) fraTil[n.from] = n.to;
    const side = {};
    for (const p of j.query.pages) side[p.title] = p;
    for (const f of gr) {
      const t = fraTil["File:" + f] ?? "File:" + f;
      ut[f] = side[t]?.imageinfo?.[0] ? { ...side[t].imageinfo[0], tittel: t } : null;
    }
  }
  return ut;
}

async function sjekkUrl(url) {
  for (let forsok = 0; forsok < 4; forsok++) {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (r.status === 429) { await sleep(3000 * (forsok + 1)); continue; }
    const ct = r.headers.get("content-type") ?? "";
    await r.arrayBuffer();
    return r.status === 200 && ct.startsWith("image/");
  }
  return false;
}

const land = new Map(LAND.filter((l) => l.suveren).map((l) => [l.id, l]));
const kand = KANDIDATER.filter(([id]) => land.has(id) && !AVVIS.has(id));
const lead = await leadBilder(kand.filter(([, , , f]) => !f).map((k) => k[2]));
const valgt = kand.map(([id, navn, art, fil]) => [id, navn, art, fil ?? lead[art]]);
const info = await filInfo([...new Set(valgt.map((v) => v[3]).filter(Boolean))]);

const resultat = {};
const hoppet = [];
for (const [id, navn, art, fil] of valgt) {
  const skip = (why) => hoppet.push(`${id} ${land.get(id).navn} (${navn}): ${why}`);
  if (!fil) { skip(`ingen ledebilde på «${art}»`); continue; }
  const i = info[fil];
  if (!i) { skip(`Commons-fil ikke funnet: ${fil}`); continue; }
  const m = i.extmetadata ?? {};
  const lisens = strip(m.LicenseShortName?.value);
  const mime = i.mime ?? "";
  if (!/^image\/(jpeg|png|webp)/.test(mime)) { skip(`ikke foto (${mime}): ${fil}`); continue; }
  if (!lisensOk(lisens)) { skip(`lisens «${lisens}»: ${fil}`); continue; }
  if (/\b(map|flag|coat of arms|logo|drawing|painting|plan)\b/i.test(fil)) { skip(`filnavn ser ut som kart/flagg/tegning: ${fil}`); continue; }
  let fotograf = strip(m.Artist?.value) || strip(m.Credit?.value) || "ukjent";
  fotograf = fotograf.match(/taken by ([^.]+?)\./i)?.[1] ?? fotograf; // some uploaders write a long boilerplate in the author field
  resultat[id] = {
    navn,
    bilde: tynnUrl(i.thumburl),
    kilde: "https://commons.wikimedia.org/wiki/" + encodeURI(i.tittel.replace(/ /g, "_")),
    lisens,
    fotograf,
  };
}

// Verifiser at alle bilde-URLer svarer 200 med bildetype.
let ok = 0;
for (const [id, r] of Object.entries(resultat)) {
  if (await sjekkUrl(r.bilde)) { ok++; }
  else { hoppet.push(`${id} ${land.get(id).navn}: bilde-URL svarte ikke 200/bilde: ${r.bilde}`); delete resultat[id]; }
  await sleep(150);
}

const sortert = Object.fromEntries(Object.entries(resultat).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(OUT, JSON.stringify(sortert, null, 2) + "\n");
const utenKandidat = [...land.keys()].filter((id) => !kand.some((k) => k[0] === id) && !AVVIS.has(id));
writeFileSync(path.join(CACHE, "hoppet.txt"), hoppet.join("\n") + "\n\nUTEN KANDIDAT: " + utenKandidat.join(" ") + "\nAVVIST: " + [...AVVIS].join(" ") + "\n");
log(`Skrev ${Object.keys(sortert).length} attraksjoner (${ok} URL-er verifisert) til ${path.relative(ROOT, OUT)}`);
log(`Hoppet over ${hoppet.length}:\n` + hoppet.join("\n"));
log("Uten kandidat: " + utenKandidat.join(" "));
