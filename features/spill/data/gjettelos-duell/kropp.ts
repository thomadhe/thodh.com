import { lag } from "../gjettelos/typer"

// Kropp og helse, bare for Gjetteløs-duell. Hvert tall er sjekket mot kilden som står ved spørsmålet; "utregnet" betyr at svaret
// følger av tallene i spørsmålet. "anslag" er tall man må resonnere seg fram til; "fakta" er oppslag, mål og årstall.

export const kropp = [
  ...lag("kropp", "anslag", [
    ["d-hjerteinfarkt", 2, "Hvor mange hjerteinfarkter ble meldt til Norsk hjerteinfarktregister i 2024?", "hjerteinfarkter", 9691, "Norsk hjerteinfarktregister", { per: "2024", info: "622 færre enn året før." }],
    ["d-salt", 2, "Hvor mange gram salt spiser en voksen nordmann i snitt hver dag?", "gram", 7.8, "Helsedirektoratet (Norkost 4)", { per: "2023", info: "Menn spiser 9,1 gram og kvinner 6,5 gram." }],
    ["d-legebesok", 3, "Hvor mange konsultasjoner hos fastlegen var det i Norge i 2024?", "konsultasjoner", 17119505, "Helsedirektoratet", { per: "2024", info: "3,2 millioner av dem var på telefon, video eller nett." }],
    ["d-skritt-norge", 1, "Hvor mange minutter med moderat aktivitet i uka bør voksne få, som et minimum?", "minutter", 150, "Helsedirektoratet", { info: "Alternativt 75 minutter med høy intensitet." }],
    ["d-dager-80", 2, "Hvor mange dager har du levd når du fyller 80 år?", "dager", 29220, "utregnet (med skuddår)", { ca: true }],
    ["d-tvillinger", 2, "Hvor mange tvillingfødsler var det i Norge i 2025?", "fødsler", 717, "SSB", { per: "2025", info: "Til sammen var det 54 810 fødsler." }],
  ]),
  ...lag("kropp", "fakta", [
    ["d-tenner", 1, "Hvor mange tenner har en voksen med alle visdomstennene?", "tenner", 32, "Store medisinske leksikon"],
    ["d-tynntarm", 2, "Hvor lang er tynntarmen hos en voksen?", "meter", 4.5, "Store medisinske leksikon", { ca: true, info: "Mellom fire og fem meter." }],
    ["d-hjerte-vekt", 2, "Hvor mye veier hjertet til en voksen?", "gram", 325, "Store medisinske leksikon", { ca: true, info: "Vanligvis mellom 300 og 350 gram." }],
    ["d-genom", 3, "Hvor mange basepar har det første helt komplette menneskegenomet fra 2022?", "basepar", 3.055e9, "Telomere-to-Telomere-konsortiet", { ca: true, per: "2022", info: "Rundt 200 millioner basepar manglet i den gamle referansen." }],
  ]),
]
