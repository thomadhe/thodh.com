// Hand-maintained facts for the 51 non-sovereign territories that Worldle also accepts as answers
// (Antarctica is left out). Names follow Språkrådet / Store norske leksikon usage.
//
// Row: [id, navn, en, svar, hovedstad, hovedstadEn, hovedstadSvar, kontinent, tilhorer]
//   - tilhorer: id of the sovereign state it belongs to (null: no sovereign, i.e. Western Sahara).
//   - hovedstad: "" when the territory has no capital (uninhabited, or Tokelau's rotating atoll administration).
//   - kontinent: E Europa, A Asia, F Afrika, N Nord-Amerika, S Sør-Amerika, O Oseania (Antarctic islands get
//     the nearest of the six, because the quizzes have no sixth/seventh continent for them).

export const OMRADE_RADER = [
  ["AS", "Amerikansk Samoa", "American Samoa", ["Amerikanske Samoa"], "Pago Pago", "Pago Pago", ["Fagatogo"], "O", "US"],
  ["AI", "Anguilla", "Anguilla", [], "The Valley", "The Valley", [], "N", "GB"],
  ["AW", "Aruba", "Aruba", [], "Oranjestad", "Oranjestad", [], "N", "NL"],
  ["BM", "Bermuda", "Bermuda", [], "Hamilton", "Hamilton", [], "N", "GB"],
  ["BV", "Bouvetøya", "Bouvet Island", ["Bouvet"], "", "", [], "F", "NO"],
  ["IO", "Britiske territorium i Indiahavet", "British Indian Ocean Territory", ["Det britiske territoriet i Indiahavet", "Chagosøyene", "Chagos", "BIOT", "Diego Garcia"], "", "", [], "A", "GB"],
  ["VG", "De britiske Jomfruøyene", "British Virgin Islands", ["Britiske Jomfruøyene", "BVI"], "Road Town", "Road Town", [], "N", "GB"],
  ["KY", "Caymanøyene", "Cayman Islands", ["Cayman"], "George Town", "George Town", [], "N", "GB"],
  ["CX", "Christmasøya", "Christmas Island", ["Christmas Island"], "Flying Fish Cove", "Flying Fish Cove", [], "A", "AU"],
  ["CC", "Kokosøyene", "Cocos (Keeling) Islands", ["Cocos Islands", "Keelingøyene", "Cocosøyene"], "West Island", "West Island", ["Bantam"], "A", "AU"],
  ["CK", "Cookøyene", "Cook Islands", [], "Avarua", "Avarua", [], "O", "NZ"],
  ["FK", "Falklandsøyene", "Falkland Islands", ["Falkland", "Malvinas", "Falklandsøyene (Malvinas)"], "Stanley", "Stanley", ["Port Stanley"], "S", "GB"],
  ["FO", "Færøyene", "Faroe Islands", ["Færøerne", "Faeroe Islands", "Faroes"], "Tórshavn", "Tórshavn", ["Torshavn"], "E", "DK"],
  ["GF", "Fransk Guyana", "French Guiana", ["Guyane"], "Cayenne", "Cayenne", [], "S", "FR"],
  ["PF", "Fransk Polynesia", "French Polynesia", ["Tahiti", "Polynésie française"], "Papeete", "Papeete", [], "O", "FR"],
  ["TF", "Franske sørlige og antarktiske territorier", "French Southern Territories", ["Franske sørterritorier", "TAAF", "Kerguelen", "Terres australes et antarctiques françaises", "French Southern and Antarctic Lands"], "Port-aux-Français", "Port-aux-Francais", [], "F", "FR"],
  ["GI", "Gibraltar", "Gibraltar", [], "Gibraltar", "Gibraltar", [], "E", "GB"],
  ["GL", "Grønland", "Greenland", ["Kalaallit Nunaat"], "Nuuk", "Nuuk", ["Godthåb"], "N", "DK"],
  ["GP", "Guadeloupe", "Guadeloupe", [], "Basse-Terre", "Basse-Terre", [], "N", "FR"],
  ["GU", "Guam", "Guam", [], "Hagåtña", "Hagatna", ["Agana", "Hagåtña"], "O", "US"],
  ["GG", "Guernsey", "Guernsey", ["Bailiwick of Guernsey"], "Saint Peter Port", "Saint Peter Port", ["St. Peter Port", "St Peter Port"], "E", "GB"],
  ["HM", "Heard- og McDonaldøyene", "Heard Island and McDonald Islands", ["Heardøya", "Heard Island", "McDonaldøyene", "Heard og McDonaldøyene"], "", "", [], "O", "AU"],
  ["HK", "Hongkong", "Hong Kong", ["Hong Kong"], "Hongkong", "Hong Kong", ["Victoria", "Hong Kong"], "A", "CN"],
  ["IM", "Isle of Man", "Isle of Man", ["Man"], "Douglas", "Douglas", [], "E", "GB"],
  ["JE", "Jersey", "Jersey", [], "Saint Helier", "Saint Helier", ["St. Helier", "St Helier"], "E", "GB"],
  ["MO", "Macao", "Macau", ["Macao", "Makao"], "Macao", "Macau", ["Macau", "Makao"], "A", "CN"],
  ["MQ", "Martinique", "Martinique", [], "Fort-de-France", "Fort-de-France", [], "N", "FR"],
  ["YT", "Mayotte", "Mayotte", [], "Mamoudzou", "Mamoudzou", [], "F", "FR"],
  ["MS", "Montserrat", "Montserrat", [], "Brades", "Brades", ["Plymouth"], "N", "GB"],
  ["NC", "Ny-Caledonia", "New Caledonia", ["Nouvelle-Calédonie", "Ny Caledonia", "Ny-Kaledonia", "Ny Kaledonia"], "Nouméa", "Noumea", ["Noumea"], "O", "FR"],
  ["NU", "Niue", "Niue", [], "Alofi", "Alofi", [], "O", "NZ"],
  ["NF", "Norfolkøya", "Norfolk Island", ["Norfolk"], "Kingston", "Kingston", [], "O", "AU"],
  ["MP", "Nord-Marianene", "Northern Mariana Islands", ["Nord-Mariana-øyene", "Nordmarianene", "Nord Marianene", "Northern Marianas"], "Saipan", "Saipan", ["Capitol Hill"], "O", "US"],
  ["PN", "Pitcairnøyene", "Pitcairn Islands", ["Pitcairn", "Pitcairn Island", "Pitcairn, Henderson, Ducie og Oeno"], "Adamstown", "Adamstown", [], "O", "GB"],
  ["PR", "Puerto Rico", "Puerto Rico", [], "San Juan", "San Juan", [], "N", "US"],
  ["RE", "Réunion", "Reunion", ["La Réunion", "Reunion"], "Saint-Denis", "Saint-Denis", [], "F", "FR"],
  ["SH", "Saint Helena", "Saint Helena, Ascension and Tristan da Cunha", ["St. Helena", "St Helena", "Ascension", "Tristan da Cunha", "Saint Helena, Ascension og Tristan da Cunha", "Saint Helena Ascension and Tristan da Cunha"], "Jamestown", "Jamestown", [], "F", "GB"],
  ["PM", "Saint-Pierre og Miquelon", "Saint Pierre and Miquelon", ["Saint Pierre og Miquelon", "St. Pierre og Miquelon", "Saint-Pierre-et-Miquelon"], "Saint-Pierre", "Saint-Pierre", [], "N", "FR"],
  ["GS", "Sør-Georgia og Sør-Sandwichøyene", "South Georgia and the South Sandwich Islands", ["Sør-Georgia", "South Georgia", "Sør-Sandwichøyene", "Sør Georgia"], "King Edward Point", "King Edward Point", ["Grytviken"], "S", "GB"],
  ["SJ", "Svalbard", "Svalbard and Jan Mayen", ["Svalbard og Jan Mayen", "Jan Mayen", "Spitsbergen"], "Longyearbyen", "Longyearbyen", [], "E", "NO"],
  ["TK", "Tokelau", "Tokelau", [], "", "", [], "O", "NZ"],
  ["TC", "Turks- og Caicosøyene", "Turks and Caicos Islands", ["Turks og Caicosøyene", "Turks and Caicos", "Turks- og Caicos"], "Cockburn Town", "Cockburn Town", [], "N", "GB"],
  ["VI", "De amerikanske Jomfruøyene", "U.S. Virgin Islands", ["Amerikanske Jomfruøyene", "US Virgin Islands", "United States Virgin Islands", "USVI"], "Charlotte Amalie", "Charlotte Amalie", [], "N", "US"],
  ["WF", "Wallis og Futuna", "Wallis and Futuna", ["Wallis-og-Futuna", "Wallis"], "Mata-Utu", "Mata-Utu", ["Mata Utu"], "O", "FR"],
  ["EH", "Vest-Sahara", "Western Sahara", ["Vest Sahara", "Sahrawi", "Sahrawi Arab Democratic Republic"], "El Aaiún", "Laayoune", ["Laayoune", "El Aaiun", "Laâyoune", "El-Aaiún", "Al Ayoun"], "F", null],
  ["CW", "Curaçao", "Curacao", ["Curacao"], "Willemstad", "Willemstad", [], "N", "NL"],
  ["BQ", "Karibisk Nederland", "Caribbean Netherlands", ["Bonaire", "Bonaire, Sint Eustatius og Saba", "BES-øyene", "Bonaire Sint Eustatius and Saba"], "Kralendijk", "Kralendijk", [], "N", "NL"],
  ["BL", "Saint-Barthélemy", "Saint Barthelemy", ["Saint Barthélemy", "Saint Barthelemy", "St. Barthélemy", "St. Barts", "Saint-Barth"], "Gustavia", "Gustavia", [], "N", "FR"],
  ["SX", "Sint Maarten", "Sint Maarten", ["Sint Maarten (nederlandsk del)", "St. Maarten", "St Maarten"], "Philipsburg", "Philipsburg", [], "N", "NL"],
  ["MF", "Saint-Martin", "Saint Martin", ["Saint Martin (fransk del)", "St. Martin", "St Martin"], "Marigot", "Marigot", [], "N", "FR"],
  ["AX", "Åland", "Aland Islands", ["Ålandsøyene", "Åland Islands", "Aland"], "Mariehamn", "Mariehamn", ["Maarianhamina"], "E", "FI"],
];

/**
 * Territories whose silhouette is too small or too unfamiliar to be a daily answer (`liten: true` in land.json).
 * Hand-picked: places under ~150 km2 (apart from the recognisable fish-hook of Bermuda), uninhabited sub-Antarctic
 * islands and scattered atolls. They stay valid guesses and map answers.
 */
export const LITEN = new Set([
  "BV", "HM", "TF", "GS", "IO", "TK", "PN", "CX", "CC", "NF", "NU", "WF", "GI", "MO", "AI", "VG", "MS", "BL", "SX", "MF", "GG", "JE", "CK",
]);

/** Capital coordinates [lat, lng] for places without a Wikidata capital (or where it points at another city). */
export const HOVEDSTAD_POS = {
  GQ: [3.75, 8.7833], // Malabo (Wikidata points at the new capital Ciudad de la Paz)
  HK: [22.2793, 114.1628], // Victoria / central Hong Kong
  SJ: [78.2232, 15.6469], // Longyearbyen
  EH: [27.1536, -13.2033], // Laayoune
  BQ: [12.1443, -68.2655], // Kralendijk
};
