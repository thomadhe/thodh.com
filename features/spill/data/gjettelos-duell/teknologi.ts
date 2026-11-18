import { lag } from "../gjettelos/typer"

// Teknologi, bare for Gjetteløs-duell. Hvert tall er sjekket mot kilden som står ved spørsmålet; "utregnet" betyr at svaret
// følger av tallene i spørsmålet. "anslag" er tall man må resonnere seg fram til; "fakta" er oppslag, mål og årstall.

export const teknologi = [
  ...lag("teknologi", "anslag", [
    ["d-elbilandel", 1, "Hvor mange prosent av de nye personbilene i Norge i 2025 var elbiler?", "prosent", 95.9, "Opplysningsrådet for veitrafikken", { per: "2025", info: "I 2024 var andelen 88,9 prosent." }],
    ["d-switch", 2, "Hvor mange Nintendo Switch-konsoller hadde Nintendo solgt per 30. september 2026?", "konsoller", 157.2e6, "Nintendo", { ca: true, per: "2026", info: "Etterfølgeren Switch 2 hadde da solgt over 26 millioner." }],
    ["d-tegn-unicode", 3, "Hvor mange tegn finnes det i Unicode-standarden versjon 16 fra 2024?", "tegn", 154998, "Unicode Consortium", { per: "2024", info: "Versjon 16 la til 3 995 egyptiske hieroglyfer." }],
    ["d-emoji", 2, "Hvor mange emojier anbefaler Unicode i Emoji 16.0, medregnet hudfarger, kjønn og flagg?", "emojier", 3790, "Unicode Consortium og Emojipedia", { per: "2024" }],
    ["d-chatgpt-meldinger", 2, "Hvor mange meldinger sendte brukerne til ChatGPT på en vanlig dag sommeren 2025?", "meldinger", 2.5e9, "OpenAI", { ca: true, per: "2025" }],
    ["d-fiber", 2, "Hvor mange prosent av norske husstander hadde tilbud om fiber i 2025?", "prosent", 92.1, "Nkom", { per: "2025", info: "Bare 78,5 prosent hadde fiberkabel helt inn i boligen." }],
    ["d-kortbetalinger", 3, "Hvor mange betalinger ble gjort med norske betalingskort i 2025?", "betalinger", 3.309e9, "Norges Bank", { per: "2025", info: "Rundt 9 millioner hver eneste dag." }],
    ["d-passord", 3, "Hvor mange ulike passord på åtte tegn kan du lage med bare de 26 små bokstavene a–z?", "passord", 208827064576, "utregnet (26 opphøyd i 8)", { info: "Tar du med store bokstaver og sifre, blir det over 218 billioner." }],
    ["d-vannkraftverk", 2, "Hvor mange vannkraftverk finnes det i Norge?", "kraftverk", 1800, "NVE", { ca: true, per: "2026" }],
  ]),
  ...lag("teknologi", "fakta", [
    ["d-concorde", 3, "Hvor fort fløy Concorde i marsjfart?", "km/t", 2179, "Store norske leksikon", { info: "Mach 2,04, i over 15 000 meters høyde." }],
  ]),
]
