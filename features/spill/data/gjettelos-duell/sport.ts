import { lag } from "../gjettelos/typer"

// Sport, bare for Gjetteløs-duell. Hvert tall er sjekket mot kilden som står ved spørsmålet; "utregnet" betyr at svaret
// følger av tallene i spørsmålet. "anslag" er tall man må resonnere seg fram til; "fakta" er oppslag, mål og årstall.

export const sport = [
  ...lag("sport", "anslag", [
    ["d-handball-vm", 2, "Hvor mange VM-gull hadde Norges kvinnelandslag i håndball vunnet etter VM i 2025?", "VM-gull", 5, "IHF", { per: "2025", info: "Gullene kom i 1999, 2011, 2015, 2021 og 2025." }],
    ["d-bjorgen-seire", 2, "Hvor mange verdenscupseire vant Marit Bjørgen, medregnet etapper?", "seire", 114, "Guinness World Records", { info: "Det er rekord i langrenn." }],
    ["d-djokovic", 2, "Hvor mange Grand Slam-titler i single har Novak Djokovic vunnet?", "titler", 24, "ATP", { per: "2026", info: "Han deler rekorden med Margaret Court." }],
    ["d-maracana", 3, "Hvor mange tilskuere var offisielt til stede på Maracanã da VM i 1950 ble avgjort, rekorden for en fotballkamp?", "tilskuere", 173850, "Guinness World Records", { info: "Uoffisielt var det kanskje nær 200 000." }],
    ["d-sjakk-4-halvtrekk", 3, "Hvor mange ulike partier finnes det etter at hvit og svart har gjort to trekk hver?", "partier", 197281, "utregnet (OEIS A048987)", { info: "Etter ett trekk hver er det 400." }],
    ["d-eliteserien", 2, "Hvor mange kamper spilles det i Eliteserien i fotball i løpet av en sesong?", "kamper", 240, "NFF", { per: "2026", info: "16 lag møter hverandre hjemme og borte." }],
    ["d-vm-2026", 2, "Hvor mange kamper ble spilt i fotball-VM i 2026, det første med 48 lag?", "kamper", 104, "FIFA", { per: "2026", info: "I VM 2022, med 32 lag, var det 64 kamper." }],
    ["d-wimbledon", 2, "128 spillere er med i herresingelen i Wimbledon. Hvor mange kamper må spilles for å kåre en vinner?", "kamper", 127, "utregnet", { info: "Hver kamp slår ut én spiller, så alle unntatt vinneren må tape én gang." }],
  ]),
  ...lag("sport", "fakta", [
    ["d-haaland-sesong", 2, "Hvor mange Premier League-mål scoret Erling Haaland i sesongen 2022–23, som er rekord?", "mål", 36, "Premier League", { info: "Den forrige rekorden i en sesong med 38 kamper var Mohamed Salahs 32 mål." }],
    ["d-skiflyging", 2, "Hvor langt er verdensrekorden i skiflyging?", "meter", 254.5, "FIS", { per: "2025", info: "Domen Prevc satte den i Planica i mars 2025." }],
    ["d-stavsprang", 2, "Hvor høyt er verdensrekorden i stavsprang for menn?", "meter", 6.31, "World Athletics", { per: "2026", info: "Armand Duplantis har slått verdensrekorden 15 ganger." }],
    ["d-hoyde", 2, "Hvor høyt hoppet Javier Sotomayor da han satte verdensrekorden i høyde i 1993?", "meter", 2.45, "Guinness World Records", { info: "Ingen andre har hoppet høyere enn 2,43." }],
    ["d-ironman", 2, "Hvor mange kilometer svømmer, sykler og løper man til sammen i en full Ironman?", "km", 226, "Ironman", { ca: true, info: "3,86 km svømming, 180,25 km sykling og en hel maraton." }],
    ["d-birken-lengde", 1, "Hvor lang er Birkebeinerrennet på ski?", "km", 53, "Birkebeinerrennet", { per: "2026", info: "Løypa ble målt til 52,9 km i 2026, men rennet har lenge vært kjent som 54 km." }],
    ["d-serve", 3, "Hvor fort gikk den raskeste serven som er målt i tennis, slått av Sam Groth i 2012?", "km/t", 263, "Guinness World Records", { ca: true, info: "ATP godkjenner den ikke, fordi radaren ikke var kalibrert." }],
    ["d-carlsen-vm", 1, "Hvor mange VM-titler i klassisk sjakk vant Magnus Carlsen?", "VM-titler", 5, "Store norske leksikon", { info: "2013, 2014, 2016, 2018 og 2021." }],
    ["d-dronninger", 3, "På hvor mange ulike måter kan du sette åtte dronninger på et sjakkbrett uten at noen av dem kan slå hverandre?", "måter", 92, "utregnet (åttedronningerproblemet)", { info: "Bare 12 av løsningene er helt ulike når du ser bort fra speilinger og dreiinger." }],
  ]),
]
