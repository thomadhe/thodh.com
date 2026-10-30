import type { MerEllerMindreCategory } from "../types"

// Verdien av det som ble stjålet eller svindlet bort i kjente ran, tyverier, hackerangrep og svindelsaker, i det
// beløpet som oppgis i kilden (nominelt, ikke inflasjonsjustert). Der tallene er omstridt er det brukt det
// tallet Wikipedia bruker i artikkelen om saken; saker uten et sikkert tall er utelatt.
// Beløpene er omregnet til norske kroner med ett fast kurs per valuta (ECB-referansekurser 29. oktober 2026,
// avrundet): USD 9.3, EUR 10.3, GBP 12.4, CHF 11.2, SEK 0.94, JPY 0.059, CAD 6.6, BRL 1.73 kroner.
// Hver verdi er avrundet til to gjeldende siffer. Kilden til hvert tall står som lenke etter varen.

export const ran: MerEllerMindreCategory = {
  id: "ran",
  title: "Største ran",
  question: "Hvilket kupp ga størst bytte?",
  winner: "higher",
  format: "compact",
  unit: "kr",
  separation: { kind: "ratio", value: 1.5 },
  source: "Wikipedia m.fl., omregnet til kroner",
  items: [
    { name: "Diamantranet i Antwerpen", value: 930000000, detail: "Ran · Belgia 2003", emoji: "💎" }, // https://en.wikipedia.org/wiki/Antwerp_diamond_heist
    { name: "Ranet mot sentralbanken i Fortaleza", value: 280000000, detail: "Tunnelran · Brasil 2005", emoji: "🕳️" }, // https://en.wikipedia.org/wiki/Banco_Central_burglary_at_Fortaleza
    { name: "Northern Bank-ranet", value: 330000000, detail: "Ran · Belfast 2004", emoji: "🏦" }, // https://en.wikipedia.org/wiki/Northern_Bank_robbery
    { name: "Juveltyveriet i Grünes Gewölbe", value: 1200000000, detail: "Tyveri · Dresden 2019", emoji: "👑" }, // https://en.wikipedia.org/wiki/Dresden_Green_Vault_burglary
    { name: "Ranet av Gardner-museet", value: 4700000000, detail: "Kunsttyveri · Boston 1990", emoji: "🖼️" }, // https://en.wikipedia.org/wiki/Isabella_Stewart_Gardner_Museum_theft
    { name: "NOKAS-ranet", value: 57000000, detail: "Ran · Stavanger 2004", emoji: "💰" }, // https://no.wikipedia.org/wiki/NOKAS-ranet
    { name: "Lufthansa-ranet", value: 55000000, detail: "Ran · New York 1978", emoji: "✈️" }, // https://en.wikipedia.org/wiki/Lufthansa_heist
    { name: "Brink's-Mat-ranet", value: 320000000, detail: "Gullran · London 1983", emoji: "🥇" }, // https://en.wikipedia.org/wiki/Brink's-Mat_robbery
    { name: "Det store togranet", value: 32000000, detail: "Togran · England 1963", emoji: "🚂" }, // https://en.wikipedia.org/wiki/Great_Train_Robbery_(1963)
    { name: "Hatton Garden-innbruddet", value: 170000000, detail: "Innbrudd · London 2015", emoji: "💍" }, // https://en.wikipedia.org/wiki/Hatton_Garden_safe_deposit_burglary
    { name: "Louvre-tyveriet", value: 910000000, detail: "Juveltyveri · Paris 2025", emoji: "👑" }, // https://en.wikipedia.org/wiki/2025_Louvre_heist
    { name: "Bybit-hackingen", value: 14000000000, detail: "Krypto-hack · 2025", emoji: "₿" }, // https://en.wikipedia.org/wiki/Bybit
    { name: "Ronin-hackingen (Axie Infinity)", value: 5800000000, detail: "Krypto-hack · 2022", emoji: "🎮" }, // https://en.wikipedia.org/wiki/Axie_Infinity
    { name: "Poly Network-hackingen", value: 5700000000, detail: "Krypto-hack · 2021", emoji: "💻" }, // https://en.wikipedia.org/wiki/Poly_Network_exploit
    { name: "BNB Bridge-hackingen", value: 5300000000, detail: "Krypto-hack · 2022", emoji: "🌉" }, // https://en.wikipedia.org/wiki/BNB_Smart_Chain_(blockchain_platform)
    { name: "Bitfinex-hackingen", value: 670000000, detail: "Krypto-hack · 2016", emoji: "₿" }, // https://en.wikipedia.org/wiki/Bitfinex
    { name: "Securitas-ranet i Tonbridge", value: 660000000, detail: "Pengeran · England 2006", emoji: "🏦" }, // https://en.wikipedia.org/wiki/Securitas_depot_robbery
    { name: "Bangladesh Bank-ranet", value: 940000000, detail: "Bankhack · 2016", emoji: "🏦" }, // https://en.wikipedia.org/wiki/Bangladesh_Bank_robbery
    { name: "Banco del Austro-hackingen", value: 110000000, detail: "Bankhack · Ecuador 2015", emoji: "🏦" }, // https://en.wikipedia.org/wiki/Lazarus_Group
    { name: "Helikopterranet i Västberga", value: 37000000, detail: "Helikopterran · Sverige 2009", emoji: "🚁" }, // https://en.wikipedia.org/wiki/Västberga_helicopter_robbery
    { name: "Madoffs svindel", value: 600000000000, detail: "Svindel · USA 2008", emoji: "📉" }, // https://en.wikipedia.org/wiki/Bernie_Madoff
    { name: "Stanfords svindel", value: 65000000000, detail: "Svindel · USA 2009", emoji: "📉" }, // https://en.wikipedia.org/wiki/Allen_Stanford
    { name: "Wirecard-skandalen", value: 20000000000, detail: "Svindel · Tyskland 2020", emoji: "💳" }, // https://en.wikipedia.org/wiki/Wirecard
    { name: "OneCoin", value: 37000000000, detail: "Kryptosvindel · 2014–2019", emoji: "🪙" }, // https://en.wikipedia.org/wiki/OneCoin
    { name: "Adobolis tap i UBS", value: 19000000000, detail: "Svindel · London 2011", emoji: "📉" }, // https://en.wikipedia.org/wiki/Kweku_Adoboli
    { name: "Charles Ponzis svindel", value: 190000000, detail: "Svindel · Boston 1920", emoji: "📮" }, // https://en.wikipedia.org/wiki/Charles_Ponzi
    { name: "Tyveriet av Cellinis Saliera", value: 560000000, detail: "Kunsttyveri · Wien 2003", emoji: "🧂" }, // https://en.wikipedia.org/wiki/Cellini_Salt_Cellar
    { name: "Carlton-ranet i Cannes", value: 1300000000, detail: "Juveltyveri · Cannes 2013", emoji: "🏨" }, // https://en.wikipedia.org/wiki/2013_Carlton_Cannes_heist
    { name: "Graff-ranet i 2009", value: 500000000, detail: "Juveltyveri · London 2009", emoji: "💎" }, // https://en.wikipedia.org/wiki/2009_Graff_Diamonds_robbery
    { name: "Graff-ranet i 2003", value: 290000000, detail: "Juveltyveri · London 2003", emoji: "💎" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Ranet av Bührle-samlingen", value: 2000000000, detail: "Kunstran · Zürich 2008", emoji: "🎨" }, // https://en.wikipedia.org/wiki/Foundation_E._G._Bührle
    { name: "Gullmynten fra Bode-museet", value: 37000000, detail: "Mynttyveri · Berlin 2017", emoji: "🪙" }, // https://en.wikipedia.org/wiki/Big_Maple_Leaf
    { name: "Dunbar-ranet", value: 180000000, detail: "Pengeran · Los Angeles 1997", emoji: "💵" }, // https://en.wikipedia.org/wiki/Dunbar_Armored_robbery
    { name: "Loomis Fargo-ranet", value: 160000000, detail: "Pengeran · Charlotte 1997", emoji: "💵" }, // https://en.wikipedia.org/wiki/October_1997_Loomis_Fargo_robbery
    { name: "Easter Sunday-ranet", value: 190000000, detail: "Pengeran · Los Angeles 2024", emoji: "💵" }, // https://en.wikipedia.org/wiki/Easter_Sunday_heist
    { name: "300-millioner-yen-ranet", value: 17000000, detail: "Ran · Tokyo 1968", emoji: "🏍️" }, // https://en.wikipedia.org/wiki/300_million_yen_robbery
    { name: "Great Brink's-ranet", value: 26000000, detail: "Ran · Boston 1950", emoji: "💰" }, // https://en.wikipedia.org/wiki/Great_Brink's_Robbery
    { name: "Det store gullranet", value: 150000, detail: "Togran · England 1855", emoji: "🥇" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Det store perleranet", value: 1900000, detail: "Juveltyveri · London 1913", emoji: "📿" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Eastcastle Street-ranet", value: 3600000, detail: "Postran · London 1952", emoji: "📮" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Baker Street-ranet", value: 37000000, detail: "Bankran · London 1971", emoji: "🏦" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Mayfair-ranet (Bank of America)", value: 99000000, detail: "Bankran · London 1975", emoji: "🏦" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Security Express-ranet", value: 74000000, detail: "Pengeran · London 1983", emoji: "💷" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Obligasjonsranet i City", value: 3600000000, detail: "Ran · London 1990", emoji: "📄" }, // https://en.wikipedia.org/wiki/City_bonds_robbery
    { name: "Midland Bank-ranet", value: 82000000, detail: "Pengeran · Manchester 1995", emoji: "💷" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Tyveriet av Buccleuch-Madonnaen", value: 310000000, detail: "Kunsttyveri · Skottland 2003", emoji: "🖼️" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Tyveriet av Portland-tiaraen", value: 47000000, detail: "Tiara-tyveri · England 2018", emoji: "👑" }, // https://en.wikipedia.org/wiki/Portland_Tiara
    { name: "Gulltoalettet «America»", value: 57000000, detail: "Tyveri · Blenheim Palace 2019", emoji: "🚽" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Ecclestone-innbruddet", value: 320000000, detail: "Innbrudd · London 2019", emoji: "💎" }, // https://en.wikipedia.org/wiki/Tamara_Ecclestone
    { name: "Feltham-bokranet", value: 31000000, detail: "Bokran · London 2017", emoji: "📚" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Slough-ranet", value: 62000000, detail: "Pengeran · England 2023", emoji: "💷" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Maleriene fra Christ Church", value: 120000000, detail: "Kunsttyveri · Oxford 2020", emoji: "🖼️" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Waddesdon Manor-ranet", value: 62000000, detail: "Juveltyveri · England 2003", emoji: "🏰" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Tyveriet fra Whitworth-galleriet", value: 50000000, detail: "Kunsttyveri · Manchester 2003", emoji: "🎨" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Sigarettranet i Belfast", value: 25000000, detail: "Ran · Belfast 2004", emoji: "🚬" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Le Vian-ranet", value: 51000000, detail: "Diamantran · England 2019", emoji: "💎" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Marlborough-diamantranet", value: 19000000, detail: "Juveltyveri · London 1980", emoji: "💎" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Gullranet på A13", value: 42000000, detail: "Gullran · London 1980", emoji: "🥇" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "Avenue Road-innbruddet", value: 130000000, detail: "Innbrudd · London 2024", emoji: "🏠" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "KLM-gullranet", value: 500000, detail: "Gullran · London 1954", emoji: "🥇" }, // https://en.wikipedia.org/wiki/List_of_heists_in_the_United_Kingdom
    { name: "D.B. Cooper-kapringen", value: 1900000, detail: "Kapring · USA 1971", emoji: "🪂" }, // https://en.wikipedia.org/wiki/D._B._Cooper
    { name: "Lønnesirup-ranet", value: 120000000, detail: "Sirupran · Quebec 2012", emoji: "🍁" }, // https://en.wikipedia.org/wiki/Great_Canadian_Maple_Syrup_Heist
  ],
}
