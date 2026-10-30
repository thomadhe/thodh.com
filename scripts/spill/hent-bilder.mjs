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
  "artister-lyttere::Pink": { deezer: "P!nk" },
  "artister-lyttere-norden::Ghost": { wiki: "Ghost (Swedish band)", lang: "en" },
  "artister-lyttere-norden::girl in red": { deezer: "girl in red" },
  "artister-lyttere-norden::Sissel": { deezer: "Sissel" },
  "artister-lyttere-norden::TIX": { deezer: "TIX" },

  // Største ran: artikkelen om saken/tingen (frie bilder; ingen logoer). null = emoji
  "ran::Diamantranet i Antwerpen": { wiki: "Antwerp diamond heist", lang: "en" },
  "ran::Ranet mot sentralbanken i Fortaleza": { wiki: "Banco Central burglary at Fortaleza", lang: "en" },
  "ran::Northern Bank-ranet": { wiki: "Northern Bank robbery", lang: "en" },
  "ran::Juveltyveriet i Grünes Gewölbe": { wiki: "Dresden Green Vault burglary", lang: "en" },
  "ran::Ranet av Gardner-museet": { wiki: "Isabella Stewart Gardner Museum theft", lang: "en" },
  "ran::NOKAS-ranet": { wiki: "NOKAS-ranet", lang: "no" },
  "ran::Lufthansa-ranet": { wiki: "Lufthansa heist", lang: "en" },
  "ran::Brink's-Mat-ranet": { wiki: "Brink's-Mat robbery", lang: "en" },
  "ran::Det store togranet": { wiki: "Great Train Robbery (1963)", lang: "en" },
  "ran::Hatton Garden-innbruddet": { wiki: "Hatton Garden safe deposit burglary", lang: "en" },
  "ran::Louvre-tyveriet": { wiki: "2025 Louvre heist", lang: "en" },
  "ran::Bybit-hackingen": { wiki: "Bybit", lang: "en" },
  "ran::Ronin-hackingen (Axie Infinity)": { wiki: "Axie Infinity", lang: "en" },
  "ran::Poly Network-hackingen": { wiki: "Poly Network exploit", lang: "en" },
  "ran::BNB Bridge-hackingen": null,
  "ran::Bitfinex-hackingen": { wiki: "Bitfinex", lang: "en" },
  "ran::Securitas-ranet i Tonbridge": { wiki: "Securitas depot robbery", lang: "en" },
  "ran::Bangladesh Bank-ranet": { wiki: "Bangladesh Bank robbery", lang: "en" },
  "ran::Banco del Austro-hackingen": null,
  "ran::Helikopterranet i Västberga": { wiki: "Västberga helicopter robbery", lang: "en" },
  "ran::Madoffs svindel": { wiki: "Bernie Madoff", lang: "en" },
  "ran::Stanfords svindel": { wiki: "Allen Stanford", lang: "en" },
  "ran::Wirecard-skandalen": { wiki: "Wirecard", lang: "en" },
  "ran::OneCoin": { wiki: "OneCoin", lang: "en" },
  "ran::Adobolis tap i UBS": { wiki: "Kweku Adoboli", lang: "en" },
  "ran::Charles Ponzis svindel": { wiki: "Charles Ponzi", lang: "en" },
  "ran::Tyveriet av Cellinis Saliera": { wiki: "Cellini Salt Cellar", lang: "en" },
  "ran::Carlton-ranet i Cannes": { wiki: "2013 Carlton Cannes heist", lang: "en" },
  "ran::Graff-ranet i 2009": { wiki: "2009 Graff Diamonds robbery", lang: "en" },
  "ran::Graff-ranet i 2003": { wiki: "Graff (jewellers)", lang: "en" },
  "ran::Ranet av Bührle-samlingen": { wiki: "Foundation E. G. Bührle", lang: "en" },
  "ran::Gullmynten fra Bode-museet": { wiki: "Big Maple Leaf", lang: "en" },
  "ran::Dunbar-ranet": { wiki: "Dunbar Armored robbery", lang: "en" },
  "ran::Loomis Fargo-ranet": { wiki: "October 1997 Loomis Fargo robbery", lang: "en" },
  "ran::Easter Sunday-ranet": { wiki: "Easter Sunday heist", lang: "en" },
  "ran::300-millioner-yen-ranet": { wiki: "300 million yen robbery", lang: "en" },
  "ran::Great Brink's-ranet": { wiki: "Great Brink's Robbery", lang: "en" },
  "ran::Det store gullranet": { wiki: "Great Gold Robbery", lang: "en" },
  "ran::Det store perleranet": { wiki: "Great Pearl Robbery", lang: "en" },
  "ran::Eastcastle Street-ranet": { wiki: "Eastcastle Street robbery", lang: "en" },
  "ran::Baker Street-ranet": { wiki: "Baker Street robbery", lang: "en" },
  "ran::Mayfair-ranet (Bank of America)": null,
  "ran::Security Express-ranet": null,
  "ran::Obligasjonsranet i City": { wiki: "City bonds robbery", lang: "en" },
  "ran::Midland Bank-ranet": null,
  "ran::Tyveriet av Buccleuch-Madonnaen": { wiki: "Madonna of the Yarnwinder", lang: "en" },
  "ran::Tyveriet av Portland-tiaraen": { wiki: "Portland Tiara", lang: "en" },
  "ran::Gulltoalettet «America»": { wiki: "America (Cattelan)", lang: "en" },
  "ran::Ecclestone-innbruddet": { wiki: "Tamara Ecclestone", lang: "en" },
  "ran::Feltham-bokranet": null,
  "ran::Slough-ranet": null,
  "ran::Maleriene fra Christ Church": { wiki: "Christ Church Picture Gallery", lang: "en" },
  "ran::Waddesdon Manor-ranet": { wiki: "Waddesdon Manor", lang: "en" },
  "ran::Tyveriet fra Whitworth-galleriet": { wiki: "Whitworth Art Gallery", lang: "en" },
  "ran::Sigarettranet i Belfast": null,
  "ran::Le Vian-ranet": null,
  "ran::Marlborough-diamantranet": null,
  "ran::Gullranet på A13": null,
  "ran::Avenue Road-innbruddet": null,
  "ran::KLM-gullranet": null,
  "ran::D.B. Cooper-kapringen": { wiki: "D. B. Cooper", lang: "en" },
  "ran::Lønnesirup-ranet": { wiki: "Great Canadian Maple Syrup Heist", lang: "en" },
  // Oppkjøp: artikkelen om saken/tingen (frie bilder; ingen logoer). null = emoji
  "oppkjop::WhatsApp": { wiki: "WhatsApp", lang: "en" },
  "oppkjop::Instagram": { wiki: "Instagram", lang: "en" },
  "oppkjop::Twitter": { wiki: "X (social network)", lang: "en" },
  "oppkjop::YouTube": { wiki: "YouTube", lang: "en" },
  "oppkjop::Marvel": { wiki: "Marvel Entertainment", lang: "en" },
  "oppkjop::Lucasfilm": { wiki: "Lucasfilm", lang: "en" },
  "oppkjop::Activision Blizzard": { wiki: "Activision Blizzard", lang: "en" },
  "oppkjop::Minecraft (Mojang)": { wiki: "Mojang Studios", lang: "en" },
  "oppkjop::Pixar": { wiki: "Pixar", lang: "en" },
  "oppkjop::Skype (til Microsoft)": { wiki: "Skype", lang: "en" },
  "oppkjop::Skype (til eBay)": null,
  "oppkjop::Beats": { wiki: "Beats (brand)", lang: "en" },
  "oppkjop::LinkedIn": { wiki: "LinkedIn", lang: "en" },
  "oppkjop::Tandberg": { wiki: "Tandberg", lang: "en" },
  "oppkjop::Trolltech (Qt)": { wiki: "Qt Group", lang: "en" },
  "oppkjop::FAST Search & Transfer": { wiki: "Fast Search & Transfer", lang: "en" },
  "oppkjop::Kahoot!": { wiki: "Kahoot!", lang: "en" },
  "oppkjop::King (Candy Crush)": { wiki: "King (company)", lang: "en" },
  "oppkjop::Rovio (Angry Birds)": { wiki: "Rovio Entertainment", lang: "en" },
  "oppkjop::Supercell": { wiki: "Supercell (company)", lang: "en" },
  "oppkjop::iZettle": { wiki: "Zettle", lang: "en" },
  "oppkjop::Slack": { wiki: "Slack Technologies", lang: "en" },
  "oppkjop::Tableau": { wiki: "Tableau Software", lang: "en" },
  "oppkjop::Motorola Mobility": { wiki: "Motorola Mobility", lang: "en" },
  "oppkjop::Tumblr": { wiki: "Tumblr", lang: "en" },
  "oppkjop::Hotmail": { wiki: "Outlook.com", lang: "en" },
  "oppkjop::Waze": { wiki: "Waze", lang: "en" },
  "oppkjop::Android": { wiki: "Android (operating system)", lang: "en" },
  "oppkjop::Nest": { wiki: "Google Nest", lang: "en" },
  "oppkjop::Ring": { wiki: "Ring (company)", lang: "en" },
  "oppkjop::Twitch": { wiki: "Twitch (service)", lang: "en" },
  "oppkjop::Whole Foods": { wiki: "Whole Foods Market", lang: "en" },
  "oppkjop::Zappos": { wiki: "Zappos", lang: "en" },
  "oppkjop::NeXT": { wiki: "NeXT", lang: "en" },
  "oppkjop::Arm": { wiki: "Arm Holdings", lang: "en" },
  "oppkjop::Bungie": { wiki: "Bungie", lang: "en" },
  "oppkjop::ZeniMax": { wiki: "ZeniMax Media", lang: "en" },
  "oppkjop::Myspace": { wiki: "Myspace", lang: "en" },
  "oppkjop::Bebo (kjøpt tilbake)": { wiki: "Bebo", lang: "en" },
  "oppkjop::Vine": { wiki: "Vine (service)", lang: "en" },
  "oppkjop::GeoCities": { wiki: "GeoCities", lang: "en" },
  "oppkjop::Broadcast.com": { wiki: "Broadcast.com", lang: "en" },
  "oppkjop::Yahoo (til Verizon)": { wiki: "Yahoo!", lang: "en" },
  "oppkjop::AOL (til Verizon)": { wiki: "AOL", lang: "en" },
  "oppkjop::21st Century Fox": { wiki: "21st Century Fox", lang: "en" },
  "oppkjop::Time Warner": { wiki: "Time Warner", lang: "en" },
  "oppkjop::Tiffany & Co.": { wiki: "Tiffany & Co.", lang: "en" },
  "oppkjop::Volvo Cars": { wiki: "Volvo Cars", lang: "en" },
  "oppkjop::The Washington Post": { wiki: "The Washington Post", lang: "en" },
  "oppkjop::Oculus": { wiki: "Oculus VR", lang: "en" },
  "oppkjop::Newcastle United": { wiki: "Newcastle United F.C.", lang: "en" },
  "oppkjop::Boston Celtics": { wiki: "Boston Celtics", lang: "en" },
  "oppkjop::Zynga": { wiki: "Zynga", lang: "en" },
  "oppkjop::GitHub": { wiki: "GitHub", lang: "en" },
  "oppkjop::Mailchimp": { wiki: "Mailchimp", lang: "en" },
  "oppkjop::Red Hat": { wiki: "Red Hat", lang: "en" },
  "oppkjop::Sun Microsystems": { wiki: "Sun Microsystems", lang: "en" },
  "oppkjop::MySQL": { wiki: "MySQL", lang: "en" },
  "oppkjop::Alcatel-Lucent": { wiki: "Alcatel-Lucent", lang: "en" },
  "oppkjop::Dollar Shave Club": { wiki: "Dollar Shave Club", lang: "en" },
  "oppkjop::Honey": { wiki: "PayPal Honey", lang: "en" },
  "oppkjop::Napster (til Best Buy)": { wiki: "Napster", lang: "en" },
  "oppkjop::Napster (til Roxio)": null,
  "oppkjop::Louisiana-kjøpet": { wiki: "Louisiana Purchase", lang: "en" },
  "oppkjop::Alaska-kjøpet": { wiki: "Alaska Purchase", lang: "en" },
  // Solgt for: artikkelen om saken/tingen (frie bilder; ingen logoer). null = emoji
  "kuriositeter::Cheetozard (Charizard-Cheeto)": null,
  "kuriositeter::Ostesmørbrød med Jomfru Maria": null,
  "kuriositeter::Napoleons hatt": null,
  "kuriositeter::Jordans «Last Dance»-trøye": { wiki: "Michael Jordan", lang: "en" },
  "kuriositeter::Wembanyamas debuttrøye": { wiki: "Victor Wembanyama", lang: "en" },
  "kuriositeter::Mantle-kortet (1952 Topps)": { wiki: "Mickey Mantle", lang: "en" },
  "kuriositeter::Jordan/Kobe-kortet (Logoman)": null,
  "kuriositeter::Honus Wagner-kortet": { wiki: "T206 Honus Wagner", lang: "en" },
  "kuriositeter::Babe Ruth-kortet (1914)": { wiki: "Babe Ruth", lang: "en" },
  "kuriositeter::LeBron James-rookiekortet": { wiki: "LeBron James", lang: "en" },
  "kuriositeter::Luka Dončić-kortet": { wiki: "Luka Dončić", lang: "en" },
  "kuriositeter::Patrick Mahomes-rookiekortet": { wiki: "Patrick Mahomes", lang: "en" },
  "kuriositeter::Tom Brady-rookiekortet": { wiki: "Tom Brady", lang: "en" },
  "kuriositeter::Wayne Gretzky-rookiekortet": { wiki: "Wayne Gretzky", lang: "en" },
  "kuriositeter::Mike Trout-kortet": { wiki: "Mike Trout", lang: "en" },
  "kuriositeter::Pikachu Illustrator": { wiki: "Pikachu Illustrator", lang: "en" },
  "kuriositeter::The One Ring (Magic-kort)": null,
  "kuriositeter::Babe Ruths «Called Shot»-trøye": { wiki: "Babe Ruth's called shot", lang: "en" },
  "kuriositeter::Maradonas «Guds hånd»-trøye": { wiki: "The hand of God", lang: "en" },
  "kuriositeter::Ballen fra «Guds hånd»": null,
  "kuriositeter::Ohtanis 50. homerun-ball": { wiki: "Shohei Ohtani", lang: "en" },
  "kuriositeter::McGwires 70. homerun-ball": { wiki: "Mark McGwire", lang: "en" },
  "kuriositeter::Muratovs Nobelmedalje": { wiki: "Dmitry Muratov", lang: "en" },
  "kuriositeter::Watsons Nobelmedalje": { wiki: "James Watson", lang: "en" },
  "kuriositeter::Steve Jobs' sandaler": { wiki: "Steve Jobs", lang: "en" },
  "kuriositeter::Jobs' jobbsøknad": { wiki: "Steve Jobs", lang: "en" },
  "kuriositeter::Cobains MTV Unplugged-gitar": { wiki: "Kurt Cobain", lang: "en" },
  "kuriositeter::Gilmours «Black Strat»": { wiki: "The Black Strat", lang: "en" },
  "kuriositeter::Freddie Mercurys flygel": { wiki: "Freddie Mercury", lang: "en" },
  "kuriositeter::Michael Jacksons «Thriller»-jakke": { wiki: "Thriller jacket", lang: "en" },
  "kuriositeter::«Titanic»-døra": null,
  "kuriositeter::Batmobilen fra 1966": { wiki: "Batmobile", lang: "en" },
  "kuriositeter::R2-D2 fra «Star Wars»": { wiki: "R2-D2", lang: "en" },
  "kuriositeter::Månestøv fra Luna 16": { wiki: "Luna 16", lang: "en" },
  "kuriositeter::Armstrongs månepose": { wiki: "Neil Armstrong", lang: "en" },
  "kuriositeter::Romdrakt fra Apollo–Sojuz": { wiki: "Apollo–Soyuz Test Project", lang: "en" },
  "kuriositeter::Marilyns «Happy Birthday»-kjole": { wiki: "Happy Birthday, Mr. President", lang: "en" },
  "kuriositeter::Dianas «black sheep»-genser": { wiki: "Diana, Princess of Wales", lang: "en" },
  "kuriositeter::John Lennons tann": { wiki: "John Lennon", lang: "en" },
  "kuriositeter::Dorothys rubinsko": { wiki: "Ruby slippers", lang: "en" },
  "kuriositeter::T. rex «Stan»": { wiki: "Stan (dinosaur)", lang: "en" },
  "kuriositeter::T. rex «Sue»": { wiki: "Sue (dinosaur)", lang: "en" },
  "kuriositeter::Stegosaurus «Apex»": { wiki: "Apex (dinosaur)", lang: "en" },
  "kuriositeter::Triceratops «Big John»": { wiki: "Big John (dinosaur)", lang: "en" },
  "kuriositeter::Salvator Mundi": { wiki: "Salvator Mundi (painting)", lang: "en" },
  "kuriositeter::Skrik (pastellversjonen)": { wiki: "The Scream", lang: "en" },
  "kuriositeter::Love is in the Bin": { wiki: "Love Is in the Bin", lang: "en" },
  "kuriositeter::Beeples «Everydays»": { wiki: "Everydays: the First 5000 Days", lang: "en" },
  "kuriositeter::Dorseys første tweet (NFT)": { wiki: "Jack Dorsey", lang: "en" },
  "kuriositeter::Charlie bit my finger (NFT)": { wiki: "Charlie Bit My Finger", lang: "en" },
  "kuriositeter::Super Mario 64 (forseglet)": { wiki: "Super Mario 64", lang: "en" },
  "kuriositeter::Super Mario Bros. (forseglet)": { wiki: "Super Mario Bros.", lang: "en" },
  "kuriositeter::Nintendo PlayStation-prototypen": { wiki: "Super NES CD-ROM", lang: "en" },
  "kuriositeter::1933 Double Eagle": { wiki: "1933 double eagle", lang: "en" },
  "kuriositeter::British Guiana 1c magenta": { wiki: "British Guiana 1c magenta", lang: "en" },
  "kuriositeter::Treskilling Yellow": { wiki: "Treskilling Yellow", lang: "en" },
  "kuriositeter::USAs grunnlov (førstetrykk)": { wiki: "United States Constitution", lang: "en" },
  "kuriositeter::Codex Leicester": { wiki: "Codex Leicester", lang: "en" },
  "kuriositeter::Magna Carta (1297)": { wiki: "Magna Carta", lang: "en" },
  "kuriositeter::Einsteins «Gud-brev»": { wiki: "Albert Einstein", lang: "en" },
  "kuriositeter::Pink Star": { wiki: "Pink Star (diamond)", lang: "en" },
  "kuriositeter::Oppenheimer Blue": { wiki: "Oppenheimer Blue", lang: "en" },
  "kuriositeter::La Peregrina-perlen": { wiki: "La Peregrina pearl", lang: "en" },
  "kuriositeter::Fabergé Rothschild-egget": { wiki: "Rothschild (Fabergé egg)", lang: "en" },
  "kuriositeter::Henckel von Donnersmarck-tiaraen": null,
  "kuriositeter::Mercedes 300 SLR Uhlenhaut": { wiki: "Mercedes-Benz 300 SLR", lang: "en" },
  "kuriositeter::Tunfisk på 278 kg": { wiki: "Atlantic bluefin tuna", lang: "en" },
  "kuriositeter::Bitcoin-pizzaene": null,

  // Overgangssummer: navn som ikke er artikkeltittelen på engelsk Wikipedia
  "overgangssummer::Khvitsja Kvaratskhelia": { wiki: "Khvicha Kvaratskhelia", lang: "en" },
  "overgangssummer::Alisson": { wiki: "Alisson Becker", lang: "en" },
  "overgangssummer::Antony": { wiki: "Antony (footballer)", lang: "en" },
  "overgangssummer::Casemiro": { wiki: "Casemiro", lang: "en" },
  "overgangssummer::Neymar": { wiki: "Neymar", lang: "en" },
  "overgangssummer::Rodri": { wiki: "Rodri", lang: "en" },
  "overgangssummer::Pedri": { wiki: "Pedri", lang: "en" },
  "overgangssummer::Kaká": { wiki: "Kaká", lang: "en" },
  "overgangssummer::Ronaldinho": { wiki: "Ronaldinho", lang: "en" },
  "overgangssummer::Raphinha": { wiki: "Raphinha", lang: "en" },
  "overgangssummer::Wayne Rooney": { wiki: "Wayne Rooney", lang: "en" },

  // Bildetreff rettet/utfylt for de nye kategoriene (stikkprøver mot rapport.tsv)
  "hva-veier-mest::Oscar-statuetten": { wiki: "Academy Awards", lang: "en" },
  "hva-veier-mest::OL-gullmedalje (Paris 2024)": null,
  "hva-veier-mest::Hønseegg": { wiki: "Egg as food", lang: "en" },
  "hva-veier-mest::Basketball": { wiki: "Basketball (ball)", lang: "en" },
  "hva-veier-mest::Fat Man (atombombe)": { wiki: "Fat Man", lang: "en" },
  "hva-veier-mest::Apollo-kommandomodulen": { wiki: "Apollo command and service module", lang: "en" },
  "hva-veier-mest::Bowlingkule": { wiki: "Bowling ball", lang: "en" },
  "hva-veier-mest::Champions League-pokalen": { wiki: "UEFA Champions League", lang: "en" },
  "hva-veier-mest::Cheops-pyramiden": { wiki: "Great Pyramid of Giza", lang: "en" },
  "hva-veier-mest::Formel 1-bil (2026-regler)": { wiki: "Formula One car", lang: "en" },
  "hva-veier-mest::Gullbarre (standard)": { wiki: "Gold bar", lang: "en" },
  "hva-veier-mest::Hjertet til en blåhval": null,
  "hva-veier-mest::Kristus Forløseren": { wiki: "Christ the Redeemer (statue)", lang: "en" },
  "hva-veier-mest::Ku": { wiki: "Cattle", lang: "en" },
  "hva-veier-mest::Liter bensin": { wiki: "Gasoline", lang: "en" },
  "hva-veier-mest::Liter vann": { wiki: "Water", lang: "en" },
  "hva-veier-mest::Lombardi-pokalen": { wiki: "Vince Lombardi Trophy", lang: "en" },
  "hva-veier-mest::MacBook Air 13\" (M4)": { wiki: "MacBook Air (Apple silicon)", lang: "en" },
  "hva-veier-mest::Nobelmedalje": { wiki: "Nobel Prize", lang: "en" },
  "hva-veier-mest::Romdrakt (EMU)": { wiki: "Extravehicular Mobility Unit", lang: "en" },
  "hva-veier-mest::Romfergen (tom)": { wiki: "Space Shuttle orbiter", lang: "en" },
  "hva-veier-mest::Skolebuss": { wiki: "School bus", lang: "en" },
  "hva-veier-mest::Titanics anker": null,
  "hva-veier-mest::Tsarklokka": { wiki: "Tsar Bell", lang: "en" },
  "hva-veier-mest::Tyrannosaurus rex «Sue»": { wiki: "Sue (dinosaur)", lang: "en" },
  "hva-veier-mest::VM-pokalen i fotball": { wiki: "FIFA World Cup Trophy", lang: "en" },
  "hva-veier-mest::Fotball": { wiki: "Ball (association football)", lang: "en" },
  "levealder::Galápagosskilpadde (Harriet)": { wiki: "Harriet (tortoise)", lang: "en" },
  "levealder::Jonathan (kjempeskilpadde)": { wiki: "Jonathan (tortoise)", lang: "en" },
  "levealder::Hummer": { wiki: "European lobster", lang: "en" },
  "levealder::Ål (i fangenskap)": { wiki: "European eel", lang: "en" },
  "levealder::Menneske (Jeanne Calment)": { wiki: "Jeanne Calment", lang: "en" },
  "levealder::Hund (Bluey)": { wiki: "Bluey (dog)", lang: "en" },
  "levealder::Katt (Creme Puff)": { wiki: "Creme Puff (cat)", lang: "en" },
  "levealder::Papegøye (Cookie)": { wiki: "Cookie (cockatoo)", lang: "en" },
  "levealder::Albatross (Wisdom)": { wiki: "Wisdom (albatross)", lang: "en" },
  "levealder::Metusalem (furu)": { wiki: "Methuselah (tree)", lang: "en" },
  "levealder::Dronningbie": { wiki: "Queen bee", lang: "en" },
  "levealder::Glasssvamp (Monorhaphis)": { wiki: "Monorhaphis chuni", lang: "en" },
  "levealder::Ishavsmusling «Ming»": { wiki: "Ocean quahog", lang: "en" },
  "levealder::Ku": { wiki: "Cattle", lang: "en" },
  "levealder::Maurdronning": null,
  "levealder::Mus": { wiki: "House mouse", lang: "en" },
  "levealder::Olivenpre": { wiki: "Olive", lang: "en" },
  "levealder::Sikade (periodisk)": { wiki: "Periodical cicadas", lang: "en" },
  "levealder::Termittdronning": null,
  "toppfart::Svømmer (50 m fri)": { wiki: "César Cielo", lang: "en" },
  "toppfart::Banesprinter (sykkel)": { wiki: "Track cycling", lang: "en" },
  "toppfart::Formel 1 (Valtteri Bottas, 2016)": { wiki: "Valtteri Bottas", lang: "en" },
  "toppfart::Skred": { wiki: "Avalanche", lang: "en" },
  "toppfart::Helikopter (Black Hawk)": { wiki: "Sikorsky UH-60 Black Hawk", lang: "en" },
  "toppfart::Badmintonsmash": { wiki: "Badminton", lang: "en" },
  "toppfart::Elsparkesykkel": { wiki: "Electric scooter", lang: "en" },
  "toppfart::Fallskjermhopper (fritt fall)": { wiki: "Skydiving", lang: "en" },
  "toppfart::Fartsski (Ivan Origone)": { wiki: "Speed skiing", lang: "en" },
  "toppfart::Fotballskudd (Ronny Heberson)": { wiki: "Ronny Heberson", lang: "en" },
  "toppfart::Fullblodshest": { wiki: "Thoroughbred", lang: "en" },
  "toppfart::Galápagosskilpadde": { wiki: "Galápagos tortoise", lang: "en" },
  "toppfart::Gulfinnet tunfisk": { wiki: "Yellowfin tuna", lang: "en" },
  "toppfart::Hurtigruteskip": { wiki: "Hurtigruten", lang: "en" },
  "toppfart::Jordas fart rundt sola": { wiki: "Earth", lang: "en" },
  "toppfart::Lydens hastighet": { wiki: "Speed of sound", lang: "en" },
  "toppfart::Makohai": { wiki: "Shortfin mako shark", lang: "en" },
  "toppfart::Maratonløper (Kipchoge)": { wiki: "Eliud Kipchoge", lang: "en" },
  "toppfart::Orkan (kategori 5)": { wiki: "Tropical cyclone", lang: "en" },
  "toppfart::Red Force (berg-og-dal-bane)": { wiki: "Red Force (roller coaster)", lang: "en" },
  "toppfart::Regndråpe": { wiki: "Raindrop", lang: "en" },
  "toppfart::Sykkel bak bil (rekord)": { wiki: "Denise Mueller-Korenek", lang: "en" },
  "toppfart::Thomsongasell": { wiki: "Thomson's gazelle", lang: "en" },
  "toppfart::Veyron Super Sport": { wiki: "Bugatti Veyron", lang: "en" },
  "toppfart::Vindkast (Barrow Island)": null,
  "toppfart::Øyenstikker": { wiki: "Dragonfly", lang: "en" },
  "overgangssummer::Antony": { wiki: "Antony (footballer, born 2000)", lang: "en" },
  "overgangssummer::Luis Suárez": { wiki: "Luis Suárez", lang: "en" },
  "sanger-strommer-norden::Mary on a Cross": { wiki: "Ghost (Swedish band)", lang: "en" },
  "sanger-strommer-norden::Samsara": { wiki: "Tungevaag", lang: "en" },
  "sanger-strommer-norden::Pinne for landet": { wiki: "Freddy Kalas", lang: "en" },
  "sanger-strommer-norden::Not You": { wiki: "Emma Steinbakken" },

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
  // Morsomme fakta: artikkelen om personen/stedet/saken (frie bilder; fallback emoji)
  "fakta::OL-gull til Michael Phelps": { wiki: "Michael Phelps", lang: "en" },
  "fakta::OL-gull til Usain Bolt": { wiki: "Usain Bolt", lang: "en" },
  "fakta::OL-medaljer til Marit Bjørgen": { wiki: "Marit Bjørgen", lang: "en" },
  "fakta::OL-gull til Ole Einar Bjørndalen": { wiki: "Ole Einar Bjørndalen", lang: "en" },
  "fakta::Norske medaljer i vinter-OL 2022": { wiki: "Beijing National Stadium", lang: "en" },
  "fakta::Wimbledon-titler til Roger Federer": { wiki: "Roger Federer", lang: "en" },
  "fakta::Roland Garros-titler til Rafael Nadal": { wiki: "Rafael Nadal", lang: "en" },
  "fakta::Poeng Wilt Chamberlain scoret i én kamp": { wiki: "Wilt Chamberlain", lang: "en" },
  "fakta::Poeng Kobe Bryant scoret i én kamp": { wiki: "Kobe Bryant", lang: "en" },
  "fakta::Trepoengere av Stephen Curry i 2015/16": { wiki: "Stephen Curry", lang: "en" },
  "fakta::NBA-titler til Bill Russell": { wiki: "Bill Russell", lang: "en" },
  "fakta::Super Bowl-seirer for Tom Brady": { wiki: "Tom Brady", lang: "en" },
  "fakta::VM-titler i Formel 1 for Michael Schumacher": { wiki: "Michael Schumacher", lang: "en" },
  "fakta::Seirer for Max Verstappen i 2023-sesongen": { wiki: "Max Verstappen", lang: "en" },
  "fakta::Mål av Miroslav Klose i VM": { wiki: "Miroslav Klose", lang: "en" },
  "fakta::Mål av Just Fontaine i VM 1958": { wiki: "Just Fontaine", lang: "en" },
  "fakta::NHL-mål av Wayne Gretzky": { wiki: "Wayne Gretzky", lang: "en" },
  "fakta::Homeruns av Barry Bonds i MLB": { wiki: "Barry Bonds", lang: "en" },
  "fakta::Premier League-mål av Haaland i 2022/23": { wiki: "Erling Haaland", lang: "en" },
  "fakta::Ligakamper uten tap på rad for Arsenal": { wiki: "Emirates Stadium", lang: "en" },
  "fakta::Poeng for Derby i Premier League 2007/08": { wiki: "Pride Park Stadium", lang: "en" },
  "fakta::Seriegull på rad for Rosenborg": { wiki: "Lerkendal Stadion", lang: "en" },
  "fakta::Poeng i en maksimal snookerbreak": { wiki: "Snooker", lang: "en" },
  "fakta::Poeng i en perfekt bowlingkamp": { wiki: "Ten-pin bowling", lang: "en" },
  "fakta::Minutter i Isner–Mahut (Wimbledon 2010)": { wiki: "John Isner", lang: "en" },
  "fakta::Games i Isner–Mahut (Wimbledon 2010)": { wiki: "Nicolas Mahut", lang: "en" },
  "fakta::Hull på en vanlig golfbane": { wiki: "Golf course", lang: "en" },
  "fakta::Spillere på banen i rugby union": { wiki: "Rugby union", lang: "en" },
  "fakta::Etappeseire for Eddy Merckx i Tour de France": { wiki: "Eddy Merckx", lang: "en" },
  "fakta::Tour de France-seire for Miguel Induráin": { wiki: "Miguel Induráin", lang: "en" },
  "fakta::Kilometer i et maraton": { wiki: "Marathon", lang: "en" },
  "fakta::Magnus Carlsens høyeste sjakkrating": { wiki: "Magnus Carlsen", lang: "en" },
  "fakta::Lovlige første trekk for hvit i sjakk": { wiki: "Chess", lang: "en" },
  "fakta::Trekk som holder for enhver Rubiks kube": { wiki: "Rubik's Cube", lang: "en" },
  "fakta::Felt på et sjakkbrett": { wiki: "Chessboard", lang: "en" },
  "fakta::Baller på et snookerbord": { wiki: "Billiard ball", lang: "en" },
  "fakta::Mennesker som har gått på månen": { wiki: "Apollo 17", lang: "en" },
  "fakta::Apollo-landinger på månen": { wiki: "Apollo 11", lang: "en" },
  "fakta::Minutter Jurij Gagarins romferd varte": { wiki: "Yuri Gagarin", lang: "en" },
  "fakta::Dager Poljakov var i rommet i ett strekk": { wiki: "Valeri Polyakov", lang: "en" },
  "fakta::Oppdrag med romfergene til NASA": { wiki: "Space Shuttle", lang: "en" },
  "fakta::Stjernebilder anerkjent av IAU": { wiki: "Constellation", lang: "en" },
  "fakta::Objekter i Messiers katalog": { wiki: "Messier object", lang: "en" },
  "fakta::Planeter i solsystemet": { wiki: "Solar System", lang: "en" },
  "fakta::Jorddøgn i ett år på Venus": { wiki: "Venus", lang: "en" },
  "fakta::Jorddøgn for én rotasjon av Venus": { wiki: "Venus", lang: "en" },
  "fakta::Jorddøgn i ett år på Merkur": { wiki: "Mercury (planet)", lang: "en" },
  "fakta::Jorddøgn fra soloppgang til neste på Merkur": { wiki: "Mercury (planet)", lang: "en" },
  "fakta::Jorddøgn i ett år på Mars": { wiki: "Mars", lang: "en" },
  "fakta::Jordår i ett år på Neptun": { wiki: "Neptune", lang: "en" },
  "fakta::Jordår i ett år på Pluto": { wiki: "Pluto", lang: "en" },
  "fakta::Meter til toppen av Mount Everest": { wiki: "Mount Everest", lang: "en" },
  "fakta::Meter høyt: Burj Khalifa": { wiki: "Burj Khalifa", lang: "en" },
  "fakta::Meter lang: Titanic": { wiki: "Titanic", lang: "en" },
  "fakta::Meter mellom tårnene i Golden Gate Bridge": { wiki: "Golden Gate Bridge", lang: "en" },
  "fakta::Trinn opp til toppen av Big Ben": { wiki: "Big Ben", lang: "en" },
  "fakta::Trinn i Empire State Building Run-Up": { wiki: "Empire State Building", lang: "en" },
  "fakta::Kilometer med Transsibirbanen": { wiki: "Trans-Siberian Railway", lang: "en" },
  "fakta::Miles langs Route 66": { wiki: "U.S. Route 66", lang: "en" },
  "fakta::År Elizabeth II satt på tronen": { wiki: "Elizabeth II", lang: "en" },
  "fakta::År Ludvig XIV var konge": { wiki: "Louis XIV", lang: "en" },
  "fakta::År dronning Victoria satt på tronen": { wiki: "Queen Victoria", lang: "en" },
  "fakta::Koner Henrik VIII giftet seg med": { wiki: "Henry VIII", lang: "en" },
  "fakta::År Hundreårskrigen varte": { wiki: "Hundred Years' War", lang: "en" },
  "fakta::År Berlinmuren sto": { wiki: "Berlin Wall", lang: "en" },
  "fakta::Medlemsland i FN": { wiki: "United Nations Headquarters", lang: "en" },
  "fakta::Medlemsland i EU (per 2026)": { wiki: "Berlaymont building", lang: "en" },
  "fakta::Valgmenn i USAs presidentvalg": { wiki: "United States Electoral College", lang: "en" },
  "fakta::Medlemmer av USAs Representantenes hus": { wiki: "United States House of Representatives", lang: "en" },
  "fakta::Tidssoner i Russland": { wiki: "Saint Basil's Cathedral", lang: "en" },
  "fakta::Land i Afrika": { wiki: "Africa", lang: "en" },
  "fakta::Naboland til Kina": { wiki: "Great Wall of China", lang: "en" },
  "fakta::Naboland til Tyskland": { wiki: "Brandenburg Gate", lang: "en" },
  "fakta::Lover i Hammurabis lovkode": { wiki: "Code of Hammurabi", lang: "en" },
  "fakta::Kapitler i Bibelen": { wiki: "Bible", lang: "en" },
  "fakta::Gaver i «The Twelve Days of Christmas»": { wiki: "The Twelve Days of Christmas (song)", lang: "en" },
  "fakta::Tegn i Bangkoks fulle seremonielle navn": { wiki: "Bangkok", lang: "en" },
  "fakta::Tegn i Taumatawhakatangi…-fjellets navn": { wiki: "Taumata Hill", lang: "en" },
  "fakta::Tegn i Llanfairpwllgwyngyll…-landsbyens navn": { wiki: "Llanfairpwllgwyngyll", lang: "en" },
  "fakta::Bokstaver i det norske alfabetet": { wiki: "Å", lang: "en" },
  "fakta::Bokstaver i det russiske alfabetet": { wiki: "Russian alphabet", lang: "en" },
  "fakta::Bokstaver i det greske alfabetet": { wiki: "Greek language", lang: "en" },
  "fakta::Brikker i et Scrabble-spill": { wiki: "Scrabble", lang: "en" },
  "fakta::Primtall under 100": { wiki: "Prime number", lang: "en" },
  "fakta::Meter til toppen av Galdhøpiggen": { wiki: "Galdhøpiggen", lang: "en" },
  "fakta::Meter dypt: Hornindalsvatnet": { wiki: "Hornindalsvatnet", lang: "en" },
  "fakta::Kilometer lang: Sognefjorden": { wiki: "Sognefjord", lang: "en" },
  "fakta::Kilometer lang: Glomma": { wiki: "Glomma", lang: "en" },
  "fakta::Meter lang: Lærdalstunnelen": { wiki: "Lærdal Tunnel", lang: "en" },
  "fakta::Kilometer med Nordlandsbanen": { wiki: "Nordland Line", lang: "en" },
  "fakta::Kilometer med Bergensbanen": { wiki: "Bergen Line", lang: "en" },
  "fakta::Meter over Lysefjorden: Preikestolen": { wiki: "Preikestolen", lang: "en" },
  "fakta::Hårnålssvinger på Trollstigen": { wiki: "Trollstigen", lang: "en" },
  "fakta::Tunneler på Flåmsbana": { wiki: "Flåm Line", lang: "en" },
  "fakta::Skulpturer i Vigelandsparken": { wiki: "Vigeland installation", lang: "en" },
  "fakta::Kommuner i Norge (per 2026)": { wiki: "Municipalities of Norway", lang: "en" },
  "fakta::Fylker i Norge (per 2026)": { wiki: "Counties of Norway", lang: "en" },
  "fakta::Representanter på Stortinget": { wiki: "Storting building", lang: "en" },
  "fakta::Meter fallhøyde i Vøringsfossen": { wiki: "Vøringsfossen", lang: "en" },
  "fakta::Norges seirer i Eurovision": { wiki: "Alexander Rybak", lang: "en" },
  "fakta::Nullpoeng for Norge i Eurovision": { wiki: "Jahn Teigen", lang: "en" },
  "fakta::Sesonger av «Skam»": { wiki: "Julie Andem", lang: "en" },
  "fakta::Bind i «Min kamp» av Knausgård": { wiki: "Karl Ove Knausgård", lang: "en" },
  "fakta::Bein i menneskekroppen": { wiki: "Human skeleton", lang: "en" },
  "fakta::Tenner hos en voksen person": { wiki: "Human tooth", lang: "en" },
  "fakta::Melketenner hos barn": { wiki: "Deciduous teeth", lang: "en" },
  "fakta::Ribbein hos et menneske": { wiki: "Rib cage", lang: "en" },
  "fakta::Bein i en menneskehånd": { wiki: "Hand", lang: "en" },
  "fakta::Bein i en menneskefot": { wiki: "Foot", lang: "en" },
  "fakta::Bein i menneskets hodeskalle": { wiki: "Human skull", lang: "en" },
  "fakta::Kromosomer hos mennesket": { wiki: "Karyotype", lang: "en" },
  "fakta::Hjerter en blekksprut har": { wiki: "Octopus", lang: "en" },
  "fakta::Nakkevirvler hos en giraff": { wiki: "Giraffe", lang: "en" },
  "fakta::Øyne på en honningbie": { wiki: "Honey bee", lang: "en" },
  "fakta::Tenner hos en voksen hund": { wiki: "Dog", lang: "en" },
  "fakta::Tenner hos en voksen katt": { wiki: "Cat", lang: "en" },
  "fakta::Mageavdelinger hos en ku": { wiki: "Cattle", lang: "en" },
  "fakta::Måneder drektighet hos en elefant": { wiki: "African elephant", lang: "en" },
  "fakta::Bjørnearter i verden": { wiki: "Bear", lang: "en" },
  "fakta::Bein på tusenbeinet Eumillipes persephone": { wiki: "Eumillipes persephone", lang: "en" },
  "fakta::Pølser Joey Chestnut spiste på 10 minutter": { wiki: "Joey Chestnut", lang: "en" },
  "fakta::Stykker i et bakerdusin": { wiki: "Bread", lang: "en" },
  "fakta::Centiliter i en vanlig vinflaske": { wiki: "Wine bottle", lang: "en" },
  "fakta::Oscar-statuetter til «Titanic»": { wiki: "James Cameron", lang: "en" },
  "fakta::Oscar-statuetter til «Oppenheimer»": { wiki: "Christopher Nolan", lang: "en" },
  "fakta::Filmer i Marvels Infinity Saga": { wiki: "Robert Downey Jr.", lang: "en" },
  "fakta::Bond-filmer fra Eon (per 2026)": { wiki: "Sean Connery", lang: "en" },
  "fakta::Filmer i Star Wars-hovedserien": { wiki: "Star Wars", lang: "en" },
  "fakta::Episoder av «Friends»": { wiki: "Jennifer Aniston", lang: "en" },
  "fakta::Episoder av «Seinfeld»": { wiki: "Seinfeld", lang: "en" },
  "fakta::Episoder av «The Office» (USA)": { wiki: "Steve Carell", lang: "en" },
  "fakta::Episoder av «Lost»": { wiki: "Lost (TV series)", lang: "en" },
  "fakta::Episoder av «How I Met Your Mother»": { wiki: "How I Met Your Mother", lang: "en" },
  "fakta::Episoder av «The Big Bang Theory»": { wiki: "The Big Bang Theory", lang: "en" },
  "fakta::Episoder av «Breaking Bad»": { wiki: "Breaking Bad", lang: "en" },
  "fakta::Episoder av «Game of Thrones»": { wiki: "Peter Dinklage", lang: "en" },
  "fakta::Sesonger av «Stranger Things»": { wiki: "Stranger Things", lang: "en" },
  "fakta::Pokémon i første generasjon": { wiki: "Pokémon", lang: "en" },
  "fakta::Typer i Pokémon": { wiki: "Pokémon", lang: "en" },
  "fakta::Baner i Super Mario Bros. (1985)": { wiki: "Shigeru Miyamoto", lang: "en" },
  "fakta::Nivået der Pac-Man krasjer": { wiki: "Toru Iwatani", lang: "en" },
  "fakta::Ruter på et Monopol-brett": { wiki: "Monopoly (game)", lang: "en" },
  "fakta::Kort i en Uno-kortstokk": { wiki: "Uno (card game)", lang: "en" },
  "fakta::Kort i en tarotkortstokk": { wiki: "Tarot", lang: "en" },
  "fakta::Brikker i et dominosett (dobbel-seks)": { wiki: "Dominoes", lang: "en" },
  "fakta::Maks poengsum i Yatzy": { wiki: "Yatzy", lang: "en" },
  "fakta::Taster på et piano": { wiki: "Piano", lang: "en" },
  "fakta::Studioalbum av The Beatles i Storbritannia": { wiki: "The Beatles", lang: "en" },
  "fakta::Hot 100-førsteplasser for The Beatles": { wiki: "The Beatles", lang: "en" },
  "fakta::Konserter på Taylor Swifts Eras Tour": { wiki: "Taylor Swift", lang: "en" },
  "fakta::Sekunder i «Bohemian Rhapsody»": { wiki: "Freddie Mercury", lang: "en" },
  "fakta::Sekunder i «Stairway to Heaven»": { wiki: "Led Zeppelin", lang: "en" },
  "fakta::Sekunder i «All Too Well» (lang versjon)": { wiki: "Taylor Swift", lang: "en" },
  "fakta::Uker på Hot 100-toppen: «Old Town Road»": { wiki: "Lil Nas X", lang: "en" },
  "fakta::Nummererte symfonier av Mozart": { wiki: "Wolfgang Amadeus Mozart", lang: "en" },
  "fakta::Nummererte symfonier av Haydn": { wiki: "Joseph Haydn", lang: "en" },
  "fakta::Historier om Sherlock Holmes": { wiki: "Sherlock Holmes", lang: "en" },
  "fakta::Forestillinger av «Phantom of the Opera»": { wiki: "Majestic Theatre (Broadway)", lang: "en" },
  "fakta::Maktens ringer i «Ringenes herre»": { wiki: "J. R. R. Tolkien", lang: "en" },
  "fakta::Svarord i den opprinnelige Wordle-listen": null,
}

// Oppslag: norsk visningsnavn → [tittel på engelsk Wikipedia, ikke-fri (logo/plakat/omslag)].
// Samme artikkel som visningene er hentet fra, så bildet viser det som ble slått opp.
const OPPSLAG = {
  "Donald Trump": ["Donald Trump"],
  "Elon Musk": ["Elon Musk"],
  "Taylor Swift": ["Taylor Swift"],
  "Cristiano Ronaldo": ["Cristiano Ronaldo"],
  "Lionel Messi": ["Lionel Messi"],
  "Kylian Mbappé": ["Kylian Mbappé"],
  "Erling Haaland": ["Erling Haaland"],
  "Martin Ødegaard": ["Martin Ødegaard"],
  "Magnus Carlsen": ["Magnus Carlsen"],
  "Barack Obama": ["Barack Obama"],
  "Joe Biden": ["Joe Biden"],
  "Vladimir Putin": ["Vladimir Putin"],
  "Volodymyr Zelenskyj": ["Volodymyr Zelenskyy"],
  "Jeffrey Epstein": ["Jeffrey Epstein"],
  "Charlie Kirk": ["Charlie Kirk"],
  "Pave Leo XIV": ["Pope Leo XIV"],
  "Bad Bunny": ["Bad Bunny"],
  "Billie Eilish": ["Billie Eilish"],
  "Zendaya": ["Zendaya"],
  "Timothée Chalamet": ["Timothée Chalamet"],
  "Margot Robbie": ["Margot Robbie"],
  "Pedro Pascal": ["Pedro Pascal"],
  "Sabrina Carpenter": ["Sabrina Carpenter"],
  "Ariana Grande": ["Ariana Grande"],
  "Kanye West": ["Kanye West"],
  "Drake": ["Drake (musician)"],
  "Beyoncé": ["Beyoncé"],
  "Rihanna": ["Rihanna"],
  "Lady Gaga": ["Lady Gaga"],
  "Ed Sheeran": ["Ed Sheeran"],
  "Harry Styles": ["Harry Styles"],
  "Justin Bieber": ["Justin Bieber"],
  "Selena Gomez": ["Selena Gomez"],
  "Dua Lipa": ["Dua Lipa"],
  "The Weeknd": ["The Weeknd"],
  "Travis Kelce": ["Travis Kelce"],
  "Jenna Ortega": ["Jenna Ortega"],
  "Tom Holland": ["Tom Holland"],
  "Keanu Reeves": ["Keanu Reeves"],
  "Leonardo DiCaprio": ["Leonardo DiCaprio"],
  "Albert Einstein": ["Albert Einstein"],
  "Napoleon Bonaparte": ["Napoleon"],
  "Adolf Hitler": ["Adolf Hitler"],
  "Leonardo da Vinci": ["Leonardo da Vinci"],
  "Kleopatra": ["Cleopatra"],
  "Jesus": ["Jesus"],
  "Muhammed": ["Muhammad"],
  "Marilyn Monroe": ["Marilyn Monroe"],
  "Michael Jackson": ["Michael Jackson"],
  "Elvis Presley": ["Elvis Presley"],
  "Freddie Mercury": ["Freddie Mercury"],
  "Kobe Bryant": ["Kobe Bryant"],
  "LeBron James": ["LeBron James"],
  "Stephen Curry": ["Stephen Curry"],
  "Lewis Hamilton": ["Lewis Hamilton"],
  "Max Verstappen": ["Max Verstappen"],
  "Lando Norris": ["Lando Norris"],
  "Jannik Sinner": ["Jannik Sinner"],
  "Novak Djokovic": ["Novak Djokovic"],
  "Carlos Alcaraz": ["Carlos Alcaraz"],
  "Mike Tyson": ["Mike Tyson"],
  "Jake Paul": ["Jake Paul"],
  "MrBeast": ["MrBeast"],
  "PewDiePie": ["PewDiePie"],
  "Kim Kardashian": ["Kim Kardashian"],
  "Dronning Elizabeth II": ["Elizabeth II"],
  "Kong Charles III": ["Charles III"],
  "Kate Middleton": ["Catherine, Princess of Wales"],
  "Meghan Markle": ["Meghan, Duchess of Sussex"],
  "Kong Harald V": ["Harald V"],
  "Greta Thunberg": ["Greta Thunberg"],
  "Bill Gates": ["Bill Gates"],
  "Jeff Bezos": ["Jeff Bezos"],
  "Mark Zuckerberg": ["Mark Zuckerberg"],
  "Steve Jobs": ["Steve Jobs"],
  "Johnny Depp": ["Johnny Depp"],
  "Tom Cruise": ["Tom Cruise"],
  "Brad Pitt": ["Brad Pitt"],
  "Angelina Jolie": ["Angelina Jolie"],
  "Scarlett Johansson": ["Scarlett Johansson"],
  "Ryan Gosling": ["Ryan Gosling"],
  "Cillian Murphy": ["Cillian Murphy"],
  "Robert Downey Jr.": ["Robert Downey Jr."],
  "Dwayne «The Rock» Johnson": ["Dwayne Johnson"],
  "USA": ["United States"],
  "Russland": ["Russia"],
  "Kina": ["China"],
  "India": ["India"],
  "Japan": ["Japan"],
  "Ukraina": ["Ukraine"],
  "Israel": ["Israel"],
  "Norge": ["Norway"],
  "Sverige": ["Sweden"],
  "Danmark": ["Denmark"],
  "Tyskland": ["Germany"],
  "Frankrike": ["France"],
  "Storbritannia": ["United Kingdom"],
  "Brasil": ["Brazil"],
  "Canada": ["Canada"],
  "Australia": ["Australia"],
  "Italia": ["Italy"],
  "Spania": ["Spain"],
  "Tyrkia": ["Turkey"],
  "Iran": ["Iran"],
  "Nord-Korea": ["North Korea"],
  "Mexico": ["Mexico"],
  "Grønland": ["Greenland"],
  "Island": ["Iceland"],
  "Venezuela": ["Venezuela"],
  "Stranger Things": ["Stranger Things", true],
  "Squid Game": ["Squid Game", true],
  "Wednesday": ["Wednesday (TV series)", true],
  "Breaking Bad": ["Breaking Bad", true],
  "Game of Thrones": ["Game of Thrones", true],
  "Harry Potter": ["Harry Potter", true],
  "Ringenes herre": ["The Lord of the Rings", true],
  "Oppenheimer": ["Oppenheimer (film)", true],
  "Barbie": ["Barbie (film)", true],
  "Avatar": ["Avatar (2009 film)", true],
  "Titanic": ["Titanic (1997 film)", true],
  "Løvenes konge": ["The Lion King", true],
  "Frost": ["Frozen (2013 film)", true],
  "Superman": ["Superman (2025 film)", true],
  "KPop Demon Hunters": ["KPop Demon Hunters", true],
  "Sinners": ["Sinners (2025 film)", true],
  "Zootropolis 2": ["Zootopia 2", true],
  "Wicked: For Good": ["Wicked: For Good", true],
  "Adolescence": ["Adolescence (TV series)", true],
  "The Last of Us": ["The Last of Us (TV series)", true],
  "The Simpsons": ["The Simpsons", true],
  "Friends": ["Friends", true],
  "The Office": ["The Office (American TV series)", true],
  "Peaky Blinders": ["Peaky Blinders", true],
  "House of the Dragon": ["House of the Dragon", true],
  "Black Mirror": ["Black Mirror", true],
  "One Piece": ["One Piece", true],
  "Naruto": ["Naruto", true],
  "Attack on Titan": ["Attack on Titan", true],
  "Dragon Ball": ["Dragon Ball", true],
  "Pokémon": ["Pokémon", true],
  "SpongeBob Firkant": ["SpongeBob SquarePants", true],
  "Apple": ["Apple Inc.", true],
  "Google": ["Google", true],
  "Microsoft": ["Microsoft", true],
  "Amazon": ["Amazon (company)", true],
  "Tesla": ["Tesla, Inc.", true],
  "Netflix": ["Netflix", true],
  "Nike": ["Nike, Inc.", true],
  "Coca-Cola": ["Coca-Cola", true],
  "McDonald's": ["McDonald's", true],
  "Starbucks": ["Starbucks", true],
  "IKEA": ["IKEA", true],
  "Lego": ["Lego", true],
  "Nintendo": ["Nintendo", true],
  "Sony": ["Sony", true],
  "Samsung": ["Samsung", true],
  "Toyota": ["Toyota", true],
  "Ferrari": ["Ferrari", true],
  "Lamborghini": ["Lamborghini", true],
  "Porsche": ["Porsche", true],
  "BMW": ["BMW", true],
  "Volvo": ["Volvo Cars", true],
  "Spotify": ["Spotify", true],
  "TikTok": ["TikTok", true],
  "Instagram": ["Instagram", true],
  "Snapchat": ["Snapchat", true],
  "YouTube": ["YouTube", true],
  "Facebook": ["Facebook", true],
  "X (Twitter)": ["X (social network)", true],
  "ChatGPT": ["ChatGPT", true],
  "OpenAI": ["OpenAI", true],
  "Disney": ["The Walt Disney Company", true],
  "Mercedes-Benz": ["Mercedes-Benz", true],
  "Equinor": ["Equinor", true],
  "Minecraft": ["Minecraft", true],
  "Fortnite": ["Fortnite", true],
  "Roblox": ["Roblox", true],
  "Grand Theft Auto VI": ["Grand Theft Auto VI", true],
  "Among Us": ["Among Us", true],
  "Counter-Strike 2": ["Counter-Strike 2", true],
  "League of Legends": ["League of Legends", true],
  "Pokémon Go": ["Pokémon Go", true],
  "The Legend of Zelda": ["The Legend of Zelda", true],
  "Super Mario": ["Super Mario", true],
  "Call of Duty": ["Call of Duty", true],
  "Elden Ring": ["Elden Ring", true],
  "Hollow Knight: Silksong": ["Hollow Knight: Silksong", true],
  "Clair Obscur: Expedition 33": ["Clair Obscur: Expedition 33", true],
  "Valorant": ["Valorant", true],
  "Tetris": ["Tetris", true],
  "Sjakk": ["Chess", true],
  "Monopol": ["Monopoly (game)", true],
  "Wordle": ["Wordle", true],
  "Pizza": ["Pizza"],
  "Sushi": ["Sushi"],
  "Hamburger": ["Hamburger"],
  "Kaffe": ["Coffee"],
  "Sjokolade": ["Chocolate"],
  "Iskrem": ["Ice cream"],
  "Taco": ["Taco"],
  "Lasagne": ["Lasagna"],
  "Kebab": ["Kebab"],
  "Pannekake": ["Pancake"],
  "Kanelbolle": ["Cinnamon roll"],
  "Brunost": ["Brunost"],
  "Lutefisk": ["Lutefisk"],
  "Potet": ["Potato"],
  "Øl": ["Beer"],
  "Vin": ["Wine"],
  "Vodka": ["Vodka"],
  "Whisky": ["Whisky"],
  "Fotball-VM 2026": ["2026 FIFA World Cup"],
  "Champions League": ["UEFA Champions League"],
  "Eurovision Song Contest": ["Eurovision Song Contest"],
  "Super Bowl": ["Super Bowl"],
  "Wimbledon": ["Wimbledon Championships"],
  "Tour de France": ["Tour de France"],
  "Formel 1": ["Formula One"],
  "Andre verdenskrig": ["World War II"],
  "Første verdenskrig": ["World War I"],
  "Den kalde krigen": ["Cold War"],
  "Koronapandemien": ["COVID-19 pandemic"],
  "Terrorangrepet 11. september": ["September 11 attacks"],
  "Titanic (skipet)": ["Titanic"],
  "Tsjernobyl-ulykken": ["Chernobyl disaster"],
  "Svartedauden": ["Black Death"],
  "Vietnamkrigen": ["Vietnam War"],
  "Halloween": ["Halloween"],
  "Jul": ["Christmas"],
  "Påske": ["Easter"],
  "Valentinsdagen": ["Valentine's Day"],
  "Oktoberfest": ["Oktoberfest"],
  "22. juli-terroren": ["2011 Norway attacks"],
  "Hund": ["Dog"],
  "Katt": ["Cat"],
  "Løve": ["Lion"],
  "Tiger": ["Tiger"],
  "Elefant": ["Elephant"],
  "Sjiraff": ["Giraffe"],
  "Pandabjørn": ["Giant panda"],
  "Ulv": ["Wolf"],
  "Isbjørn": ["Polar bear"],
  "Hvithai": ["Great white shark"],
  "Blekksprut": ["Octopus"],
  "Pingvin": ["Penguin"],
  "Hest": ["Horse"],
  "Nebbdyr": ["Platypus"],
  "Capybara": ["Capybara"],
  "Axolotl": ["Axolotl"],
  "Elg": ["Moose"],
  "Blåhval": ["Blue whale"],
  "Tyrannosaurus rex": ["Tyrannosaurus"],
  "Sort hull": ["Black hole"],
  "Månen": ["Moon"],
  "Mars": ["Mars"],
  "Kunstig intelligens": ["Artificial intelligence"],
  "Bitcoin": ["Bitcoin"],
  "iPhone": ["IPhone"],
  "PlayStation 5": ["PlayStation 5"],
  "Mount Everest": ["Mount Everest"],
  "Oslo": ["Oslo"],
  "Bergen": ["Bergen"],
  "Eiffeltårnet": ["Eiffel Tower"],
  "Frihetsgudinnen": ["Statue of Liberty"],
  "Pyramidene i Egypt": ["Egyptian pyramids"],
  "Den kinesiske mur": ["Great Wall of China"],
  "Nobels fredspris": ["Nobel Peace Prize"],
  "Tokyo": ["Tokyo"],
  "New York": ["New York City"],
  "Paris": ["Paris"],
  "Dubai": ["Dubai"],
  "Gazastripen": ["Gaza Strip"],
  "De olympiske leker": ["Olympic Games"],
  "Real Madrid": ["Real Madrid CF", true],
  "FC Barcelona": ["FC Barcelona", true],
  "Manchester United": ["Manchester United F.C.", true],
  "Liverpool": ["Liverpool F.C.", true],
  "Arsenal": ["Arsenal F.C.", true],
  "Rosenborg": ["Rosenborg BK", true],
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
  overgangssummer: {
    titles: (it) => {
      const n = stripParens(it.name)
      return [`${n} (footballer)`, n]
    },
    search: (it) => `${stripParens(it.name)} footballer`,
    reject: /^$/,
    accept: /footballer|soccer|football/i,
    onlyPreferred: true,
  },
  // Toppfart, vekt og levealder: tingen eller dyret har som regel en egen artikkel.
  toppfart: { titles: (it) => [it.name, stripParens(it.name), ...parensContent(it.name)], search: (it) => stripParens(it.name), reject: /^$/ },
  "hva-veier-mest": { titles: (it) => [it.name, stripParens(it.name), ...parensContent(it.name)], search: (it) => stripParens(it.name), reject: /^$/ },
  levealder: { titles: (it) => [it.name, stripParens(it.name), ...parensContent(it.name)], search: (it) => stripParens(it.name), reject: /^$/ },
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
    let ov = Object.prototype.hasOwnProperty.call(OVERRIDES, key) ? OVERRIDES[key] : undefined
    const oppslagFlagg = cat.id === "oppslag-wikipedia" && item.detail === "Land" ? flagCode(item.emoji) : null
    if (ov === undefined && cat.id === "oppslag-wikipedia" && !oppslagFlagg && OPPSLAG[item.name]) {
      const [wiki, ikkeFri] = OPPSLAG[item.name]
      ov = { wiki, lang: "en", license: ikkeFri ? "any" : "free" }
    }
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
      case "artister-lyttere-norden": {
        const names = ov?.deezer ? [ov.deezer] : [stripParens(item.name), ...parensContent(item.name)]
        for (const n of names) if (!r) r = await deezerArtist(n)
        if (!r) addWiki("artister", { key, item })
        break
      }
      case "sanger-strommer":
      case "sanger-strommer-norden":
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
      case "oppslag-wikipedia":
        if (oppslagFlagg) r = { src: `https://flagcdn.com/w320/${oppslagFlagg}.png`, how: `flag:${oppslagFlagg}` }
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
    const lang = ["artister", "filmer", "serier", "sanger", "overgangssummer", "oppslag-wikipedia"].includes(rule) ? "en" : "no"
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
