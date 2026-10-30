# Kilder til egenskaper.json og steder.json

Generert av `scripts/geo/lag-egenskaper.mjs` (hentet 2026-10-30). Rådata caches i `%TEMP%\geo-egenskaper\dl\`.
Kjør `node scripts/geo/lag-egenskaper.mjs` for å lage begge filene på nytt (krever nett).

`egenskaper.json` har nøyaktig de 197 suverene statene (`Land.id`, Kosovo = `XK`). Geografi gjelder landet selv (ikke oversjøiske territorier),
unntatt `tidssoner` som teller avhengige territorier med. `null` = ingen kilde har et tall.

| Felt | Kilde | Lisens |
| --- | --- | --- |
| `kystKm`, `hoyestePunktM`, `medianalder` (og `levealder`/`skogProsent` der Verdensbanken mangler) | CIA World Factbook via speilet [factbook/factbook.json](https://github.com/factbook/factbook.json); landfilene finnes via FIPS-koder fra Wikidata (P901) | Public domain |
| `skogProsent` (AG.LND.FRST.ZS), `bnpPerInnbygger` (NY.GDP.PCAP.CD, løpende USD), `levealder` (SP.DYN.LE00.IN) | Verdensbanken WDI, siste år med tall | CC BY 4.0 |
| `hdi` | UNDP Human Development Report 2025 (data for 2023); Taiwan fra Wikidata (P1081) | CC BY 3.0 IGO / CC0 |
| `olMedaljer` | Wikipedia «All-time Olympic Games medal table», samlet sommer + vinter t.o.m. vinter-OL 2026, under landets egen NOC (forgjengere som USSR, DDR, Jugoslavia og Tsjekkoslovakia telles ikke med; Russland = RUS + ROC + OAR) | CC BY-SA 4.0 |
| `tidssoner` | Wikipedia «List of time zones by country»: antall ulike UTC-forskyvninger inkl. avhengige territorier (Frankrike 12, USA 11, Russland 11, Storbritannia 9 …). Land som ikke står i flersone-tabellen telles som 1. | CC BY-SA 4.0 |
| `metro` | Wikipedia «List of metro systems» (systemer i drift) | CC BY-SA 4.0 |
| `ildringen` | Wikipedia «Ring of Fire», tabell med «Consensus for inclusion = Yes» (Argentina og Bolivia er med i tabellen som «No» fordi de ikke har Stillehavskyst) | CC BY-SA 4.0 |
| `spraak` | mledoze/countries (offisielle språk), oversatt til norsk. India har 22 offisielle språk, men kilden oppgir bare tre. | ODbL |
| `tropene`, `ekvator` | Breddegrad-utstrekning for landet i Natural Earth 10m map units; rettet for Japan (Okinotorishima), Marokko (Vest-Sahara), USA (Jarvis Island) og São Tomé (Ilhéu das Rolas) | Public domain |
| `eu`, `nato`, `samveldet`, `arabiskeLiga`, `venstrekjoring` | Håndlister, kryssjekket mot Wikidata (P463 uten sluttdato, P1622) | CC0 |
| `monarki` | Håndliste (43 suverene monarkier inkl. Vatikanstaten), kryssjekket mot CIA «Government type» | |
| `tidligereSovjet`, `atomvapen` | Håndlister (15 tidligere sovjetrepublikker; USA, Russland, Storbritannia, Frankrike, Kina, India, Pakistan, Israel (uoffisielt), Nord-Korea) | |
| `flagg*` | Håndkurert etter Wikipedia/flagcdn-bildene (sivilt flagg for Bolivia, Peru, Venezuela og Costa Rica; Afghanistan = Taliban-flagget), kryssjekket mot CIA «Flag»-teksten for farger, stjerner og halvmåner | |
| `hav`, `innlandsstat`, `oy`, `oyDelt` | Håndkurert hav-tabell; `innlandsstat` = ingen kyst (Kasakhstan, Aserbajdsjan og Turkmenistan regnes som innlandsstater selv om de grenser til Kaspihavet); `oy` = ingen landgrense og hovedsakelig øyer (Australia regnes ikke), `oyDelt` = `oy` + land som deler en øy eller er knyttet med en demning (Storbritannia, Irland, Indonesia, Papua Ny-Guinea, Haiti, Den dominikanske republikk, Brunei, Øst-Timor, Bahrain, Singapore) | |
| `harArrangertOL`, `harArrangertFotballVM`, `harVunnetFotballVM`, `eurovision` | Håndlister. VM-vinnere inkl. Spania 2026 (Wikipedia «2026 FIFA World Cup»); VM-arrangører inkl. Canada/Mexico/USA 2026; Eurovision = 50 nåværende stater (Jugoslavia og Serbia-Montenegro regnes ikke som egne land). | |
| `hovedstadIkkeStorst` | Håndliste etter Wikipedias landinfobokser («largest city»); kryssjekket mot GeoNames-byene i `byer.json`. Nauru er `null` (ingen de jure hovedstad). Grensetilfeller: India (Mumbai), Kina (Shanghai), Filippinene (Quezon City), Sudan (Omdurman), Malta (Birkirkara). | |

## Kjente svakheter

- BNP per innbygger er fra siste år Verdensbanken har: Eritrea 2011, Sør-Sudan 2015, Jemen 2018, Cuba 2020. Taiwan er IMFs nominelle tall for 2025 (Wikipedia «Economy of Taiwan»). Nord-Korea og Vatikanstaten mangler.
- HDI mangler for Kosovo, Monaco, Nord-Korea og Vatikanstaten. Taiwan er ikke med i UNDP; verdien kommer fra Wikidata.
- Flaggfelter er subjektive i grensetilfeller: Nepal (måne telles som halvmåne, ingen stjerne), Slovenia og Serbia (kors/stjerner i våpenet), Spania og Andorra (små dyr i våpenet telles ikke), Benin/Madagaskar/Guinea-Bissau (blandet oppsett: verken horisontale eller vertikale striper).
- `tropene` for Japan er satt til true på grunn av Okinotorishima, som Kina bestrider som øy.

## Steder (`steder.json`)

Byer: koordinater og folketall (bykjerne, ikke storbyregion) fra [GeoNames](https://www.geonames.org) `cities15000` (CC BY 4.0, krever navngivelse: «Data fra GeoNames»). Små steder under 15 000 innbyggere og alle landemerker har håndskrevne koordinater (to desimaler) og `befolkning: null`. Norske navn er håndskrevne.
