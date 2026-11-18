import { lag } from "../gjettelos/typer"

// Dyr, bare for Gjetteløs-duell. Hvert tall er sjekket mot kilden som står ved spørsmålet; "utregnet" betyr at svaret
// følger av tallene i spørsmålet. "anslag" er tall man må resonnere seg fram til; "fakta" er oppslag, mål og årstall.

export const dyr = [
  ...lag("dyr", "anslag", [
    ["d-blahval-vekt", 2, "Hvor mye kan en blåhval veie?", "tonn", 150, "NOAA Fisheries", { ca: true, info: "Blåhvalen er det største dyret som noen gang har levd." }],
    ["d-strutseegg", 2, "Hvor mye veier et strutseegg?", "kg", 1.5, "Smithsonian's National Zoo", { ca: true }],
    ["d-koala", 1, "Hvor mange timer sover en koala i løpet av et døgn?", "timer", 20, "San Diego Zoo", { ca: true, info: "Den sover så mye for å spare energi." }],
    ["d-bidronning", 2, "Hvor mange egg kan en bidronning legge på ett døgn om våren?", "egg", 1500, "Store norske leksikon", { ca: true }],
    ["d-elg-vekt", 2, "Hvor mye kan de største elgoksene veie?", "kg", 800, "Store norske leksikon", { ca: true }],
    ["d-villrein", 2, "Hvor mange villrein lever i Norge om vinteren?", "villrein", 25000, "Store norske leksikon", { ca: true }],
  ]),
  ...lag("dyr", "fakta", [
    ["d-sjiraff-tunge", 2, "Hvor lang er tunga til en sjiraff?", "cm", 46, "San Diego Zoo", { ca: true }],
    ["d-gepard", 2, "Hvor fort kan en gepard løpe?", "km/t", 112, "San Diego Zoo", { ca: true }],
  ]),
]
