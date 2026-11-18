import { lag } from "../gjettelos/typer"

// Vitenskap og rommet, bare for Gjetteløs-duell. Hvert tall er sjekket mot kilden som står ved spørsmålet; "utregnet" betyr at svaret
// følger av tallene i spørsmålet. "anslag" er tall man må resonnere seg fram til; "fakta" er oppslag, mål og årstall.

export const rommet = [
  ...lag("rommet", "anslag", [
    ["d-iss-besokende", 2, "Hvor mange mennesker hadde vært om bord på romstasjonen ISS ved utgangen av november 2025?", "personer", 292, "NASA", { per: "2025", info: "De kom fra 26 land." }],
    ["d-mars-avstand", 3, "Hvor mange dager brukte NASA-roveren Perseverance på reisen fra jorda til Mars?", "dager", 203, "NASA", { info: "Skutt opp 30. juli 2020 og landet 18. februar 2021." }],
    ["d-hubble-bilder", 3, "Hvor mange observasjoner har romteleskopet Hubble gjort siden 1990?", "observasjoner", 1.7e6, "NASA", { ca: true, per: "2026" }],
    ["d-vann-jorda", 3, "Hvor mange kubikkilometer vann finnes det på jorda til sammen?", "km³", 1.386e9, "USGS", { ca: true, info: "Over 96 prosent er saltvann i havet." }],
    ["d-ekvator-gange", 3, "Hvor mange døgn ville det ta å gå rundt jorda langs ekvator i 5 km/t, uten en eneste pause?", "døgn", 334, "utregnet (ekvator 40 075 km, NASA)", { ca: true, info: "Med 8 timers gange om dagen tar det nesten tre år." }],
    ["d-bil-manen", 2, "Hvor mange døgn ville det ta å kjøre bil til månen i 100 km/t?", "døgn", 160, "utregnet (snittavstand 384 400 km, NASA)", { ca: true, info: "Et passasjerfly i 900 km/t ville brukt under 18 døgn." }],
    ["d-fly-sola", 3, "Hvor mange år ville et passasjerfly i 900 km/t brukt på å fly til sola?", "år", 19, "utregnet (snittavstand 149,6 millioner km, NASA)", { ca: true }],
    ["d-jordkloder-manen", 2, "Hvor mange jordkloder kunne du lagt på rad mellom jorda og månen?", "jordkloder", 30, "utregnet (NASA)", { ca: true }],
  ]),
  ...lag("rommet", "fakta", [
    ["d-sola-kjerne", 3, "Hvor varmt er det i kjernen av sola?", "°C", 15e6, "NASA", { ca: true, info: "Kjernen er nesten 3 000 ganger varmere enn overflaten." }],
    ["d-neptun-ar", 3, "Hvor mange år bruker Neptun på én runde rundt sola?", "år", 165, "NASA", { ca: true, info: "Siden den ble oppdaget i 1846, har Neptun bare gått én runde." }],
    ["d-pluto-ar", 3, "Hvor mange år bruker Pluto på én runde rundt sola?", "år", 248, "NASA", { ca: true, info: "Pluto fullfører sin første runde siden oppdagelsen i 2178." }],
    ["d-mars-dogn", 3, "Hvor mange minutter varer et døgn på Mars?", "minutter", 1479.6, "NASA", { ca: true, info: "24 timer og 40 minutter, bare litt lengre enn hos oss." }],
    ["d-olympus-mons", 3, "Hvor høy er Olympus Mons på Mars, den høyeste vulkanen i solsystemet?", "km", 22, "ESA og NASA", { ca: true, info: "Rundt to og en halv gang så høy som Mount Everest." }],
    ["d-andromeda", 2, "Hvor mange lysår unna ligger Andromedagalaksen?", "lysår", 2.5e6, "NASA", { ca: true, info: "Den nærmeste store galaksen, og den kan ses med blotte øyet." }],
    ["d-unnslipning", 3, "Hvor fort må en rakett gå for å slippe unna jordas tyngdekraft?", "km/t", 40270, "NASA", { ca: true, info: "11,2 km i sekundet." }],
    ["d-grunnstoffer", 1, "Hvor mange grunnstoffer er det i periodesystemet?", "grunnstoffer", 118, "IUPAC", { info: "De fire siste fikk navnene sine i 2016." }],
    ["d-mane-tyngde", 2, "Hvor mange prosent av jordas tyngdekraft har du på månen?", "prosent", 16.5, "NASA"],
  ]),
]
