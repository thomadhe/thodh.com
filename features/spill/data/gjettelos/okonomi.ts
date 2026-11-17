import { lag } from "./typer"

// Økonomi: penger, handel og selskaper. Kilder er NBIM, SIPRI, Verdensbanken, World Gold Council og selskapenes egne tall.
// "anslag" er tall man må resonnere seg fram til (hvor mange, hvor mye, hvor ofte); "fakta" er oppslag, mål og årstall.

export const okonomi = [
  ...lag("okonomi", "anslag", [
    ["gull-totalt", 2, "Hvor mange tonn gull har menneskene utvunnet i hele historien?", "tonn", 219891, "World Gold Council", { per: "2025", ca: true, info: "Alt sammen ville fått plass i en kube på rundt 22 meter. Nesten halvparten er smykker." }],
    ["gull-ar", 3, "Hvor mange tonn gull ble utvunnet fra gruvene i verden i 2025?", "tonn", 3672, "World Gold Council", { per: "2025", info: "Rekord." }],
    ["sentralbankgull", 3, "Hvor mange tonn gull eier verdens sentralbanker til sammen?", "tonn", 38666, "World Gold Council", { per: "2025", ca: true, info: "Rundt 18 prosent av alt gull som er utvunnet." }],
    ["milliardaerer", 2, "Hvor mange dollarmilliardærer fantes det i verden i 2025, ifølge Forbes?", "milliardærer", 3028, "Forbes", { per: "2025", info: "902 av dem i USA." }],
    ["hundremilliarder", 2, "Hvor mange personer i verden var verdt over 100 milliarder dollar i 2025, ifølge Forbes?", "personer", 15, "Forbes", { per: "2025", info: "Rekord." }],
    ["militaer", 3, "Hvor mange dollar brukte verdens land på militæret i 2024?", "dollar", 2.718e12, "SIPRI", { per: "2024", info: "USA alene brukte 997 milliarder." }],
    ["olje-dag", 2, "Hvor mange fat olje bruker verden på en gjennomsnittlig dag?", "fat", 102.8e6, "IEA", { per: "2024", ca: true, info: "Et fat er 159 liter." }],
    ["coca-cola", 2, "Hvor mange porsjoner av Coca-Colas drikker blir drukket i verden hver dag?", "porsjoner", 2.2e9, "The Coca-Cola Company", { ca: true, info: "Fordelt på over 200 land." }],
    ["billy", 2, "Hvor mange Billy-bokhyller hadde IKEA solgt fram til 2023?", "bokhyller", 140e6, "IKEA", { per: "2023", ca: true, info: "IKEA anslår at det selges én hvert femte sekund." }],
    ["sveitsiske-ur", 3, "Hvor mange armbåndsur eksporterte Sveits i 2024?", "ur", 15.3e6, "Den sveitsiske urindustriens forbund (FH)", { per: "2024", ca: true, info: "Verdt rundt 25 milliarder sveitsiske franc." }],
    ["visa", 3, "Hvor mange betalinger gikk gjennom Visa-nettet på en gjennomsnittlig dag i 2024?", "betalinger", 640e6, "Visa", { per: "2024", ca: true, info: "233,8 milliarder i løpet av regnskapsåret." }],
    ["pengeoverforinger", 3, "Hvor mange dollar sendte innvandrere hjem til familien i fattige land og mellominntektsland i 2024?", "dollar", 685e9, "Verdensbanken", { per: "2024", ca: true, info: "India fikk mest, 129 milliarder." }],
    ["turistforbruk", 3, "Hvor mange dollar brukte internasjonale turister i verden i 2024?", "dollar", 1.6e12, "UN Tourism", { per: "2024", ca: true }],
    ["starbucks", 2, "Hvor mange Starbucks-kaféer finnes det i verden?", "kaféer", 40990, "Starbucks", { per: "2025", info: "Rundt 16 900 i USA og 8 000 i Kina." }],
    ["mcdonalds", 2, "Hvor mange McDonald's-restauranter fantes det i verden ved utgangen av 2024?", "restauranter", 43477, "McDonald's", { per: "2024" }],
    ["superbowl-reklame", 2, "Hvor mange dollar kostet 30 sekunder reklame under Super Bowl i 2026?", "dollar", 8e6, "Sports Business Journal", { per: "2026", ca: true, info: "Under den første Super Bowl i 1967 kostet det 37 500 dollar." }],
    ["sjofrakt", 3, "Hvor mange tonn last ble fraktet med skip i verden i 2023?", "tonn", 12.3e9, "UNCTAD", { per: "2023", ca: true, info: "Rundt 1,5 tonn per menneske på jorda." }],
    ["kjoretoy", 2, "Hvor mange biler, varebiler, lastebiler og busser ble produsert i verden i 2024?", "kjøretøy", 92.5e6, "OICA", { per: "2024", ca: true, info: "Kina laget rundt en tredel, 31,3 millioner." }],
    ["laks", 2, "Hvor mange kroner eksporterte Norge laks for i 2024?", "kr", 122.9e9, "Norges sjømatråd", { per: "2024", info: "Laksen sto for 70 prosent av sjømateksporten." }],
    ["eras-inntekt", 2, "Hvor mange dollar solgte Taylor Swifts Eras Tour billetter for?", "dollar", 2.078e9, "Taylor Swift Touring (via The New York Times)", { per: "2024", info: "Den første turneen som har passert 2 milliarder dollar." }],
    ["koffertkostnad", 3, "Hvor mange dollar kostet det flyselskapene å rydde opp etter kofferter som ble borte, forsinket eller skadet i 2024?", "dollar", 5e9, "SITA Baggage IT Insights 2025", { per: "2024", ca: true }],
  ]),
  ...lag("okonomi", "fakta", [
    ["oljefondet-andel", 3, "Hvor mange prosent av alle børsnoterte aksjer i verden eier oljefondet?", "prosent", 1.5, "NBIM", { ca: true, per: "2024" }],
    ["handlingsregelen", 2, "Hvor mange prosent av oljefondet kan staten bruke i et normalår etter handlingsregelen?", "prosent", 3, "Finansdepartementet", { info: "Fra 2017. Før det var det 4 prosent." }],
    ["gullbarre", 3, "Hvor mye veier en standard gullbarre på verdensmarkedet (400 unser)?", "kg", 12.4, "London Bullion Market Association", { ca: true }],
    ["moms", 1, "Hvor mange prosent er vanlig merverdiavgift i Norge?", "prosent", 25, "Skatteetaten"],
    ["instagram", 2, "Hvor mye betalte Facebook for Instagram i 2012?", "dollar", 1e9, "Meta"],
    ["whatsapp", 3, "Hvor mye betalte Facebook for WhatsApp i 2014?", "dollar", 19e9, "Meta", { ca: true }],
    ["twitter", 2, "Hvor mye betalte Elon Musk for Twitter i 2022?", "dollar", 44e9, "Twitter"],
    ["youtube-kjop", 3, "Hvor mye betalte Google for YouTube i 2006?", "dollar", 1.65e9, "Google"],
    ["activision", 3, "Hvor mye betalte Microsoft for Activision Blizzard, kjøpet som ble fullført i 2023?", "dollar", 69e9, "Microsoft", { ca: true }],
    ["neymar", 2, "Hvor mye betalte PSG for Neymar i 2017, verdens dyreste fotballovergang?", "euro", 222e6, "UEFA"],
    ["salvator-mundi", 2, "Hvor mye ble «Salvator Mundi», verdens dyreste maleri, solgt for i 2017?", "dollar", 450.3e6, "Christie's"],
    ["nobelpris-belop", 3, "Hvor mange svenske kroner får vinnerne av en nobelpris til sammen?", "svenske kr", 12e6, "Nobelstiftelsen (nobelprize.org)", { per: "2026", info: "Beløpet ble økt fra 11 millioner i 2026." }],
    ["bitcoin-pizza", 3, "I 2010 kjøpte en mann i USA to pizzaer for bitcoin, det første kjente kjøpet med bitcoin. Hvor mange bitcoin betalte han?", "bitcoin", 10000, "Bitcoin Pizza Day"],
    ["arbeidsgiveravgift", 3, "Hvor mange prosent er arbeidsgiveravgiften i sone 1, der de fleste bor?", "prosent", 14.1, "Skatteetaten"],
    ["oljefondet", 2, "Hvor mye var oljefondet verdt ved utgangen av 2025?", "kr", 21268e9, "NBIM", { per: "31.12.2025", info: "Fondet eier aksjer i rundt 7 200 selskaper." }],
    ["oljefondet-avkastning", 3, "Hvor mye tjente oljefondet i 2025?", "kr", 2362e9, "NBIM", { per: "2025", info: "15,1 prosent avkastning." }],
  ]),
]
