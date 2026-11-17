import { lag } from "./typer"

// Historie: antall og noen årstall. Kilder er Store norske leksikon og Britannica der ikke annet står.
// "anslag" er tall man må resonnere seg fram til (hvor mange, hvor mye, hvor ofte); "fakta" er oppslag, mål og årstall.

export const historie = [
  ...lag("historie", "anslag", [
    ["titanic-om-bord", 3, "Hvor mange mennesker var om bord på Titanic?", "mennesker", 2224, "Britannica", { ca: true }],
    ["okkupasjonen", 3, "Hvor mange dager gikk det fra 9. april 1940 til frigjøringen 8. mai 1945?", "dager", 1855, "Utregnet fra datoene"],
    ["utvandring", 2, "Hvor mange nordmenn utvandret til Amerika fra 1825 til 1930?", "utvandrere", 850000, "Nasjonalbiblioteket og Store norske leksikon", { ca: true, info: "Omtrent en firedel av dem som reiste mellom 1881 og 1930, kom etter hvert tilbake." }],
    ["folketall-1801", 2, "Hvor mange bodde i Norge ved folketellingen i 1801?", "innbyggere", 883603, "SSB", { info: "Bare rundt 10 prosent bodde i byer." }],
    ["kheops-blokker", 2, "Hvor mange steinblokker regner man med at Kheopspyramiden er bygget av?", "blokker", 2.3e6, "National Geographic", { ca: true, info: "I snitt rundt 2,3 tonn hver, til sammen nesten 6 millioner tonn." }],
    ["d-dagen", 2, "Hvor mange allierte soldater gikk i land i Normandie på D-dagen 6. juni 1944?", "soldater", 156115, "D-Day Center", { info: "De kom med nesten 7 000 skip og landgangsfartøyer." }],
    ["luftbroen", 3, "Hvor mange tonn forsyninger ble fløyet inn til Vest-Berlin under luftbroen i 1948–49?", "tonn", 2.33e6, "Smithsonian National Air and Space Museum og Alliiertenmuseum", { ca: true, info: "Rundt to tredeler var kull, fordelt på rundt 278 000 flyvninger." }],
    ["titanic-livbater", 2, "Hvor mange personer var det plass til i livbåtene på Titanic?", "plasser", 1178, "Den britiske granskingen av Titanic-forliset (1912)", { info: "Det var over 2 200 om bord, og rundt 706 overlevde." }],
    ["london-brann", 2, "Hvor mange hus brant ned i bybrannen i London i 1666?", "hus", 13200, "London Fire Brigade Museum og The Gazette", { info: "Bare seks dødsfall er bekreftet, men rundt 70 000 av byens 80 000 innbyggere mistet hjemmet." }],
    ["terrakotta", 2, "Hvor mange leirsoldater regner man med at Terrakottahæren i Xi'an har?", "soldater", 8000, "Smarthistory", { ca: true, info: "I tillegg rundt 130 stridsvogner og over 600 hester." }],
    ["spanskesyken", 2, "Hvor mange mennesker døde av spanskesyken fra 1918 til 1920?", "mennesker", 50e6, "CDC", { ca: true, info: "Rundt en tredel av verdens befolkning ble smittet. Noen anslag går opp mot 100 millioner døde." }],
    ["ww2-norge", 2, "Hvor mange nordmenn mistet livet som følge av andre verdenskrig?", "nordmenn", 10000, "Store norske leksikon", { ca: true, info: "Rundt en tredel av dem var militære." }],
    ["ellis-island", 2, "Hvor mange innvandrere ble tatt imot på Ellis Island i New York fra 1892 til 1954?", "innvandrere", 12e6, "National Park Service", { ca: true, info: "I toppåret 1907 kom over én million gjennom stasjonen." }],
    ["ww1-soldater", 2, "Hvor mange soldater døde i første verdenskrig?", "soldater", 8.5e6, "Store norske leksikon", { ca: true, info: "Rundt 21 millioner ble i tillegg såret." }],
    ["befolkning-ar-1", 3, "Hvor mange mennesker levde på jorda rundt år 1?", "mennesker", 230e6, "Our World in Data (HYDE 3.3)", { ca: true, info: "Færre enn det bor i Indonesia i dag. Forskernes anslag spriker fra rundt 170 til 400 millioner." }],
  ]),
  ...lag("historie", "fakta", [
    ["elizabeth", 1, "Hvor mange år var dronning Elizabeth 2. monark?", "år", 70, "Britannica", { info: "Fra 1952 til 2022." }],
    ["forste-verdenskrig", 1, "Hvilket år begynte første verdenskrig?", "årstall", 1914, "Britannica"],
    ["fn", 2, "Hvilket år ble FN grunnlagt?", "årstall", 1945, "FN"],
    ["svartedauden", 2, "Hvilket år kom svartedauden til Norge?", "årstall", 1349, "Store norske leksikon"],
    ["stiklestad", 2, "Hvilket år falt Olav Haraldsson i slaget på Stiklestad?", "årstall", 1030, "Store norske leksikon"],
    ["unionsopplosningen", 1, "Hvilket år ble unionen mellom Norge og Sverige oppløst?", "årstall", 1905, "Store norske leksikon"],
    ["grunnloven", 1, "Hvilket år fikk Norge sin grunnlov?", "årstall", 1814, "Stortinget"],
    ["manelandingen", 1, "Hvilket år landet de første menneskene på månen?", "årstall", 1969, "NASA"],
    ["berlinmuren", 1, "Hvilket år falt Berlinmuren?", "årstall", 1989, "Britannica"],
    ["columbus", 1, "Hvilket år kom Columbus til Amerika?", "årstall", 1492, "Britannica"],
    ["gutenberg", 3, "Rundt hvilket år trykte Gutenberg bibelen sin?", "årstall", 1455, "Britannica", { ca: true }],
    ["lindisfarne", 3, "Vikingtiden regnes ofte fra angrepet på klosteret Lindisfarne. Hvilket år var det?", "årstall", 793, "Store norske leksikon"],
    ["9-april", 1, "Hvilket år ble Norge angrepet og okkupert av Tyskland?", "årstall", 1940, "Store norske leksikon"],
    ["haakon-7", 2, "Hvor mange år var Haakon 7. konge i Norge?", "år", 52, "Kongehuset", { info: "Fra 1905 til 1957." }],
    ["cheops", 2, "Hvor høy var Kheopspyramiden i Giza da den var ny?", "meter", 146.6, "Britannica", { ca: true, info: "I dag er den rundt 139 meter." }],
    ["hadrians-mur", 3, "Hvor lang var Hadrians mur i Nord-England?", "km", 117, "English Heritage", { ca: true }],
    ["victoria", 3, "Hvor mange år var dronning Victoria monark?", "år", 63, "Britannica", { info: "Fra 1837 til 1901." }],
    ["berlinmuren-ar", 2, "Hvor mange år stod Berlinmuren?", "år", 28, "Britannica", { info: "Fra 1961 til 1989." }],
    ["sovjet-varighet", 2, "Hvor mange år fantes Sovjetunionen?", "år", 69, "Britannica", { info: "Fra 1922 til 1991." }],
    ["kon-tiki", 2, "Hvor mange dager varte Kon-Tiki-ferden over Stillehavet?", "dager", 101, "Kon-Tiki Museet"],
    ["amundsen-dager", 3, "Hvor mange dager brukte Amundsen fra Framheim til Sydpolen?", "dager", 56, "Store norske leksikon", { info: "Fra 19. oktober til 14. desember 1911." }],
    ["hundrearskrigen", 3, "Hvor mange år varte hundreårskrigen mellom England og Frankrike?", "år", 116, "Britannica", { info: "Fra 1337 til 1453." }],
  ]),
]
