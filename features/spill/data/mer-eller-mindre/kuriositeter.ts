import type { MerEllerMindreCategory } from "../types"

// Salgspris (inkludert kjøpers avgifter der kilden oppgir det) for kjente og snodige ting som er solgt på
// auksjon eller i private salg, fra en Cheeto formet som Charizard til Salvator Mundi. Nominelle beløp i salgsåret.
// Beløpene er omregnet til norske kroner med ett fast kurs per valuta (ECB-referansekurser 29. oktober 2026,
// avrundet): USD 9.3, EUR 10.3, GBP 12.4, CHF 11.2, SEK 0.94, JPY 0.059, CAD 6.6, BRL 1.73 kroner.
// Hver verdi er avrundet til to gjeldende siffer. Kilden til hvert tall står som lenke etter varen.

export const kuriositeter: MerEllerMindreCategory = {
  id: "kuriositeter",
  title: "Solgt for",
  question: "Hva ble solgt for mest?",
  winner: "higher",
  format: "compact",
  unit: "kr",
  separation: { kind: "ratio", value: 1.5 },
  source: "Auksjoner m.m., omregnet til kroner",
  items: [
    { name: "Cheetozard (Charizard-Cheeto)", value: 820000, detail: "Auksjon · 2025", emoji: "🔥" }, // https://www.cllct.com/sports-collectibles/cllcttv/someone-spent-almost-88-000-on-a-cheeto-shaped-like-charizard-why
    { name: "Ostesmørbrød med Jomfru Maria", value: 260000, detail: "eBay · 2004", emoji: "🥪" }, // https://www.nbcnews.com/id/wbna6511148
    { name: "Napoleons hatt", value: 19000000, detail: "Auksjon · 2014", emoji: "🎩" }, // https://www.artnet.com/market/napoleons-hat-sells-for-22-million-172335
    { name: "Jordans «Last Dance»-trøye", value: 94000000, detail: "Auksjon · 2022", emoji: "🏀" }, // https://en.wikipedia.org/wiki/1998_NBA_Finals
    { name: "Wembanyamas debuttrøye", value: 7100000, detail: "Auksjon · 2023", emoji: "🏀" }, // https://www.cbssports.com/nba/news/victor-wembanyamas-spurs-rookie-debut-jersey-sells-for-record-762000-at-auction
    { name: "Mantle-kortet (1952 Topps)", value: 120000000, detail: "Samlekort · 2022", emoji: "⚾" }, // https://en.wikipedia.org/wiki/List_of_most_expensive_sports_cards
    { name: "Jordan/Kobe-kortet (Logoman)", value: 120000000, detail: "Samlekort · 2025", emoji: "🏀" }, // https://en.wikipedia.org/wiki/List_of_most_expensive_sports_cards
    { name: "Honus Wagner-kortet", value: 67000000, detail: "Samlekort · 2022", emoji: "⚾" }, // https://en.wikipedia.org/wiki/List_of_most_expensive_sports_cards
    { name: "Babe Ruth-kortet (1914)", value: 67000000, detail: "Samlekort · 2023", emoji: "⚾" }, // https://en.wikipedia.org/wiki/List_of_most_expensive_sports_cards
    { name: "LeBron James-rookiekortet", value: 48000000, detail: "Samlekort · 2021", emoji: "🏀" }, // https://en.wikipedia.org/wiki/List_of_most_expensive_sports_cards
    { name: "Luka Dončić-kortet", value: 43000000, detail: "Samlekort · 2021", emoji: "🏀" }, // https://en.wikipedia.org/wiki/List_of_most_expensive_sports_cards
    { name: "Patrick Mahomes-rookiekortet", value: 40000000, detail: "Samlekort · 2021", emoji: "🏈" }, // https://en.wikipedia.org/wiki/List_of_most_expensive_sports_cards
    { name: "Tom Brady-rookiekortet", value: 29000000, detail: "Samlekort · 2021", emoji: "🏈" }, // https://en.wikipedia.org/wiki/List_of_most_expensive_sports_cards
    { name: "Wayne Gretzky-rookiekortet", value: 35000000, detail: "Samlekort · 2021", emoji: "🏒" }, // https://en.wikipedia.org/wiki/List_of_most_expensive_sports_cards
    { name: "Mike Trout-kortet", value: 37000000, detail: "Samlekort · 2020", emoji: "⚾" }, // https://en.wikipedia.org/wiki/List_of_most_expensive_sports_cards
    { name: "Pikachu Illustrator", value: 150000000, detail: "Pokémon-kort · 2026", emoji: "⚡" }, // https://en.wikipedia.org/wiki/List_of_most_expensive_cards_from_collectible_card_games
    { name: "The One Ring (Magic-kort)", value: 19000000, detail: "Samlekort · 2023", emoji: "💍" }, // https://en.wikipedia.org/wiki/List_of_most_expensive_cards_from_collectible_card_games
    { name: "Babe Ruths «Called Shot»-trøye", value: 220000000, detail: "Auksjon · 2024", emoji: "⚾" }, // https://en.wikipedia.org/wiki/Babe_Ruth's_called_shot
    { name: "Maradonas «Guds hånd»-trøye", value: 88000000, detail: "Auksjon · 2022", emoji: "⚽" }, // https://en.wikipedia.org/wiki/The_hand_of_God
    { name: "Ballen fra «Guds hånd»", value: 31000000, detail: "Auksjon · 2026", emoji: "⚽" }, // https://en.wikipedia.org/wiki/The_hand_of_God
    { name: "Ohtanis 50. homerun-ball", value: 41000000, detail: "Auksjon · 2024", emoji: "⚾" }, // https://www.cbssports.com/mlb/news/dodgers-shohei-ohtanis-50th-home-run-ball-sells-for-4-39-million-at-auction
    { name: "McGwires 70. homerun-ball", value: 28000000, detail: "Auksjon · 1999", emoji: "⚾" }, // https://www.cbssports.com/mlb/news/dodgers-shohei-ohtanis-50th-home-run-ball-sells-for-4-39-million-at-auction
    { name: "Muratovs Nobelmedalje", value: 960000000, detail: "Auksjon · 2022", emoji: "🏅" }, // https://en.wikipedia.org/wiki/Dmitry_Muratov
    { name: "Watsons Nobelmedalje", value: 38000000, detail: "Auksjon · 2014", emoji: "🏅" }, // https://en.wikipedia.org/wiki/James_Watson
    { name: "Steve Jobs' sandaler", value: 2000000, detail: "Auksjon · 2022", emoji: "🩴" }, // https://www.cbsnews.com/amp/news/steve-jobs-birkenstock-sandals-sold-auction-218750-apple
    { name: "Jobs' jobbsøknad", value: 2100000, detail: "Auksjon · 2021", emoji: "📝" }, // https://www.macrumors.com/2021/03/24/steve-jobs-employment-questionnaire/amp/
    { name: "Cobains MTV Unplugged-gitar", value: 56000000, detail: "Auksjon · 2020", emoji: "🎸" }, // https://en.wikipedia.org/wiki/MTV_Unplugged_in_New_York
    { name: "Gilmours «Black Strat»", value: 37000000, detail: "Auksjon · 2019", emoji: "🎸" }, // https://en.wikipedia.org/wiki/The_Black_Strat
    { name: "Freddie Mercurys flygel", value: 21000000, detail: "Auksjon · 2023", emoji: "🎹" }, // https://en.wikipedia.org/wiki/Freddie_Mercury
    { name: "Michael Jacksons «Thriller»-jakke", value: 17000000, detail: "Auksjon · 2011", emoji: "🧥" }, // https://en.wikipedia.org/wiki/Thriller_jacket
    { name: "«Titanic»-døra", value: 6700000, detail: "Auksjon · 2024", emoji: "🚪" }, // https://www.deseret.com/business/2024/03/28/titanic-door-prop-sold-for-700-thousand
    { name: "Batmobilen fra 1966", value: 39000000, detail: "Auksjon · 2013", emoji: "🦇" }, // https://en.wikipedia.org/wiki/Batmobile
    { name: "R2-D2 fra «Star Wars»", value: 26000000, detail: "Auksjon · 2017", emoji: "🤖" }, // https://www.wtvy.com/content/news/R2-D2-Droid-Used-in-Star-Wars-Films-Sells-For-276m-431388303.html
    { name: "Månestøv fra Luna 16", value: 8000000, detail: "Auksjon · 2018", emoji: "🌕" }, // https://en.wikipedia.org/wiki/Luna_16
    { name: "Armstrongs månepose", value: 17000000, detail: "Auksjon · 2017", emoji: "👨‍🚀" }, // https://www.collectspace.com/news/news-072017a-sothebys-space-auction-moon-bag.html
    { name: "Romdrakt fra Apollo–Sojuz", value: 2300000, detail: "Sokol-drakt · Auksjon 2011", emoji: "🧑‍🚀" }, // https://space.com/11600-russian-spacesuit-auction-human-spaceflight-50th-anniversary.html
    { name: "Marilyns «Happy Birthday»-kjole", value: 45000000, detail: "Auksjon · 2016", emoji: "👗" }, // https://abc30.com/happy-birthday-mr-president-marilyn-monroe-dress/1613991/
    { name: "Dianas «black sheep»-genser", value: 10000000, detail: "Auksjon · 2023", emoji: "🐑" }, // https://www.aljazeera.com/news/2023/9/15/princess-dianas-iconic-black-sheep-sweater-sells-at-auction-for-1-1m
    { name: "John Lennons tann", value: 290000, detail: "Auksjon · 2011", emoji: "🦷" }, // https://www.cbsnews.com/news/john-lennons-tooth-sells-for-more-than-31000
    { name: "Dorothys rubinsko", value: 300000000, detail: "Auksjon · 2024", emoji: "👠" }, // https://www.nbcnews.com/news/us-news/ruby-slippers-worn-judy-garland-wizard-oz-sell-325-million-auction-rcna183339
    { name: "T. rex «Stan»", value: 300000000, detail: "Fossil · 2020", emoji: "🦖" }, // https://en.wikipedia.org/wiki/Stan_(dinosaur)
    { name: "T. rex «Sue»", value: 77000000, detail: "Fossil · 1997", emoji: "🦖" }, // https://en.wikipedia.org/wiki/Sue_(dinosaur)
    { name: "Stegosaurus «Apex»", value: 410000000, detail: "Fossil · 2024", emoji: "🦕" }, // https://en.wikipedia.org/wiki/Apex_(dinosaur)
    { name: "Triceratops «Big John»", value: 68000000, detail: "Fossil · 2021", emoji: "🦕" }, // https://en.wikipedia.org/wiki/Big_John_(dinosaur)
    { name: "Salvator Mundi", value: 4200000000, detail: "Maleri · Leonardo · 2017", emoji: "🖼️" }, // https://en.wikipedia.org/wiki/Salvator_Mundi_(painting)
    { name: "Skrik (pastellversjonen)", value: 1100000000, detail: "Maleri · Munch · 2012", emoji: "😱" }, // https://en.wikipedia.org/wiki/The_Scream
    { name: "Love is in the Bin", value: 230000000, detail: "Kunst · Banksy · 2021", emoji: "🎈" }, // https://en.wikipedia.org/wiki/Love_Is_in_the_Bin
    { name: "Beeples «Everydays»", value: 640000000, detail: "Digital kunst · 2021", emoji: "💻" }, // https://en.wikipedia.org/wiki/Everydays:_the_First_5000_Days
    { name: "Dorseys første tweet (NFT)", value: 27000000, detail: "NFT · 2021", emoji: "🐦" }, // https://www.engadget.com/jack-dorsey-first-tweet-nft-sells-for-2-9-million-214729911.html
    { name: "Charlie bit my finger (NFT)", value: 7100000, detail: "NFT · 2021", emoji: "👶" }, // https://en.wikipedia.org/wiki/Charlie_Bit_My_Finger
    { name: "Super Mario 64 (forseglet)", value: 15000000, detail: "Videospill · 2021", emoji: "🍄" }, // https://en.wikipedia.org/wiki/Super_Mario_Bros.
    { name: "Super Mario Bros. (forseglet)", value: 19000000, detail: "Videospill · 2021", emoji: "🍄" }, // https://en.wikipedia.org/wiki/Super_Mario_Bros.
    { name: "Nintendo PlayStation-prototypen", value: 3300000, detail: "Spillkonsoll · 2020", emoji: "🎮" }, // https://en.wikipedia.org/wiki/Super_NES_CD-ROM
    { name: "1933 Double Eagle", value: 180000000, detail: "Gullmynt · 2021", emoji: "🪙" }, // https://en.wikipedia.org/wiki/1933_double_eagle
    { name: "British Guiana 1c magenta", value: 88000000, detail: "Frimerke · 2014", emoji: "✉️" }, // https://en.wikipedia.org/wiki/British_Guiana_1c_magenta
    { name: "Treskilling Yellow", value: 32000000, detail: "Frimerke · 1996", emoji: "✉️" }, // https://en.wikipedia.org/wiki/Treskilling_Yellow
    { name: "USAs grunnlov (førstetrykk)", value: 400000000, detail: "Dokument · 2021", emoji: "📜" }, // https://en.wikipedia.org/wiki/List_of_most_expensive_books_and_manuscripts
    { name: "Codex Leicester", value: 290000000, detail: "Notatbok · Leonardo · 1994", emoji: "📖" }, // https://en.wikipedia.org/wiki/Codex_Leicester
    { name: "Magna Carta (1297)", value: 200000000, detail: "Dokument · 2007", emoji: "📜" }, // https://en.wikipedia.org/wiki/List_of_most_expensive_books_and_manuscripts
    { name: "Einsteins «Gud-brev»", value: 27000000, detail: "Brev · 2018", emoji: "✉️" }, // https://en.wikipedia.org/wiki/Religious_and_philosophical_views_of_Albert_Einstein
    { name: "Pink Star", value: 660000000, detail: "Diamant · 2017", emoji: "💎" }, // https://en.wikipedia.org/wiki/Pink_Star_(diamond)
    { name: "Oppenheimer Blue", value: 470000000, detail: "Diamant · 2016", emoji: "💎" }, // https://en.wikipedia.org/wiki/Oppenheimer_Blue
    { name: "La Peregrina-perlen", value: 100000000, detail: "Perle · Liz Taylor · 2011", emoji: "🦪" }, // https://en.wikipedia.org/wiki/La_Peregrina_pearl
    { name: "Fabergé Rothschild-egget", value: 110000000, detail: "Fabergé-egg · 2007", emoji: "🥚" }, // https://en.wikipedia.org/wiki/Rothschild_(Fabergé_egg)
    { name: "Henckel von Donnersmarck-tiaraen", value: 130000000, detail: "Tiara · 2011", emoji: "👑" }, // https://www.pricescope.com/blog/emerald-and-diamond-tiara-sets-world-auction-record
    { name: "Mercedes 300 SLR Uhlenhaut", value: 1400000000, detail: "Bil · 2022", emoji: "🏎️" }, // https://www.cbsnews.com/news/mercedes-sotheys-record-price-143-million
    { name: "Tunfisk på 278 kg", value: 20000000, detail: "Fiskemarked · Tokyo 2019", emoji: "🐟" }, // https://www.cnbc.com/2019/01/05/tuna-sells-for-record-3-million-in-auction-at-tokyos-new-fish-market.html
    { name: "Bitcoin-pizzaene", value: 380, detail: "Kjøpt med 10 000 BTC · 2010", emoji: "🍕" }, // https://www.guinnessworldrecords.com/world-records/696240-first-commercial-bitcoin-transaction
  ],
}
