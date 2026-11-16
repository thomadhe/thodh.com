import { lag } from "./typer"

// Natur: vær, jord, planter og noen få dyr. Kilder er NOAA, U.S. Geological Survey, Britannica og Store norske leksikon.

export const natur = lag("natur", [
  ["blahval", 1, "Hvor lang kan en blåhval bli?", "meter", 30, "Britannica", { ca: true }],
  ["gepard", 1, "Hvor fort kan en gepard løpe?", "km/t", 110, "Britannica", { ca: true }],
  ["vandrefalk", 3, "Hvor fort er det raskeste stupet som er målt for en vandrefalk?", "km/t", 389, "National Geographic", { ca: true }],
  ["elefant", 2, "Hvor mange måneder er en elefant drektig?", "måneder", 22, "Britannica", { ca: true }],
  ["lyn-temperatur", 3, "Hvor varm blir lufta i et lynnedslag?", "°C", 30000, "NOAA", { ca: true }],
  ["lyn-sekund", 3, "Hvor mange lyn slår ned på jorda hvert sekund?", "lyn", 44, "NOAA", { ca: true }],
  ["bambus", 3, "Hvor mange centimeter kan den raskeste bambusen vokse på ett døgn?", "cm", 91, "Guinness World Records", { ca: true }],
  ["ferskvann", 2, "Hvor mange prosent av alt vann på jorda er ferskvann?", "prosent", 2.5, "U.S. Geological Survey", { ca: true }],
  ["gronlandshai", 3, "Hvor gammel kan en håkjerring (grønlandshai) bli?", "år", 400, "Nielsen mfl., Science (2016)", { ca: true }],
  ["blekksprut", 2, "Hvor mange hjerter har en blekksprut?", "hjerter", 3, "Britannica"],
  ["sjiraff", 2, "Hvor høy kan en voksen sjiraffhann bli?", "meter", 5.5, "Britannica", { ca: true }],
  ["valdivia", 3, "Hvor sterkt var jordskjelvet i Chile i 1960, det kraftigste som er målt?", "momentmagnitude", 9.5, "U.S. Geological Survey"],
  ["vulkaner", 3, "Hvor mange vulkaner på land regnes som potensielt aktive?", "vulkaner", 1350, "U.S. Geological Survey", { ca: true }],
  ["skog-norge", 2, "Hvor mange prosent av Norges landareal er dekket av skog?", "prosent", 38, "NIBIO", { ca: true }],
  ["traer", 3, "Hvor mange trær finnes det på jorda?", "trær", 3e12, "Crowther mfl., Nature (2015)", { ca: true }],
  ["regnskog", 3, "Hvor mange prosent av jordas landareal er dekket av tropisk regnskog?", "prosent", 6, "Britannica", { ca: true }],
  ["isbre-andel", 3, "Hvor mange prosent av jordas ferskvann er bundet i isbreer og iskapper?", "prosent", 69, "U.S. Geological Survey", { ca: true }],
  ["regndraape", 3, "Hvor fort faller en stor regndråpe?", "km/t", 32, "U.S. Geological Survey", { ca: true }],
  ["tordenavstand", 2, "Hvor mange sekunder går det omtrent mellom lyn og torden når uværet er én kilometer unna?", "sekunder", 3, "Meteorologisk institutt", { ca: true }],
  ["solformorkelse", 3, "Hvor mange minutter kan en total solformørkelse vare på det lengste?", "minutter", 7.5, "NASA", { ca: true }],
  ["nordlys", 3, "Hvor høyt over bakken er den nedre kanten av nordlyset vanligvis?", "km", 100, "Store norske leksikon", { ca: true }],
])
