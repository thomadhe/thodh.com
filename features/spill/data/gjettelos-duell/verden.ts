import { lag } from "../gjettelos/typer"

// Verden, bare for Gjetteløs-duell. Hvert tall er sjekket mot kilden som står ved spørsmålet; "utregnet" betyr at svaret
// følger av tallene i spørsmålet. "anslag" er tall man må resonnere seg fram til; "fakta" er oppslag, mål og årstall.

export const verden = [
  ...lag("verden", "anslag", [
    ["d-gronland", 2, "Hvor mange bor på Grønland?", "innbyggere", 56740, "Grønlands Statistik", { per: "1.1.2026" }],
    ["d-faeroyene", 2, "Hvor mange bor på Færøyene?", "innbyggere", 54878, "Hagstova Føroya", { per: "1.1.2026" }],
    ["d-tristan", 2, "Hvor mange fastboende har Tristan da Cunha, verdens mest avsidesliggende bebodde øy?", "innbyggere", 220, "Tristan da Cunha Association", { per: "2026" }],
    ["d-vatikanet", 2, "Hvor mange bor i Vatikanstaten?", "innbyggere", 450, "Store norske leksikon", { ca: true, per: "2019", info: "Av de 618 statsborgerne i 2023 bodde bare 246 i Vatikanet." }],
    ["d-taxi-nyc", 3, "Hvor mange gule drosjer har lov til å kjøre i New York?", "drosjer", 13587, "NYC Taxi and Limousine Commission", { per: "2026", info: "Tallet er fastsatt i lov, og hver drosje må ha et eget skilt («medallion»)." }],
    ["d-sveitsisk-sjokolade", 2, "Hvor mange kilo sjokolade spiste hver sveitser i snitt i 2025?", "kg", 10.3, "Chocosuisse", { per: "2025" }],
    ["d-nyc-subway", 2, "Hvor mange reiser blir det med T-banen i New York på en vanlig hverdag?", "reiser", 4.0e6, "MTA", { ca: true, per: "2025", info: "Det er fortsatt bare tre firedeler av nivået fra 2019." }],
    ["d-las-vegas", 2, "Hvor mange hotellrom finnes det i Las Vegas?", "hotellrom", 150300, "LVCVA", { ca: true, per: "2025" }],
    ["d-sko", 3, "Hvor mange par sko ble produsert i verden i 2025?", "par", 24.6e9, "World Footwear Yearbook (APICCAPS)", { ca: true, per: "2025", info: "Kina lager over halvparten av dem." }],
    ["d-plastflasker", 2, "Hvor mange plastflasker kjøpes i verden hvert minutt?", "flasker", 1e6, "FNs miljøprogram (UNEP)", { ca: true, per: "2018", info: "Nesten 20 000 i sekundet." }],
    ["d-plast-havet", 3, "Hvor mange tonn plast havnet i havet i 2016, ifølge et stort anslag fra Pew?", "tonn", 11e6, "Pew Charitable Trusts og SYSTEMIQ", { ca: true, per: "2016", info: "Uten tiltak kan mengden nesten tredobles innen 2040." }],
    ["d-sauer-nz", 2, "Hvor mange sauer fantes det i New Zealand i 2025?", "sauer", 23252463, "Stats NZ", { per: "30.6.2025", info: "Det er over fire sauer per innbygger." }],
    ["d-empire-vinduer", 2, "Hvor mange vinduer har Empire State Building?", "vinduer", 6514, "Empire State Building", { info: "Alle ble byttet ut i en energioppgradering fra 2009." }],
    ["d-empire-byggetid", 2, "Hvor mange dager tok det å bygge Empire State Building?", "dager", 410, "Empire State Building", { info: "Skyskraperen sto ferdig i 1931." }],
    ["d-buckingham", 2, "Hvor mange rom har Buckingham Palace?", "rom", 775, "The Royal Family (royal.uk)", { info: "188 av dem er soverom for de ansatte." }],
    ["d-hvite-hus", 2, "Hvor mange rom har Det hvite hus?", "rom", 132, "Store norske leksikon"],
  ]),
  ...lag("verden", "fakta", [
    ["d-eurolandene", 2, "Hvor mange land bruker euro i 2026?", "land", 21, "Den europeiske sentralbanken", { per: "2026", info: "Bulgaria ble nummer 21 den 1. januar 2026." }],
    ["d-sor-afrika-sprak", 3, "Hvor mange offisielle språk har Sør-Afrika?", "språk", 12, "Sør-Afrikas regjering (SAnews)", { per: "2023", info: "Tegnspråk ble nummer 12 i 2023." }],
    ["d-kina-naboer", 2, "Hvor mange land grenser Kina til på land?", "land", 14, "Britannica", { info: "Kina og Russland deler rekorden for flest naboland." }],
    ["d-nilen", 2, "Hvor lang er Nilen?", "km", 6650, "Britannica", { ca: true, info: "Svaret avhenger litt av hvor man begynner å måle." }],
    ["d-sahara", 2, "Hvor stort areal har Sahara?", "km²", 8.6e6, "Britannica", { ca: true, info: "Omtrent like stort som USA." }],
    ["d-k2", 2, "Hvor høyt er K2, verdens nest høyeste fjell?", "meter", 8609, "Store norske leksikon", { info: "Eldre målinger ga 8 611 meter." }],
    ["d-bajkal", 3, "Hvor dyp er Bajkalsjøen, verdens dypeste innsjø?", "meter", 1680, "Store norske leksikon"],
    ["d-panamakanalen", 2, "Hvor lang er Panamakanalen?", "km", 82, "Store norske leksikon", { info: "Kanalen har seks dobbeltsluser." }],
    ["d-frihetsgudinnen", 2, "Hvor høy er Frihetsgudinnen med sokkelen, fra bakken til fakkelen?", "meter", 93, "National Park Service", { ca: true }],
  ]),
]
