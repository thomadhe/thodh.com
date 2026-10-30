// Builds features/spill/data/geografi/egenskaper.json (attributes of the 197 sovereign states, for Griddy / Havet)
// and features/spill/data/geografi/steder.json (places for Heksagonal jakt).
//
// Run (needs network): node scripts/geo/lag-egenskaper.mjs
// Raw downloads are cached in %TEMP%/geo-egenskaper/dl/ (delete the folder to refresh).
// Retrieval date of the figures: 2026-10-30. Sources and licences: features/spill/data/geografi/egenskaper-kilder.md
//
// Where the numbers come from (everything else is a hand-curated list below, cross-checked against the sources):
//   - kystKm, hoyestePunktM, medianalder, hovedstadIkkeStorst cross-check: CIA World Factbook (public domain), via the
//     factbook.json mirror (https://github.com/factbook/factbook.json); country files found through FIPS codes from Wikidata (P901).
//   - skogProsent (AG.LND.FRST.ZS), bnpPerInnbygger (NY.GDP.PCAP.CD), levealder (SP.DYN.LE00.IN): World Bank WDI (CC BY 4.0), latest year.
//     Gaps are filled from the CIA Factbook / Wikidata (P2132, P2250, P1081; CC0).
//   - hdi: UNDP Human Development Report 2025 (data year 2023, CC BY 3.0 IGO), Wikidata where UNDP has no figure.
//   - olMedaljer: Wikipedia "All-time Olympic Games medal table" (CC BY-SA 4.0), combined total through the 2026 Winter Games.
//   - tidssoner: Wikipedia "List of time zones by country" (number of distinct UTC offsets incl. dependent territories);
//     countries missing from the multi-zone block count as 1.
//   - metro: Wikipedia "List of metro systems" (operating systems).
//   - spraak: official languages from mledoze/countries (ODbL), translated to Norwegian.
//   - ildringen: Wikipedia "Ring of Fire", table "Consensus for inclusion = Yes".
//   - tropene / ekvator: latitude extent of the country proper in Natural Earth 10m map units (public domain).
//   - Memberships (EU, NATO, Commonwealth, Arab League) and driving side are hand lists, cross-checked against Wikidata (CC0).
//   - Places: GeoNames cities15000 (CC BY 4.0, https://www.geonames.org) for coordinates and city-proper population;
//     landmarks and a few small places have hand-entered coordinates.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA = path.join(ROOT, "features/spill/data/geografi");
const DL = path.join(tmpdir(), "geo-egenskaper", "dl");
mkdirSync(DL, { recursive: true });
const UA = "thodh.com-geo/1.0 (https://thodh.com; thodhel@gmail.com)";
const log = (...a) => console.log(...a);
const warn = (...a) => console.log("  !", ...a);
const set = (s) => new Set(s.trim().split(/\s+/));

// ---- download helpers -------------------------------------------------------------------------
async function hentFil(url, fil) {
  const sti = path.join(DL, fil);
  if (!existsSync(sti)) {
    const svar = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (!svar.ok) throw new Error(`${url}: ${svar.status}`);
    writeFileSync(sti, Buffer.from(await svar.arrayBuffer()));
  }
  return sti;
}
const hentTekst = async (url, fil) => readFileSync(await hentFil(url, fil), "utf8");
const hentJson = async (url, fil) => JSON.parse(await hentTekst(url, fil));
const wiki = (tittel) => hentTekst(`https://en.wikipedia.org/w/index.php?title=${tittel}&action=raw`, `wp-${tittel}.wiki`);

async function sparql(sporring) {
  const fil = "wd-" + createHash("sha1").update(sporring).digest("hex").slice(0, 12) + ".json";
  const svar = await hentJson("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(sporring), fil);
  return svar.results.bindings.map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])));
}

// ---- the 197 states -----------------------------------------------------------------------------
const omrader = JSON.parse(readFileSync(path.join(DATA, "land.json"), "utf8"));
const land = omrader.filter((o) => o.suveren);
const IDS = land.map((l) => l.id);
const ID_SET = new Set(IDS);
const ALLE_IDER = new Set(omrader.map((o) => o.id));
if (land.length !== 197) throw new Error(`Expected 197 sovereign states, got ${land.length}`);
const landById = Object.fromEntries(land.map((l) => [l.id, l]));

function sjekkDekning(navn, ids) {
  for (const id of ids) if (!ID_SET.has(id)) throw new Error(`${navn}: unknown id ${id}`);
}
function liste(navn, s) {
  const ids = set(s);
  sjekkDekning(navn, ids);
  return ids;
}

// ---- hand-curated lists -------------------------------------------------------------------------
// Flag colours: r red, h white, b blue, g green, y yellow, s black, o orange. Main colours only (tiny emblem details ignored).
// Flags follow the usual Wikipedia/flagcdn images (civil flag where the state flag adds an emblem: Bolivia, Peru, Venezuela, Costa Rica).
// Afghanistan: the Taliban flag (white with black shahada).
const FARGE_NAVN = { r: "rød", h: "hvit", b: "blå", g: "grønn", y: "gul", s: "svart", o: "oransje" };
const FLAGG_FARGER = `
AD byr|AE rghs|AF hs|AG rsbhy|AL rs|AM rbo|AO rsy|AR bhy|AT rh|AU brh|AZ brgh|BA byh|BB bys|BD gr|BE syr|BF rgy|BG hgr|BH rh|BI rgh|BJ gyr|BN yhsr|BO ryg|BR gybh|BS bys|BT yoh|BW bhs|BY rgh|BZ brh|CA rh|CD byr|CF bhgyr|CG gyr|CH rh|CI ohg|CL bhr|CM gry|CN ry|CO ybr|CR bhr|CU bhr|CV bhry|CY ho|CZ hrb|DE sry|DJ bghr|DK rh|DM gyshr|DO brh|DZ ghr|EC ybr|EE bsh|EG rhs|ER grby|ES ry|ET gyrb|FI hb|FJ brh|FM bh|FR bhr|GA gyb|GB rhb|GD ryg|GE hr|GH ryg s|GM rbgh|GN ryg|GQ ghrb|GR bh|GT bh|GW rygs|GY gyrsh|HN bh|HR rhb|HT br|HU rhg|ID rh|IE gho|IL hb|IN ohgb|IQ rhsg|IR ghr|IS bhr|IT ghr|JM gys|JO shgr|JP hr|KE srgh|KG ry|KH rbh|KI rbyh|KM ghrby|KN grysh|KP brh|KR hrbs|KW ghrs|KZ by|LA rbh|LB rhg|LC bhsy|LI bry|LK yrog|LR rhb|LS bhgs|LT ygr|LU rhb|LV rh|LY rsgh|MA rg|MC rh|MD byr|ME ry|MG hrg|MH boh|MK ry|ML gyr|MM ygrh|MN rby|MR gyr|MT hr|MU rbyg|MV rgh|MW srg|MX ghr|MY rhby|MZ gsyhr|NA brghy|NE ohg|NG gh|NI bh|NL rhb|NO rhb|NP rbh|NR byh|NZ brh|OM rhg|PA bhr|PE rh|PG rsyh|PH brhy|PK gh|PL hr|PS shgr|PT gry|PW by|PY rhb|QA rh|RO byr|RS rbh|RU hbr|RW byg|SA gh|SB bgyh|SC byrhg|SD rhsg|SE by|SG rh|SI hbr|SK hbr|SL ghb|SM hb|SN gyr|SO bh|SR ghry|SS srghby|ST gyrs|SV bh|SY rhsg|SZ byrhs|TD byr|TG gyrh|TH rhb|TJ rhgy|TL rsyh|TM grh|TN rh|TO rh|TR rh|TT rhs|TV byrh|TW rbh|TZ gbys|UA by|UG syrh|US rhb|UY hby|UZ bhgr|VA yh|VC byg|VE ybrh|VN ry|VU rgsy|WS rbh|XK byh|YE rhs|ZA rbgysh|ZM grso|ZW gyrsh
`
  .trim()
  .split("|")
  .map((s) => s.trim().split(/\s+/));

const STJERNE = liste(
  "stjerne",
  "AO AU AZ BA BF BI BR CD CF CL CM CN CU CV DJ DM DZ ET FM GD GH GW HN IL JO KM KN KP LR LY MA MH MM MR MY MZ NR NZ PA PG PH PK PY SB SG SI SN SO SR SS ST SY TG TJ TL TM TN TR TV US UZ VE VN WS XK ZW",
);
const MANE = liste("mane", "AZ BN DZ KM LY MR MV MY NP PK SG TM TN TR UZ");
const DYR = liste("dyr", "AL BT DM EC EG FJ GT KI KZ LK MD ME MX PG RS UG ZM ZW");
const VAPEN = liste(
  "vapen",
  "AD AO BN BZ DO EC EG ES FJ GQ GT HR HT IR KE KI MD ME MX MZ NI OM PT PY RS SI SK SM SV SZ VA",
);
const KORS = liste("kors", "AU BI CH DK DM DO FI FJ GB GE GR IS JM MT NO NZ RS SE SK TO TV");
// Horizontal bands = the field is divided into parallel horizontal bands (a canton/triangle/emblem on top is fine).
// Vertical bands likewise. Mixed layouts (Benin, Madagascar, Guinea-Bissau) and cross/saltire/diagonal flags are neither.
const H_STRIPER = liste(
  "h-striper",
  "AE AM AO AR AT AZ BF BG BO BS BW BY BZ CF CL CO CR CU CV CZ DE DJ EC EE EG ES ET GA GH GM GQ GR HN HR HT HU ID IL IN IQ IR JO KE KH KM KP KW LA LB LI LR LS LT LU LV LY MC MM MR MU MW MY MZ NE NI NL NR OM PH PL PS PY RS RU RW SD SG SI SK SL SM SR SS ST SV SY SZ TG TH TJ UA UG US UY UZ VE YE ZW",
);
const V_STRIPER = liste("v-striper", "AD BB BE CA CI CM DZ FR GN GT IE IT MD ML MN MT MX NG PE PK PT RO SN TD VA VC");

const KYST = {
  AL: "M", DZ: "M", AO: "A", AG: "AK", AR: "A", AU: "IP", BS: "A", BH: "G", BD: "I", BB: "AK", BE: "N", BZ: "K", BJ: "A", BR: "A", BN: "C",
  BG: "S", CM: "A", KH: "C", CA: "APX", CV: "A", CL: "P", CN: "PC", CO: "KP", KM: "I", CD: "A", CG: "A", CR: "KP", CI: "A", HR: "M", CU: "AK",
  CY: "M", DK: "NB", DJ: "RI", DM: "AK", DO: "AK", EC: "P", EG: "MR", SV: "P", GQ: "A", ER: "R", EE: "B", FJ: "P", FI: "B", FR: "AMN",
  GA: "A", GM: "A", GE: "S", DE: "NB", GH: "A", GR: "M", GD: "AK", GT: "KP", GN: "A", GW: "A", GY: "A", HT: "AK", HN: "KP", IS: "A",
  IN: "I", ID: "IP", IR: "GI", IQ: "G", IE: "A", IL: "MR", IT: "M", JM: "K", JP: "P", JO: "R", KE: "I", KI: "P", KP: "P", KR: "P",
  KW: "G", LV: "B", LB: "M", LR: "A", LY: "M", LT: "B", MG: "I", MY: "CI", MV: "I", MT: "M", MH: "P", MR: "A", MU: "I", MX: "AKP",
  FM: "P", MC: "M", ME: "M", MA: "AM", MZ: "I", MM: "I", NA: "A", NR: "P", NL: "N", NZ: "P", NI: "KP", NG: "A", NO: "ANX", OM: "GI",
  PK: "I", PW: "P", PS: "M", PA: "KP", PG: "P", PE: "P", PH: "PC", PL: "B", PT: "A", QA: "G", RO: "S", RU: "BSXP", WS: "P", ST: "A",
  SA: "RG", SN: "A", SC: "I", SL: "A", SG: "C", SB: "P", SO: "I", ZA: "AI", ES: "AM", LK: "I", KN: "AK", LC: "AK", VC: "AK", SD: "R",
  SR: "A", SE: "BN", SY: "M", TL: "I", TG: "A", TO: "P", TT: "AK", TN: "M", TR: "MS", TV: "P", TZ: "I", TH: "IC", UA: "S", AE: "GI",
  GB: "AN", US: "APX", UY: "A", VU: "P", VE: "AK", VN: "C", YE: "RI", TW: "PC", BA: "M", SI: "M",
};
const HAV_NAVN = {
  A: "Atlanterhavet", P: "Stillehavet", I: "Det indiske hav", M: "Middelhavet", K: "Karibhavet", B: "Østersjøen", N: "Nordsjøen",
  S: "Svartehavet", R: "Rødehavet", G: "Persiabukta", C: "Sørkinahavet", X: "Polhavet",
};

const MONARKI = liste(
  "monarki",
  "NO SE DK NL BE ES LU LI MC AD VA GB JP TH KH MY BN BT SA KW QA BH AE OM JO MA LS SZ TO AU NZ CA PG SB TV JM BS AG GD LC VC KN BZ",
);
const EU = liste("eu", "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE");
const NATO = liste(
  "nato",
  "AL BE BG CA HR CZ DK EE FI FR DE GR HU IS IT LV LT LU ME NL MK NO PL PT RO SK SI ES SE TR GB US",
);
const SAMVELDET = liste(
  "samveldet",
  "AG AU BS BD BB BZ BW BN CM CA CY DM SZ FJ GA GM GH GD GY IN JM KE KI LS MW MY MV MT MU MZ NA NR NZ NG PK PG RW KN LC VC WS SC SL SG SB ZA LK TZ TG TO TT TV UG GB VU ZM",
);
const ARABISKE_LIGA = liste("arabiskeLiga", "DZ BH KM DJ EG IQ JO KW LB LY MR MA OM PS QA SA SO SD SY TN AE YE");
const TIDL_SOVJET = liste("tidligereSovjet", "AM AZ BY EE GE KZ KG LV LT MD RU TJ TM UA UZ");
const ATOMVAPEN = liste("atomvapen", "US RU GB FR CN IN PK IL KP");
const VENSTRE = liste(
  "venstrekjoring",
  "AU NZ GB IE MT CY JP IN PK BD LK NP BT MV TH MY SG BN ID TL ZA BW NA ZW ZM MW MZ KE UG TZ LS SZ MU SC JM BS BB AG DM GD LC VC KN TT GY SR FJ KI NR PG SB TV WS TO",
);
const OL_VERT = liste("olVert", "GR FR US GB SE DE BE NL FI AU IT JP MX CA RU BA KR ES CN BR NO CH AT");
const VM_VERT = liste("vmVert", "UY IT FR BR CH SE CL GB MX DE AR ES US JP KR ZA RU QA CA");
const VM_VINNER = liste("vmVinner", "UY IT DE BR GB AR FR ES");
const EUROVISION = liste(
  "eurovision",
  "AL AD AM AU AT AZ BY BE BA BG HR CY CZ DK EE FI FR GE DE GR HU IS IE IL IT LV LT LU MT MD MC ME MA NL MK NO PL PT RO RU SM RS SK SI ES SE CH TR UA GB",
);
// Capital is not the largest city (Wikipedia infobox "largest city" convention; urban agglomeration/city proper as the infobox gives it).
// NR (Nauru has no de jure capital) is left null.
const HOVEDSTAD_IKKE_STORST = liste(
  "hovedstadIkkeStorst",
  "AU BR CA CH CN IN PK NG TR TZ CI MA ZA US NZ VN KZ MM LK BO EC BZ AE TW TT BI SD CM GQ BJ GM SZ LI SM FM PW PS PH MT",
);
const HOVEDSTAD_UKJENT = set("NR");
const METRO_FRA_WIKI_EKSTRA = new Set(); // hand additions to the Wikipedia metro list (none for now)

// Pacific Ring of Fire: filled from Wikipedia's table at run time (Consensus for inclusion = Yes); see ildringenFraWiki().
const ILDRINGEN_NAVN_TIL_ID = {
  Chile: "CL", Peru: "PE", Ecuador: "EC", Colombia: "CO", Panama: "PA", "Costa Rica": "CR", Nicaragua: "NI", Honduras: "HN",
  "El Salvador": "SV", Guatemala: "GT", Mexico: "MX", "United States": "US", Canada: "CA", Russia: "RU", Japan: "JP", Taiwan: "TW",
  Philippines: "PH", Indonesia: "ID", "Papua New Guinea": "PG", "Solomon Islands": "SB", Vanuatu: "VU", Fiji: "FJ", Tonga: "TO",
  "New Zealand": "NZ",
};

// Official languages (English from mledoze/countries) -> Norwegian.
const SPRAAK_NO = {
  Afrikaans: "afrikaans", Albanian: "albansk", Amharic: "amharisk", Arabic: "arabisk", Aramaic: "arameisk", Armenian: "armensk",
  "Austro-Bavarian German": "tysk", Aymara: "aymara", Azerbaijani: "aserbajdsjansk", Belarusian: "hviterussisk",
  "Belizean Creole": "kriol", Bengali: "bengali", Berber: "berbisk", Bislama: "bislama", Bosnian: "bosnisk", Bulgarian: "bulgarsk",
  Burmese: "burmesisk", Catalan: "katalansk", Chewa: "chichewa", Chibarwe: "chibarwe", Chinese: "kinesisk", Comorian: "komorisk",
  Croatian: "kroatisk", Czech: "tsjekkisk", Danish: "dansk", Dari: "dari", Dutch: "nederlandsk", Dzongkha: "dzongkha",
  English: "engelsk", Estonian: "estisk", "Fiji Hindi": "fijiansk hindi", Fijian: "fijiansk", Filipino: "filippinsk", Finnish: "finsk",
  French: "fransk", Georgian: "georgisk", German: "tysk", Gilbertese: "kiribatisk", Greek: "gresk", Guaraní: "guarani",
  "Haitian Creole": "haitisk kreol", Hebrew: "hebraisk", Herero: "herero", Hindi: "hindi", "Hiri Motu": "hiri motu",
  Hungarian: "ungarsk", Icelandic: "islandsk", Indonesian: "indonesisk", Irish: "irsk", Italian: "italiensk",
  "Jamaican Patois": "jamaicansk patois", Japanese: "japansk", Kalanga: "kalanga", Kazakh: "kasakhisk", Khmer: "khmer",
  Khoekhoe: "khoekhoe", Khoisan: "khoisan", Kikongo: "kikongo", Kinyarwanda: "kinyarwanda", Kirundi: "kirundi", Korean: "koreansk",
  Kwangali: "kwangali", Kyrgyz: "kirgisisk", Lao: "laotisk", Latin: "latin", Latvian: "latvisk", Lingala: "lingala",
  Lithuanian: "litauisk", Lozi: "lozi", Luxembourgish: "luxembourgsk", Macedonian: "makedonsk", Malagasy: "malagassisk",
  Malay: "malayisk", Maldivian: "divehi", Maltese: "maltesisk", Marshallese: "marshallesisk", "Mauritian Creole": "mauritisk kreol",
  Moldavian: "rumensk", Mongolian: "mongolsk", Montenegrin: "montenegrinsk", Māori: "maori", Nauru: "nauruansk", Ndau: "ndau",
  Ndonga: "ndonga", Nepali: "nepali", "New Zealand Sign Language": "newzealandsk tegnspråk", "Northern Ndebele": "nordndebele",
  "Northern Sotho": "nordsotho", "Norwegian Bokmål": "norsk", "Norwegian Nynorsk": "norsk", Palauan: "palauisk", Pashto: "pashto",
  "Persian (Farsi)": "persisk", Polish: "polsk", Portuguese: "portugisisk", Quechua: "quechua", Romanian: "rumensk",
  Romansh: "retoromansk", Russian: "russisk", Sami: "samisk", Samoan: "samoansk", Sango: "sango", Serbian: "serbisk",
  "Seychellois Creole": "seychellisk kreol", Shona: "shona", Sinhala: "singalesisk", Slovak: "slovakisk", Slovene: "slovensk",
  Somali: "somali", Sorani: "kurdisk", Sotho: "sotho", "Southern Ndebele": "sørndebele", "Southern Sotho": "sørsotho",
  Spanish: "spansk", Swahili: "swahili", Swazi: "swati", Swedish: "svensk", "Swiss German": "tysk", Tajik: "tadsjikisk",
  Tamil: "tamil", Tetum: "tetum", Thai: "thai", Tigrinya: "tigrinja", "Tok Pisin": "tok pisin", Tonga: "tonga", Tongan: "tongansk",
  Tshiluba: "tshiluba", Tsonga: "tsonga", Tswana: "tswana", Turkish: "tyrkisk", Turkmen: "turkmensk", Tuvaluan: "tuvaluansk",
  Ukrainian: "ukrainsk", "Upper Guinea Creole": "kreol", Urdu: "urdu", Uzbek: "usbekisk", Venda: "venda", Vietnamese: "vietnamesisk",
  Xhosa: "xhosa", "Zimbabwean Sign Language": "zimbabwisk tegnspråk", Zulu: "zulu",
};
// mledoze lists Moldovan as "Moldavian"; Switzerland/Austria/Belgium variants are folded into the parent language above.

// Manual fixes after the automatic assembly (id -> field -> value), each with the reason.
const OVERSTYR = {
  JP: { tropene: true }, // Okinotorishima (20.4 N) is Japanese; Natural Earth has no polygon for it
  MA: { tropene: false }, // Natural Earth's Morocco includes Western Sahara; Morocco proper starts at 27.7 N
  US: { ekvator: false }, // Natural Earth's US unit includes Jarvis Island (0.4 S), an unincorporated territory
  ST: { ekvator: true }, // the equator crosses Ilhéu das Rolas, which the 10m polygons do not resolve
  TW: { bnpPerInnbygger: 39489 }, // no World Bank figure; IMF nominal GDP per capita 2025 as given on Wikipedia "Economy of Taiwan" (retrieved 2026-10-30)
};

// ---- Wikidata / CIA / World Bank / UNDP / Wikipedia ----------------------------------------------
async function hentAlt() {
  const kilder = {};

  // mledoze/countries (names, IOC codes, official languages, landlocked)
  kilder.ml = await hentJson("https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json", "mledoze.json");

  // Wikidata: FIPS codes (for factbook), driving side, current memberships
  const fips = await sparql(`SELECT ?iso ?fips WHERE { ?c wdt:P297 ?iso. ?c wdt:P901 ?fips }`);
  kilder.fips = Object.fromEntries(fips.map((r) => [r.iso, r.fips.toLowerCase()]));
  Object.assign(kilder.fips, { XK: "kv", PS: "we", TW: "tw", VA: "vt", NL: "nl" }); // Wikidata has no FIPS code on these items
  const kjor = await sparql(`SELECT ?iso ?s WHERE { ?c wdt:P297 ?iso. ?c wdt:P1622 ?d. ?d rdfs:label ?s FILTER(lang(?s)="en") }`);
  kilder.drivSide = Object.fromEntries(kjor.map((r) => [r.iso, r.s]));
  const org = await sparql(
    `SELECT ?iso ?org WHERE { VALUES ?org { wd:Q458 wd:Q7184 wd:Q7785 wd:Q7172 }
      ?c wdt:P297 ?iso. ?c p:P463 ?st. ?st ps:P463 ?org. FILTER NOT EXISTS { ?st pq:P582 ?slutt } }`,
  );
  kilder.org = { Q458: new Set(), Q7184: new Set(), Q7785: new Set(), Q7172: new Set() };
  for (const r of org) kilder.org[r.org.split("/").pop()]?.add(r.iso);
  const wdTall = async (prop) => {
    const rader = await sparql(`SELECT ?iso ?v ?t WHERE { ?c wdt:P297 ?iso. ?c p:${prop} ?s. ?s ps:${prop} ?v. OPTIONAL { ?s pq:P585 ?t } }`);
    const ut = {};
    for (const r of rader) {
      const t = r.t ?? "0";
      if (!ut[r.iso] || t > ut[r.iso].t) ut[r.iso] = { v: Number(r.v), t };
    }
    return ut;
  };
  kilder.wdHdi = await wdTall("P1081");
  kilder.wdBnp = await wdTall("P2132");
  kilder.wdLevealder = await wdTall("P2250");

  // CIA World Factbook (factbook.json mirror)
  const dirs = [
    "europe", "africa", "middle-east", "east-n-southeast-asia", "south-asia", "central-asia", "north-america",
    "central-america-n-caribbean", "south-america", "australia-oceania",
  ];
  kilder.fb = {};
  const koe = [...IDS];
  async function arbeider() {
    while (koe.length) {
      const id = koe.shift();
      const kode = kilder.fips[id];
      if (!kode) continue;
      const fil = path.join(DL, `fb-${kode}.json`);
      if (existsSync(fil)) {
        const txt = readFileSync(fil, "utf8");
        if (txt) kilder.fb[id] = JSON.parse(txt);
        continue;
      }
      let funnet = null;
      for (const d of dirs) {
        const svar = await fetch(`https://raw.githubusercontent.com/factbook/factbook.json/master/${d}/${kode}.json`, { headers: { "User-Agent": UA } });
        if (svar.ok) {
          funnet = await svar.text();
          break;
        }
      }
      writeFileSync(fil, funnet ?? "");
      if (funnet) kilder.fb[id] = JSON.parse(funnet);
    }
  }
  await Promise.all(Array.from({ length: 8 }, arbeider));
  // Palestine: coastline is Gaza's
  const gaza = await hentJson("https://raw.githubusercontent.com/factbook/factbook.json/master/middle-east/gz.json", "fb-gz.json");
  kilder.fbGaza = gaza;

  // World Bank
  const wb = async (kode) => {
    const j = await hentJson(`https://api.worldbank.org/v2/country/all/indicator/${kode}?format=json&date=2000:2026&per_page=20000`, `wb-${kode}.json`);
    const ut = {};
    for (const r of j[1]) {
      if (r.value == null) continue;
      const id = r.country.id;
      const aar = Number(r.date);
      if (!ut[id] || aar > ut[id].aar) ut[id] = { v: r.value, aar };
    }
    return ut;
  };
  kilder.wbSkog = await wb("AG.LND.FRST.ZS");
  kilder.wbBnp = await wb("NY.GDP.PCAP.CD");
  kilder.wbLevealder = await wb("SP.DYN.LE00.IN");

  // UNDP HDR 2025 (data year 2023)
  const csv = await hentTekst("https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_complete_time_series.csv", "hdr25.csv");
  const linjer = csv.split(/\r?\n/);
  const hode = linjer[0].split(",");
  const iIso = hode.indexOf("iso3");
  const iHdi = hode.indexOf("hdi_2023");
  kilder.hdi3 = {};
  for (const l of linjer.slice(1)) {
    const k = l.split(",");
    const v = parseFloat(k[iHdi]);
    if (k[iIso] && Number.isFinite(v)) kilder.hdi3[k[iIso]] = v;
  }

  // Wikipedia
  kilder.wpOl = await wiki("All-time_Olympic_Games_medal_table");
  kilder.wpMetro = await wiki("List_of_metro_systems");
  kilder.wpTid = await wiki("List_of_time_zones_by_country");
  kilder.wpRof = await wiki("Ring_of_Fire");

  // Natural Earth 10m map units (for tropics / equator)
  kilder.ne = await hentJson(
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_map_units.geojson",
    "ne_10m_admin_0_map_units.geojson",
  );
  return kilder;
}

// ---- parsing helpers ------------------------------------------------------------------------------
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]/g, "");
function lagNavnIndeks(ml) {
  const idx = new Map();
  for (const c of ml) {
    const navn = [c.name.common, c.name.official, ...(c.altSpellings ?? [])];
    for (const n of navn) if (n && !idx.has(norm(n))) idx.set(norm(n), c.cca2);
  }
  const alias = {
    "Kingdom of the Netherlands": "NL", "Democratic Republic of the Congo": "CD", "Republic of the Congo": "CG",
    "Federated States of Micronesia": "FM", "Cape Verde": "CV", "Czech Republic": "CZ", "East Timor": "TL", "Ivory Coast": "CI",
    "Russia": "RU", "South Korea": "KR", "North Korea": "KP", "United States": "US", "United Kingdom": "GB", Taiwan: "TW",
    Palestine: "PS", "State of Palestine": "PS", Vatican: "VA", "The Bahamas": "BS", "The Gambia": "GM", "Bosnia and Herzegovina": "BA",
    "North Macedonia": "MK", Eswatini: "SZ", Myanmar: "MM", Brunei: "BN", Laos: "LA", Syria: "SY", Iran: "IR", Moldova: "MD",
    Tanzania: "TZ", Vietnam: "VN", Turkey: "TR", Kosovo: "XK", "São Tomé and Príncipe": "ST", "Saint Kitts and Nevis": "KN",
    "Saint Lucia": "LC", "Saint Vincent and the Grenadines": "VC", "Trinidad and Tobago": "TT", "Antigua and Barbuda": "AG",
  };
  for (const [n, id] of Object.entries(alias)) idx.set(norm(n), id);
  return idx;
}
const rensWiki = (s) =>
  s
    .replace(/<ref[^>]*\/>/g, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
    .replace(/\{\{(?:efn|nb|sfn)[^}]*\}\}/gi, "");
const tallFra = (s) => {
  const m = String(s ?? "").match(/-?\d[\d,]*\.?\d*/);
  return m ? Number(m[0].replace(/,/g, "")) : null;
};

function parseOl(tekst, ml) {
  const start = tekst.indexOf("{| class=\"wikitable sortable sticky-header-multi\"");
  const slutt = tekst.indexOf("\n|}", start);
  const tabell = rensWiki(tekst.slice(start, slutt));
  const ioc = {};
  for (const c of ml) if (c.cioc) ioc[c.cioc] = c.cca2;
  Object.assign(ioc, { KOS: "XK", PLE: "PS", TPE: "TW" });
  const medaljer = {};
  for (const rad of tabell.split("\n|-\n")) {
    const kode = rad.match(/flag IOC\|(\w+)/)?.[1];
    const total = [...rad.matchAll(/'''(\d+)'''/g)].pop()?.[1];
    if (!kode || total == null) continue;
    medaljer[kode] = (medaljer[kode] ?? 0) + Number(total);
  }
  const perId = {};
  for (const [kode, n] of Object.entries(medaljer)) {
    const id = ioc[kode];
    if (id && ID_SET.has(id)) perId[id] = n;
  }
  // Russia competed as ROC (2020, 2022) and OAR (2018) with the same NOC: add those to RUS.
  for (const ekstra of ["ROC", "OAR"]) if (medaljer[ekstra]) perId.RU = (perId.RU ?? 0) + medaljer[ekstra];
  return perId;
}

function parseMetro(tekst, idx) {
  const start = tekst.indexOf("{| class=\"wikitable sortable sticky-header-multi static-row-numbers\"");
  const slutt = tekst.indexOf("\n|}", start);
  const ider = new Set();
  const ukjent = new Set();
  for (const m of tekst.slice(start, slutt).matchAll(/\{\{flag\|([^|}]+)/gi)) {
    const id = idx.get(norm(m[1]));
    if (id) ider.add(id);
    else ukjent.add(m[1]);
  }
  return { ider, ukjent };
}

function parseTid(tekst, idx) {
  const ut = {};
  for (const rad of tekst.split(/\n\|-\n/).slice(1)) {
    const r = rensWiki(rad);
    const navn = r.match(/\{\{Flag\|([^}|]+)/i)?.[1];
    if (!navn) continue;
    const tall = r.match(/\|\|\s*(\d+)\s*\|\|/)?.[1] ?? r.split(/\n\|/)[1]?.trim().match(/^\d+$/)?.[0];
    const id = idx.get(norm(navn));
    if (id && tall) ut[id] = Number(tall);
  }
  return ut;
}

function parseRof(tekst) {
  const i = tekst.indexOf("Distribution of Ring of Fire volcanoes");
  const e = tekst.indexOf("\n|}", i);
  const ider = new Set();
  for (const rad of tekst.slice(i, e).split("\n|-\n").slice(1)) {
    const c = rad.split("\n|").map((x) => x.replace(/^\|/, "").replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2").trim());
    if (c[6] !== "Yes") continue;
    for (const navn of c[1].split("-")) {
      const id = ILDRINGEN_NAVN_TIL_ID[navn.trim()];
      if (id) ider.add(id);
    }
  }
  return ider;
}

function breddeUtstrekning(ne) {
  const ut = {};
  const ids = new Set(IDS);
  for (const f of ne.features) {
    const p = f.properties;
    // ISO_A2_EH is the country's own code per map unit; overseas units (French Guiana "GF", ...) carry their own code and drop out.
    const id = p.ISO_A2_EH;
    if (!ids.has(id)) continue;
    const ring = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
    for (const poly of ring(f.geometry)) for (const [, lat] of poly[0]) {
      const u = (ut[id] ??= { min: 90, max: -90 });
      if (lat < u.min) u.min = lat;
      if (lat > u.max) u.max = lat;
    }
  }
  return ut;
}

// ---- assembly -------------------------------------------------------------------------------------
function bygg(k) {
  const ml = k.ml;
  const mlById = Object.fromEntries(ml.map((c) => [c.cca2, c]));
  const idx = lagNavnIndeks(ml);
  const ol = parseOl(k.wpOl, ml);
  const metroParse = parseMetro(k.wpMetro, idx);
  const tid = parseTid(k.wpTid, idx);
  const rof = parseRof(k.wpRof);
  const bredde = breddeUtstrekning(k.ne);
  const iso3til2 = Object.fromEntries(ml.map((c) => [c.cca3, c.cca2]));
  const hdi = {};
  for (const [a3, v] of Object.entries(k.hdi3)) if (iso3til2[a3]) hdi[iso3til2[a3]] = v;
  if (metroParse.ukjent.size) warn("metro: unmapped country names:", [...metroParse.ukjent].join("; "));

  const ut = {};
  const mangler = {};
  const noter = (felt, id) => (mangler[felt] ??= []).push(id);
  for (const id of IDS) {
    const l = landById[id];
    const fb = k.fb[id];
    const kyst = KYST[id] ?? "";
    const farge = FLAGG_FARGER_MAP[id];
    const e = {};
    // flag
    e.flaggFarger = [...farge].map((c) => FARGE_NAVN[c]);
    e.flaggStjerne = STJERNE.has(id);
    e.flaggManeHalvmane = MANE.has(id);
    e.flaggDyr = DYR.has(id);
    e.flaggVapen = VAPEN.has(id);
    e.flaggKors = KORS.has(id);
    e.flaggHorisontaleStriper = H_STRIPER.has(id);
    e.flaggVertikaleStriper = V_STRIPER.has(id);
    // geography
    e.innlandsstat = kyst === "";
    e.oy = l.naboer.length === 0 && kyst !== "" && id !== "AU";
    e.oyDelt = e.oy || ["GB", "IE", "ID", "PG", "HT", "DO", "BN", "TL", "BH", "SG"].includes(id);
    const kystFb = id === "PS" ? k.fbGaza?.Geography?.Coastline?.text : fb?.Geography?.Coastline?.text;
    let kystKm = kystFb == null ? null : /landlocked|^none|^0 km/i.test(kystFb) ? 0 : tallFra(kystFb);
    e.kystKm = kystKm;
    if (kystKm == null) noter("kystKm", id);
    e.hav = [...kyst].map((c) => HAV_NAVN[c]);
    const b = bredde[id];
    e.ekvator = b ? b.min < 0 && b.max > 0 : null;
    e.tropene = b ? b.min < 23.4366 && b.max > -23.4366 : null;
    if (!b) noter("bredde", id);
    const hp = fb?.Geography?.Elevation?.["highest point"]?.text;
    // First "<number> m" (or ft) in the text; the place name before it may contain digits ("K2").
    const hpTreff = hp?.match(/(\d[\d,]*(?:\.\d+)?)\s*(m|ft)\b/);
    let hpM = hpTreff ? Number(hpTreff[1].replace(/,/g, "")) : null;
    if (hpTreff?.[2] === "ft") hpM = Math.round(hpM * 0.3048);
    e.hoyestePunktM = hpM;
    if (hpM == null) noter("hoyestePunktM", id);
    const skog = k.wbSkog[id]?.v ?? tallFra(fb?.Geography?.["Land use"]?.forest?.text) ?? tallFra(fb?.Environment?.["Land use"]?.forest?.text);
    e.skogProsent = skog == null ? null : Math.round(skog * 10) / 10;
    if (skog == null) noter("skogProsent", id);
    e.ildringen = rof.has(id);
    // politics
    e.monarki = MONARKI.has(id);
    e.eu = EU.has(id);
    e.nato = NATO.has(id);
    e.samveldet = SAMVELDET.has(id);
    e.arabiskeLiga = ARABISKE_LIGA.has(id);
    e.tidligereSovjet = TIDL_SOVJET.has(id);
    e.atomvapen = ATOMVAPEN.has(id);
    e.venstrekjoring = VENSTRE.has(id);
    const spraak = [];
    for (const navn of Object.values(mlById[id]?.languages ?? {})) {
      const no = SPRAAK_NO[navn];
      if (!no) warn(`${id}: no Norwegian name for language "${navn}"`);
      else if (!spraak.includes(no)) spraak.push(no);
    }
    e.spraak = spraak;
    e.tidssoner = tid[id] ?? 1;
    // people / economy
    const h = hdi[id] ?? (k.wdHdi[id] ? Math.round(k.wdHdi[id].v * 1000) / 1000 : null);
    e.hdi = h;
    if (h == null) noter("hdi", id);
    const bnp = k.wbBnp[id]?.v ?? l.bnp ?? k.wdBnp[id]?.v ?? null;
    e.bnpPerInnbygger = bnp == null ? null : Math.round(bnp);
    if (bnp == null) noter("bnpPerInnbygger", id);
    const lev = k.wbLevealder[id]?.v ?? tallFra(fb?.["People and Society"]?.["Life expectancy at birth"]?.["total population"]?.text) ?? k.wdLevealder[id]?.v ?? null;
    e.levealder = lev == null ? null : Math.round(lev * 10) / 10;
    if (lev == null) noter("levealder", id);
    const med = tallFra(fb?.["People and Society"]?.["Median age"]?.total?.text);
    e.medianalder = med;
    if (med == null) noter("medianalder", id);
    // sport / culture
    e.olMedaljer = ol[id] ?? 0;
    e.harArrangertOL = OL_VERT.has(id);
    e.harArrangertFotballVM = VM_VERT.has(id);
    e.harVunnetFotballVM = VM_VINNER.has(id);
    e.eurovision = EUROVISION.has(id);
    // misc
    e.metro = metroParse.ider.has(id) || METRO_FRA_WIKI_EKSTRA.has(id);
    e.hovedstadIkkeStorst = HOVEDSTAD_UKJENT.has(id) ? null : HOVEDSTAD_IKKE_STORST.has(id);
    Object.assign(e, OVERSTYR[id]);
    ut[id] = e;
  }
  return { ut, mangler, k };
}

// ---- cross-checks (printed, not applied) -------------------------------------------------------------
function kryssjekk({ ut, k }) {
  const diff = (navn, mine, ref) => {
    const a = IDS.filter((id) => mine.has(id) && !ref.has(id));
    const b = IDS.filter((id) => !mine.has(id) && ref.has(id));
    if (a.length || b.length) warn(`${navn}: only in my list [${a.join(" ")}] / only in Wikidata [${b.join(" ")}]`);
  };
  diff("eu", EU, k.org.Q458);
  diff("nato", NATO, k.org.Q7184);
  diff("samveldet", SAMVELDET, k.org.Q7785);
  diff("arabiskeLiga", ARABISKE_LIGA, k.org.Q7172);
  const venstreWd = new Set(Object.entries(k.drivSide).filter(([, s]) => s === "left").map(([id]) => id));
  diff("venstrekjoring", VENSTRE, venstreWd);
  // monarchy vs CIA government type
  const monFb = new Set(IDS.filter((id) => /monarchy|emirate|sultanate|principality|kingdom/i.test(k.fb[id]?.Government?.["Government type"]?.text ?? "")));
  diff("monarki (vs CIA government type)", MONARKI, monFb);
  // landlocked vs mledoze
  const innlandMl = new Set(k.ml.filter((c) => c.landlocked && ID_SET.has(c.cca2)).map((c) => c.cca2));
  const innlandMine = new Set(IDS.filter((id) => ut[id].innlandsstat));
  diff("innlandsstat (vs mledoze landlocked)", innlandMine, innlandMl);
  // landlocked vs CIA coastline 0
  const innlandFb = new Set(IDS.filter((id) => ut[id].kystKm === 0));
  diff("innlandsstat (vs CIA coastline 0)", innlandMine, innlandFb);
  // equator hand list
  const ekvHand = set("BR CO EC ID KE UG SO GA CG CD ST MV KI GQ");
  diff("ekvator (computed vs hand list)", new Set(IDS.filter((id) => ut[id].ekvator)), ekvHand);
  // flags vs CIA flag description
  const avvik = [];
  for (const id of IDS) {
    const d = (k.fb[id]?.Government?.Flag?.text ?? "").toLowerCase();
    if (!d) continue;
    const fa = FLAGG_FARGER_MAP[id];
    const ord = { r: "red", h: "white", b: "blue", g: "green", y: "yellow", s: "black", o: "orange" };
    const manglerFarge = [...fa].filter((c) => !d.includes(ord[c]) && !(c === "b" && /azure|cyan/.test(d)) && !(c === "r" && /maroon|crimson/.test(d)) && !(c === "y" && /gold/.test(d)));
    if (manglerFarge.length) avvik.push(`${id} colours not in CIA text: ${manglerFarge.map((c) => ord[c]).join(",")}`);
    if (/\bstars?\b/.test(d) && !STJERNE.has(id)) avvik.push(`${id} CIA mentions star, mine false`);
    if (!/\bstar|pentagram|hexagram/.test(d) && STJERNE.has(id)) avvik.push(`${id} mine star, CIA text has none`);
    if (/crescent/.test(d) && !MANE.has(id)) avvik.push(`${id} CIA mentions crescent, mine false`);
    if (!/crescent/.test(d) && MANE.has(id)) avvik.push(`${id} mine crescent, CIA text has none`);
  }
  log(`  flag cross-check vs CIA text: ${avvik.length} notes`);
  for (const a of avvik) log("    " + a);
  // capital not largest vs byer.json (top city per country)
  const byerFil = path.join(DATA, "byer.json"); // top cities per country, written by lag-geodata.mjs; optional here
  if (!existsSync(byerFil)) return;
  const byer = JSON.parse(readFileSync(byerFil, "utf8"));
  const avvikHs = [];
  for (const id of IDS) {
    const storst = byer[id]?.[0]?.navn;
    if (!storst) continue;
    const hs = landById[id].hovedstadEn;
    const lik = norm(storst).includes(norm(hs)) || norm(hs).includes(norm(storst)) || landById[id].hovedstadSvar.some((s) => norm(s) === norm(storst));
    if (lik === ut[id].hovedstadIkkeStorst) avvikHs.push(`${id}: capital ${hs}, largest (GeoNames) ${storst}, mine=${ut[id].hovedstadIkkeStorst}`);
  }
  log(`  capital-vs-largest cross-check vs GeoNames: ${avvikHs.length} disagreements`);
  for (const a of avvikHs) log("    " + a);
}

// ---- places (Heksagonal jakt) --------------------------------------------------------------------------
// "Name|ISO|GeoNames-lookup (optional)|lat,lng (optional, forces manual coordinates)". Norwegian names.
const BYER = `
Oslo|NO
Bergen|NO
Trondheim|NO
Stavanger|NO
Tromsø|NO
Kristiansand|NO
Ålesund|NO
Bodø|NO
Lillehammer|NO
Alta|NO
Drammen|NO
Fredrikstad|NO
Haugesund|NO
Molde|NO
Tønsberg|NO
Narvik|NO||68.43,17.43
Røros|NO||62.57,11.39
Harstad|NO
Kirkenes|NO||69.73,30.05
Hammerfest|NO||70.66,23.68
Svolvær|NO||68.23,14.57
Longyearbyen|SJ||78.22,15.63
Stockholm|SE
Göteborg|SE|Gothenburg
Malmö|SE
Kiruna|SE
Uppsala|SE
Luleå|SE|Lulea
Visby|SE
København|DK|Copenhagen
Aarhus|DK
Odense|DK
Aalborg|DK
Tórshavn|FO||62.01,-6.77
Helsinki|FI
Rovaniemi|FI
Tampere|FI
Turku|FI
Oulu|FI
Reykjavik|IS
Akureyri|IS
Nuuk|GL
London|GB
Manchester|GB
Edinburgh|GB
Birmingham|GB
Glasgow|GB
Liverpool|GB
Belfast|GB
Cardiff|GB
Bristol|GB
Dublin|IE
Cork|IE
Paris|FR
Marseille|FR
Lyon|FR
Nice|FR
Bordeaux|FR
Toulouse|FR
Strasbourg|FR
Lille|FR
Nantes|FR
Montpellier|FR
Berlin|DE
München|DE|Munich
Hamburg|DE
Frankfurt|DE|Frankfurt am Main
Köln|DE|Cologne
Dresden|DE
Stuttgart|DE
Düsseldorf|DE|Dusseldorf
Leipzig|DE
Nürnberg|DE|Nuremberg
Amsterdam|NL
Rotterdam|NL
Brussel|BE|Brussels
Antwerpen|BE|Antwerp
Luxembourg|LU
Zürich|CH|Zurich
Genève|CH|Geneva
Bern|CH
Wien|AT|Vienna
Salzburg|AT
Innsbruck|AT
Madrid|ES
Barcelona|ES
Sevilla|ES|Seville
Valencia|ES
Bilbao|ES
Málaga|ES|Malaga
Zaragoza|ES
Granada|ES
Palma de Mallorca|ES|Palma
Las Palmas|ES|Las Palmas de Gran Canaria
Lisboa|PT|Lisbon
Porto|PT
Faro|PT
Roma|IT|Rome
Milano|IT|Milan
Napoli|IT|Naples
Venezia|IT|Venice
Firenze|IT|Florence
Torino|IT|Turin
Palermo|IT
Genova|IT|Genoa
Bologna|IT
Verona|IT
Valletta|MT||35.90,14.51
Aten|GR|Athens
Thessaloniki|GR
Heraklion|GR|Iraklion
Warszawa|PL|Warsaw
Kraków|PL|Krakow
Gdańsk|PL|Gdansk
Wrocław|PL|Wroclaw
Brno|CZ
Brașov|RO|Brasov
Praha|CZ|Prague
Bratislava|SK
Budapest|HU
București|RO|Bucharest
Cluj-Napoca|RO
Sofia|BG
Beograd|RS|Belgrade
Zagreb|HR
Split|HR
Dubrovnik|HR
Ljubljana|SI
Sarajevo|BA
Podgorica|ME
Skopje|MK
Tirana|AL
Pristina|XK
Tallinn|EE
Riga|LV
Vilnius|LT
Minsk|BY
Kyiv|UA|Kiev
Odesa|UA|Odessa
Lviv|UA
Kharkiv|UA|Kharkov
Chișinău|MD|Chisinau
Moskva|RU|Moscow
St. Petersburg|RU|Saint Petersburg
Novosibirsk|RU
Vladivostok|RU
Jekaterinburg|RU|Yekaterinburg
Murmansk|RU
Kazan|RU
Sotsji|RU|Sochi
Irkutsk|RU
Magadan|RU
Norilsk|RU
Khabarovsk|RU
Kaliningrad|RU
Jakutsk|RU|Yakutsk
Istanbul|TR
Ankara|TR
Izmir|TR
Antalya|TR
Trabzon|TR
Nikosia|CY|Nicosia
Tokyo|JP
Osaka|JP
Kyoto|JP
Sapporo|JP
Hiroshima|JP
Fukuoka|JP
Nagoya|JP
Yokohama|JP
Kobe|JP
Nagasaki|JP
Naha|JP
Jeju|KR|Jeju City
Seoul|KR
Busan|KR
Pyongyang|KP
Beijing|CN
Shanghai|CN
Guangzhou|CN
Shenzhen|CN
Chengdu|CN
Chongqing|CN
Xi'an|CN
Harbin|CN
Ürümqi|CN|Urumqi
Lhasa|CN
Wuhan|CN
Hangzhou|CN
Nanjing|CN
Tianjin|CN
Qingdao|CN
Kunming|CN
Shenyang|CN
Kashgar|CN
Hongkong|HK|Hong Kong
Macao|MO|Macau
Taipei|TW
Ulan Bator|MN|Ulaanbaatar
Delhi|IN
Mumbai|IN
Kolkata|IN
Chennai|IN
Bangalore|IN
Hyderabad|IN
Jaipur|IN
Varanasi|IN
Ahmedabad|IN
Pune|IN
Amritsar|IN
Kochi|IN|Cochin
Agra|IN
Panaji|IN
Karachi|PK
Lahore|PK
Islamabad|PK
Peshawar|PK
Kandahar|AF
Dhaka|BD
Colombo|LK
Kathmandu|NP
Thimphu|BT
Malé|MV|Male
Kabul|AF
Teheran|IR|Tehran
Isfahan|IR|Esfahan
Mashhad|IR
Shiraz|IR
Aleppo|SY
Mosul|IQ
Basra|IQ
Medina|SA
Bagdad|IQ|Baghdad
Damaskus|SY|Damascus
Beirut|LB
Jerusalem|IL
Tel Aviv|IL
Amman|JO
Riyadh|SA
Mekka|SA|Mecca
Jeddah|SA
Dubai|AE
Abu Dhabi|AE
Doha|QA
Kuwait by|KW|Kuwait City
Muscat|OM
Sanaa|YE|Sana'a
Jerevan|AM|Yerevan
Tbilisi|GE
Baku|AZ
Astana|KZ
Almaty|KZ
Tasjkent|UZ|Tashkent
Samarkand|UZ
Asjkhabad|TM|Ashgabat
Bisjkek|KG|Bishkek
Dusjanbe|TJ|Dushanbe
Bangkok|TH
Chiang Mai|TH
Phuket|TH
Hanoi|VN
Ho Chi Minh-byen|VN|Ho Chi Minh City
Phnom Penh|KH
Siem Reap|KH
Vientiane|LA
Yangon|MM
Naypyidaw|MM|Nay Pyi Taw
Kuala Lumpur|MY
Singapore|SG
Jakarta|ID
Surabaya|ID
Denpasar|ID
Yogyakarta|ID
Bandung|ID
Manila|PH
Cebu|PH|Cebu City
Davao|PH|Davao City
Da Nang|VN
Hue|VN
Mandalay|MM
Bandar Seri Begawan|BN
Dili|TL
Kairo|EG|Cairo
Alexandria|EG
Luxor|EG
Marrakech|MA
Casablanca|MA
Rabat|MA
Fès|MA|Fes
Tanger|MA|Tangier
Oran|DZ
Benghazi|LY
Aswan|EG
Asmara|ER
Alger|DZ|Algiers
Tunis|TN
Tripoli|LY
Khartoum|SD
Addis Abeba|ET|Addis Ababa
Nairobi|KE
Mombasa|KE
Dar es Salaam|TZ
Dodoma|TZ
Zanzibar|TZ|Zanzibar City
Kampala|UG
Lilongwe|MW
Lomé|TG|Lome
Cotonou|BJ
Conakry|GN
Freetown|SL
Monrovia|LR
Ouagadougou|BF
Niamey|NE
N'Djamena|TD
Brazzaville|CG
Yaoundé|CM|Yaounde
Bujumbura|BI
Lubumbashi|CD
Bulawayo|ZW
Maseru|LS
Gqeberha|ZA|Port Elizabeth
Bloemfontein|ZA
Moroni|KM
Kigali|RW
Lagos|NG
Abuja|NG
Kano|NG
Accra|GH
Abidjan|CI
Dakar|SN
Timbuktu|ML
Bamako|ML
Kinshasa|CD
Luanda|AO
Johannesburg|ZA
Cape Town|ZA|Cape Town
Durban|ZA
Pretoria|ZA
Windhoek|NA
Gaborone|BW
Harare|ZW
Lusaka|ZM
Maputo|MZ
Antananarivo|MG
Port Louis|MU
Victoria|SC
Mogadishu|SO
Djibouti|DJ
Douala|CM
Libreville|GA
Praia|CV
Juba|SS
New York|US
Los Angeles|US
Chicago|US
San Francisco|US
Washington D.C.|US|Washington
Miami|US
Houston|US
Seattle|US
Las Vegas|US
New Orleans|US
Boston|US
Denver|US
Anchorage|US
Honolulu|US
Fairbanks|US
Dallas|US
Atlanta|US
Phoenix|US
Philadelphia|US
Detroit|US
Salt Lake City|US
Nashville|US
San Diego|US
Portland|US
Juneau|US
Toronto|CA
Montréal|CA|Montreal
Vancouver|CA
Calgary|CA
Ottawa|CA
Québec|CA|Quebec
Winnipeg|CA
Halifax|CA
Edmonton|CA
Iqaluit|CA||63.75,-68.52
St. John's|CA
Yellowknife|CA
Whitehorse|CA
Mexico by|MX|Mexico City
Guadalajara|MX
Cancún|MX|Cancun
Monterrey|MX
Tijuana|MX
Mérida|MX|Merida
Oaxaca|MX
Tegucigalpa|HN
San Salvador|SV
Managua|NI
Guatemala by|GT|Guatemala City
Havana|CU
Kingston|JM
Port-au-Prince|HT
Santo Domingo|DO
San Juan|PR
Panama by|PA|Panama City
San José|CR
Belize City|BZ
Nassau|BS
Bridgetown|BB
Port of Spain|TT
Bogotá|CO|Bogota
Medellín|CO|Medellin
Cartagena|CO
Cali|CO
Maracaibo|VE
Arequipa|PE
Iquitos|PE
Santa Cruz de la Sierra|BO|Santa Cruz
Sucre|BO
Rosario|AR
Mendoza|AR
Salta|AR
Caracas|VE
Quito|EC
Guayaquil|EC
Lima|PE
Cusco|PE|Cusco
La Paz|BO
Santiago|CL
Punta Arenas|CL
Valparaíso|CL|Valparaiso
Buenos Aires|AR
Córdoba|AR|Cordoba
Ushuaia|AR
Montevideo|UY
Asunción|PY|Asuncion
São Paulo|BR|Sao Paulo
Rio de Janeiro|BR
Brasília|BR|Brasilia
Salvador|BR
Manaus|BR
Recife|BR
Belém|BR|Belem
Fortaleza|BR
Curitiba|BR
Porto Alegre|BR
Belo Horizonte|BR
Florianópolis|BR|Florianopolis
Paramaribo|SR
Georgetown|GY
Stanley|FK||-51.70,-57.85
Sydney|AU
Melbourne|AU
Perth|AU
Brisbane|AU
Adelaide|AU
Darwin|AU
Canberra|AU
Alice Springs|AU
Hobart|AU
Cairns|AU
Gold Coast|AU
Auckland|NZ
Wellington|NZ
Christchurch|NZ
Queenstown|NZ||-45.03,168.66
Dunedin|NZ
Rotorua|NZ
Honiara|SB
Port Moresby|PG
Suva|FJ
Apia|WS
Nuku'alofa|TO
Port Vila|VU
Nouméa|NC|Noumea
Papeete|PF
Hagåtña|GU||13.48,144.75
Tarawa|KI
Funafuti|TV||-8.52,179.20
Majuro|MH
`;

// Landmarks: name|ISO|lat,lng
const LANDEMERKER = `
Machu Picchu|PE|-13.16,-72.55
Mount Everest|NP|27.99,86.93
Nordkapp|NO|71.17,25.78
Grand Canyon|US|36.11,-112.11
Niagarafallene|CA|43.08,-79.07
Victoriafallene|ZW|-17.92,25.86
Kilimanjaro|TZ|-3.07,37.35
Uluru|AU|-25.34,131.04
Den kinesiske mur|CN|40.43,116.57
Taj Mahal|IN|27.17,78.04
Pyramidene i Giza|EG|29.98,31.13
Angkor Wat|KH|13.41,103.87
Petra|JO|30.33,35.44
Colosseum|IT|41.89,12.49
Eiffeltårnet|FR|48.86,2.29
Frihetsgudinnen|US|40.69,-74.04
Påskeøya|CL|-27.11,-109.35
Galápagosøyene|EC|-0.95,-90.97
Iguazú-fallene|AR|-25.69,-54.44
Salar de Uyuni|BO|-20.13,-67.49
Torres del Paine|CL|-50.94,-73.41
Sagrada Família|ES|41.40,2.17
Stonehenge|GB|51.18,-1.83
Mont Blanc|FR|45.83,6.86
Matterhorn|CH|45.98,7.66
Geirangerfjorden|NO|62.10,7.09
Preikestolen|NO|58.99,6.19
Lofoten|NO|68.20,14.50
Store Barriererev|AU|-18.29,147.70
Fuji|JP|35.36,138.73
Ha Long-bukta|VN|20.91,107.18
Bagan|MM|21.17,94.86
Serengeti|TZ|-2.33,34.83
Taffelfjellet|ZA|-33.96,18.40
Dødehavet|JO|31.50,35.50
Denali|US|63.07,-151.01
Yellowstone|US|44.43,-110.59
Hagia Sofia|TR|41.01,28.98
Kappadokia|TR|38.64,34.83
Santorini|GR|36.39,25.46
Akropolis|GR|37.97,23.73
Alhambra|ES|37.18,-3.59
Neuschwanstein|DE|47.56,10.75
Mont-Saint-Michel|FR|48.64,-1.51
Moherklippene|IE|52.97,-9.43
Giant's Causeway|GB|55.24,-6.51
Gullfoss|IS|64.33,-20.12
Baikalsjøen|RU|53.50,108.17
Den forbudte by|CN|39.92,116.39
Borobudur|ID|-7.61,110.20
Burj Khalifa|AE|25.20,55.27
Operahuset i Sydney|AU|-33.86,151.21
Golden Gate-brua|US|37.82,-122.48
Chichén Itzá|MX|20.68,-88.57
Tikal|GT|17.22,-89.62
Kristusstatuen|BR|-22.95,-43.21
Kapp det gode håp|ZA|-34.36,18.47
Okavango-deltaet|BW|-19.28,22.90
Milford Sound|NZ|-44.67,167.93
Aoraki/Mount Cook|NZ|-43.59,170.14
`;

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .normalize("NFD").replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const rund2 = (x) => Math.round(x * 100) / 100;

async function byggSteder() {
  const fil = path.join(DL, "cities15000.txt");
  if (!existsSync(fil)) {
    const zip = await hentFil("https://download.geonames.org/export/dump/cities15000.zip", "cities15000.zip");
    execFileSync("powershell.exe", ["-NoProfile", "-Command", `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${DL}' -Force`]);
  }
  const rader = readFileSync(fil, "utf8").split("\n").filter(Boolean).map((l) => l.split("\t"));
  const perLand = new Map();
  for (const k of rader) {
    const cc = k[8];
    const nøkler = new Set([k[1], k[2], ...k[3].split(",")].filter(Boolean).map(norm));
    const post = { navn: k[1], lat: Number(k[4]), lng: Number(k[5]), pop: Number(k[14]), nøkler };
    if (!perLand.has(cc)) perLand.set(cc, []);
    perLand.get(cc).push(post);
  }
  const ut = [];
  const feil = [];
  const brukt = new Set();
  for (const linje of BYER.trim().split("\n")) {
    const [navn, land, lookup, manuell] = linje.split("|");
    if (!ALLE_IDER.has(land)) {
      feil.push(`${navn}: unknown country ${land}`);
      continue;
    }
    let lat, lng, pop = null;
    if (manuell) [lat, lng] = manuell.split(",").map(Number);
    else {
      const nøkler = [norm(lookup || navn), norm(navn)];
      const kandidater = (perLand.get(land) ?? []).filter((p) => nøkler.some((n) => p.nøkler.has(n)));
      if (!kandidater.length) {
        feil.push(`${navn} (${land}): not in GeoNames cities15000 - add coordinates by hand`);
        continue;
      }
      const best = kandidater.sort((a, b) => b.pop - a.pop)[0];
      [lat, lng, pop] = [best.lat, best.lng, best.pop || null];
    }
    ut.push({ id: slug(navn), navn, land, lat: rund2(lat), lng: rund2(lng), type: "by", befolkning: pop });
  }
  for (const linje of LANDEMERKER.trim().split("\n")) {
    const [navn, land, koord] = linje.split("|");
    if (!ALLE_IDER.has(land)) {
      feil.push(`${navn}: unknown country ${land}`);
      continue;
    }
    const [lat, lng] = koord.split(",").map(Number);
    ut.push({ id: slug(navn), navn, land, lat: rund2(lat), lng: rund2(lng), type: "landemerke", befolkning: null });
  }
  for (const s of ut) {
    if (brukt.has(s.id)) feil.push(`duplicate id ${s.id}`);
    brukt.add(s.id);
  }
  if (feil.length) {
    log("Place errors:");
    for (const f of feil) warn(f);
    throw new Error(`${feil.length} place errors`);
  }
  return ut;
}

// ---- main --------------------------------------------------------------------------------------------
const FLAGG_FARGER_MAP = {};
for (const e of FLAGG_FARGER) {
  const [id, farger] = e;
  FLAGG_FARGER_MAP[id] = farger.replace(/\s+/g, "");
}

function skriv(fil, innhold) {
  writeFileSync(path.join(DATA, fil), innhold, "utf8");
}

const k = await hentAlt();
// Every id must have flag colours.
for (const id of IDS) if (!FLAGG_FARGER_MAP[id]) throw new Error(`Missing flag colours for ${id}`);
for (const id of Object.keys(FLAGG_FARGER_MAP)) if (!ID_SET.has(id)) throw new Error(`Unknown flag id ${id}`);
if (EUROVISION.size !== 50) warn(`Eurovision count ${EUROVISION.size}, expected 50`);

const { ut, mangler } = bygg(k);
log("Fields with null values (id lists):");
for (const [felt, ids] of Object.entries(mangler)) log(`  ${felt}: ${ids.join(" ")}`);
log("Cross-checks:");
kryssjekk({ ut, k });

const egenskaperTekst = "{\n" + IDS.map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(ut[id])}`).join(",\n") + "\n}\n";
skriv("egenskaper.json", egenskaperTekst);
log(`Wrote egenskaper.json (${IDS.length} states)`);

const steder = await byggSteder();
skriv("steder.json", "[\n" + steder.map((s) => "  " + JSON.stringify(s)).join(",\n") + "\n]\n");
log(`Wrote steder.json (${steder.filter((s) => s.type === "by").length} cities, ${steder.filter((s) => s.type === "landemerke").length} landmarks)`);
