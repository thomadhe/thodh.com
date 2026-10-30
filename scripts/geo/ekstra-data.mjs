// Hand-maintained extras for land.json (all 197 quiz countries and the 51 territories):
// currency, spoken languages and manual corrections to the computed land borders.
// Everything here is general knowledge written down by hand; the checks in sjekk-geodata.mjs
// verify that every id is covered.

/** Primary currency per id (ISO 4217). `null`: none of its own and nothing worth quoting (uninhabited). */
const VALUTA_KODER = `
AF AFN|AL ALL|DZ DZD|AD EUR|AO AOA|AG XCD|AR ARS|AM AMD|AZ AZN|AU AUD|BS BSD|BH BHD|BD BDT|BB BBD|BY BYN|BE EUR|BZ BZD|BJ XOF|
BT BTN|BO BOB|BA BAM|BW BWP|BR BRL|BN BND|BG EUR|BF XOF|BI BIF|CA CAD|CL CLP|CO COP|CR CRC|CU CUP|DK DKK|AE AED|CD CDF|DO DOP|
CF XAF|DJ DJF|DM XCD|EC USD|EG EGP|GQ XAF|SV USD|CI XOF|ER ERN|EE EUR|SZ SZL|ET ETB|FJ FJD|PH PHP|FI EUR|FR EUR|GA XAF|GM GMD|
GE GEL|GH GHS|GD XCD|GT GTQ|GN GNF|GW XOF|GY GYD|HT HTG|GR EUR|HN HNL|IN INR|ID IDR|IQ IQD|IR IRR|IE EUR|IS ISK|IL ILS|IT EUR|
JM JMD|JP JPY|YE YER|JO JOD|KH KHR|CM XAF|CV CVE|KZ KZT|KE KES|CN CNY|KG KGS|KI AUD|KM KMF|XK EUR|HR EUR|KW KWD|CY EUR|LA LAK|
LV EUR|LS LSL|LB LBP|LR LRD|LY LYD|LI CHF|LT EUR|LU EUR|MG MGA|MW MWK|MY MYR|MV MVR|ML XOF|MT EUR|MA MAD|MH USD|MR MRU|MU MUR|
MX MXN|FM USD|MD MDL|MC EUR|MN MNT|ME EUR|MZ MZN|MM MMK|NA NAD|NR AUD|NL EUR|NP NPR|NZ NZD|NI NIO|NE XOF|NG NGN|KP KPW|MK MKD|
NO NOK|OM OMR|PK PKR|PW USD|PS ILS|PA PAB|PG PGK|PY PYG|PE PEN|PL PLN|PT EUR|QA QAR|CG XAF|RO RON|RU RUB|RW RWF|KN XCD|LC XCD|
VC XCD|SB SBD|WS WST|SM EUR|ST STN|SA SAR|SN XOF|RS RSD|SC SCR|SL SLE|SG SGD|SK EUR|SI EUR|SO SOS|ES EUR|LK LKR|GB GBP|SD SDG|
SR SRD|CH CHF|SE SEK|SY SYP|ZA ZAR|KR KRW|SS SSP|TJ TJS|TW TWD|TZ TZS|TH THB|TG XOF|TO TOP|TT TTD|TD XAF|CZ CZK|TN TND|TM TMT|
TV AUD|TR TRY|DE EUR|UG UGX|UA UAH|HU HUF|UY UYU|US USD|UZ UZS|VU VUV|VA EUR|VE VES|VN VND|ZM ZMW|ZW ZWG|TL USD|AT EUR|
AS USD|AI XCD|AW AWG|BM BMD|BV -|IO USD|VG USD|KY KYD|CX AUD|CC AUD|CK NZD|FK FKP|FO DKK|GF EUR|PF XPF|TF EUR|GI GIP|GL DKK|GP EUR|
GU USD|GG GBP|HM -|HK HKD|IM GBP|JE GBP|MO MOP|MQ EUR|YT EUR|MS XCD|NC XPF|NU NZD|NF AUD|MP USD|PN NZD|PR USD|RE EUR|SH SHP|
PM EUR|GS FKP|SJ NOK|TK NZD|TC USD|VI USD|WF XPF|EH MAD|CW XCG|BQ USD|BL EUR|SX XCG|MF EUR|AX EUR
`;

/** Norwegian currency names by ISO 4217 code. */
export const VALUTA_NAVN = {
  AED: "emiratisk dirham", AFN: "afghansk afghani", ALL: "albansk lek", AMD: "armensk dram", AOA: "angolansk kwanza",
  ARS: "argentinsk peso", AUD: "australsk dollar", AWG: "arubansk floryn", AZN: "aserbajdsjansk manat", BAM: "konvertibel mark",
  BBD: "barbadisk dollar", BDT: "bangladeshisk taka", BGN: "bulgarsk lev", BHD: "bahrainsk dinar", BIF: "burundisk franc",
  BMD: "bermudisk dollar", BND: "bruneisk dollar", BOB: "boliviansk boliviano", BRL: "brasiliansk real", BSD: "bahamansk dollar",
  BTN: "bhutansk ngultrum", BWP: "botswansk pula", BYN: "hviterussisk rubel", BZD: "belizisk dollar", CAD: "kanadisk dollar",
  CDF: "kongolesisk franc", CHF: "sveitsisk franc", CLP: "chilensk peso", CNY: "kinesisk yuan", COP: "colombiansk peso",
  CRC: "costaricansk colón", CUP: "cubansk peso", CVE: "kapverdisk escudo", CZK: "tsjekkisk koruna", DJF: "djiboutisk franc",
  DKK: "dansk krone", DOP: "dominikansk peso", DZD: "algerisk dinar", EGP: "egyptisk pund", ERN: "eritreisk nakfa",
  ETB: "etiopisk birr", EUR: "euro", FJD: "fijiansk dollar", FKP: "falklandspund", GBP: "britisk pund", GEL: "georgisk lari",
  GHS: "ghanesisk cedi", GIP: "gibraltarpund", GMD: "gambisk dalasi", GNF: "guineansk franc", GTQ: "guatemalansk quetzal",
  GYD: "guyansk dollar", HKD: "hongkong-dollar", HNL: "honduransk lempira", HTG: "haitisk gourde", HUF: "ungarsk forint",
  IDR: "indonesisk rupiah", ILS: "israelsk shekel", INR: "indisk rupi", IQD: "irakisk dinar", IRR: "iransk rial",
  ISK: "islandsk krone", JMD: "jamaicansk dollar", JOD: "jordansk dinar", JPY: "japansk yen", KES: "kenyansk shilling",
  KGS: "kirgisisk som", KHR: "kambodsjansk riel", KMF: "komorisk franc", KPW: "nordkoreansk won", KRW: "sørkoreansk won",
  KWD: "kuwaitisk dinar", KYD: "caymansk dollar", KZT: "kasakhstansk tenge", LAK: "laotisk kip", LBP: "libanesisk pund",
  LKR: "srilankisk rupi", LRD: "liberiansk dollar", LSL: "lesothisk loti", LYD: "libysk dinar", MAD: "marokkansk dirham",
  MDL: "moldovsk leu", MGA: "madagassisk ariary", MKD: "makedonsk denar", MMK: "myanmarsk kyat", MNT: "mongolsk tugrik",
  MOP: "macaosk pataca", MRU: "mauritansk ouguiya", MUR: "mauritisk rupi", MVR: "maldivisk rufiyaa", MWK: "malawisk kwacha",
  MXN: "meksikansk peso", MYR: "malaysisk ringgit", MZN: "mosambikisk metical", NAD: "namibisk dollar", NGN: "nigeriansk naira",
  NIO: "nicaraguansk córdoba", NOK: "norsk krone", NPR: "nepalesisk rupi", NZD: "newzealandsk dollar", OMR: "omansk rial",
  PAB: "panamansk balboa", PEN: "peruansk sol", PGK: "papuansk kina", PHP: "filippinsk peso", PKR: "pakistansk rupi",
  PLN: "polsk złoty", PYG: "paraguayansk guarani", QAR: "qatarsk riyal", RON: "rumensk leu", RSD: "serbisk dinar",
  RUB: "russisk rubel", RWF: "rwandisk franc", SAR: "saudiarabisk riyal", SBD: "salomonsk dollar", SCR: "seychellisk rupi",
  SDG: "sudansk pund", SEK: "svensk krone", SGD: "singaporsk dollar", SHP: "sainthelensk pund", SLE: "sierraleonsk leone",
  SOS: "somalisk shilling", SRD: "surinamsk dollar", SSP: "sørsudansk pund", STN: "saotomesisk dobra", SYP: "syrisk pund",
  SZL: "swazisk lilangeni", THB: "thailandsk baht", TJS: "tadsjikisk somoni", TMT: "turkmensk manat", TND: "tunisisk dinar",
  TOP: "tongansk paʻanga", TRY: "tyrkisk lire", TTD: "trinidadisk dollar", TWD: "taiwansk dollar", TZS: "tanzaniansk shilling",
  UAH: "ukrainsk hryvnja", UGX: "ugandisk shilling", USD: "amerikansk dollar", UYU: "uruguayansk peso", UZS: "usbekisk som",
  VES: "venezuelansk bolívar", VND: "vietnamesisk dong", VUV: "vanuatisk vatu", WST: "samoansk tala", XAF: "sentralafrikansk CFA-franc",
  XCD: "østkaribisk dollar", XCG: "karibisk gylden", XOF: "vestafrikansk CFA-franc", XPF: "CFP-franc", YER: "jemenittisk rial",
  ZAR: "sørafrikansk rand", ZMW: "zambisk kwacha", ZWG: "zimbabwisk gull",
};

export const VALUTA = Object.fromEntries(
  VALUTA_KODER.replace(/\n/g, "").split("|").map((s) => s.trim().split(" ")).filter((p) => p.length === 2).map(([id, kode]) => [id, kode === "-" ? null : kode]),
);

/**
 * The most widely spoken languages first (Norwegian names, at most three). Where a country's official language is
 * not what most people speak (Philippines, Namibia, ...) the spoken ones come first. Written by hand from general
 * knowledge (CIA World Factbook / Ethnologue style), not from a single census table.
 */
const SPRAK = `
AF dari, pashto|AL albansk|DZ arabisk, berber|AD katalansk|AO portugisisk|AG engelsk|AR spansk|AM armensk|AZ aserbajdsjansk|AU engelsk|
BS engelsk|BH arabisk|BD bengali|BB engelsk|BY russisk, hviterussisk|BE nederlandsk, fransk|BZ engelsk, spansk|BJ fransk|BT dzongkha|
BO spansk, quechua|BA bosnisk, serbisk, kroatisk|BW tswana, engelsk|BR portugisisk|BN malayisk|BG bulgarsk|BF fransk, mossi|BI kirundi, fransk|
CA engelsk, fransk|CL spansk|CO spansk|CR spansk|CU spansk|DK dansk|AE arabisk|CD fransk, lingala|DO spansk|CF sango, fransk|
DJ somali, arabisk, fransk|DM engelsk|EC spansk|EG arabisk|GQ spansk, fransk|SV spansk|CI fransk|ER tigrinja, arabisk|EE estisk|
SZ swati, engelsk|ET amharisk, oromo|FJ engelsk, fijiansk|PH tagalog, cebuano|FI finsk, svensk|FR fransk|GA fransk|GM engelsk|GE georgisk|
GH engelsk|GD engelsk|GT spansk|GN fransk|GW portugisisk|GY engelsk|HT haitisk kreol, fransk|GR gresk|HN spansk|IN hindi, engelsk|
ID indonesisk|IQ arabisk, kurdisk|IR persisk|IE engelsk, irsk|IS islandsk|IL hebraisk, arabisk|IT italiensk|JM engelsk|JP japansk|
YE arabisk|JO arabisk|KH khmer|CM fransk, engelsk|CV portugisisk|KZ kasakhisk, russisk|KE swahili, engelsk|CN kinesisk (mandarin)|
KG kirgisisk, russisk|KI engelsk, kiribatisk|KM komorisk, arabisk, fransk|XK albansk, serbisk|HR kroatisk|KW arabisk|CY gresk, tyrkisk|
LA lao|LV latvisk|LS sesotho, engelsk|LB arabisk, fransk|LR engelsk|LY arabisk|LI tysk|LT litauisk|LU luxembourgsk, fransk, tysk|
MG malagassisk, fransk|MW chichewa, engelsk|MY malayisk, engelsk|MV dhivehi|ML fransk, bambara|MT maltesisk, engelsk|MA arabisk, berber|
MH marshallesisk, engelsk|MR arabisk|MU mauritisk kreol, fransk|MX spansk|FM engelsk|MD rumensk|MC fransk|MN mongolsk|ME montenegrinsk|
MZ portugisisk, makhuwa|MM burmesisk|NA oshiwambo, afrikaans, engelsk|NR nauruansk, engelsk|NL nederlandsk|NP nepali|NZ engelsk, maori|
NI spansk|NE hausa, fransk|NG engelsk, hausa, yoruba|KP koreansk|MK makedonsk|NO norsk|OM arabisk|PK urdu, punjabi, engelsk|PW palauisk, engelsk|
PS arabisk|PA spansk|PG tok pisin, engelsk|PY spansk, guarani|PE spansk, quechua|PL polsk|PT portugisisk|QA arabisk|CG fransk, lingala|
RO rumensk|RU russisk|RW kinyarwanda, fransk|KN engelsk|LC engelsk|VC engelsk|SB engelsk|WS samoansk, engelsk|SM italiensk|ST portugisisk|
SA arabisk|SN fransk, wolof|RS serbisk|SC seychellisk kreol, engelsk, fransk|SL krio, engelsk|SG engelsk, kinesisk (mandarin), malayisk|
SK slovakisk|SI slovensk|SO somali, arabisk|ES spansk|LK singalesisk, tamil|GB engelsk|SD arabisk, engelsk|SR nederlandsk, sranan tongo|
CH tysk, fransk, italiensk|SE svensk|SY arabisk|ZA zulu, xhosa, afrikaans|KR koreansk|SS engelsk, arabisk|TJ tadsjikisk, russisk|
TW kinesisk (mandarin), taiwansk|TZ swahili, engelsk|TH thai|TG fransk, ewe|TO tongansk, engelsk|TT engelsk|TD fransk, arabisk|CZ tsjekkisk|
TN arabisk, fransk|TM turkmensk, russisk|TV tuvalsk, engelsk|TR tyrkisk|DE tysk|UG engelsk, swahili, luganda|UA ukrainsk, russisk|
HU ungarsk|UY spansk|US engelsk, spansk|UZ usbekisk, russisk|VU bislama, engelsk, fransk|VA italiensk, latin|VE spansk|VN vietnamesisk|
ZM engelsk, bemba|ZW shona, engelsk, ndebele|TL tetum, portugisisk|AT tysk|
AS samoansk, engelsk|AI engelsk|AW papiamento, nederlandsk|BM engelsk|BV -|IO engelsk|VG engelsk|KY engelsk|CX engelsk|CC engelsk|
CK rarotongansk, engelsk|FK engelsk|FO færøysk, dansk|GF fransk|PF fransk, tahitisk|TF fransk|GI engelsk, spansk|GL grønlandsk, dansk|GP fransk|
GU engelsk, chamorro|GG engelsk|HM -|HK kantonesisk, engelsk|IM engelsk, manx|JE engelsk|MO kantonesisk, portugisisk|MQ fransk|
YT fransk, shimaore|MS engelsk|NC fransk|NU niueansk, engelsk|NF engelsk, norfuk|MP chamorro, carolinsk, engelsk|PN engelsk, pitkernsk|
PR spansk, engelsk|RE fransk, réunionkreolsk|SH engelsk|PM fransk|GS -|SJ norsk, russisk|TK tokelauansk, engelsk|TC engelsk|VI engelsk|
WF wallisisk, fransk|EH arabisk, spansk|CW papiamento, nederlandsk|BQ nederlandsk, papiamento, engelsk|BL fransk|SX engelsk, nederlandsk|
MF fransk, engelsk|AX svensk
`;

export const SPRAK_PER_ID = Object.fromEntries(
  SPRAK.replace(/\n/g, "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const i = s.indexOf(" ");
      const id = s.slice(0, i);
      const rest = s.slice(i + 1).trim();
      return [id, rest === "-" ? [] : rest.split(",").map((x) => x.trim())];
    }),
);

/**
 * Hand-checked corrections to the land borders computed from Natural Earth (1:10m map units).
 * Each pair [a, b] is a border that Natural Earth does not model as shared line work (fixed links, disputed
 * zones, a demilitarised zone, tiny borders) or one that is spurious (NABO_FJERN). The computed result was checked
 * against the land borders of mledoze/countries, see KJENTE_AVVIK in sjekk-geodata.mjs.
 */
export const NABO_LEGG_TIL = [
  ["FR", "GB"], // Channel Tunnel (a fixed link, kept because Worldle lists it)
  ["DK", "SE"], // Oresund bridge (same reason)
  ["MY", "SG"], // Johor-Singapore Causeway and the Second Link (same reason)
  ["SA", "BH"], // King Fahd Causeway (same reason)
  ["IL", "SY"], // Golan Heights / UNDOF zone is its own map unit
  ["BW", "ZM"], // Kazungula: a ~150 m border on the Zambezi, below the 1:10m resolution
  ["CN", "MO"], // Macao-Zhuhai border is not shared line work in Natural Earth
];
export const NABO_FJERN = [];
