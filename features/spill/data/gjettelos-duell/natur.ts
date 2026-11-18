import { lag } from "../gjettelos/typer"

// Natur, bare for Gjetteløs-duell. Hvert tall er sjekket mot kilden som står ved spørsmålet; "utregnet" betyr at svaret
// følger av tallene i spørsmålet. "anslag" er tall man må resonnere seg fram til; "fakta" er oppslag, mål og årstall.

export const natur = [
  ...lag("natur", "anslag", [
    ["d-mjosa-volum", 3, "Hvor mange kubikkilometer vann er det i Mjøsa?", "km³", 56, "Store norske leksikon"],
    ["d-sky", 2, "Hvor mye vann er det i en vanlig sauesky (cumulus)?", "tonn", 500, "USGS og Library of Congress", { ca: true, info: "Like mye som rundt 100 elefanter." }],
    ["d-havniva", 2, "Hvor mange centimeter steg havet i snitt fra 1901 til 2018?", "cm", 20, "FNs klimapanel (IPCC)", { ca: true, per: "2018" }],
  ]),
  ...lag("natur", "fakta", [
    ["d-sognefjorden-dyp", 3, "Hvor dyp er Sognefjorden der den er dypest?", "meter", 1303, "Store norske leksikon"],
    ["d-glomma", 2, "Hvor lang er Glomma, Norges lengste elv?", "km", 623, "Store norske leksikon"],
    ["d-jostedalsbreen", 3, "Hvor stort areal har Jostedalsbreen, fastlands-Europas største isbre?", "km²", 415, "Store norske leksikon", { info: "Regnes Jostefonni med, blir det 458 km²." }],
    ["d-voringsfossen", 2, "Hvor høy er Vøringsfossen?", "meter", 182, "Store norske leksikon"],
    ["d-antarktis-is", 3, "Hvor mange kilometer tykk er isen i Antarktis der den er tykkest?", "km", 4.757, "British Antarctic Survey (Bedmap3)", { per: "2025", info: "Den tykkeste isen ligger i en dal uten navn i Wilkes Land." }],
    ["d-skog-norge", 2, "Hvor mange prosent av Norges areal er dekket av skog?", "prosent", 37.7, "SSB", { per: "2026", info: "Det er 122 166 km²." }],
    ["d-hav-dybde", 3, "Hvor dypt er havet i snitt?", "meter", 3682, "NOAA", { ca: true }],
  ]),
]
