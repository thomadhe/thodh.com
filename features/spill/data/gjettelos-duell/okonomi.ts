import { lag } from "../gjettelos/typer"

// Økonomi, bare for Gjetteløs-duell. Hvert tall er sjekket mot kilden som står ved spørsmålet; "utregnet" betyr at svaret
// følger av tallene i spørsmålet. "anslag" er tall man må resonnere seg fram til; "fakta" er oppslag, mål og årstall.

export const okonomi = [
  ...lag("okonomi", "anslag", [
    ["d-bompenger", 3, "Hvor mange kroner betalte bilistene i bompenger i Norge i løpet av 2024?", "kr", 15.5e9, "AutoPASS, årsrapport for bompenger", { ca: true, per: "2024", info: "Året før var det 14,7 milliarder." }],
    ["d-snittlonn", 2, "Hvor mye var gjennomsnittlig månedslønn for en heltidsansatt i Norge i 2025?", "kr", 62070, "SSB", { per: "2025", info: "4,5 prosent mer enn året før." }],
    ["d-bnp-verden", 3, "Hvor mange dollar var hele verdens bruttonasjonalprodukt (BNP) verdt i 2024?", "dollar", 111.7e12, "Verdensbanken", { ca: true, per: "2024" }],
    ["d-pensjonister", 2, "Hvor mange mottar alderspensjon fra NAV?", "personer", 1105800, "NAV", { per: "september 2026", info: "26 400 flere enn ett år tidligere." }],
    ["d-equinor", 2, "Hvor mange ansatte hadde Equinor i 2025?", "ansatte", 24600, "Equinor", { per: "2025" }],
    ["d-kontanter", 2, "Hvor mange prosent av betalingene i butikk gjøres med kontanter i Norge?", "prosent", 3, "Norges Bank", { ca: true, per: "2026" }],
    ["d-julehandel", 3, "Hvor mange kroner regner Virke med at nordmenn handler for i butikkene i desember 2026?", "kr", 79.3e9, "Virke", { ca: true, per: "2026", info: "For november og desember til sammen venter Virke 151,7 milliarder." }],
    ["d-doble-krone", 2, "Du starter med én krone og dobler beløpet hver dag. Hvor mange dager tar det før du har over én milliard kroner?", "dager", 30, "utregnet (2 opphøyd i 30 er litt over én milliard)", { info: "Etter 20 dager har du bare litt over én million." }],
    ["d-rente-dobling", 2, "Du setter 1 000 kroner i banken til 5 prosent rente i året. Hvor mange år går det før beløpet er doblet?", "år", 15, "utregnet (rentes rente)", { info: "Etter 14 år mangler det fortsatt drøyt 20 kroner." }],
    ["d-rente-100", 3, "Du setter 1 000 kroner i banken til 5 prosent rente i året og lar dem stå. Hvor mye har du etter 100 år?", "kr", 131501, "utregnet (rentes rente)", { info: "Uten rentes rente ville du bare hatt 6 000 kroner." }],
  ]),
]
