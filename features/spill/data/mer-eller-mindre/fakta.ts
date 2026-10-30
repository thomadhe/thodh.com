import type { MerEllerMindreCategory } from "../types"

// Morsomme tall, som hos lessgames: alle verdier er rene tall uten enhet, og enheten står i navnet eller i detail.
// Alle tall er kontrollert mot engelsk Wikipedia (kilde-URL står bak hver linje) og er ikke tidsavhengige, bortsett
// fra de som er merket «per 2026». Omstridte eller skiftende tall (f.eks. antall Eiffeltårn-malinger, USA-presidenter
// som var venstrehendte, VM-deltakelser for Norge) er utelatt. «avrundet» betyr at kilden oppgir flere sifre.

export const fakta: MerEllerMindreCategory = {
  id: "fakta",
  title: "Morsomme fakta",
  question: "Hvilket tall er størst?",
  winner: "higher",
  format: "integer",
  unit: "",
  separation: { kind: "ratio", value: 1.3 },
  source: "Wikipedia",
  items: [
    { name: "OL-gull til Michael Phelps", value: 23, emoji: "🏊" }, // https://en.wikipedia.org/wiki/Michael_Phelps
    { name: "OL-gull til Usain Bolt", value: 8, emoji: "🏃" }, // https://en.wikipedia.org/wiki/Usain_Bolt
    { name: "OL-medaljer til Marit Bjørgen", value: 15, emoji: "🎿" }, // https://en.wikipedia.org/wiki/Marit_Bj%C3%B8rgen
    { name: "OL-gull til Ole Einar Bjørndalen", value: 8, emoji: "🎯" }, // https://en.wikipedia.org/wiki/Ole_Einar_Bj%C3%B8rndalen
    { name: "Norske medaljer i vinter-OL 2022", value: 37, emoji: "🥇" }, // https://en.wikipedia.org/wiki/2022_Winter_Olympics_medal_table
    { name: "Wimbledon-titler til Roger Federer", value: 8, detail: "herresingel", emoji: "🎾" }, // https://en.wikipedia.org/wiki/Roger_Federer
    { name: "Roland Garros-titler til Rafael Nadal", value: 14, detail: "herresingel", emoji: "🎾" }, // https://en.wikipedia.org/wiki/Rafael_Nadal
    { name: "Poeng Wilt Chamberlain scoret i én kamp", value: 100, emoji: "🏀" }, // https://en.wikipedia.org/wiki/Wilt_Chamberlain
    { name: "Poeng Kobe Bryant scoret i én kamp", value: 81, emoji: "🏀" }, // https://en.wikipedia.org/wiki/Kobe_Bryant
    { name: "Trepoengere av Stephen Curry i 2015/16", value: 402, emoji: "🏀" }, // https://en.wikipedia.org/wiki/Stephen_Curry
    { name: "NBA-titler til Bill Russell", value: 11, emoji: "🏀" }, // https://en.wikipedia.org/wiki/Bill_Russell
    { name: "Super Bowl-seirer for Tom Brady", value: 7, emoji: "🏈" }, // https://en.wikipedia.org/wiki/Tom_Brady
    { name: "VM-titler i Formel 1 for Michael Schumacher", value: 7, emoji: "🏎️" }, // https://en.wikipedia.org/wiki/Michael_Schumacher
    { name: "Seirer for Max Verstappen i 2023-sesongen", value: 19, detail: "Formel 1", emoji: "🏁" }, // https://en.wikipedia.org/wiki/Max_Verstappen
    { name: "Mål av Miroslav Klose i VM", value: 16, emoji: "⚽" }, // https://en.wikipedia.org/wiki/Miroslav_Klose
    { name: "Mål av Just Fontaine i VM 1958", value: 13, emoji: "⚽" }, // https://en.wikipedia.org/wiki/Just_Fontaine
    { name: "NHL-mål av Wayne Gretzky", value: 894, emoji: "🏒" }, // https://en.wikipedia.org/wiki/Wayne_Gretzky
    { name: "Homeruns av Barry Bonds i MLB", value: 762, emoji: "⚾" }, // https://en.wikipedia.org/wiki/Barry_Bonds
    { name: "Premier League-mål av Haaland i 2022/23", value: 36, emoji: "⚽" }, // https://en.wikipedia.org/wiki/Erling_Haaland
    { name: "Ligakamper uten tap på rad for Arsenal", value: 49, detail: "2003–04", emoji: "⚽" }, // https://en.wikipedia.org/wiki/Arsenal_F.C._Invincibles
    { name: "Poeng for Derby i Premier League 2007/08", value: 11, emoji: "⚽" }, // https://en.wikipedia.org/wiki/2007%E2%80%9308_Derby_County_F.C._season
    { name: "Seriegull på rad for Rosenborg", value: 13, emoji: "⚽" }, // https://en.wikipedia.org/wiki/Rosenborg_BK
    { name: "Poeng i en maksimal snookerbreak", value: 147, emoji: "🎱" }, // https://en.wikipedia.org/wiki/Snooker
    { name: "Poeng i en perfekt bowlingkamp", value: 300, emoji: "🎳" }, // https://en.wikipedia.org/wiki/Ten-pin_bowling
    { name: "Minutter i Isner–Mahut (Wimbledon 2010)", value: 665, emoji: "🎾" }, // https://en.wikipedia.org/wiki/Isner%E2%80%93Mahut_match_at_the_2010_Wimbledon_Championships
    { name: "Games i Isner–Mahut (Wimbledon 2010)", value: 183, emoji: "🎾" }, // https://en.wikipedia.org/wiki/Isner%E2%80%93Mahut_match_at_the_2010_Wimbledon_Championships
    { name: "Hull på en vanlig golfbane", value: 18, emoji: "⛳" }, // https://en.wikipedia.org/wiki/Golf_course
    { name: "Spillere på banen i rugby union", value: 15, emoji: "🏉" }, // https://en.wikipedia.org/wiki/Rugby_union
    { name: "Etappeseire for Eddy Merckx i Tour de France", value: 34, emoji: "🚴" }, // https://en.wikipedia.org/wiki/Eddy_Merckx
    { name: "Tour de France-seire for Miguel Induráin", value: 5, emoji: "🚴" }, // https://en.wikipedia.org/wiki/Miguel_Indur%C3%A1in
    { name: "Kilometer i et maraton", value: 42, detail: "avrundet", emoji: "🏃" }, // https://en.wikipedia.org/wiki/Marathon
    { name: "Magnus Carlsens høyeste sjakkrating", value: 2882, emoji: "♟️" }, // https://en.wikipedia.org/wiki/Magnus_Carlsen
    { name: "Lovlige første trekk for hvit i sjakk", value: 20, emoji: "♟️" }, // https://en.wikipedia.org/wiki/Chess
    { name: "Trekk som holder for enhver Rubiks kube", value: 20, emoji: "🧩" }, // https://en.wikipedia.org/wiki/Optimal_solutions_for_the_Rubik's_Cube
    { name: "Felt på et sjakkbrett", value: 64, emoji: "♟️" }, // https://en.wikipedia.org/wiki/Chessboard
    { name: "Baller på et snookerbord", value: 22, emoji: "🎱" }, // https://en.wikipedia.org/wiki/Snooker
    { name: "Mennesker som har gått på månen", value: 12, emoji: "🌕" }, // https://en.wikipedia.org/wiki/Apollo_program
    { name: "Apollo-landinger på månen", value: 6, emoji: "🚀" }, // https://en.wikipedia.org/wiki/Apollo_program
    { name: "Minutter Jurij Gagarins romferd varte", value: 108, emoji: "🧑‍🚀" }, // https://en.wikipedia.org/wiki/Yuri_Gagarin
    { name: "Dager Poljakov var i rommet i ett strekk", value: 437, emoji: "🛰️" }, // https://en.wikipedia.org/wiki/Valeri_Polyakov
    { name: "Oppdrag med romfergene til NASA", value: 135, emoji: "🚀" }, // https://en.wikipedia.org/wiki/Space_Shuttle
    { name: "Stjernebilder anerkjent av IAU", value: 88, emoji: "⭐" }, // https://en.wikipedia.org/wiki/IAU_designated_constellations
    { name: "Objekter i Messiers katalog", value: 110, emoji: "🔭" }, // https://en.wikipedia.org/wiki/Messier_object
    { name: "Planeter i solsystemet", value: 8, emoji: "🪐" }, // https://en.wikipedia.org/wiki/Solar_System
    { name: "Jorddøgn i ett år på Venus", value: 225, detail: "avrundet", emoji: "🪐" }, // https://en.wikipedia.org/wiki/Venus
    { name: "Jorddøgn for én rotasjon av Venus", value: 243, emoji: "🪐" }, // https://en.wikipedia.org/wiki/Venus
    { name: "Jorddøgn i ett år på Merkur", value: 88, emoji: "☿️" }, // https://en.wikipedia.org/wiki/Mercury_%28planet%29
    { name: "Jorddøgn fra soloppgang til neste på Merkur", value: 176, emoji: "☿️" }, // https://en.wikipedia.org/wiki/Mercury_%28planet%29
    { name: "Jorddøgn i ett år på Mars", value: 687, emoji: "🔴" }, // https://en.wikipedia.org/wiki/Mars
    { name: "Jordår i ett år på Neptun", value: 165, detail: "avrundet", emoji: "🔵" }, // https://en.wikipedia.org/wiki/Neptune
    { name: "Jordår i ett år på Pluto", value: 248, detail: "avrundet", emoji: "🌑" }, // https://en.wikipedia.org/wiki/Pluto
    { name: "Meter til toppen av Mount Everest", value: 8849, detail: "avrundet", emoji: "🏔️" }, // https://en.wikipedia.org/wiki/Mount_Everest
    { name: "Meter høyt: Burj Khalifa", value: 828, emoji: "🏙️" }, // https://en.wikipedia.org/wiki/Burj_Khalifa
    { name: "Meter lang: Titanic", value: 269, emoji: "🚢" }, // https://en.wikipedia.org/wiki/Titanic
    { name: "Meter mellom tårnene i Golden Gate Bridge", value: 1280, emoji: "🌉" }, // https://en.wikipedia.org/wiki/Golden_Gate_Bridge
    { name: "Trinn opp til toppen av Big Ben", value: 334, emoji: "🕰️" }, // https://en.wikipedia.org/wiki/Big_Ben
    { name: "Trinn i Empire State Building Run-Up", value: 1576, emoji: "🏢" }, // https://en.wikipedia.org/wiki/Empire_State_Building_Run-Up
    { name: "Kilometer med Transsibirbanen", value: 9289, emoji: "🚂" }, // https://en.wikipedia.org/wiki/Trans-Siberian_Railway
    { name: "Miles langs Route 66", value: 2448, emoji: "🛣️" }, // https://en.wikipedia.org/wiki/U.S._Route_66
    { name: "År Elizabeth II satt på tronen", value: 70, emoji: "👑" }, // https://en.wikipedia.org/wiki/Elizabeth_II
    { name: "År Ludvig XIV var konge", value: 72, emoji: "👑" }, // https://en.wikipedia.org/wiki/Louis_XIV
    { name: "År dronning Victoria satt på tronen", value: 63, emoji: "👑" }, // https://en.wikipedia.org/wiki/Queen_Victoria
    { name: "Koner Henrik VIII giftet seg med", value: 6, emoji: "👑" }, // https://en.wikipedia.org/wiki/Henry_VIII
    { name: "År Hundreårskrigen varte", value: 116, emoji: "⚔️" }, // https://en.wikipedia.org/wiki/Hundred_Years'_War
    { name: "År Berlinmuren sto", value: 28, emoji: "🧱" }, // https://en.wikipedia.org/wiki/Berlin_Wall
    { name: "Medlemsland i FN", value: 193, emoji: "🇺🇳" }, // https://en.wikipedia.org/wiki/United_Nations
    { name: "Medlemsland i EU (per 2026)", value: 27, emoji: "🇪🇺" }, // https://en.wikipedia.org/wiki/European_Union
    { name: "Valgmenn i USAs presidentvalg", value: 538, emoji: "🗳️" }, // https://en.wikipedia.org/wiki/United_States_Electoral_College
    { name: "Medlemmer av USAs Representantenes hus", value: 435, emoji: "🏛️" }, // https://en.wikipedia.org/wiki/United_States_House_of_Representatives
    { name: "Tidssoner i Russland", value: 11, emoji: "🕐" }, // https://en.wikipedia.org/wiki/Time_in_Russia
    { name: "Land i Afrika", value: 54, emoji: "🌍" }, // https://en.wikipedia.org/wiki/Africa
    { name: "Naboland til Kina", value: 14, emoji: "🇨🇳" }, // https://en.wikipedia.org/wiki/China
    { name: "Naboland til Tyskland", value: 9, emoji: "🇩🇪" }, // https://en.wikipedia.org/wiki/Germany
    { name: "Lover i Hammurabis lovkode", value: 282, emoji: "📜" }, // https://en.wikipedia.org/wiki/Code_of_Hammurabi
    { name: "Kapitler i Bibelen", value: 1189, detail: "protestantisk utgave", emoji: "📖" }, // https://en.wikipedia.org/wiki/Chapters_and_verses_of_the_Bible
    { name: "Gaver i «The Twelve Days of Christmas»", value: 364, detail: "til sammen", emoji: "🎁" }, // https://en.wikipedia.org/wiki/The_Twelve_Days_of_Christmas_%28song%29
    { name: "Tegn i Bangkoks fulle seremonielle navn", value: 168, emoji: "🏯" }, // https://en.wikipedia.org/wiki/Bangkok
    { name: "Tegn i Taumatawhakatangi…-fjellets navn", value: 85, emoji: "⛰️" }, // https://en.wikipedia.org/wiki/Taumata_Hill
    { name: "Tegn i Llanfairpwllgwyngyll…-landsbyens navn", value: 58, emoji: "🚉" }, // https://en.wikipedia.org/wiki/Llanfairpwllgwyngyll
    { name: "Bokstaver i det norske alfabetet", value: 29, emoji: "🔤" }, // https://en.wikipedia.org/wiki/Norwegian_alphabet
    { name: "Bokstaver i det russiske alfabetet", value: 33, emoji: "🔤" }, // https://en.wikipedia.org/wiki/Russian_alphabet
    { name: "Bokstaver i det greske alfabetet", value: 24, emoji: "🔤" }, // https://en.wikipedia.org/wiki/Greek_alphabet
    { name: "Brikker i et Scrabble-spill", value: 100, detail: "engelsk utgave", emoji: "🔠" }, // https://en.wikipedia.org/wiki/Scrabble
    { name: "Primtall under 100", value: 25, emoji: "➗" }, // https://en.wikipedia.org/wiki/Prime_number
    { name: "Meter til toppen av Galdhøpiggen", value: 2469, emoji: "⛰️" }, // https://en.wikipedia.org/wiki/Galdh%C3%B8piggen
    { name: "Meter dypt: Hornindalsvatnet", value: 514, emoji: "🏞️" }, // https://en.wikipedia.org/wiki/Hornindalsvatnet
    { name: "Kilometer lang: Sognefjorden", value: 205, emoji: "🌊" }, // https://en.wikipedia.org/wiki/Sognefjord
    { name: "Kilometer lang: Glomma", value: 621, emoji: "🏞️" }, // https://en.wikipedia.org/wiki/Glomma
    { name: "Meter lang: Lærdalstunnelen", value: 24509, emoji: "🚗" }, // https://en.wikipedia.org/wiki/L%C3%A6rdal_Tunnel
    { name: "Kilometer med Nordlandsbanen", value: 729, emoji: "🚆" }, // https://en.wikipedia.org/wiki/Nordland_Line
    { name: "Kilometer med Bergensbanen", value: 496, emoji: "🚆" }, // https://en.wikipedia.org/wiki/Bergen_Line
    { name: "Meter over Lysefjorden: Preikestolen", value: 604, emoji: "🧗" }, // https://en.wikipedia.org/wiki/Preikestolen
    { name: "Hårnålssvinger på Trollstigen", value: 11, emoji: "🛣️" }, // https://en.wikipedia.org/wiki/Trollstigen
    { name: "Tunneler på Flåmsbana", value: 20, emoji: "🚆" }, // https://en.wikipedia.org/wiki/Fl%C3%A5m_Line
    { name: "Skulpturer i Vigelandsparken", value: 212, emoji: "🗿" }, // https://en.wikipedia.org/wiki/Vigeland_installation
    { name: "Kommuner i Norge (per 2026)", value: 357, emoji: "🗺️" }, // https://en.wikipedia.org/wiki/Municipalities_of_Norway
    { name: "Fylker i Norge (per 2026)", value: 15, emoji: "🗺️" }, // https://en.wikipedia.org/wiki/Counties_of_Norway
    { name: "Representanter på Stortinget", value: 169, emoji: "🏛️" }, // https://en.wikipedia.org/wiki/Storting
    { name: "Meter fallhøyde i Vøringsfossen", value: 182, emoji: "💦" }, // https://en.wikipedia.org/wiki/V%C3%B8ringsfossen
    { name: "Norges seirer i Eurovision", value: 3, emoji: "🎤" }, // https://en.wikipedia.org/wiki/Norway_in_the_Eurovision_Song_Contest
    { name: "Nullpoeng for Norge i Eurovision", value: 4, emoji: "🎤" }, // https://en.wikipedia.org/wiki/Norway_in_the_Eurovision_Song_Contest
    { name: "Sesonger av «Skam»", value: 4, emoji: "📱" }, // https://en.wikipedia.org/wiki/Skam_%28TV_series%29
    { name: "Bind i «Min kamp» av Knausgård", value: 6, emoji: "📚" }, // https://en.wikipedia.org/wiki/My_Struggle_%28Knausg%C3%A5rd_book_series%29
    { name: "Bein i menneskekroppen", value: 206, detail: "voksen", emoji: "🦴" }, // https://en.wikipedia.org/wiki/Human_skeleton
    { name: "Tenner hos en voksen person", value: 32, emoji: "🦷" }, // https://en.wikipedia.org/wiki/Human_tooth
    { name: "Melketenner hos barn", value: 20, emoji: "🦷" }, // https://en.wikipedia.org/wiki/Primary_dentition
    { name: "Ribbein hos et menneske", value: 24, emoji: "🫁" }, // https://en.wikipedia.org/wiki/Rib_cage
    { name: "Bein i en menneskehånd", value: 27, detail: "inkl. håndledd", emoji: "✋" }, // https://en.wikipedia.org/wiki/Hand
    { name: "Bein i en menneskefot", value: 26, emoji: "🦶" }, // https://en.wikipedia.org/wiki/Foot
    { name: "Bein i menneskets hodeskalle", value: 22, emoji: "💀" }, // https://en.wikipedia.org/wiki/Skull
    { name: "Kromosomer hos mennesket", value: 46, emoji: "🧬" }, // https://en.wikipedia.org/wiki/Human_genome
    { name: "Hjerter en blekksprut har", value: 3, emoji: "🐙" }, // https://en.wikipedia.org/wiki/Cephalopod
    { name: "Nakkevirvler hos en giraff", value: 7, emoji: "🦒" }, // https://en.wikipedia.org/wiki/Giraffe
    { name: "Øyne på en honningbie", value: 5, emoji: "🐝" }, // https://en.wikipedia.org/wiki/Honey_bee
    { name: "Tenner hos en voksen hund", value: 42, emoji: "🐕" }, // https://en.wikipedia.org/wiki/Dog
    { name: "Tenner hos en voksen katt", value: 30, emoji: "🐈" }, // https://en.wikipedia.org/wiki/Cat
    { name: "Mageavdelinger hos en ku", value: 4, emoji: "🐄" }, // https://en.wikipedia.org/wiki/Cattle
    { name: "Måneder drektighet hos en elefant", value: 22, emoji: "🐘" }, // https://en.wikipedia.org/wiki/African_elephant
    { name: "Bjørnearter i verden", value: 8, emoji: "🐻" }, // https://en.wikipedia.org/wiki/Bear
    { name: "Bein på tusenbeinet Eumillipes persephone", value: 1306, emoji: "🐛" }, // https://en.wikipedia.org/wiki/Eumillipes_persephone
    { name: "Pølser Joey Chestnut spiste på 10 minutter", value: 76, emoji: "🌭" }, // https://en.wikipedia.org/wiki/Joey_Chestnut
    { name: "Stykker i et bakerdusin", value: 13, emoji: "🥖" }, // https://en.wikipedia.org/wiki/Baker's_dozen
    { name: "Centiliter i en vanlig vinflaske", value: 75, emoji: "🍷" }, // https://en.wikipedia.org/wiki/Wine_bottle
    { name: "Oscar-statuetter til «Titanic»", value: 11, emoji: "🎬" }, // https://en.wikipedia.org/wiki/Titanic_%281997_film%29
    { name: "Oscar-statuetter til «Oppenheimer»", value: 7, emoji: "🎬" }, // https://en.wikipedia.org/wiki/Oppenheimer_%28film%29
    { name: "Filmer i Marvels Infinity Saga", value: 23, emoji: "🦸" }, // https://en.wikipedia.org/wiki/Infinity_Saga
    { name: "Bond-filmer fra Eon (per 2026)", value: 25, emoji: "🕵️" }, // https://en.wikipedia.org/wiki/List_of_James_Bond_films
    { name: "Filmer i Star Wars-hovedserien", value: 9, emoji: "⚔️" }, // https://en.wikipedia.org/wiki/Star_Wars
    { name: "Episoder av «Friends»", value: 236, emoji: "☕" }, // https://en.wikipedia.org/wiki/Friends
    { name: "Episoder av «Seinfeld»", value: 180, emoji: "📺" }, // https://en.wikipedia.org/wiki/Seinfeld
    { name: "Episoder av «The Office» (USA)", value: 201, emoji: "📎" }, // https://en.wikipedia.org/wiki/The_Office_%28American_TV_series%29
    { name: "Episoder av «Lost»", value: 121, emoji: "🏝️" }, // https://en.wikipedia.org/wiki/Lost_%28TV_series%29
    { name: "Episoder av «How I Met Your Mother»", value: 208, emoji: "🎩" }, // https://en.wikipedia.org/wiki/How_I_Met_Your_Mother
    { name: "Episoder av «The Big Bang Theory»", value: 279, emoji: "🧪" }, // https://en.wikipedia.org/wiki/The_Big_Bang_Theory
    { name: "Episoder av «Breaking Bad»", value: 62, emoji: "🧪" }, // https://en.wikipedia.org/wiki/Breaking_Bad
    { name: "Episoder av «Game of Thrones»", value: 73, emoji: "🐉" }, // https://en.wikipedia.org/wiki/Game_of_Thrones
    { name: "Sesonger av «Stranger Things»", value: 5, emoji: "🔦" }, // https://en.wikipedia.org/wiki/Stranger_Things
    { name: "Pokémon i første generasjon", value: 151, emoji: "⚡" }, // https://en.wikipedia.org/wiki/List_of_generation_I_Pok%C3%A9mon
    { name: "Typer i Pokémon", value: 18, emoji: "🔥" }, // https://en.wikipedia.org/wiki/Pok%C3%A9mon_%28video_game_series%29
    { name: "Baner i Super Mario Bros. (1985)", value: 32, emoji: "🍄" }, // https://en.wikipedia.org/wiki/Super_Mario_Bros.
    { name: "Nivået der Pac-Man krasjer", value: 256, emoji: "👾" }, // https://en.wikipedia.org/wiki/Pac-Man
    { name: "Ruter på et Monopol-brett", value: 40, emoji: "🎲" }, // https://en.wikipedia.org/wiki/Monopoly_%28game%29
    { name: "Kort i en Uno-kortstokk", value: 108, emoji: "🃏" }, // https://en.wikipedia.org/wiki/Uno_%28card_game%29
    { name: "Kort i en tarotkortstokk", value: 78, emoji: "🔮" }, // https://en.wikipedia.org/wiki/Tarot
    { name: "Brikker i et dominosett (dobbel-seks)", value: 28, emoji: "🎴" }, // https://en.wikipedia.org/wiki/Dominoes
    { name: "Maks poengsum i Yatzy", value: 374, emoji: "🎲" }, // https://en.wikipedia.org/wiki/Yatzy
    { name: "Taster på et piano", value: 88, emoji: "🎹" }, // https://en.wikipedia.org/wiki/Piano
    { name: "Studioalbum av The Beatles i Storbritannia", value: 12, emoji: "🎸" }, // https://en.wikipedia.org/wiki/The_Beatles_discography
    { name: "Hot 100-førsteplasser for The Beatles", value: 20, emoji: "🎵" }, // https://en.wikipedia.org/wiki/The_Beatles
    { name: "Konserter på Taylor Swifts Eras Tour", value: 149, emoji: "🎤" }, // https://en.wikipedia.org/wiki/The_Eras_Tour
    { name: "Sekunder i «Bohemian Rhapsody»", value: 355, emoji: "🎶" }, // https://en.wikipedia.org/wiki/Bohemian_Rhapsody
    { name: "Sekunder i «Stairway to Heaven»", value: 482, emoji: "🎸" }, // https://en.wikipedia.org/wiki/Stairway_to_Heaven
    { name: "Sekunder i «All Too Well» (lang versjon)", value: 613, emoji: "🧣" }, // https://en.wikipedia.org/wiki/All_Too_Well_%2810_Minute_Version%29
    { name: "Uker på Hot 100-toppen: «Old Town Road»", value: 19, emoji: "🤠" }, // https://en.wikipedia.org/wiki/Old_Town_Road
    { name: "Nummererte symfonier av Mozart", value: 41, emoji: "🎻" }, // https://en.wikipedia.org/wiki/Wolfgang_Amadeus_Mozart
    { name: "Nummererte symfonier av Haydn", value: 104, emoji: "🎻" }, // https://en.wikipedia.org/wiki/List_of_symphonies_by_Joseph_Haydn
    { name: "Historier om Sherlock Holmes", value: 60, emoji: "🔍" }, // https://en.wikipedia.org/wiki/Sherlock_Holmes
    { name: "Forestillinger av «Phantom of the Opera»", value: 13981, detail: "på Broadway", emoji: "🎭" }, // https://en.wikipedia.org/wiki/The_Phantom_of_the_Opera_%28musical%29
    { name: "Maktens ringer i «Ringenes herre»", value: 20, emoji: "💍" }, // https://en.wikipedia.org/wiki/One_Ring
    { name: "Svarord i den opprinnelige Wordle-listen", value: 2315, emoji: "🟩" }, // https://en.wikipedia.org/wiki/Wordle
  ],
}
