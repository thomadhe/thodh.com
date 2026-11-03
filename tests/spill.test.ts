import assert from "node:assert/strict"
import { test } from "node:test"
import { sanglosSanger } from "../features/spill/data/sanglos/sanger"
import { stavebienOrd } from "../features/spill/data/stavebien/ord"
import { dagNummer, erGyldigDato, iDagOslo, iRotasjon, kanSpilles, leggTilDager, START_DATO, velgDato } from "../features/spill/lib/dag"
import { formaterVerdi } from "../features/spill/lib/format"
import { dagensMerEllerMindre, kategorier, KATEGORIER_PER_DAG, RUNDER_PER_KATEGORI } from "../features/spill/lib/mer-eller-mindre"
import { dagensStavebien } from "../features/spill/lib/stavebien"
import { erRiktigStavet } from "../features/spill/lib/stavebien-regler"
import { gridDisk, gridRing } from "h3-js"
import { avstandKm, MAKS_POENG, NIVAER, nivaaForZoom, rundePoeng, utfallForAvstand } from "../features/spill/lib/heksagon"
import { celleFor, nivaaFor, omriss, sentrum, synligeCeller, vurder } from "../features/spill/lib/heksagon-celler"
import { stegernDager } from "../features/spill/data/stegern"
import { sp } from "../features/spill/data/stegern/typer"
import { GJENTA_DM, hoppDm, MAKS_DM, NORMALE, STEGERN_START } from "../features/spill/lib/stegern"
import {
  avstand,
  byggOppgave,
  dagensSporsmal,
  dagFor,
  erGjentatt,
  erRepris,
  finaleBillett,
  finnAlternativ,
  harFinaleBillett,
  harKvittering,
  kanSpillesStegern,
  konflikter,
  kvittering,
  normaliser,
  sjetteNr,
  tallIOrd,
  vurderSvar,
} from "../features/spill/lib/server/stegern-logikk"

const dager = Array.from({ length: 120 }, (_, i) => leggTilDager(START_DATO, i))

test("datoer valideres og avgrenses til spillbare dager", () => {
  assert.equal(erGyldigDato("2026-02-30"), false)
  assert.equal(erGyldigDato("2026-10-28"), true)
  assert.equal(dagNummer(START_DATO), 0)
  assert.equal(kanSpilles("2026-09-30", "2026-10-28"), false)
  assert.equal(kanSpilles("2026-10-29", "2026-10-28"), false)
  assert.equal(velgDato("2099-01-01", "2026-10-28"), "2026-10-28")
  assert.equal(velgDato("2026-10-05", "2026-10-28"), "2026-10-05")
  assert.equal(iDagOslo(new Date("2026-10-28T23:30:00Z")), "2026-10-29")
})

test("rotasjon bruker hvert element én gang før noe gjentas", () => {
  const liste = Array.from({ length: 37 }, (_, i) => i)
  for (const runde of [0, 1, 2]) {
    const sett = new Set(liste.map((_, i) => iRotasjon(liste, runde * liste.length + i, "test")))
    assert.equal(sett.size, liste.length)
  }
})

test("Mer eller mindre: fem kategorier med fem gyldige runder hver dag", () => {
  for (const dato of dager) {
    const dag = dagensMerEllerMindre(dato)
    assert.equal(dag.length, KATEGORIER_PER_DAG)
    assert.equal(new Set(dag.map((k) => k.id)).size, KATEGORIER_PER_DAG, dato)
    for (const k of dag) {
      const kilde = kategorier.find((x) => x.id === k.id)!
      assert.equal(k.runder.length, RUNDER_PER_KATEGORI, `${dato} ${k.id}`)
      // Rounds form a chain: the right card of one round is the left card of the next.
      k.runder.slice(1).forEach((r, i) => assert.equal(r.a.name, k.runder[i].b.name, `${dato} ${k.id} brutt kjede`))
      const navn = [k.runder[0].a.name, ...k.runder.map((r) => r.b.name)]
      assert.equal(new Set(navn).size, navn.length, `${dato} ${k.id} gjentar et element`)
      for (const r of k.runder) {
        const [vinner, taper] = r.fasit === 0 ? [r.a, r.b] : [r.b, r.a]
        assert.ok(kilde.winner === "higher" ? vinner.value > taper.value : vinner.value < taper.value)
        if (kilde.separation.kind === "ratio") {
          assert.ok(Math.max(r.a.value, r.b.value) / Math.min(r.a.value, r.b.value) >= kilde.separation.value)
        } else {
          assert.ok(Math.abs(r.a.value - r.b.value) >= kilde.separation.value)
        }
      }
    }
  }
})

test("Mer eller mindre: dataene er komplette og uten duplikater", () => {
  for (const k of kategorier) {
    assert.ok(k.items.length >= 60, `${k.id} har bare ${k.items.length} elementer`)
    assert.equal(new Set(k.items.map((i) => i.name)).size, k.items.length, `${k.id} har duplikater`)
    for (const i of k.items) assert.ok(Number.isFinite(i.value) && i.value > 0 && i.emoji, `${k.id}: ${i.name}`)
  }
})

test("Stavebien: fem ord fra lett til vanskelig, uten lekkasje i hintene", () => {
  for (const dato of dager.slice(0, 30)) {
    const ord = dagensStavebien(dato)
    assert.deepEqual(ord.map((o) => o.level), [1, 2, 3, 4, 5])
    assert.equal(new Set(ord.map((o) => o.word)).size, 5)
  }
  for (const o of stavebienOrd) {
    assert.ok(!o.definition.toLowerCase().includes(o.word.toLowerCase()), o.word)
    assert.ok(o.sentence.includes("___") && !o.sentence.toLowerCase().includes(o.word.toLowerCase()), o.word)
  }
  const komite = stavebienOrd.find((o) => o.alternatives?.length)!
  assert.ok(erRiktigStavet(` ${komite.alternatives![0].toUpperCase()} `, komite))
  assert.ok(!erRiktigStavet("kjøken", { word: "kjøkken", level: 1, definition: "", sentence: "", origin: "" }))
})

test("Sangløs: unike sanger med trackId i alle kategorier", () => {
  assert.equal(new Set(sanglosSanger.map((s) => s.id)).size, sanglosSanger.length)
  assert.equal(new Set(sanglosSanger.map((s) => s.trackId)).size, sanglosSanger.length)
  for (const k of ["rock", "hiphop"] as const) {
    assert.ok(sanglosSanger.filter((s) => s.genre === k).length >= 200, k)
  }
})

test("verdier formateres på norsk", () => {
  assert.equal(formaterVerdi(1994, "year"), "1994")
  assert.equal(formaterVerdi(8.25, "decimal"), "8,3")
  assert.match(formaterVerdi(2_400_000, "compact"), /^2,4 mill\.$/)
  assert.match(formaterVerdi(0.018, "compact"), /^0,018$/)
})

test("Anelsesløs: ordlisten og vektorene passer sammen og har ikke CRLF", async () => {
  const { readFileSync } = await import("node:fs")
  const ord = readFileSync("features/spill/data/anelseslos/vocab.txt", "utf8")
  assert.ok(!ord.includes("\r"), "vocab.txt har fått Windows-linjeskift")
  assert.equal(readFileSync("features/spill/data/anelseslos/vectors.bin").length, ord.split("\n").length * 300)
})

test("Heksagonal jakt: H3-nivåer og zoom som i HexHunt", () => {
  assert.deepEqual(NIVAER.map((n) => n.poeng), [80, 120, 155, 180, 200])
  assert.equal(MAKS_POENG * 7, 1400)
  // The level changes 0.35 zoom past its threshold, in both directions, and the whole world is always Vid.
  assert.equal(nivaaForZoom(2.9, 0), 0)
  assert.equal(nivaaForZoom(3, 0), 1)
  assert.equal(nivaaForZoom(2.3, 1), 1)
  assert.equal(nivaaForZoom(2.2, 1), 0)
  assert.equal(nivaaForZoom(9, 0), 4)
  assert.equal(nivaaForZoom(9, 4, true), 0)
  const oslo: [number, number] = [59.91, 10.75]
  for (let n = 0; n < NIVAER.length; n++) assert.equal(nivaaFor(celleFor(...oslo, n)), n)
  assert.equal(nivaaFor(celleFor(...oslo, 6)), null)
  assert.equal(nivaaFor("hei"), null)
  // Outlines on the date line don't streak across the map, and those around a pole close along it.
  for (const c of [celleFor(-17.8, 179.99, 1), celleFor(89.9, 0, 0), celleFor(-89.9, 0, 0)]) {
    const ring = omriss(c)
    ring.slice(1).forEach((p, i) => assert.ok(Math.abs(p[0] - ring[i][0]) <= 180 || Math.abs(p[1]) === 90, c))
  }
  assert.ok(omriss(celleFor(89.9, 0, 0)).some(([, lat]) => lat === 90))
  // The visible cells cover the view, also across the date line.
  assert.ok(synligeCeller(5, 55, 16, 64, 3).includes(celleFor(...oslo, 3)))
  const stillehavet = synligeCeller(170, -25, 190, -10, 2)
  assert.ok(stillehavet.includes(celleFor(-18.1, 178.4, 2)) && stillehavet.includes(celleFor(-17, -178, 2)))
  assert.equal(synligeCeller(-170, -80, 170, 80, 3).length, 0)
})

test("Heksagonal jakt: vurdering og poeng som i HexHunt", () => {
  const oslo: [number, number] = [59.91, 10.75]
  const c = celleFor(...oslo, 2)
  assert.deepEqual(vurder(c, oslo), { utfall: "funnet", unna: 0 })
  for (const nabo of gridDisk(c, 1).filter((x) => x !== c)) {
    const { utfall, unna } = vurder(nabo, oslo)
    assert.equal(utfall, utfallForAvstand(2, avstandKm(sentrum(nabo), oslo)))
    assert.notEqual(utfall, "kald")
    assert.ok(unna >= 1 && unna <= 2, `${unna}`)
    // A large site counts as found from a neighbouring hex.
    assert.equal(vurder(nabo, oslo, 300, true).utfall, "funnet")
  }
  assert.equal(vurder(celleFor(-33.9, 151.2, 2), oslo).utfall, "kald")
  // About as many hexes away as the grid counts, also further out.
  for (const ring of [3, 6, 10]) {
    for (const g of gridRing(c, ring)) assert.ok(Math.abs(vurder(g, oslo).unna - ring) <= 2, `${ring}: ${vurder(g, oslo).unna}`)
  }
  // A city's 10 km reach every hex that meets at a corner of its own.
  const [lng, lat] = omriss(celleFor(...oslo, 4))[0]
  for (const nabo of gridDisk(celleFor(lat, lng, 4), 1)) {
    if (omriss(nabo).some(([x, y]) => Math.hypot(x - lng, y - lat) < 1e-9)) assert.equal(vurder(nabo, [lat, lng], 10).utfall, "funnet")
  }
  assert.notEqual(vurder(celleFor(61, 10.75, 4), oslo, 10).utfall, "funnet")
  // Feedback in hex sizes (√area): hot within 1.5, warm within 3, lukewarm within 6.
  assert.equal(utfallForAvstand(4, 1.5 * Math.sqrt(1770) - 0.1), "het")
  assert.equal(utfallForAvstand(4, 1.5 * Math.sqrt(1770) + 0.1), "varm")
  assert.equal(utfallForAvstand(4, 6 * Math.sqrt(1770) + 0.1), "kald")
  assert.equal(rundePoeng("funnet", 4, 0), 200)
  assert.equal(rundePoeng("funnet", 2, 1), 124)
  assert.equal(rundePoeng("varm", 3, 0), 54)
  assert.equal(rundePoeng("het", 0, 2), 29)
  assert.equal(rundePoeng("lunken", 4, 0), 0)
})

// 6/7-stegern

const stegernDatoer = Array.from({ length: 120 }, (_, i) => leggTilDager(STEGERN_START, i))
const treff = (svar: string, tekst: string, streng = false) => {
  const o = byggOppgave(sp("Test", svar, { streng }))
  const i = finnAlternativ(o, tekst)
  return i === null ? null : o.alternativer[i].vis
}

test("6/7-stegern: normalisering av svar", () => {
  assert.equal(normaliser("Côte d'Ivoire"), "cotedivoire")
  assert.equal(normaliser("  Østerrike "), "osterrike")
  assert.equal(normaliser("Ålesund"), normaliser("Aalesund"))
  assert.equal(normaliser("en banan"), "banan")
  assert.equal(normaliser("Bosnia-Hercegovina"), normaliser("bosnia hercegovina"))
  assert.notEqual(normaliser("C#"), normaliser("C"))
  assert.notEqual(normaliser("C++"), normaliser("C"))
  assert.equal(avstand("tyskland", "tysklnad"), 1)
  assert.equal(avstand("abc", "xyz", 1), 2)
})

test("6/7-stegern: alias, skrivefeil og bøyning godtas", () => {
  const usa = "#US, #CA | #MX | | | "
  for (const t of ["USA", "Amerika", "De forente stater", "united states", "usa "]) assert.equal(treff(usa, t), "USA")
  assert.equal(treff("#DE, #FR | | | | ", "Tysklnad"), "Tyskland")
  assert.equal(treff("#AT | | | | ", "Østerike"), "Østerrike")
  assert.equal(treff("#LI | | | | ", "Lichtenstein"), "Liechtenstein")
  assert.equal(treff("eple/epler, banan | | | | ", "EPLER"), "eple")
  assert.equal(treff("katt, hund | | | | ", "katter"), "katt")
  assert.equal(treff("kantarell | | | | ", "kantarel"), "kantarell")
  assert.equal(treff("Python, C, C#, C++ | | | | ", "c#"), "C#")
  assert.equal(treff("Python, C, C#, C++ | | | | ", "C++"), "C++")
  assert.equal(treff("zorbik | | | | ", "zorbiker"), "zorbik")
  assert.equal(treff("zorbik | | | | ", "zorbiken"), "zorbik")
})

test("6/7-stegern: bare vanlige substantiv bøyes, og ekte ord er aldri skrivefeil", () => {
  // Names and places are not inflected: "Bergenen" is not Bergen.
  assert.equal(treff("Bergen, Oslo | | | | ", "Bergenen"), null)
  assert.equal(treff("#PE | | | | ", "Peruene"), null)
  // One letter only comes off a stem of five letters or more.
  assert.equal(treff("bil | | | | ", "bils"), null)
  assert.equal(treff("tre | | | | ", "tree"), null)
  // A word that is itself an answer elsewhere is not stripped: the country Sveits is not a "sveit".
  assert.equal(treff("sveit | | | | ", "Sveits"), null)
  assert.equal(treff("sveit | | | | ", "sveiten"), "sveit")
  // Long real words one letter off are not typos either: Kingston is not Kingstown.
  assert.equal(treff("$VC | | | | ", "Kingston"), null)
  assert.equal(treff("$VC | | | | ", "Kingstwon"), "Kingstown")
})

test("6/7-stegern: tall og romertall må stemme nøyaktig", () => {
  assert.equal(tallIOrd("Rocky II"), "2")
  assert.equal(tallIOrd("Rocky 2"), "2")
  assert.equal(tallIOrd("Henrik VIII"), "8")
  assert.equal(tallIOrd("Mannen i månen"), "")
  assert.equal(tallIOrd("Vi over 60"), "60")
  const rocky = "Rocky, Rocky II, Rocky III | Rocky IV | | | "
  assert.equal(treff(rocky, "Rocky VII"), null)
  assert.equal(treff(rocky, "Rocky V"), null)
  assert.equal(treff(rocky, "Rocky IIII"), null)
  assert.equal(treff(rocky, "Rokcy II"), "Rocky II")
  assert.equal(treff(rocky, "rocky iv"), "Rocky IV")
  assert.equal(treff("Henrik VIII | | | | ", "Henrik VII"), null)
  assert.equal(treff("Apollo 11 | | | | ", "Apollo 13"), null)
  assert.equal(treff("Apollo 11 | | | | ", "Apolo 11"), "Apollo 11")
  assert.equal(treff("Ocean's Eleven | | | | ", "Ocean's 11"), null)
})

test("6/7-stegern: svar fra andre spørsmål i banken godtas ikke ved et uhell", () => {
  // Reviewed exceptions as "day.question: key → accepted answer". Add one only after checking that the
  // text really is a right answer to that question (then it should rather be listed there as an alias).
  const godkjent = new Set<string>([])
  const alle = stegernDager.flatMap((d, i) => [...d.sporsmal, d.finale].map((s, j) => ({ hvor: `${i + 1}.${j === 5 ? 7 : j + 1}`, o: byggOppgave(s) })))
  const nokler = new Set(alle.flatMap(({ o }) => [...o.indeks.keys(), ...o.nei]))
  const feil: string[] = []
  for (const { hvor, o } of alle) {
    for (const k of nokler) {
      if (o.indeks.has(k) || o.nei.has(k)) continue
      const i = finnAlternativ(o, k)
      const linje = `${hvor}: ${k} → ${i === null ? "" : o.alternativer[i].vis}`
      if (i !== null && !godkjent.has(linje)) feil.push(linje)
    }
  }
  assert.deepEqual(feil, [])
})

test("6/7-stegern: nesten-treff på andre ord, delstrenger og lister avvises", () => {
  const afghanistan = byggOppgave(sp("Test", "@naboer:AF | | | | "))
  const vis = (t: string) => {
    const i = finnAlternativ(afghanistan, t)
    return i === null ? null : afghanistan.alternativer[i].vis
  }
  assert.equal(vis("Iran"), "Iran")
  assert.equal(vis("Irna"), "Iran")
  // Irak is a real country one letter from Iran: never read as a typo.
  assert.equal(vis("Irak"), null)
  assert.equal(treff("Bali, Java | | | | ", "Mali"), null)
  assert.equal(treff("banan, eple | | | | ", "ban"), null)
  assert.equal(treff("banan, eple | | | | ", "banan eple"), null)
  assert.equal(treff("banan, eple | | | | ", ""), null)
  assert.equal(treff("Niger | | | | ", "Nigeria"), null)
  // Rhymes are exact: no typos, no inflection.
  assert.equal(treff("mus, lus | | | | ", "mus", true), "mus")
  assert.equal(treff("mus, lus | | | | ", "muss", true), null)
  assert.equal(treff("mus, lus | | | | ", "muser", true), null)
  // A listed wrong answer stays wrong even when it is a typo away from a right one.
  const o = byggOppgave(sp("Test", "konge, dronning | | | | ", { nei: "konga" }))
  assert.equal(finnAlternativ(o, "konga"), null)
  assert.notEqual(finnAlternativ(o, "kongee"), null)
})

test("6/7-stegern: hopp og poeng", () => {
  assert.equal(hoppDm(0), 4)
  assert.equal(hoppDm(5), 90)
  assert.equal(hoppDm(5, true), 153)
  assert.equal(GJENTA_DM, 67)
  // A perfect day is exactly 67 metres.
  assert.equal(MAKS_DM, 670)
})

test("6/7-stegern: dagens oppgaver og spørsmål 6", () => {
  assert.equal(kanSpillesStegern("2026-11-01", "2026-12-01"), false)
  assert.equal(kanSpillesStegern(STEGERN_START, "2026-12-01"), true)
  assert.equal(kanSpillesStegern("2026-12-02", "2026-12-01"), false)
  // At least 60 days in a row from the start, each with its own prompts.
  const forste60 = stegernDatoer.slice(0, 60).map((d) => dagFor(d))
  assert.ok(stegernDager.length >= 60, `${stegernDager.length}`)
  assert.equal(new Set(forste60).size, 60)
  assert.equal(dagFor(STEGERN_START), stegernDager[0])
  for (const dato of stegernDatoer) {
    assert.equal(dagensSporsmal(dato).length, NORMALE, dato)
    const n = sjetteNr(dato)
    assert.ok(Number.isInteger(n) && n >= 1 && n <= NORMALE, `${dato}: ${n}`)
    assert.equal(sjetteNr(dato), n)
  }
  // Question 6 points at different questions on different days.
  assert.ok(new Set(stegernDatoer.map(sjetteNr)).size === NORMALE)

  const dato = STEGERN_START
  const s = dagFor(dato).sporsmal[sjetteNr(dato) - 1]
  const o = byggOppgave(s)
  const forsteSvar = o.alternativer[0]
  // The same answer, in another form or with a typo, unlocks the final.
  assert.equal(erGjentatt(dato, forsteSvar.vis, forsteSvar.vis), true)
  assert.equal(erGjentatt(dato, forsteSvar.vis, forsteSvar.vis.toUpperCase() + " "), true)
  const alias = forsteSvar.nokler.find((k) => k !== normaliser(forsteSvar.vis))
  if (alias) assert.equal(erGjentatt(dato, forsteSvar.vis, alias), true)
  assert.equal(erGjentatt(dato, forsteSvar.vis, o.alternativer[1].vis), false)
  // A wrong answer then must be repeated as typed; a blank one is repeated by answering blank or "ingenting".
  assert.equal(erGjentatt(dato, "blåbærsyltetøy", "blåbærsyltetøy"), true)
  assert.equal(erGjentatt(dato, "blåbærsyltetøy", "blåbærsyltetøi"), true)
  assert.equal(erGjentatt(dato, "blåbærsyltetøy", "jordbær"), false)
  assert.equal(erGjentatt(dato, "", ""), true)
  assert.equal(erGjentatt(dato, "", "Ingenting"), true)
  assert.equal(erGjentatt(dato, "", forsteSvar.vis), false)
  assert.equal(erGjentatt(dato, forsteSvar.vis, ""), false)

  const v = vurderSvar(dato, 0, byggOppgave(dagFor(dato).sporsmal[0]).alternativer[0].vis)
  assert.equal(v.nivaa, 1)
  assert.ok(v.vanligste.length > 0 && v.sjeldneste.length > 0 && v.antall > 10)
  assert.equal(vurderSvar(dato, 0, "qwertyuiop").nivaa, 0)
})

test("6/7-stegern: kvitteringer for svar og finalen", () => {
  const dato = STEGERN_START
  const k = kvittering(dato, 2, "Banan")
  // The receipt follows the normalised answer, so case and spacing do not matter.
  assert.equal(harKvittering(dato, 2, "banan ", k), true)
  assert.equal(harKvittering(dato, 2, "eple", k), false)
  assert.equal(harKvittering(dato, 3, "Banan", k), false)
  assert.equal(harKvittering(leggTilDager(dato, 1), 2, "Banan", k), false)
  assert.equal(harKvittering(dato, 2, "Banan", undefined), false)
  assert.equal(harKvittering(dato, 2, "Banan", k.slice(0, -1)), false)
  // A blank answer gets a receipt too, and question 6 can then be repeated blank.
  assert.equal(harKvittering(dato, 0, "", kvittering(dato, 0, "")), true)
  assert.equal(harFinaleBillett(dato, finaleBillett(dato)), true)
  assert.equal(harFinaleBillett(leggTilDager(dato, 1), finaleBillett(dato)), false)
  assert.equal(harFinaleBillett(dato, ""), false)
  assert.equal(harFinaleBillett(dato, k), false)
})

test("6/7-stegern: repris når banken begynner på nytt", () => {
  assert.equal(erRepris(STEGERN_START), false)
  assert.equal(erRepris(leggTilDager(STEGERN_START, stegernDager.length - 1)), false)
  assert.equal(erRepris(leggTilDager(STEGERN_START, stegernDager.length)), true)
  assert.equal(dagFor(leggTilDager(STEGERN_START, stegernDager.length)), stegernDager[0])
})

test("6/7-stegern: hver dag i banken er velformet", () => {
  const tekster = new Set<string>()
  for (const [i, d] of stegernDager.entries()) {
    assert.equal(d.sporsmal.length, NORMALE, `dag ${i + 1}`)
    for (const s of [...d.sporsmal, d.finale]) {
      const hvor = `dag ${i + 1}: ${s.tekst}`
      assert.ok(!tekster.has(s.tekst), `to like spørsmål: ${hvor}`)
      tekster.add(s.tekst)
      assert.ok(!s.svar.includes("?"), `usikkert svar: ${hvor}`)
      const o = byggOppgave(s)
      assert.ok(o.alternativer.length >= 4, hvor)
      assert.ok(o.alternativer.some((a) => a.nivaa === 1), hvor)
      assert.ok(o.alternativer.every((a) => a.nokler.length > 0), hvor)
      assert.deepEqual(konflikter(s), [], hvor)
      // A listed wrong answer is never also a right one, and no answer is listed twice.
      assert.deepEqual([...o.nei].filter((k) => o.indeks.has(k)), [], hvor)
      const viste = o.alternativer.map((a) => normaliser(a.vis))
      assert.equal(new Set(viste).size, viste.length, `${hvor}: samme svar to ganger`)
      // Every answer is found from its own name.
      for (const [j, a] of o.alternativer.entries()) assert.equal(finnAlternativ(o, a.vis), j, `${hvor}: ${a.vis}`)
      // A wrong answer never slips through.
      assert.equal(finnAlternativ(o, "xqzv"), null, hvor)
    }
  }
})
