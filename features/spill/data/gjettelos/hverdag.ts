import { lag } from "./typer"

// Hverdag: forbruk, vaner, spill og mål. Forbruk fra SSB og bransjen; spill og mål er utregnet der ikke annet står.
// "anslag" er tall man må resonnere seg fram til (hvor mange, hvor mye, hvor ofte); "fakta" er oppslag, mål og årstall.

export const hverdag = [
  ...lag("hverdag", "anslag", [
    ["avfall", 2, "Hvor mange kilo husholdningsavfall kastet hver nordmann i snitt i 2024?", "kg", 379, "SSB", { per: "2024", info: "Til sammen rundt 2,1 millioner tonn." }],
    ["kaffe", 2, "Hvor mange kilo kaffe importerer Norge per innbygger i løpet av et år?", "kg", 9.5, "SSB", { ca: true, info: "Rundt 40 000 tonn i året til sammen." }],
    ["matsvinn", 2, "Hvor mange kilo spiselig mat kaster hver nordmann hjemme i løpet av et år?", "kg", 35, "Matvett", { per: "2023", info: "18 prosent mindre enn i 2016." }],
    ["matsvinn-norge", 3, "Hvor mange tonn mat gikk til spille i Norge i 2023, fra åker til middagsbord?", "tonn", 451600, "Matvett", { per: "2023", ca: true, info: "Rundt 82 kilo per innbygger." }],
    ["vann", 2, "Hvor mange liter vann bruker hver nordmann i snitt hjemme på et døgn?", "liter", 167, "SSB", { per: "2024", info: "I tillegg lekker over 100 liter per person ut av rørene før vannet når fram." }],
    ["medier", 2, "Hvor mange minutter bruker nordmenn i snitt på medier en vanlig dag?", "minutter", 275, "SSB, Norsk mediebarometer", { per: "2024", info: "4 timer og 35 minutter." }],
    ["boklesing", 2, "Hvor mange minutter bruker nordmenn i snitt på å lese bøker en vanlig dag?", "minutter", 17, "SSB, Norsk mediebarometer", { per: "2024", info: "Mot slutten av 1990-tallet var det rundt 10 minutter." }],
    ["juletrar", 2, "Hvor mange juletrær kjøper nordmenn i løpet av en jul?", "juletrær", 1.4e6, "Norsk Juletre", { per: "2018", ca: true, info: "Rundt 400 000 av dem importeres, mest fra Danmark." }],
    ["grandiosa", 1, "Hvor mange Grandiosa-pizzaer spiste nordmenn i 2025?", "pizzaer", 25e6, "Orkla Foods Norge", { per: "2025", ca: true, info: "Over 600 millioner siden 1980." }],
    ["plastposer", 2, "Hvor mange plastbæreposer kjøpte hver nordmann i snitt i 2023?", "poser", 104, "Handelens Miljøfond via SIFO", { per: "2023", info: "Året før var det 132. EU-målet er høyst 40." }],
    ["kjorelengde", 2, "Hvor mange kilometer kjører en norsk personbil i snitt i løpet av et år?", "km", 11215, "SSB", { per: "2024", info: "I 2016 var snittet 12 480 km." }],
    ["kjorte-km", 3, "Hvor mange kilometer kjørte alle norske personbiler til sammen i 2024?", "km", 35.44e9, "SSB", { per: "2024", ca: true, info: "Det er nesten 900 000 runder rundt jorda." }],
    ["arbeidstimer", 2, "Hvor mange timer jobber en sysselsatt i Norge i snitt i løpet av et år?", "timer", 1407, "OECD", { per: "2024", info: "Blant de laveste i OECD, der snittet er 1 736 timer." }],
    ["strom-husholdning", 2, "Hvor mange kilowattimer strøm bruker en norsk husholdning i snitt i løpet av et år?", "kWh", 14700, "SSB", { per: "2024", ca: true, info: "En enebolig bruker over dobbelt så mye som en leilighet i blokk." }],
    ["te", 2, "Hvor mange kopper te drikker britene til sammen på en vanlig dag?", "kopper", 100e6, "UK Tea & Infusions Association", { ca: true, info: "Rundt halvannen kopp per innbygger." }],
    ["ord-per-dag", 2, "Hvor mange ord sier et menneske i snitt i løpet av en dag?", "ord", 16000, "Mehl mfl., Science (2007)", { ca: true, info: "Kvinner og menn snakket omtrent like mye." }],
    ["kaffe-vann", 3, "Hvor mange liter vann går med til å dyrke og lage kaffen i én kopp?", "liter", 140, "Water Footprint Network", { ca: true, info: "Ett kilo storfekjøtt krever rundt 15 000 liter." }],
  ]),
  ...lag("hverdag", "fakta", [
    ["kortstokk", 1, "Hvor mange kort er det i en kortstokk uten jokere?", "kort", 52, "Standard kortstokk"],
    ["monopol", 2, "Hvor mange felter er det rundt Monopol-brettet?", "felter", 40, "Hasbro"],
    ["terning", 2, "Hva blir summen av alle øynene på en vanlig terning?", "øyne", 21, "Utregnet"],
    ["a0", 3, "Hvor mange A4-ark får du ut av ett A0-ark?", "ark", 16, "ISO 216"],
    ["a4-vekt", 3, "Hvor mange gram veier et vanlig A4-ark på 80 g/m²?", "gram", 5, "Utregnet fra ISO 216"],
    ["spenning", 1, "Hvor mange volt er det i en vanlig norsk stikkontakt?", "volt", 230, "NEK"],
    ["fotballbane", 2, "Hvor mange kvadratmeter er en fotballbane på 105 × 68 meter?", "m²", 7140, "Utregnet"],
    ["fargekoder", 2, "Hvor mange ulike farger kan vises med vanlige 24-biters fargekoder på nett (#RRGGBB)?", "farger", 16777216, "Utregnet", { info: "256 × 256 × 256." }],
    ["400-ar", 3, "Hvor mange dager er det i 400 år med dagens kalender (med skuddår)?", "dager", 146097, "Utregnet"],
    ["tjuekroning", 3, "Hvor mange gram veier en norsk 20-kroning?", "gram", 9.9, "Norges Bank"],
    ["rubik", 3, "Hvor mange ulike stillinger kan en Rubiks kube ha?", "stillinger", 4.3252e19, "Utregnet", { ca: true, info: "Nøyaktig 43 252 003 274 489 856 000." }],
    ["lotto", 3, "Hvor mange ulike rekker finnes i Lotto, der du velger 7 tall av 34?", "rekker", 5379616, "Norsk Tipping"],
    ["lego-seks", 3, "Hvor mange måter kan seks LEGO-klosser med 2 × 4 knotter settes sammen på?", "måter", 915103765, "Eilers (2005), Københavns universitet"],
    ["milliard-sekunder", 3, "Hvor mange år er én milliard sekunder?", "år", 31.7, "Utregnet"],
    ["million-sekunder", 2, "Hvor mange dager er én million sekunder?", "dager", 11.6, "Utregnet"],
    ["kvadratkilometer", 2, "Hvor mange fotballbaner (105 × 68 m) får plass på én kvadratkilometer?", "baner", 140, "Utregnet", { ca: true }],
  ]),
]
