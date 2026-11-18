import { lag } from "../gjettelos/typer"

// Norge, bare for Gjetteløs-duell. Hvert tall er sjekket mot kilden som står ved spørsmålet; "utregnet" betyr at svaret
// følger av tallene i spørsmålet. "anslag" er tall man må resonnere seg fram til; "fakta" er oppslag, mål og årstall.

export const norge = [
  ...lag("norge", "anslag", [
    ["d-ferjesamband", 2, "Hvor mange ferjesamband finnes det i Norge?", "ferjesamband", 130, "Statens vegvesen", { ca: true, per: "2026", info: "Statens vegvesen har selv ansvaret for bare 16 av dem." }],
    ["d-hotellnetter", 2, "Hvor mange overnattinger var det på norske hoteller i 2025?", "overnattinger", 28155650, "SSB", { per: "2025", info: "Rundt 5 prosent flere enn året før." }],
    ["d-grunnskoleelever", 2, "Hvor mange elever gikk i grunnskolen i Norge høsten 2025?", "elever", 621961, "SSB", { per: "2025", info: "9 408 færre enn året før." }],
    ["d-studenter", 2, "Hvor mange studenter gikk på norske universiteter og høyskoler høsten 2025?", "studenter", 311148, "SSB", { per: "2025", info: "Året før var det 301 879." }],
    ["d-barnehager", 2, "Hvor mange barnehager fantes det i Norge i 2025?", "barnehager", 5112, "SSB", { per: "2025", info: "Året før var det 5 220." }],
    ["d-hansen", 2, "Hansen er det vanligste etternavnet i Norge. Hvor mange heter det?", "personer", 47879, "SSB", { per: "2025", info: "Johansen og Olsen følger like bak, med rundt 45 000 hver." }],
    ["d-kirkemedlemmer", 2, "Hvor mange er medlemmer av Den norske kirke?", "medlemmer", 3431223, "SSB", { per: "2025", info: "Rundt 21 000 færre enn året før." }],
    ["d-valg-2025", 2, "Hvor mange stemmer ble talt opp ved stortingsvalget i 2025?", "stemmer", 3246318, "Valgdirektoratet", { per: "2025", info: "Valgdeltakelsen var 80,0 prosent." }],
    ["d-svalbard", 2, "Hvor mange bor i Longyearbyen og Ny-Ålesund på Svalbard?", "innbyggere", 2504, "SSB", { per: "2026", info: "Over en tredel kommer fra utlandet." }],
    ["d-aleneboende", 2, "Hvor mange nordmenn bor alene?", "personer", 1103955, "SSB", { per: "2026", info: "Rundt 14 000 flere enn året før." }],
    ["d-nye-boliger", 3, "Hvor mange boliger fikk igangsettingstillatelse i Norge i 2025?", "boliger", 20184, "SSB", { per: "2025", info: "I 2024 var det 18 679, det laveste på flere tiår." }],
    ["d-sysselsatte", 2, "Hvor mange mellom 15 og 74 år var i jobb i Norge i 3. kvartal 2026?", "personer", 2952000, "SSB, arbeidskraftundersøkelsen", { ca: true, per: "2026", info: "1 392 000 menn og 1 560 000 kvinner." }],
    ["d-tromso", 1, "Hvor mange innbyggere har Tromsø kommune?", "innbyggere", 79943, "Store norske leksikon (tall fra SSB)", { per: "2026", info: "Tromsø er den største kommunen i Nord-Norge." }],
    ["d-jan-mayen", 2, "Ingen bor fast på Jan Mayen. Hvor mange er stasjonert der?", "personer", 17, "Store norske leksikon", { info: "De kommer fra Forsvaret og Meteorologisk institutt." }],
    ["d-lofoten", 2, "Hvor mange bor i de seks kommunene i Lofoten?", "innbyggere", 24849, "Store norske leksikon (tall fra SSB)", { per: "2026" }],
    ["d-dnt-medlemmer", 2, "Hvor mange medlemmer har Den Norske Turistforening?", "medlemmer", 300000, "Store norske leksikon", { ca: true, per: "2024", info: "DNT er Norges største friluftsorganisasjon." }],
    ["d-dnt-hytter", 2, "Hvor mange hytter har DNT rundt om i landet?", "hytter", 550, "Store norske leksikon", { ca: true }],
    ["d-dnt-stier", 2, "Hvor mange kilometer merkede sommerruter holder DNT ved like?", "km", 22000, "Store norske leksikon", { ca: true, info: "I tillegg kommer rundt 7 000 kilometer med vinterløyper." }],
    ["d-nasjonalparker", 2, "Hvor mange nasjonalparker har fastlands-Norge?", "nasjonalparker", 41, "Store norske leksikon", { info: "I tillegg kommer sju på Svalbard." }],
    ["d-trapp-galdhopiggen", 3, "Et trappetrinn er 18 cm høyt. Hvor mange trinn må du gå for å komme like høyt som toppen av Galdhøpiggen?", "trinn", 13717, "utregnet (2 469 meter, Store norske leksikon)", { ca: true }],
    ["d-hurtigruten-havner", 2, "Hvor mange steder anløper Hurtigruten langs kysten mellom Bergen og Kirkenes?", "steder", 34, "Store norske leksikon", { info: "Hurtigruten frakter fortsatt gods i tillegg til passasjerer." }],
    ["d-trollstigen", 2, "Hvor mange hårnålssvinger har Trollstigen?", "svinger", 11, "Store norske leksikon"],
    ["d-bryggen", 2, "Hvor mange fredede bygninger står på Bryggen i Bergen?", "bygninger", 65, "Store norske leksikon", { info: "De står på et område på rundt 13 dekar." }],
    ["d-radhusklokker", 2, "Hvor mange klokker henger i klokkespillet i Oslo rådhus?", "klokker", 49, "Store norske leksikon", { info: "Klokkespillet henger i østre tårn." }],
    ["d-adopsjon", 3, "Hvor mange barn fra utlandet ble adoptert til Norge i 2025?", "barn", 6, "SSB", { per: "2025" }],
    ["d-vinmonopolet-butikker", 2, "Hvor mange butikker hadde Vinmonopolet ved utgangen av 2024?", "butikker", 351, "Store norske leksikon", { per: "2024" }],
    ["d-flyttinger", 3, "Hvor mange ganger flyttet noen fra én norsk kommune til en annen i 2025?", "flyttinger", 253882, "SSB", { per: "2025" }],
  ]),
  ...lag("norge", "fakta", [
    ["d-kommuner", 1, "Hvor mange kommuner har Norge?", "kommuner", 357, "Valgdirektoratet", { per: "2025" }],
    ["d-galdhopiggen", 1, "Hvor høy er Galdhøpiggen, Norges høyeste fjell?", "meter", 2469, "Store norske leksikon", { info: "Glittertind er 2 460 meter selv med snøkappen." }],
    ["d-sognefjorden", 2, "Hvor lang er Sognefjorden, Norges lengste fjord?", "km", 205, "Store norske leksikon", { info: "Regnes Sognesjøen med, blir den 226 km." }],
    ["d-mjosa", 2, "Hvor stort areal har Mjøsa, Norges største innsjø?", "km²", 369, "Store norske leksikon"],
    ["d-laerdalstunnelen", 2, "Hvor lang er Lærdalstunnelen, verdens lengste vegtunnel?", "km", 24.5, "Store norske leksikon", { info: "Nøyaktig 24 509 meter." }],
    ["d-florli", 2, "Hvor mange trinn har Flørli-trappa ved Lysefjorden, en av verdens lengste tretrapper?", "trinn", 4444, "Store norske leksikon"],
  ]),
]
