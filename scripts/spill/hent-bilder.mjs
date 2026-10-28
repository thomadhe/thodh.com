#!/usr/bin/env node
// Henter bilde-URL-er (hotlink, ingen filer lastes ned) til «Mer eller mindre»-kortene og skriver
// features/spill/data/mer-eller-mindre/bilder.json: { "<kategori>::<navn>": { src, kilde? } }.
// Kort uten sikkert treff utelates; UI-et faller da tilbake til emoji.
//
// Kilder: Deezer (artister, låter), TVmaze (serier), engelsk Wikipedia-plakat (filmer; ikke-frie
// plakater, som lessgames), flagcdn (land), Wikipedia PageImages med frie lisenser (alt annet, og
// reserve for artister og serier).
// (iTunes Search ble vurdert, men film-søket der gir 0 treff per okt. 2026.)
//
// Bruk:
//   node scripts/spill/hent-bilder.mjs                 alle kategorier
//   node scripts/spill/hent-bilder.mjs --only=dyr-vekt,hoyde   bare disse (andre beholdes i bilder.json)
//   node scripts/spill/hent-bilder.mjs --refresh       ignorer cachen
//   node scripts/spill/hent-bilder.mjs --dry           bare fyll cachen, ikke skriv bilder.json
//
// Alle API-svar caches i %TEMP%/mel-bilder-cache (eller MEL_BILDER_CACHE). Et avbrutt løp kan derfor
// bare startes på nytt: det fortsetter der det slapp, og et fullt løp med varm cache tar sekunder.
// En diagnoserapport (kilde, treff-tittel, fil) skrives til <cache>/rapport.tsv for stikkprøver.

import { createHash } from "node:crypto"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const DATA_DIR = path.join(ROOT, "features/spill/data/mer-eller-mindre")
const OUT_FILE = path.join(DATA_DIR, "bilder.json")
const CACHE_DIR = process.env.MEL_BILDER_CACHE || path.join(os.tmpdir(), "mel-bilder-cache")
const UA = "thodh.com-spill/1.0 (thodhel@gmail.com)"

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const optList = (name) => {
  const a = args.find((x) => x.startsWith(`--${name}=`))
  return a ? a.slice(name.length + 3).split(",").filter(Boolean) : null
}
const ONLY = optList("only")
const DRY = flag("dry") // bare fyll cachen, ikke skriv bilder.json
const REFRESH = flag("refresh")

fs.mkdirSync(path.join(CACHE_DIR, "http"), { recursive: true })

// ---------------------------------------------------------------------------------------------
// Overstyringer. Nøkkel = "<kategori>::<navn>".
//   null                    → aldri bilde (kjent feiltreff uten god erstatning)
//   { wiki: "Tittel" }      → bruk denne no.wikipedia-artikkelen (eller { wiki, lang: "en" })
//   { deezer: "Navn" }      → søk etter dette artistnavnet på Deezer
//   { tvmaze: "Navn" }      → søk etter dette serienavnet på TVmaze
//   { src, kilde }          → fast bilde
// ---------------------------------------------------------------------------------------------
const OVERRIDES = {
  // Artister
  "artister-alder::Marie Ulven (girl in red)": { deezer: "girl in red" },
  "artister-alder::Lukas Forchhammer": { wiki: "Lukas Forchhammer", lang: "en" },
  "artister-alder::Pink": { deezer: "P!nk" },
  "artister-lyttere::Pink": { deezer: "P!nk" },
  "artister-alder::Lisa": { wiki: "Lisa (rapper)", lang: "en" },
  "artister-lyttere::Ghost": { wiki: "Ghost (Swedish band)", lang: "en" },
  "artister-alder::Sissel Kyrkjebø": { deezer: "Sissel" },
  "artister-alder::Pjotr Tsjajkovskij": { deezer: "Pyotr Ilyich Tchaikovsky" },
  "artister-alder::Tix": { deezer: "TIX" },

  // Serier: navnet på TVmaze
  "serier-imdb::Arcane": { tvmaze: "Arcane: League of Legends" },
  "serier-imdb::Money Heist": { tvmaze: "La Casa de Papel" },
  "serier-imdb::Forbrytelsen": { tvmaze: "Forbrydelsen" },
  "serier-imdb::Dahmer – Monster": { wiki: "Dahmer – Monster: The Jeffrey Dahmer Story" },

  // Filmer
  "filmer-imdb::Borat": { wiki: "Borat" },
  "filmer-inntekter::Borat": { wiki: "Borat" },
  "filmer-imdb::Roman Holiday": { wiki: "Roman Holiday" },
  "filmer-imdb::The Pianist": { wiki: "The Pianist (2002 film)" },
  "filmer-inntekter::Gravity": { wiki: "Gravity (2013 film)" },

  // Avstand fra Oslo
  "avstand-oslo::Napoli": { wiki: "Naples", lang: "en" },
  "avstand-oslo::Edinburgh": { wiki: "Edinburgh", lang: "en" },
  "avstand-oslo::Kolkata": { wiki: "Kolkata", lang: "en" }, // no.wiki-bildet er bystyrets emblem
  "avstand-oslo::Denpasar": { wiki: "Denpasar", lang: "en" },
  "avstand-oslo::La Paz": { wiki: "La Paz", lang: "en" },
  "avstand-oslo::Fredrikstad": { wiki: "Fredrikstad", lang: "en" },
  "avstand-oslo::Narvik": { wiki: "Narvik", lang: "en" },
  "avstand-oslo::Nicosia": { wiki: "Nicosia", lang: "en" },
  "avstand-oslo::Palma": { wiki: "Palma de Mallorca", lang: "en" },
  "avstand-oslo::Brussel": { wiki: "Brussels", lang: "en" },
  "hoyde::Chrysler Building": { file: "Chrysler Building Nov 2021.jpg" },
  "avstand-oslo::Hongkong": { wiki: "Victoria Harbour", lang: "en" }, // artikkelbildene er flagg
  "avstand-oslo::Singapore": { wiki: "Marina Bay Sands", lang: "en" },
  "avstand-oslo::Monaco": { wiki: "Monte Carlo", lang: "en" },
  "avstand-oslo::Abu Dhabi": { wiki: "Abu Dhabi", lang: "en" },
  "mat-kalorier::Kyllingfilet": null, // bare bilder av levende høns
  "hva-kom-forst::Telefonen": { wiki: "Telephone", lang: "en" },
  "hva-kom-forst::Første Nobels fredspris": { wiki: "Frédéric Passy", lang: "en" },
  "hva-kom-forst::Möller's Tran": { wiki: "Tran" },
  "hva-kom-forst::Ringnes": { wiki: "Ringnes", lang: "en" },

  // Dyr
  "dyr-vekt::Galápagoskjempeskilpadde": { wiki: "Galápagos tortoise", lang: "en" },
  "dyr-vekt::Hummer": { wiki: "European lobster", lang: "en" },
  "dyr-vekt::Kattelemur": { wiki: "Ring-tailed lemur", lang: "en" },
  "dyr-vekt::Rød kenguru": { wiki: "Red kangaroo", lang: "en" },
  "dyr-vekt::Stillehavskjempeblekksprut": { wiki: "Giant Pacific octopus", lang: "en" },
  "dyr-vekt::Tretået dovendyr": { wiki: "Three-toed sloth", lang: "en" },

  // Høyde
  "hoyde::Akashi Kaikyō-broen": { wiki: "Akashi Kaikyō Bridge", lang: "en" },
  "hoyde::Iguazú-fallene": { wiki: "Iguazu Falls", lang: "en" },
  "hoyde::Kinabalu": { wiki: "Mount Kinabalu", lang: "en" },
  "hoyde::Kristus Forløseren": { wiki: "Christ the Redeemer (statue)", lang: "en" },
  "hoyde::Leshan-buddhaen": { wiki: "Leshan Giant Buddha", lang: "en" },
  "hoyde::Milad-tårnet": { wiki: "Milad Tower", lang: "en" },
  "hoyde::Milanodomen": { wiki: "Milan Cathedral", lang: "en" },
  "hoyde::Millau-viadukten": { wiki: "Millau Viaduct", lang: "en" },
  "hoyde::Ostankino-tårnet": { wiki: "Ostankino Tower", lang: "en" },
  "hoyde::Sukkertoppen": { wiki: "Sugarloaf Mountain", lang: "en" },
  "hoyde::TV-tårnet i Kyiv": { wiki: "Kyiv TV Tower", lang: "en" },
  "hoyde::Storsteinen": { wiki: "Fjellheisen" },
  "hoyde::Monolitten i Vigelandsparken": { wiki: "Monolitten" },

  // Mat
  "mat-kalorier::Aprikoser (tørkede)": { wiki: "Dried apricot", lang: "en" },
  "mat-kalorier::Digestivekjeks": { wiki: "Digestive biscuit", lang: "en" },
  "mat-kalorier::Eplejuice": { wiki: "Apple juice", lang: "en" },
  "mat-kalorier::Gresskarkjerner": { wiki: "Pumpkin seed", lang: "en" },
  "mat-kalorier::Kidneybønner (kokte)": { wiki: "Kidney bean", lang: "en" },
  "mat-kalorier::Kokosvann": { wiki: "Coconut water", lang: "en" },
  "mat-kalorier::Linser (kokte)": { wiki: "Lentil", lang: "en" },
  "mat-kalorier::Løk": { wiki: "Onion", lang: "en" },
  "mat-kalorier::Nachochips": { wiki: "Nachos", lang: "en" },
  "mat-kalorier::Ribbe": { wiki: "Pork belly", lang: "en" },
  "mat-kalorier::Rød paprika": { wiki: "Bell pepper", lang: "en" },
  "mat-kalorier::Sardiner i olje": { wiki: "Sardine", lang: "en" },
  "mat-kalorier::Seterrømme": { wiki: "Sour cream", lang: "en" },
  "mat-kalorier::Skyr naturell": { wiki: "Skyr", lang: "en" },
  "mat-kalorier::Svart kaffe": { wiki: "Coffee", lang: "en" },
  "mat-kalorier::Tunfisk i vann": { wiki: "Canned fish", lang: "en" },
  "mat-kalorier::Kiwi": { wiki: "Kiwifruit", lang: "en" }, // no-søk traff dagligvarekjeden
  "mat-kalorier::Squash": { wiki: "Zucchini", lang: "en" }, // no-søk traff sporten
  "mat-kalorier::Sitron": { wiki: "Lemon", lang: "en" },
  "mat-kalorier::Helmelk": { wiki: "Milk", lang: "en" },
  "mat-kalorier::Macadamianøtter": { wiki: "Macadamia", lang: "en" },
  "mat-kalorier::Solsikkefrø": { wiki: "Sunflower seed", lang: "en" },
  "mat-kalorier::Vaniljeis": { wiki: "Ice cream", lang: "en" },
  "mat-kalorier::Fiken (tørkede)": { wiki: "Common fig", lang: "en" },
  "mat-kalorier::Dadler (tørkede)": { wiki: "Medjool", lang: "en" },
  "mat-kalorier::Cashewnøtter": { wiki: "Cashew", lang: "en" },
  "mat-kalorier::Mandler": { wiki: "Almond", lang: "en" },
  "mat-kalorier::Chiafrø": { wiki: "Chia seed", lang: "en" },
  "mat-kalorier::Honningmelon": { wiki: "Honeydew (melon)", lang: "en" },
  "mat-kalorier::Grønne oliven": { wiki: "Olive", lang: "en" },
  "mat-kalorier::Indrefilet av storfe": { wiki: "Beef tenderloin", lang: "en" },
  "mat-kalorier::Quinoa (kokt)": { wiki: "Quinoa", lang: "en" },
  "mat-kalorier::Reker (kokte)": { wiki: "Shrimp", lang: "en" },
  "mat-kalorier::Melkesjokolade": { wiki: "Milk chocolate", lang: "en" },
  "mat-kalorier::Mørk sjokolade (70 %)": { wiki: "Dark chocolate", lang: "en" },
  "mat-kalorier::Hvit sjokolade": { wiki: "White chocolate", lang: "en" },
  "mat-kalorier::Mango": { wiki: "Mango", lang: "en" },
  "mat-kalorier::Papaya": { wiki: "Papaya", lang: "en" },
  "mat-kalorier::Mais": { wiki: "Corn on the cob", lang: "en" },
  "mat-kalorier::Sesamfrø": { wiki: "Sesame", lang: "en" },
  "mat-kalorier::Plomme": { wiki: "Plum", lang: "en" },
  "mat-kalorier::Spinat": { wiki: "Spinach", lang: "en" },
  "mat-kalorier::Gresskar": { wiki: "Pumpkin", lang: "en" },
  "mat-kalorier::Kremfløte": { wiki: "Cream", lang: "en" },
  "dyr-vekt::Høne": { wiki: "Chicken", lang: "en" },
  "dyr-vekt::Ku": { wiki: "Cattle", lang: "en" }, // no.wiki «Ku» viser en elgku
  "dyr-vekt::Labrador": { wiki: "Labrador Retriever", lang: "en" }, // no.wiki «Labrador» er regionen
  "hoyde::Fannaråken": { wiki: "Fannaråki", lang: "en" },
  "hoyde::Huascarán": { wiki: "Huascarán", lang: "en" },
  "hoyde::Kheops-pyramiden": { wiki: "Great Pyramid of Giza", lang: "en" },
  "hoyde::Sydney Tower": { wiki: "Sydney Tower", lang: "en" },
  "hoyde::Ulm Münster": { wiki: "Ulm Minster", lang: "en" },
  "hoyde::Øresundsbroen": { wiki: "Øresund Bridge", lang: "en" },

  // Hva kom først? Artikkel om oppfinnelsen/hendelsen. Merkevarer/spill/TV bruker logo eller omslag
  // fra en.wiki (license: "any"), på linje med filmplakatene.
  "hva-kom-forst::Aircondition": { wiki: "Air conditioning", lang: "en" },
  "hva-kom-forst::Amazon": { wiki: "Amazon (company)", lang: "en", license: "any" },
  "hva-kom-forst::Among Us": { wiki: "Among Us", lang: "en", license: "any" },
  "hva-kom-forst::Brødrene Lumières kinoforestilling": { wiki: "Auguste and Louis Lumière", lang: "en" },
  "hva-kom-forst::Dagbladet": { wiki: "Dagbladet", lang: "en", license: "any" },
  "hva-kom-forst::Damplokomotivet": { wiki: "Steam locomotive", lang: "en" },
  "hva-kom-forst::Digitalkameraet": { wiki: "Digital camera", lang: "en" },
  "hva-kom-forst::Discord": { wiki: "Discord", lang: "en", license: "any" },
  "hva-kom-forst::Donald Duck & Co": { wiki: "Donald Duck", lang: "en", license: "any" },
  "hva-kom-forst::Dynamitt": { wiki: "Dynamite", lang: "en" },
  "hva-kom-forst::Europacupen for klubblag": { wiki: "UEFA Champions League", lang: "en", license: "any" },
  "hva-kom-forst::Fløtemysost (Anne Hov)": { wiki: "Brunost", lang: "en" },
  "hva-kom-forst::Folketrygden": { wiki: "Norwegian Labour and Welfare Administration", lang: "en", license: "any" },
  "hva-kom-forst::Folkevogn Boble": { wiki: "Volkswagen Beetle", lang: "en" },
  "hva-kom-forst::Fonografen": { wiki: "Phonograph", lang: "en" },
  "hva-kom-forst::Formel 1-VM": { wiki: "Formula One", lang: "en" },
  "hva-kom-forst::Fotball-EM": { wiki: "UEFA European Championship", lang: "en", license: "any" },
  "hva-kom-forst::Fotball-VM for kvinner": { wiki: "FIFA Women's World Cup", lang: "en", license: "any" },
  "hva-kom-forst::Fotografiet": { wiki: "View from the Window at Le Gras", lang: "en" },
  "hva-kom-forst::Første Android-telefon": { wiki: "HTC Dream", lang: "en" },
  "hva-kom-forst::Første TV-demonstrasjon": { wiki: "John Logie Baird", lang: "en" },
  "hva-kom-forst::Første mobiltelefonsamtale": { wiki: "Motorola DynaTAC", lang: "en" },
  "hva-kom-forst::Første motorfly (Wright)": { wiki: "Wright Flyer", lang: "en" },
  "hva-kom-forst::Glidelåsen": { wiki: "Zipper", lang: "en" },
  "hva-kom-forst::Grammofonen": { wiki: "Emile Berliner", lang: "en" },
  "hva-kom-forst::Gutenbergs trykkpresse": { wiki: "Printing press", lang: "en" },
  "hva-kom-forst::Hobbiten": { wiki: "The Hobbit", lang: "en", license: "any" },
  "hva-kom-forst::Instant nudler": { wiki: "Instant noodles", lang: "en" },
  "hva-kom-forst::Internet Explorer": { wiki: "Internet Explorer", lang: "en", license: "any" },
  "hva-kom-forst::Ironman": { wiki: "Ironman Triathlon", lang: "en", license: "any" },
  "hva-kom-forst::Ispinnen (Popsicle)": { wiki: "Ice pop", lang: "en" },
  "hva-kom-forst::Jul i Skomakergata": null,
  "hva-kom-forst::Kinderegg": { wiki: "Kinder Surprise", lang: "en" },
  "hva-kom-forst::Koppevaksinen": { wiki: "Smallpox vaccine", lang: "en" },
  "hva-kom-forst::Kredittkortet (Diners Club)": { wiki: "Diners Club International", lang: "en", license: "any" },
  "hva-kom-forst::Laseren": { wiki: "Laser", lang: "en" },
  "hva-kom-forst::Levi's-jeansen": { wiki: "Jeans", lang: "en" },
  "hva-kom-forst::MSN Messenger": { wiki: "Windows Live Messenger", lang: "en", license: "any" },
  "hva-kom-forst::Mars-sjokoladen": { wiki: "Mars (chocolate bar)", lang: "en" },
  "hva-kom-forst::Moderne OL": { wiki: "1896 Summer Olympics", lang: "en" },
  "hva-kom-forst::Mummitrollet": { wiki: "Moomins", lang: "en", license: "any" },
  "hva-kom-forst::Narvesen": { wiki: "Narvesen", lang: "en", license: "any" },
  "hva-kom-forst::Oppdagelsen av insulin": { wiki: "Frederick Banting", lang: "en" },
  "hva-kom-forst::Pinterest": { wiki: "Pinterest", lang: "en", license: "any" },
  "hva-kom-forst::Pokémon Rød og Grønn": { wiki: "Pokémon Red, Blue, and Yellow", lang: "en", license: "any" },
  "hva-kom-forst::Premier League": { wiki: "Premier League", lang: "en", license: "any" },
  "hva-kom-forst::Pringles": { wiki: "Pringles", lang: "en", license: "any" },
  "hva-kom-forst::Reisen til Julestjernen (film)": null,
  "hva-kom-forst::Rugby-VM": { wiki: "Rugby World Cup", lang: "en", license: "any" },
  "hva-kom-forst::Schibsted": { wiki: "Schibsted", lang: "en", license: "any" },
  "hva-kom-forst::Sikkerhetsnålen": { wiki: "Safety pin", lang: "en" },
  "hva-kom-forst::Singers symaskin": { wiki: "Singer Corporation", lang: "en" },
  "hva-kom-forst::Skam": { wiki: "Skam (TV series)", lang: "en", license: "any" },
  "hva-kom-forst::Sprayboksen (Rotheim)": { wiki: "Aerosol spray", lang: "en" },
  "hva-kom-forst::Stetoskopet": { wiki: "Stethoscope", lang: "en" },
  "hva-kom-forst::Subway": { wiki: "Subway (restaurant)", lang: "en", license: "any" },
  "hva-kom-forst::Tesla": { wiki: "Tesla, Inc.", lang: "en", license: "any" },
  "hva-kom-forst::Tinder": { wiki: "Tinder (app)", lang: "en", license: "any" },
  "hva-kom-forst::Tintin": { wiki: "The Adventures of Tintin", lang: "en", license: "any" },
  "hva-kom-forst::Toy Story": { wiki: "Toy Story", lang: "en", license: "any" },
  "hva-kom-forst::Transistoren": { wiki: "Transistor", lang: "en" },
  "hva-kom-forst::Twister": { wiki: "Twister (game)", lang: "en", license: "any" },
  "hva-kom-forst::Varmluftsballongen": { wiki: "Hot air balloon", lang: "en" },
  "hva-kom-forst::Wi-Fi-standarden": { wiki: "Wi-Fi", lang: "en", license: "any" },
  "hva-kom-forst::Wordle": { wiki: "Wordle", lang: "en", license: "any" },
  // Feiltreff fra søk/navnelikhet, rettet ved stikkprøver
  "hva-kom-forst::Apple I": { wiki: "Apple I", lang: "en" },
  "hva-kom-forst::Apple Watch": { wiki: "Apple Watch", lang: "en" },
  "hva-kom-forst::Atari 2600": { wiki: "Atari 2600", lang: "en" },
  "hva-kom-forst::Batteriet": { wiki: "Voltaic pile", lang: "en" },
  "hva-kom-forst::Boksåpneren": { wiki: "Can opener", lang: "en" },
  "hva-kom-forst::Boston Marathon": { wiki: "Boston Marathon", lang: "en", license: "any" },
  "hva-kom-forst::Diet Coke": { wiki: "Diet Coke", lang: "en" },
  "hva-kom-forst::Edisons lyspære": { wiki: "Incandescent light bulb", lang: "en" },
  "hva-kom-forst::FIFA (første spill)": { wiki: "FIFA International Soccer", lang: "en", license: "any" },
  "hva-kom-forst::Første menneske i verdensrommet": { wiki: "Yuri Gagarin", lang: "en" },
  "hva-kom-forst::Google Maps": { wiki: "Google Maps", lang: "en", license: "any" },
  "hva-kom-forst::Hashtaggen": { wiki: "Hashtag", lang: "en" },
  "hva-kom-forst::IBM PC": { wiki: "IBM Personal Computer", lang: "en" },
  "hva-kom-forst::Jordan": null, // tannbørstemerket; artikkeltreffet er landet
  "hva-kom-forst::Kaffefilteret (Melitta)": { wiki: "Melitta Bentz", lang: "en" },
  "hva-kom-forst::Monopol": { wiki: "Monopoly (game)", lang: "en", license: "any" },
  "hva-kom-forst::OL i Oslo": { wiki: "1952 Winter Olympics", lang: "en", license: "any" },
  "hva-kom-forst::PlayStation": { wiki: "PlayStation (console)", lang: "en" },
  "hva-kom-forst::Play-Doh": { wiki: "Play-Doh", lang: "en", license: "any" },
  "hva-kom-forst::Sega Mega Drive": { wiki: "Sega Genesis", lang: "en" },
  "hva-kom-forst::Snickers": { wiki: "Snickers", lang: "en", license: "any" },
  "hva-kom-forst::Snøhvit (Disney-film)": { wiki: "Snow White and the Seven Dwarfs (1937 film)", lang: "en", license: "any" },
  "hva-kom-forst::Sony Walkman": { wiki: "Walkman", lang: "en" },
  "hva-kom-forst::Støvsugeren": { wiki: "Vacuum cleaner", lang: "en" },
  "hva-kom-forst::Teleskopet": { wiki: "Telescope", lang: "en" },
  "hva-kom-forst::Uno": { wiki: "Uno (card game)", lang: "en", license: "any" },
  "hva-kom-forst::Wimbledon": { wiki: "The Championships, Wimbledon", lang: "en", license: "any" },
  "hva-kom-forst::Månelandingen": { wiki: "Apollo 11", lang: "en" },
  "hva-kom-forst::James Bond-film (Dr. No)": { wiki: "Dr. No (film)", lang: "en", license: "any" },
  "hva-kom-forst::Mikke Mus (Steamboat Willie)": { wiki: "Steamboat Willie", lang: "en", license: "any" },
  "hva-kom-forst::iPod": { wiki: "iPod", lang: "en" },
  "hva-kom-forst::Puma": { wiki: "Puma (brand)", lang: "en", license: "any" },
  "hva-kom-forst::Sykkelen (draisinen)": { wiki: "Dandy horse", lang: "en" },
  "hva-kom-forst::Den norske kronen": { wiki: "Norsk krone" },
  "hva-kom-forst::Fortnite": { wiki: "Fortnite Battle Royale", lang: "en", license: "any" },
  "hva-kom-forst::Game of Thrones": { wiki: "A Song of Ice and Fire", lang: "en", license: "any" },
  "hva-kom-forst::Første telegrafmelding med morse": { wiki: "Samuel Morse", lang: "en" },
  "hva-kom-forst::New York Marathon": { wiki: "New York City Marathon", lang: "en", license: "any" },
}

// Norske/originale filmtitler → engelsk Wikipedia-tittel (uten «(film)»-suffiks).
const FILM_TITLES = {
  "Ringenes herre: Atter en konge": "The Lord of the Rings: The Return of the King",
  "Ringenes herre: Ringens brorskap": "The Lord of the Rings: The Fellowship of the Ring",
  "Ringenes herre: To tårn": "The Lord of the Rings: The Two Towers",
  "Chihiro og heksene": "Spirited Away",
  "Løvenes konge": "The Lion King",
  "Løvenes konge (2019)": "The Lion King",
  "Oppdrag Nemo": "Finding Nemo",
  "Monsterbedriften": "Monsters, Inc.",
  "Harry Potter og dødstalismanene – del 2": "Harry Potter and the Deathly Hallows: Part 2",
  "Harry Potter og dødstalismanene – del 1": "Harry Potter and the Deathly Hallows: Part 1",
  "Harry Potter og fangen fra Azkaban": "Harry Potter and the Prisoner of Azkaban",
  "Harry Potter og de vises stein": "Harry Potter and the Sorcerer's Stone",
  "Harry Potter og Føniksordenen": "Harry Potter and the Order of the Phoenix",
  "Harry Potter og halvblodsprinsen": "Harry Potter and the Half-Blood Prince",
  "Skjønnheten og udyret": "Beauty and the Beast",
  "Skjønnheten og udyret (2017)": "Beauty and the Beast",
  "Alene hjemme": "Home Alone",
  "Den lille havfrue": "The Little Mermaid",
  "Den lille havfrue (2023)": "The Little Mermaid",
  "Innsiden ut 2": "Inside Out 2",
  "Frost": "Frozen",
  "Frost 2": "Frozen II",
  "Snøhvit (2025)": "Snow White",
  "Jagten": "The Hunt",
  "Det sjunde inseglet": "The Seventh Seal",
  "Festen": "The Celebration",
  "Fanny och Alexander": "Fanny and Alexander",
  "Låt den rätte komma in": "Let the Right One In",
  "Flåklypa Grand Prix": "Pinchcliffe Grand Prix",
  "Män som hatar kvinnor": "The Girl with the Dragon Tattoo",
  "Druk": "Another Round",
  "Verdens verste menneske": "The Worst Person in the World",
  "En man som heter Ove": "A Man Called Ove",
  "Adams æbler": "Adam's Apples",
  "Oslo, 31. august": "Oslo, August 31st",
  "Hodejegerne": "Headhunters",
  "Retfærdighedens ryttere": "Riders of Justice",
  "Den 12. mann": "The 12th Man",
  "Max Manus": "Max Manus: Man of War",
  "Kraftidioten": "In Order of Disappearance",
  "Kautokeino-opprøret": "The Kautokeino Rebellion",
  "Kongens nei": "The King's Choice",
  "Trolljegeren": "Trollhunter",
  "Bølgen": "The Wave",
  "Fritt vilt": "Cold Prey",
  "Død snø": "Dead Snow",
  "Skjelvet": "The Quake",
}

// ---------------------------------------------------------------------------------------------
// Hjelpere
// ---------------------------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Små bokstaver, uten diakritika og tegnsetting, "&" → "and", uten ledende "the". */
function norm(s) {
  return String(s)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/å/g, "a")
    .replace(/ß/g, "ss")
    .replace(/&/g, " and ")
    .replace(/['’`´.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^the /, "")
}

const stripParens = (s) => s.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim()
const parensContent = (s) => [...s.matchAll(/\(([^)]*)\)/g)].map((m) => m[1].trim())
const yearOf = (s) => {
  const m = /(\d{4})/.exec(s || "")
  return m ? Number(m[1]) : null
}

// Struping per vert (millisekunder mellom kall).
const GAPS = { "api.deezer.com": 120, "api.tvmaze.com": 550, wiki: 60 }
const nextSlot = new Map()
async function throttle(key) {
  const gap = GAPS[key] ?? 100
  const now = Date.now()
  const at = Math.max(now, nextSlot.get(key) ?? 0)
  nextSlot.set(key, at + gap)
  if (at > now) await sleep(at - now)
}

let netCalls = 0
async function fetchJson(url) {
  const file = path.join(CACHE_DIR, "http", createHash("sha1").update(url).digest("hex") + ".json")
  if (!REFRESH && fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"))
    } catch {
      /* korrupt cache → hent på nytt */
    }
  }
  const host = new URL(url).host
  const key = host.endsWith("wikipedia.org") || host.endsWith("wikimedia.org") ? "wiki" : host
  for (let attempt = 0; attempt < 8; attempt++) {
    await throttle(key)
    let res
    try {
      res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } })
    } catch (err) {
      await sleep(2000 * (attempt + 1))
      continue
    }
    if (res.ok) {
      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        await sleep(2000 * (attempt + 1))
        continue
      }
      // Deezer svarer 200 med { error: { code: 4 } } ved kvoteoverskridelse.
      if (data && data.error && host === "api.deezer.com") {
        await sleep(5000 * (attempt + 1))
        continue
      }
      netCalls++
      fs.writeFileSync(file, JSON.stringify(data))
      return data
    }
    if ([403, 429, 500, 502, 503, 504].includes(res.status)) {
      const wait = 3000 * (attempt + 1)
      console.warn(`  ${res.status} fra ${host}, venter ${Math.round(wait / 1000)} s`)
      await sleep(wait)
      continue
    }
    return null // 404 o.l.: ikke cache, ikke prøv igjen
  }
  console.warn(`  ga opp: ${url}`)
  return null
}

// ---------------------------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------------------------
async function loadCategories() {
  const cats = []
  for (const f of fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".ts")).sort()) {
    // Datafilene er rene objektliteraler; fjern type-importen og typeannotasjonen og importer som JS.
    const src = fs
      .readFileSync(path.join(DATA_DIR, f), "utf8")
      .replace(/^\s*import\s+type\b.*$/gm, "")
      .replace(/(export\s+const\s+\w+)\s*:\s*[\w.<>\[\]]+\s*=/g, "$1 =")
      .replace(/\s+satisfies\s+[\w.<>\[\]]+/g, "")
    const mod = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"))
    for (const v of Object.values(mod)) {
      if (v && typeof v === "object" && typeof v.id === "string" && Array.isArray(v.items)) cats.push(v)
    }
  }
  return cats
}

// ---------------------------------------------------------------------------------------------
// Deezer
// ---------------------------------------------------------------------------------------------
const isDeezerPlaceholder = (url, md5) => !url || url.includes("/artist//") || url.includes("/images/artist/-") || md5 === "" || url.includes("d41d8cd98f00b204e9800998ecf8427e")

async function deezerArtist(name) {
  const data = await fetchJson(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=10`)
  const want = norm(name)
  const hits = (data?.data ?? []).filter((a) => norm(a.name) === want && !isDeezerPlaceholder(a.picture_big, a.md5_image))
  if (!hits.length) return null
  hits.sort((a, b) => (b.nb_fan ?? 0) - (a.nb_fan ?? 0))
  const a = hits[0]
  return { id: a.id, src: a.picture_big, kilde: `https://www.deezer.com/artist/${a.id}`, how: `deezer:${a.name} (${a.nb_fan} fans)` }
}

const COMPILATION = /greatest hits|best of|\bhits\b|collection|essential|anthology|now that|compilation|playlist|\btop \d+|the very best|\bgold\b|various|karaoke|tribute|workout|party|summer|christmas hits|throwback|\bmix\b|\d{2,4}s\b|love songs|ballads|radio|club|chill|\bvol\b/i
const VARIANT = /\blive\b|remix|acoustic|karaoke|instrumental|cover|sped up|slowed|tribute|version|rework|piano|edit\b|demo|\bmix\b|session|extended|\bmono\b|a cappella|opening night|christmas for|radio|club|bamboo|\(later\)/i

function splitArtists(s) {
  return s
    .split(/\s*(?:&|,|\bfeat\.?|\bft\.?|\bx\b|\bwith\b|\band\b)\s*/i)
    .map((x) => x.trim())
    .filter(Boolean)
}

// Forkortede artistnavn i datafilen → navn på Deezer.
const ARTIST_ALIASES = { CCR: "Creedence Clearwater Revival", Bieber: "Justin Bieber" }

async function deezerAlbum(id) {
  return fetchJson(`https://api.deezer.com/album/${id}`)
}

async function deezerSong(title, detail) {
  const year = yearOf(detail)
  const artistStr = (detail || "").split("·")[0].trim()
  const parts = splitArtists(artistStr).map((a) => ARTIST_ALIASES[a] ?? a)
  const whole = ARTIST_ALIASES[artistStr] ?? artistStr
  // Finn artist-id(er) slik at coverband og navnelikheter ikke slipper gjennom.
  const ids = new Set()
  const wholeHit = await deezerArtist(whole)
  if (wholeHit) ids.add(wholeHit.id)
  else for (const p of parts) {
    const a = await deezerArtist(p)
    if (a) ids.add(a.id)
  }
  const names = new Set([norm(whole), ...parts.map(norm)])
  const wantTitle = norm(stripParens(title))
  const okTitle = (t) => norm(stripParens(t.replace(/\s+-\s+.*$/, ""))) === wantTitle
  const okArtist = (a) => (a && ids.has(a.id)) || (!ids.size && names.has(norm(a?.name ?? "")))
  const main = wholeHit ? whole : parts[0] ?? whole
  const queries = [`artist:"${main}" track:"${title}"`, `artist:"${main}" track:"${stripParens(title)}"`, `${main} ${stripParens(title)}`]
  // Samle treff fra alle spørringene (cachet), så velg originalutgivelsen.
  const seen = new Set()
  const hits = []
  for (const q of [...new Set(queries)]) {
    const data = await fetchJson(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=25`)
    for (const t of data?.data ?? []) {
      if (seen.has(t.id) || !okTitle(t.title_short || t.title) || !okArtist(t.artist) || !t.album?.id) continue
      seen.add(t.id)
      hits.push(t)
    }
  }
  if (!hits.length) return null
  const plain = hits.filter((t) => !VARIANT.test(t.title))
  const pool = (plain.length ? plain : hits)
    .sort((x, y) => (y.rank ?? 0) - (x.rank ?? 0))
    .filter((t, i, arr) => arr.findIndex((x) => x.album.id === t.album.id) === i)
    .slice(0, 10)
  // Albuminfo: unngå samlealbum/remiks, foretrekk riktig år, deretter mest spilte versjon.
  const lexLess = (a, b) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i]
    return false
  }
  let best = null
  for (const t of pool) {
    const al = await deezerAlbum(t.album.id)
    const cover = al?.cover_big ?? t.album.cover_big
    if (!cover || isDeezerPlaceholder(cover, al?.md5_image ?? t.album.md5_image)) continue
    const albumTitle = al?.title ?? t.album.title
    const ay = yearOf(al?.release_date)
    const bad = (al?.record_type === "compile" || COMPILATION.test(albumTitle) ? 2 : 0) + (VARIANT.test(albumTitle) ? 1 : 0)
    const yearOff = year && ay && Math.abs(ay - year) > 2 ? 1 : 0
    const score = [bad, yearOff, -(t.rank ?? 0)]
    if (!best || lexLess(score, best.score)) best = { t, al, cover, score }
  }
  if (!best) return null
  const { t, al, cover } = best
  return {
    weak: best.score[0] > 0 || VARIANT.test(t.title),
    src: cover,
    kilde: `https://www.deezer.com/album/${t.album.id}`,
    how: `deezer:${t.artist.name} – ${t.title} [${al?.title ?? t.album.title} ${al?.release_date ?? ""} ${al?.record_type ?? ""}]`,
  }
}

// ---------------------------------------------------------------------------------------------
// TVmaze (serier)
// ---------------------------------------------------------------------------------------------
async function tvmazeShow(name, detail) {
  const year = yearOf(detail)
  const wantFull = norm(name)
  const wantBase = norm(stripParens(name))
  const country = parensContent(name).map((p) => p.toUpperCase())[0] // f.eks. "The Office (UK)"
  const data = await fetchJson(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(stripParens(name))}`)
  let best = null
  for (const { show } of data ?? []) {
    // «medium» (210×295) holder for kortene og er ~10× mindre enn originalen (300–400 kB).
    const img = show?.image?.medium || show?.image?.original
    if (!img) continue
    const n = norm(show.name)
    if (n !== wantFull && n !== wantBase) continue
    const py = yearOf(show.premiered)
    const dy = year && py ? Math.abs(py - year) : 5
    if (year && py && dy > 1) continue
    const cc = show.network?.country?.code ?? show.webChannel?.country?.code ?? ""
    const ccOk = country ? (country === "UK" ? "GB" : country) === cc : true
    const rank = (n === wantFull ? 2 : 0) + (ccOk ? 2 : 0) - dy
    if (!best || rank > best.rank) best = { show, img, rank }
  }
  if (!best) return null
  return { src: best.img, kilde: best.show.url, how: `tvmaze:${best.show.name} (${best.show.premiered})` }
}

// ---------------------------------------------------------------------------------------------
// Flagg
// ---------------------------------------------------------------------------------------------
function flagCode(emoji) {
  const cps = [...(emoji || "")].map((c) => c.codePointAt(0))
  const ri = cps.filter((c) => c >= 0x1f1e6 && c <= 0x1f1ff)
  if (ri.length === 2) return ri.map((c) => String.fromCharCode(c - 0x1f1e6 + 97)).join("")
  if (cps[0] === 0x1f3f4 && cps.length > 2) {
    // Tag-sekvens, f.eks. 🏴 + g b e n g + cancel → gb-eng
    const tag = cps
      .filter((c) => c >= 0xe0061 && c <= 0xe007a)
      .map((c) => String.fromCharCode(c - 0xe0061 + 97))
      .join("")
    if (/^gb(eng|sct|wls|nir)$/.test(tag)) return `gb-${tag.slice(2)}`
  }
  return null
}

// ---------------------------------------------------------------------------------------------
// Wikipedia
// ---------------------------------------------------------------------------------------------
const wikiProps = (license = "free") =>
  "action=query&format=json&formatversion=2&redirects=1&prop=pageimages|pageprops|description|langlinks" +
  `&piprop=thumbnail|name&pithumbsize=500&pilicense=${license}&pilimit=50&ppprop=disambiguation&lllang=en&lllimit=max`

function mergePages(into, pages) {
  for (const p of pages ?? []) {
    const cur = into.get(p.title)
    into.set(p.title, cur ? { ...cur, ...p, langlinks: [...(cur.langlinks ?? []), ...(p.langlinks ?? [])] } : p)
  }
}

/** Slår opp titler i bolker på 50. Returnerer Map(inndata-tittel → side | null). */
async function wikiLookup(lang, titles, license = "free") {
  const out = new Map()
  const uniq = [...new Set(titles.filter(Boolean))]
  for (let i = 0; i < uniq.length; i += 50) {
    const chunk = uniq.slice(i, i + 50)
    const pages = new Map()
    const redirect = new Map()
    let cont = ""
    for (let guard = 0; guard < 10; guard++) {
      const url = `https://${lang}.wikipedia.org/w/api.php?${wikiProps(license)}&titles=${encodeURIComponent(chunk.join("|"))}${cont}`
      const data = await fetchJson(url)
      if (!data?.query) break
      for (const n of data.query.normalized ?? []) redirect.set(n.from, n.to)
      for (const r of data.query.redirects ?? []) redirect.set(r.from, r.to)
      mergePages(pages, data.query.pages)
      if (!data.continue) break
      cont = "&" + new URLSearchParams(data.continue).toString()
    }
    for (const t of chunk) {
      let cur = t
      for (let k = 0; k < 5 && redirect.has(cur); k++) cur = redirect.get(cur)
      const p = pages.get(cur)
      out.set(t, p && !p.missing && !p.invalid ? { ...p, lang } : null)
    }
  }
  return out
}

async function wikiSearch(lang, query, license = "free") {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?${wikiProps(license).replace("&redirects=1", "")}` +
    `&generator=search&gsrnamespace=0&gsrlimit=3&gsrsearch=${encodeURIComponent(query)}`
  const data = await fetchJson(url)
  const pages = (data?.query?.pages ?? []).sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
  return pages.map((p) => ({ ...p, lang }))
}

const isDisambig = (p) => p?.pageprops && "disambiguation" in p.pageprops
const enLink = (p) => (p?.langlinks ?? []).find((l) => l.lang === "en")?.title ?? null

function wikiImage(p) {
  if (!p?.thumbnail?.source) return null
  const src = p.thumbnail.source.replace(/\?.*$/, "")
  const file = p.pageimage
  // Hopp over typiske ikon/logo-plassholdere.
  if (/disambig|Question_book|Wiktionary|Commons-logo|Flag_of_None|Edit-clear|Ambox/i.test(file || src)) return null
  // Kart og flagg viser ikke selve stedet/tingen (land får flagg fra flagcdn i stedet).
  if (/^Flag_of_|^Bandera_|^Location_|location_map|locator|(^|[_-])map\.(png|svg|jpe?g)$|_kart\.|^Kart_/i.test(file || "")) return null
  const onCommons = src.includes("/wikipedia/commons/")
  const kilde = file
    ? onCommons
      ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file).replace(/%2C/g, ",")}`
      : `https://${p.lang}.wikipedia.org/wiki/File:${encodeURIComponent(file).replace(/%2C/g, ",")}`
    : undefined
  return { src, kilde }
}

const GENERIC_REJECT = /pekerside|flertydig|disambiguation|fornavn|etternavn|pikenavn|guttenavn|given name|surname|family name|wikimedia/i

/** Per kategori: kandidattitler (i prioritert rekkefølge), søkestreng og validering. */
const WIKI_RULES = {
  "dyr-vekt": {
    titles: (it) => {
      const n = stripParens(it.name)
      const kind = (it.detail || "").split("·")[0].trim().toLowerCase()
      const extra = { fugl: "fugl", fisk: "fisk", krypdyr: "krypdyr", pattedyr: "pattedyr" }[kind]
      return [`${n} (dyr)`, extra && `${n} (${extra})`, n, ...parensContent(it.name)]
    },
    search: (it) => `${stripParens(it.name)} ${(it.detail || "").split("·")[0]}`,
    reject: /bilmodell|bilmerke|biltype|\bbil\b|car |automobile|film|album|sang|singel|\bband\b|selskap|company|tettsted|kommune|\bby\b|elv|fjell|lokomotiv|fly\b|skip|spill|låt|programvare|fotball|klubb|merkevare|brand|tegneserie|figur/i,
  },
  "mat-kalorier": {
    titles: (it) => [it.name, stripParens(it.name), `${stripParens(it.name)} (mat)`],
    search: (it) => stripParens(it.name),
    reject: /film|album|\bband\b|tettsted|kommune|\bby i\b|fjell|fotballspiller|politiker|musiker|sanger|låt|singel|elv|innsjø/i,
  },
  hoyde: {
    titles: (it) => {
      const kind = (it.detail || "").split("·")[0].trim().toLowerCase()
      const n = stripParens(it.name)
      const t = [it.name]
      if (/fjell|vulkan/.test(kind)) t.unshift(`${n} (fjell)`, `${n} (vulkan)`)
      return [...t, n, ...parensContent(it.name)]
    },
    search: (it) => `${it.name} ${(it.detail || "").split("·")[0]}`,
    reject: /tettsted|film|album|\bband\b|låt|singel|fotball|klubb|skip\b|tegneserie|dataspill/i,
  },
  "hva-kom-forst": {
    titles: (it) => [it.name, stripParens(it.name), ...parensContent(it.name)],
    search: (it) => it.name.replace(/[()]/g, " "),
    reject: /^$/,
  },
  "norske-kommuner": {
    titles: (it) => [`${it.name} kommune`, `${it.name} (${it.detail})`, `${it.name} (kommune)`, it.name],
    search: (it) => `${it.name} kommune ${it.detail}`,
    reject: /tettsted i (?!.*kommune)|fjell|elv|innsjø|film|album|person|fotball|klubb|skip/i,
    accept: /kommune|municipality|by i|hovedstad|by og/i,
  },
  "avstand-oslo": {
    titles: (it) => {
      const n = stripParens(it.name)
      const t = it.detail === "Norge" || it.detail === "Svalbard" ? [`${n} (by)`, n] : [n]
      return [...t, `${n} (${it.detail})`, `${n} (by)`]
    },
    search: (it) => `${it.name} by ${it.detail}`,
    reject: /fornavn|film|album|\bband\b|låt|singel|fotballklubb|idrettslag|skip|elv\b|fylke\b|provins\b|delstat|stat i|land i|region|øy\b|innsjø|bispedømme|kommune i .*fylke|valgkrets/i,
  },
  filmer: {
    // Plakatene er ikke-frie (fair use på en.wiki), derfor license=any og bare engelsk Wikipedia.
    license: "any",
    onlyPreferred: true,
    name: (it) => FILM_TITLES[it.name] ?? stripParens(it.name),
    titles: (it) => {
      const en = FILM_TITLES[it.name] ?? stripParens(it.name)
      const y = yearOf(it.detail)
      return [y && `${en} (${y} film)`, `${en} (film)`, en, y && `${en} (${y} American film)`]
    },
    search: (it) => `${FILM_TITLES[it.name] ?? stripParens(it.name)} ${yearOf(it.detail) ?? ""} film`,
    reject: /^$/,
    accept: /film|movie|documentary|animated|anime/i,
    check: (p, it) => yearsClose(p.description, yearOf(it.detail), 1),
  },
  sanger: {
    // Singelcover på en.wiki (ikke-frie), reserve når Deezer mangler låten.
    license: "any",
    onlyPreferred: true,
    name: (it) => stripParens(it.name),
    titles: (it) => {
      const n = stripParens(it.name)
      const artist = (it.detail || "").split("·")[0].trim()
      const a = ARTIST_ALIASES[artist] ?? artist
      return [`${n} (${a} song)`, `${n} (song)`, n]
    },
    search: (it) => `${stripParens(it.name)} ${(it.detail || "").split("·")[0]} song`,
    reject: /^$/,
    accept: /song|single/i,
    check: (p, it) => yearsClose(p.description, yearOf(it.detail), 1),
  },
  serier: {
    license: "any",
    onlyPreferred: true,
    name: (it) => stripParens(it.name),
    titles: (it) => {
      const n = stripParens(it.name)
      const y = yearOf(it.detail)
      return [y && `${n} (${y} TV series)`, `${n} (TV series)`, `${n} (American TV series)`, `${n} (British TV series)`, n]
    },
    search: (it) => `${stripParens(it.name)} TV series`,
    reject: /^$/,
    accept: /series|television|\btv\b|sitcom|anime|miniseries|show|documentary|programme|serial/i,
    check: (p, it) => yearsClose(p.description, yearOf(it.detail), 1),
  },
  artister: {
    titles: (it) => [it.name, stripParens(it.name), ...parensContent(it.name)],
    search: (it) => `${stripParens(it.name)} musiker`,
    reject: /^$/,
    accept: /sang|musik|musician|singer|artist|komponist|composer|band|rapper|dj|produ|gitar|guitar|pian|fiolin|violin|cell|group|gruppe|duo|record|vokal|låtskriv|songwriter|joik|saksofon|saxophon/i,
  },
}

/** Hvis beskrivelsen nevner årstall, må ett av dem ligge innenfor ±tol av året. */
function yearsClose(desc, year, tol) {
  if (!year) return true
  const ys = [...String(desc || "").matchAll(/\b(1[89]\d\d|20\d\d)\b/g)].map((m) => Number(m[1]))
  return !ys.length || ys.some((y) => Math.abs(y - year) <= tol)
}

function wikiOk(rule, p, item) {
  if (!p || isDisambig(p)) return false
  const desc = p.description || ""
  if (GENERIC_REJECT.test(desc)) return false
  if (rule.reject.test(desc)) return false
  if (rule.accept && desc.trim() && !rule.accept.test(desc)) return false
  if (rule.check && item && !rule.check(p, item)) return false
  return true
}

/** Løser en liste av { key, item, titles? } via foretrukket wiki → andre språk (langlink) → søk. */
async function resolveWiki(ruleName, jobs, preferLang = "no") {
  const rule = WIKI_RULES[ruleName]
  const license = rule.license ?? "free"
  const results = new Map()
  const otherLang = preferLang === "no" ? "en" : "no"
  const how = (page, extra = "") => `wiki-${page.lang}${extra}:${page.title} | ${page.description ?? ""} | ${page.pageimage}`

  // 1) Direkte titler på foretrukket språk.
  const titlesOf = new Map(jobs.map((j) => [j.key, (j.titles ?? rule.titles(j.item)).filter(Boolean)]))
  const first = await wikiLookup(preferLang, [...titlesOf.values()].flat(), license)
  const needOther = []
  const unresolved = []
  for (const j of jobs) {
    const page = titlesOf.get(j.key).map((t) => first.get(t)).find((p) => wikiOk(rule, p, j.item))
    if (!page) {
      unresolved.push(j)
      continue
    }
    const img = wikiImage(page)
    if (img) results.set(j.key, { ...img, how: how(page) })
    else if (preferLang === "no" && enLink(page)) needOther.push({ j, title: enLink(page) })
    else unresolved.push(j)
  }

  // 2) Søk for de uten treff.
  for (const j of unresolved) {
    const hits = await wikiSearch(preferLang, rule.search(j.item), license)
    const want = norm(rule.name ? rule.name(j.item) : stripParens(j.item.name))
    // Søketreff godtas bare når tittelen ligner navnet, eller er øverste treff for sammensatte navn.
    const page = hits.find((p, idx) => {
      if (!wikiOk(rule, p, j.item)) return false
      const t = norm(stripParens(p.title))
      // «Las Palmas» → «Las Palmas de Gran Canaria» er greit; «Edinburgh» → «Philip, hertug av Edinburgh» er ikke.
      return t === want || (want.length > 3 && t.startsWith(want + " ")) || (idx === 0 && ruleName === "hva-kom-forst")
    })
    if (!page) {
      if (!rule.onlyPreferred) needOther.push({ j, title: null })
      continue
    }
    const img = wikiImage(page)
    if (img) results.set(j.key, { ...img, how: how(page, "-søk") })
    else if (!rule.onlyPreferred) needOther.push({ j, title: enLink(page) })
  }

  // 3) Andre språk: via langlink, ellers samme titler direkte.
  const otherTitles = needOther.flatMap(({ j, title }) => (title ? [title] : titlesOf.get(j.key)))
  const second = await wikiLookup(otherLang, otherTitles, license)
  for (const { j, title } of needOther) {
    const cands = title ? [title] : titlesOf.get(j.key)
    const page = cands.map((t) => second.get(t)).find((p) => wikiOk({ ...rule, reject: title ? /^$/ : rule.reject }, p, j.item))
    const img = wikiImage(page)
    if (img) results.set(j.key, { ...img, how: how(page) })
  }
  return results
}

// ---------------------------------------------------------------------------------------------
// Hovedløp
// ---------------------------------------------------------------------------------------------
const report = []
const keyOf = (cat, item) => `${cat.id}::${item.name}`

async function processCategory(cat) {
  const out = new Map()
  const pendingWiki = new Map() // ruleName → jobs
  const addWiki = (rule, job) => {
    if (!pendingWiki.has(rule)) pendingWiki.set(rule, [])
    pendingWiki.get(rule).push(job)
  }

  for (const item of cat.items) {
    const key = keyOf(cat, item)
    if (out.has(key)) continue
    const ov = Object.prototype.hasOwnProperty.call(OVERRIDES, key) ? OVERRIDES[key] : undefined
    if (ov === null) continue
    if (ov?.src) {
      out.set(key, { src: ov.src, kilde: ov.kilde, how: "override" })
      continue
    }
    if (ov?.wiki) {
      const poster = /^(filmer|serier)-/.test(cat.id)
      const pages = await wikiLookup(ov.lang ?? (poster ? "en" : "no"), [ov.wiki], ov.license ?? (poster ? "any" : "free"))
      const img = wikiImage(pages.get(ov.wiki))
      if (img) out.set(key, { ...img, how: `override-wiki:${ov.wiki}` })
      continue
    }
    if (ov?.file) {
      // Bestemt fil på Wikimedia Commons (når artikkelen ikke har et brukbart hovedbilde).
      const data = await fetchJson(
        "https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=url&iiurlwidth=500&titles=" +
          encodeURIComponent(`File:${ov.file}`),
      )
      const info = data?.query?.pages?.[0]?.imageinfo?.[0]
      if (info?.thumburl) {
        out.set(key, {
          src: info.thumburl.replace(/\?.*$/, ""),
          kilde: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(ov.file.replace(/ /g, "_")).replace(/%2C/g, ",")}`,
          how: `override-file:${ov.file}`,
        })
      }
      continue
    }

    let r = null
    switch (cat.id) {
      case "artister-lyttere":
      case "artister-alder": {
        const names = ov?.deezer ? [ov.deezer] : [stripParens(item.name), ...parensContent(item.name)]
        for (const n of names) if (!r) r = await deezerArtist(n)
        if (!r) addWiki("artister", { key, item })
        break
      }
      case "sanger-strommer":
        r = await deezerSong(item.name, item.detail)
        if (!r || r.weak) addWiki("sanger", { key, item }) // svakt Deezer-treff: prøv singelcover
        break
      case "filmer-imdb":
      case "filmer-inntekter":
        addWiki("filmer", { key, item })
        break
      case "serier-imdb":
        r = await tvmazeShow(ov?.tvmaze ?? item.name, item.detail)
        if (!r) addWiki("serier", { key, item })
        break
      case "land-befolkning":
      case "land-areal": {
        const code = flagCode(item.emoji)
        if (code) r = { src: `https://flagcdn.com/w320/${code}.png`, how: `flag:${code}` }
        else addWiki("avstand-oslo", { key, item, titles: [item.name] })
        break
      }
      default:
        if (WIKI_RULES[cat.id]) addWiki(cat.id, { key, item })
    }
    if (r) out.set(key, r)
  }

  for (const [rule, jobs] of pendingWiki) {
    // Artister/filmer/serier: engelsk Wikipedia har flest og best bilder.
    const lang = ["artister", "filmer", "serier", "sanger"].includes(rule) ? "en" : "no"
    const res = await resolveWiki(rule, jobs, lang)
    for (const [k, v] of res) out.set(k, v)
  }

  let hit = 0
  for (const item of cat.items) {
    const key = keyOf(cat, item)
    const r = out.get(key)
    if (r) hit++
    report.push([key, r ? "ok" : "MANGLER", r?.how ?? "", r?.src ?? ""].join("\t"))
  }
  return { out, hit, total: new Set(cat.items.map((i) => i.name)).size }
}

/** Skriv via midlertidig fil; på Windows kan dev-server/editor låse filen et øyeblikk. */
async function writeRetry(file, text) {
  for (let i = 0; ; i++) {
    try {
      fs.writeFileSync(file + ".tmp", text)
      fs.renameSync(file + ".tmp", file)
      return
    } catch (err) {
      if (i >= 10) throw err
      await sleep(500 * (i + 1))
    }
  }
}

async function main() {
  const cats = (await loadCategories()).filter((c) => !ONLY || ONLY.includes(c.id))
  const existing = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, "utf8")) : {}
  const done = new Set(cats.map((c) => c.id))
  const merged = {}
  for (const [k, v] of Object.entries(existing)) if (!done.has(k.split("::")[0])) merged[k] = v

  const stats = []
  for (const cat of cats) {
    const t0 = Date.now()
    const { out, hit, total } = await processCategory(cat)
    for (const [k, v] of out) merged[k] = v.kilde ? { src: v.src, kilde: v.kilde } : { src: v.src }
    stats.push({ id: cat.id, hit, total })
    console.log(`${cat.id}: ${hit}/${total} (${Math.round((100 * hit) / total)} %) på ${Math.round((Date.now() - t0) / 1000)} s`)
  }

  // Én skriving til slutt (avbrutte løp gjenopptas via cachen). Sortert, én oppføring per linje.
  if (!DRY) {
    const lines = Object.keys(merged)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${JSON.stringify(merged[k])}`)
    await writeRetry(OUT_FILE, "{\n" + lines.join(",\n") + "\n}\n")
  }
  fs.writeFileSync(path.join(CACHE_DIR, "rapport.tsv"), report.sort().join("\n") + "\n")
  const hit = stats.reduce((a, s) => a + s.hit, 0)
  const total = stats.reduce((a, s) => a + s.total, 0)
  const size = fs.existsSync(OUT_FILE) ? fs.statSync(OUT_FILE).size : 0
  console.log(`\nTotalt ${hit}/${total} (${Math.round((100 * hit) / total)} %), ${netCalls} nettkall, ${size} byte`)
  console.log(`Rapport: ${path.join(CACHE_DIR, "rapport.tsv")}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
