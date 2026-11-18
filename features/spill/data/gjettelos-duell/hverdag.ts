import { lag } from "../gjettelos/typer"

// Hverdag, bare for Gjetteløs-duell. Hvert tall er sjekket mot kilden som står ved spørsmålet; "utregnet" betyr at svaret
// følger av tallene i spørsmålet. "anslag" er tall man må resonnere seg fram til; "fakta" er oppslag, mål og årstall.

export const hverdag = [
  ...lag("hverdag", "anslag", [
    ["d-godteri", 2, "Hvor mange kilo godteri kjøpte hver nordmann i snitt i dagligvarebutikken i 2023?", "kg", 5.4, "Helsedirektoratet", { per: "2023", info: "Snacks, is, sjokolade og godteri ble til sammen 25,6 kg per person." }],
    ["d-kjott", 2, "Hvor mange kilo kjøtt gikk det med per nordmann i 2024, uten grensehandelen?", "kg", 71, "Helsedirektoratet (tall fra Animalia)", { ca: true, per: "2024", info: "Grensehandelen legger til et par kilo til." }],
    ["d-melk-drikke", 2, "Hvor mange kilo drikkemelk gikk det med per nordmann i 2024?", "kg", 74, "Helsedirektoratet", { per: "2024", info: "I 1999 var det 127 kilo." }],
    ["d-sukker-cola", 2, "Hvor mange gram sukker er det i en boks Coca-Cola på 0,33 liter?", "gram", 35, "Coca-Cola", { ca: true, info: "Omtrent sju sukkerbiter." }],
    ["d-skuddsekund", 3, "Hvor mange skuddsekunder har blitt lagt til klokka siden 1972?", "sekunder", 27, "IERS", { per: "2026", info: "Det siste kom nyttårsaften 2016." }],
    ["d-brette-manen", 2, "Et papirark er 0,1 mm tykt. Hvor mange ganger må du brette det på midten for at det skal nå fra jorda til månen?", "ganger", 42, "utregnet", { info: "Etter 41 brettinger når du bare litt over halvveis." }],
    ["d-basseng", 2, "Hvor mange liter vann trengs for å fylle et basseng som er 50 meter langt, 25 meter bredt og 2 meter dypt?", "liter", 2.5e6, "utregnet"],
    ["d-fredag13", 3, "Hvor mange fredag den 13. er det i 400 år med dagens kalender?", "ganger", 688, "utregnet", { info: "Den 13. faller oftere på en fredag enn på noen annen ukedag." }],
    ["d-riskorn", 3, "Du legger ett riskorn på første rute på et sjakkbrett, to på den neste, fire på den neste og så videre. Hvor mange riskorn blir det til sammen?", "riskorn", 1.8447e19, "utregnet (2 opphøyd i 64, minus 1)", { ca: true, info: "Det er over 18 trillioner riskorn." }],
    ["d-bursdag", 2, "Hvor mange må være i et rom for at det skal være over 50 prosent sjanse for at to har bursdag samme dag?", "personer", 23, "utregnet (bursdagsparadokset)", { info: "Med 70 personer er sjansen over 99,9 prosent." }],
    ["d-handtrykk", 1, "30 personer på en fest håndhilser på alle de andre én gang. Hvor mange håndtrykk blir det?", "håndtrykk", 435, "utregnet"],
    ["d-yatzy", 2, "Hvor mange kast må du i snitt gjøre med fem terninger for å få yatzy (fem like) på ett kast?", "kast", 1296, "utregnet", { info: "Sjansen er 6 av 7 776 for hvert kast." }],
    ["d-hanoi", 3, "Hvor mange trekk trengs det minst for å flytte et Hanois tårn med ti ringer?", "trekk", 1023, "utregnet (2 opphøyd i 10, minus 1)", { info: "Hver ekstra ring dobler nesten antall trekk." }],
    ["d-bilhjul", 2, "Hvor mange ganger går et bilhjul som er 65 cm i diameter rundt på én kilometer?", "omdreininger", 490, "utregnet", { ca: true }],
    ["d-minuttviser", 1, "Hvor mange ganger går minuttviseren rundt i løpet av et år på 365 dager?", "runder", 8760, "utregnet", { info: "Én runde for hver time i året." }],
    ["d-regn-tak", 2, "Det regner 10 millimeter. Hvor mange liter vann faller på et flatt tak på 100 kvadratmeter?", "liter", 1000, "utregnet", { info: "Hver millimeter nedbør er én liter per kvadratmeter." }],
  ]),
  ...lag("hverdag", "fakta", [
    ["d-sudoku", 3, "Hvor mange ulike ferdig utfylte sudokuer (9 × 9) finnes det?", "sudokuer", 6.670903752021073e21, "Felgenhauer og Jarvis (2005)", { ca: true }],
    ["d-stokking", 3, "På hvor mange ulike måter kan de 52 kortene i en kortstokk ligge i rekkefølge?", "rekkefølger", 8.0658e67, "utregnet (52!)", { ca: true, info: "Trolig har ingen godt stokket kortstokk noen gang ligget likt to ganger." }],
    ["d-poker", 3, "Hvor mange ulike pokerhender på fem kort kan du få fra en vanlig kortstokk?", "hender", 2598960, "utregnet", { info: "Bare fire av dem er royal flush." }],
  ]),
]
