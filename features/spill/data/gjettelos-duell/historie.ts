import { lag } from "../gjettelos/typer"

// Historie, bare for Gjetteløs-duell. Hvert tall er sjekket mot kilden som står ved spørsmålet; "utregnet" betyr at svaret
// følger av tallene i spørsmålet. "anslag" er tall man må resonnere seg fram til; "fakta" er oppslag, mål og årstall.

export const historie = [
  ...lag("historie", "anslag", [
    ["d-1905-nei", 2, "Hvor mange stemte nei til å oppløse unionen med Sverige i folkeavstemningen i 1905?", "stemmer", 184, "SSB, historisk statistikk", { info: "Hele 368 208 stemte ja." }],
    ["d-hindenburg", 2, "Hvor mange mennesker omkom da luftskipet «Hindenburg» brant i 1937?", "omkomne", 36, "Britannica", { info: "Av de 97 om bord overlevde 62." }],
    ["d-manhattan", 3, "Hvor mange mennesker jobbet på Manhattan-prosjektet, som laget atombomben, da det var på det største?", "personer", 130000, "US Department of Energy", { ca: true, info: "Prosjektet kostet rundt 2,2 milliarder dollar." }],
    ["d-gutenberg-eksemplarer", 2, "Hvor mange eksemplarer av Gutenberg-bibelen er kjent i dag?", "eksemplarer", 49, "Library of Congress", { info: "Bare 21 av dem er komplette." }],
    ["d-nansenpass", 3, "Hvor mange Nansen-pass ble utstedt til statsløse flyktninger til sammen?", "pass", 450000, "Store norske leksikon", { ca: true, info: "I Norge ble det bare utstedt rundt 60." }],
    ["d-mayflower", 2, "Hvor mange passasjerer var med Mayflower til Amerika i 1620?", "passasjerer", 102, "History.com"],
    ["d-magellan", 3, "Rundt 270 mann la ut på Magellans ferd jorda rundt i 1519. Hvor mange kom hjem med skipet Victoria i 1522?", "menn", 18, "History.com", { info: "Magellan selv ble drept på Filippinene i 1521." }],
    ["d-colosseum", 2, "Hvor mange tilskuere fikk plass i Colosseum i Roma?", "tilskuere", 50000, "Britannica", { ca: true, info: "Noen anslag går helt opp mot 75 000." }],
    ["d-krigsseilere", 3, "Hvor mange sjøfolk jobbet om bord på Nortraships skip under andre verdenskrig?", "sjøfolk", 30000, "Store norske leksikon", { ca: true, info: "Rundt 3 000 av dem mistet livet." }],
    ["d-stavkirker", 2, "Hvor mange stavkirker fra middelalderen står fortsatt i Norge?", "stavkirker", 28, "Store norske leksikon", { info: "Én av dem, Vang stavkirke, står i Polen." }],
    ["d-dunkirk", 2, "Hvor mange allierte soldater ble evakuert fra Dunkerque i 1940?", "soldater", 338000, "Store norske leksikon", { ca: true, info: "Evakueringen varte fra 26. mai til 4. juni." }],
    ["d-grande-armee", 3, "Hvor stor hær samlet Napoleon til felttoget mot Russland i 1812?", "soldater", 600000, "Store norske leksikon", { ca: true }],
  ]),
  ...lag("historie", "fakta", [
    ["d-eidsvollsmenn", 2, "Hvor mange representanter var med på riksforsamlingen på Eidsvoll i 1814?", "representanter", 112, "Store norske leksikon", { info: "33 av dem kom fra hæren og marinen." }],
    ["d-dansketid", 2, "Hvor mange år var Norge i union med Danmark?", "år", 434, "Store norske leksikon", { info: "Fra 1380, da Olav 4. ble norsk konge, til 1814." }],
    ["d-titanic-funnet", 2, "Hvor dypt ligger vraket av Titanic?", "meter", 3800, "NOAA", { ca: true }],
    ["d-vikingskip", 2, "Hvor langt er Osebergskipet?", "meter", 21.5, "Store norske leksikon", { ca: true }],
    ["d-oslo-navn", 2, "Hvilket år fikk Kristiania navnet Oslo?", "årstall", 1925, "Store norske leksikon"],
    ["d-stemmerett", 2, "Hvilket år vedtok Stortinget allmenn stemmerett for kvinner?", "årstall", 1913, "Stortinget", { info: "Vedtaket ble gjort enstemmig 11. juni 1913." }],
    ["d-ekofisk", 2, "Hvilket år ble oljefeltet Ekofisk funnet?", "årstall", 1969, "Store norske leksikon", { info: "Det var da verdens største oljefelt til havs." }],
    ["d-bergensbanen", 2, "Hvilket år åpnet Bergensbanen hele veien mellom Oslo og Bergen?", "årstall", 1909, "Store norske leksikon", { info: "Kong Haakon åpnet banen på Voss 27. november 1909." }],
    ["d-uio", 2, "Hvilket år ble Universitetet i Oslo grunnlagt?", "årstall", 1811, "Store norske leksikon", { info: "Det åpnet i 1813 med fem professorer og 18 studenter." }],
    ["d-hurtigruten", 2, "Hvilket år gikk Hurtigruten sin første tur?", "årstall", 1893, "Store norske leksikon", { info: "DS «Vesteraalen» la ut fra Trondheim 2. juli 1893." }],
  ]),
]
