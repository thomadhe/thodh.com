import { lag } from "../gjettelos/typer"

// Rekorder, bare for Gjetteløs-duell. Hvert tall er sjekket mot kilden som står ved spørsmålet; "utregnet" betyr at svaret
// følger av tallene i spørsmålet. "anslag" er tall man må resonnere seg fram til; "fakta" er oppslag, mål og årstall.

export const rekorder = [
  ...lag("rekorder", "anslag", [
    ["d-seiling", 3, "Hvor mange døgn brukte den raskeste seilbåten jorda rundt?", "døgn", 40.45, "Yachting World", { ca: true, per: "2026", info: "Sodebo Ultim 3 kom i mål i januar 2026." }],
    ["d-vaken", 2, "Hvor mange timer holdt Randy Gardner seg våken i 1964, i det mest kjente søvnforsøket?", "timer", 264, "NPR", { info: "Guinness godkjenner ikke lenger slike forsøk fordi de er farlige." }],
    ["d-flest-barn", 2, "Hvor mange barn fødte den russiske bondekona Valentina Vasiljeva på 1700-tallet, ifølge Guinness?", "barn", 69, "Guinness World Records", { info: "Det var 27 fødsler, med mange tvillinger, trillinger og firlinger." }],
    ["d-skilpadde", 2, "Hvor gammel er kjempeskilpadden Jonathan på St. Helena, verdens eldste kjente landdyr, i 2026?", "år", 194, "Guinness World Records", { ca: true, per: "2026", info: "Han var allerede utvokst da han kom til øya i 1882." }],
  ]),
  ...lag("rekorder", "fakta", [
    ["d-pizza", 3, "Hvor stor er verdens største pizza, i kvadratmeter?", "m²", 1296.72, "Guinness World Records", { per: "2023", info: "Den ble laget i Los Angeles i 2023." }],
    ["d-gresskar", 3, "Hvor mye veier verdens tyngste gresskar?", "kg", 1431.5, "Guinness World Records", { per: "2026", info: "Rekorden fra oktober 2026 kom bare én uke etter den forrige." }],
    ["d-angel-falls", 2, "Hvor høy er Angel Falls i Venezuela, verdens høyeste foss?", "meter", 979, "Guinness World Records", { info: "807 av metrene er ett sammenhengende fall." }],
    ["d-danyang", 3, "Hvor lang er Danyang–Kunshan-viadukten i Kina, verdens lengste bru?", "km", 164.8, "Guinness World Records", { ca: true, info: "Den bærer høyhastighetsbanen mellom Beijing og Shanghai." }],
    ["d-holde-pusten", 3, "Hvor mange minutter er verdensrekorden i å holde pusten under vann, når man først har pustet inn rent oksygen?", "minutter", 29.05, "Guinness World Records", { per: "2025", info: "Vitomir Maričić fra Kroatia satte rekorden i 2025." }],
    ["d-100-fri", 2, "Hvor mange sekunder er verdensrekorden på 100 meter fri svømming for menn?", "sekunder", 46.40, "World Aquatics", { per: "2024", info: "Pan Zhanle satte den i OL i Paris." }],
    ["d-dykk", 3, "Hvor dypt dykket Ahmed Gabr med flaske da han satte verdensrekorden i 2014?", "meter", 332.35, "Guinness World Records", { info: "Det tok ham nesten 15 timer å komme opp igjen." }],
    ["d-vindkast", 3, "Hvor fort var det kraftigste vindkastet som er målt utenom tornadoer?", "km/t", 408, "WMO og Bureau of Meteorology", { info: "Det ble målt på Barrow Island i Australia i 1996." }],
    ["d-kuskjell", 3, "Hvor gammel ble muslingen «Ming», et av de eldste dyrene som er funnet?", "år", 507, "Guinness World Records", { info: "Forskerne frøs den ned i 2006, før de visste hvor gammel den var." }],
    ["d-nebbhval-dykk", 3, "Hvor mange minutter varte det lengste dykket som er målt for et pattedyr?", "minutter", 222, "Guinness World Records", { per: "2020", info: "Det var en småtannet nebbhval, som var under i 3 timer og 42 minutter." }],
  ]),
]
