import { lag } from "./typer"

// Rekorder. Kilder er Guinness World Records, byggherrer og operatører, og Store norske leksikon.
// "anslag" er tall man må resonnere seg fram til (hvor mange, hvor mye, hvor ofte); "fakta" er oppslag, mål og årstall.

export const rekorder = [
  ...lag("rekorder", "anslag", [
    ["louvre", 3, "Hvor mange besøkte Louvre, verdens mest besøkte kunstmuseum, i 2023?", "besøkende", 8900000, "Louvre", { ca: true, per: "2023" }],
    ["corolla", 3, "Toyota Corolla er verdens mestselgende bilmodell. Hvor mange var solgt i 2021?", "biler", 50000000, "Toyota", { ca: true, per: "2021" }],
    ["ps2", 3, "PlayStation 2 er verdens mestselgende spillkonsoll. Hvor mange er solgt?", "konsoller", 160000000, "Sony", { ca: true, per: "2024" }],
    ["mest-solgte-bok", 3, "Hvor mange eksemplarer har Bibelen solgt, verdens mestselgende bok?", "eksemplarer", 5e9, "Guinness World Records", { ca: true }],
    ["flyrekord", 2, "Hvor mange kommersielle flyvninger registrerte Flightradar24 på rekorddagen 23. juli 2026?", "flyvninger", 153359, "Flightradar24", { per: "2026", info: "Med privatfly og militærfly var det over 287 000." }],
    ["atlanta", 2, "Hvor mange passasjerer reiste gjennom Atlanta, verdens travleste flyplass, i 2024?", "passasjerer", 108.1e6, "Airports Council International", { per: "2024", ca: true }],
    ["dubai", 2, "Hvor mange internasjonale passasjerer hadde Dubai, verdens travleste flyplass for utenlandsreiser, i 2024?", "passasjerer", 92.3e6, "Airports Council International", { per: "2024", ca: true }],
    ["shinjuku", 2, "Hvor mange passasjerer går gjennom Shinjuku stasjon i Tokyo, verdens travleste stasjon, på en vanlig dag?", "passasjerer", 2.7e6, "Guinness World Records", { per: "2022", ca: true }],
    ["baby-shark", 2, "Hvor mange ganger var «Baby Shark Dance», den mest sette videoen på YouTube, vist i oktober 2026?", "visninger", 17e9, "YouTube (via Epidemic Sound)", { per: "2026", ca: true, info: "Den ble den første videoen over 10 milliarder i januar 2022." }],
    ["steam", 3, "Hvor mange var logget på Steam samtidig på rekorddagen i januar 2026?", "brukere", 42e6, "SteamDB", { per: "2026", ca: true, info: "Bare rundt 13 millioner av dem spilte et spill akkurat da." }],
    ["polser-rekord", 2, "Hvor mange pølser med brød spiste Joey Chestnut på ti minutter da han satte rekorden i Nathan's-konkurransen i 2021?", "pølser", 76, "theScore", { per: "2021", info: "I et eget Netflix-oppgjør mot Kobayashi i 2024 klarte han 83, men det teller ikke som rekord i Nathan's-konkurransen." }],
    ["domino", 3, "Hvor mange dominobrikker veltet da verdensrekorden ble satt på Domino Day i 2009?", "brikker", 4491863, "Guinness World Records", { info: "89 byggere satte opp brikkene i en messehall i Leeuwarden i Nederland." }],
    ["kanalsvommere", 3, "Hvor mange svømmeturer alene over Den engelske kanal har Channel Swimming Association godkjent siden 1875?", "svømmeturer", 2148, "Channel Swimming Association", { ca: true, per: "2026", info: "I tillegg kommer over 1100 stafetter." }],
    ["8000-metere", 3, "Hvor mange klatrere har stått på den ekte toppen av alle de 14 fjellene over 8000 meter?", "klatrere", 42, "8000ers.com", { per: "2026", info: "Mange som trodde de var ferdige, måtte tilbake til Manaslu fordi de hadde stoppet på en falsk topp." }],
  ]),
  ...lag("rekorder", "fakta", [
    ["burj-khalifa", 1, "Hvor høy er Burj Khalifa, verdens høyeste bygning?", "meter", 828, "Emaar"],
    ["wadlow", 2, "Hvor høy var Robert Wadlow, det høyeste mennesket som er målt?", "cm", 272, "Guinness World Records"],
    ["calment", 1, "Hvor gammel ble Jeanne Calment, det eldste mennesket med dokumentert alder?", "år", 122, "Guinness World Records"],
    ["kola", 3, "Hvor dypt er Kola-borehullet, det dypeste hullet mennesker har boret?", "meter", 12262, "Guinness World Records"],
    ["sr-71", 3, "Hvor fort fløy SR-71 Blackbird da det satte rekorden for raskeste bemannede jetfly i 1976?", "km/t", 3530, "Guinness World Records", { ca: true }],
    ["maglev", 3, "Hvor fort kjørte et japansk magnettog i 2015, verdensrekorden for tog?", "km/t", 603, "Central Japan Railway"],
    ["eustace", 3, "Hvor høyt hoppet Alan Eustace fra da han satte rekorden for fallskjermhopp i 2014?", "meter", 41419, "Guinness World Records"],
    ["poljakov", 3, "Hvor mange dager i strekk var Valerij Poljakov i rommet, rekorden for én tur?", "dager", 437, "Guinness World Records"],
    ["varmest", 2, "Hvor varmt er det varmeste som er målt på jorda?", "°C", 56.7, "Verdens meteorologiorganisasjon (WMO)", { info: "Death Valley i USA, 10. juli 1913." }],
    ["kaldest", 2, "Hvor mange minusgrader er det kaldeste som er målt på jorda?", "minusgrader", 89.2, "Verdens meteorologiorganisasjon (WMO)", { info: "Vostok-stasjonen i Antarktis, 21. juli 1983." }],
    ["cullinan", 3, "Hvor mange karat var Cullinan, den største diamanten som er funnet?", "karat", 3106, "Guinness World Records", { ca: true }],
    ["bolt", 1, "Hvor mange sekunder er Usain Bolts verdensrekord på 100 meter?", "sekunder", 9.58, "World Athletics", { info: "Berlin, 2009." }],
    ["gotthard", 3, "Hvor lang er Gotthard-basistunnelen i Sveits, verdens lengste jernbanetunnel?", "km", 57, "SBB", { ca: true }],
    ["lengste-flyrute", 3, "Hvor lang er flyruten Singapore–New York, verdens lengste rute uten stopp?", "km", 15300, "Singapore Airlines", { ca: true, per: "2024" }],
    ["eldste-tre", 3, "Hvor gammel er furua Methuselah i California, et av verdens eldste trær?", "år", 4850, "U.S. Forest Service", { ca: true, per: "2025" }],
    ["sawe", 2, "Hvor mange minutter brukte Sabastian Sawe da han satte verdensrekorden i maraton i London i 2026?", "minutter", 119.5, "World Athletics", { info: "1:59:30, det første godkjente maratonløpet under to timer." }],
  ]),
]
