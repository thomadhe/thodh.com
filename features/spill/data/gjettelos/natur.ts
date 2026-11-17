import { lag } from "./typer"

// Natur: vær, jord, planter og noen få dyr. Kilder er NOAA, USGS, NVE og forskningen som står ved hvert spørsmål.
// "anslag" er tall man må resonnere seg fram til (hvor mange, hvor mye, hvor ofte); "fakta" er oppslag, mål og årstall.

export const natur = [
  ...lag("natur", "anslag", [
    ["lyn-sekund", 3, "Hvor mange lyn slår ned på jorda hvert sekund?", "lyn", 44, "NOAA", { ca: true }],
    ["traer", 3, "Hvor mange trær finnes det på jorda?", "trær", 3e12, "Crowther mfl., Nature (2015)", { ca: true }],
    ["maur", 3, "Hvor mange maur finnes det på jorda?", "maur", 2e16, "Schultheiss mfl., PNAS (2022)", { ca: true, info: "Rundt 2,5 millioner maur per menneske." }],
    ["fugler", 2, "Hvor mange ville fugler finnes det i verden?", "fugler", 50e9, "Callaghan mfl., PNAS (2021)", { ca: true, info: "Rundt seks fugler per menneske." }],
    ["graspurv", 2, "Hvor mange gråspurver, verdens vanligste villfugl, finnes det?", "gråspurver", 1.6e9, "Callaghan mfl., PNAS (2021)", { ca: true }],
    ["jordskjelv", 2, "Hvor mange jordskjelv med styrke 7 eller mer skjer det i verden i et gjennomsnittlig år?", "jordskjelv", 16, "USGS", { ca: true, info: "Til sammen skjer det flere millioner skjelv i året, men de fleste merkes ikke." }],
    ["honning", 3, "Hvor mange blomster må biene besøke for å lage et halvt kilo honning?", "blomster", 2e6, "University of Florida IFAS Extension", { ca: true, info: "En bikube kan ha 40 000 til 60 000 bier om sommeren." }],
    ["regnskog", 3, "Hvor mange hektar tropisk urskog forsvant i verden i 2024?", "hektar", 6.7e6, "Global Forest Watch (WRI)", { per: "2024", ca: true, info: "Rundt 18 fotballbaner i minuttet. For første gang var brann den største årsaken." }],
    ["husdyr-ville", 3, "Hvor mange ganger mer veier alle husdyr i verden enn alle ville pattedyr?", "ganger", 14, "Bar-On, Phillips og Milo, PNAS (2018)", { ca: true, info: "Menneskene veier alene rundt ti ganger så mye som alle ville pattedyr." }],
    ["gronland", 3, "Hvor mange tonn is har Grønland mistet i et gjennomsnittlig år siden 2002?", "tonn", 266e9, "NOAA Arctic Report Card (GRACE-satellittene)", { per: "2002–2023", ca: true, info: "I 2024 var tapet bare rundt 55 milliarder tonn, takket være mye snø." }],
    ["arter", 3, "Hvor mange arter av planter, dyr, sopp og andre organismer med cellekjerne anslår forskerne at det finnes på jorda?", "arter", 8.7e6, "Mora mfl., PLOS Biology (2011)", { ca: true, info: "Bare rundt 1,2 millioner er beskrevet." }],
    ["co2-fossil", 2, "Hvor mange tonn CO₂ slapp verden ut fra fossilt brensel i 2025?", "tonn", 38.1e9, "Global Carbon Budget 2025", { per: "2025", ca: true, info: "Ny rekord, 1,1 prosent mer enn året før." }],
    ["karbonbudsjett", 3, "Hvor mange tonn CO₂ kan verden slippe ut før budsjettet for 1,5 graders oppvarming er brukt opp?", "tonn", 170e9, "Global Carbon Budget 2025", { per: "2025", ca: true, info: "Det tilsvarer rundt fire år med dagens utslipp." }],
    ["plast", 2, "Hvor mange tonn plast ble produsert i verden i 2019?", "tonn", 460e6, "OECD Global Plastics Outlook", { per: "2019", info: "Dobbelt så mye som i 2000." }],
    ["plastavfall", 3, "Hvor mange tonn plastavfall oppsto i verden i 2019?", "tonn", 353e6, "OECD Global Plastics Outlook", { per: "2019", info: "Bare 9 prosent ble resirkulert." }],
    ["traer-hugget", 3, "Hvor mange trær blir hugget eller går tapt i verden hvert år?", "trær", 15.3e9, "Crowther mfl., Nature (2015)", { ca: true, info: "Antallet trær er nesten halvert siden menneskene begynte med jordbruk." }],
    ["vulkanutbrudd", 2, "Hvor mange vulkanutbrudd pågår det i verden i løpet av et gjennomsnittlig år?", "utbrudd", 78, "Smithsonian Global Volcanism Program", { ca: true, info: "Siden 2000 har det vært mellom 64 og 89 i året." }],
    ["breer", 2, "Hvor mange kvadratkilometer dekker isbreene i fastlands-Norge?", "km²", 2700, "NVE", { ca: true, info: "Rundt 0,7 prosent av landarealet." }],
    ["haiangrep", 2, "Hvor mange uprovoserte haiangrep på mennesker ble registrert i hele verden i 2024?", "angrep", 47, "International Shark Attack File", { per: "2024", info: "Fire av dem var dødelige. Over halvparten skjedde i USA." }],
    ["isbjorn", 2, "Hvor mange isbjørner finnes det i verden?", "isbjørner", 26000, "IUCN Polar Bear Specialist Group", { per: "2016", ca: true }],
  ]),
  ...lag("natur", "fakta", [
    ["blahval", 1, "Hvor lang kan en blåhval bli?", "meter", 30, "Britannica", { ca: true }],
    ["gepard", 1, "Hvor fort kan en gepard løpe?", "km/t", 110, "Britannica", { ca: true }],
    ["vandrefalk", 3, "Hvor fort er det raskeste stupet som er målt for en vandrefalk?", "km/t", 389, "National Geographic", { ca: true }],
    ["lyn-temperatur", 3, "Hvor varm blir lufta i et lynnedslag?", "°C", 30000, "NOAA", { ca: true }],
    ["ferskvann", 2, "Hvor mange prosent av alt vann på jorda er ferskvann?", "prosent", 2.5, "U.S. Geological Survey", { ca: true }],
    ["gronlandshai", 3, "Hvor gammel kan en håkjerring (grønlandshai) bli?", "år", 400, "Nielsen mfl., Science (2016)", { ca: true }],
    ["valdivia", 3, "Hvor sterkt var jordskjelvet i Chile i 1960, det kraftigste som er målt?", "momentmagnitude", 9.5, "U.S. Geological Survey"],
    ["isbre-andel", 3, "Hvor mange prosent av jordas ferskvann er bundet i isbreer og iskapper?", "prosent", 69, "U.S. Geological Survey", { ca: true }],
    ["elefant", 2, "Hvor mange måneder er en elefant drektig?", "måneder", 22, "Britannica", { ca: true }],
    ["regndraape", 3, "Hvor fort faller en stor regndråpe?", "km/t", 32, "U.S. Geological Survey", { ca: true }],
  ]),
]
