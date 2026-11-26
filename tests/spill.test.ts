import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { sanglosSanger } from "../features/spill/data/sanglos/sanger"
import { stavebienOrd } from "../features/spill/data/stavebien/ord"
import { dagNummer, erGyldigDato, iDagOslo, iRotasjon, kanSpilles, leggTilDager, START_DATO, velgDato } from "../features/spill/lib/dag"
import { formaterVerdi } from "../features/spill/lib/format"
import { forhandsbygdeDager, KLOKKESLINGRING_MS, rutSpill, sidensDag } from "../features/spill/lib/ruting"
import { spill } from "../features/spill/lib/spill"
import { dagensMerEllerMindre, kategorier, KATEGORIER_PER_DAG, RUNDER_PER_KATEGORI } from "../features/spill/lib/mer-eller-mindre"
import { dagensStavebien } from "../features/spill/lib/stavebien"
import { erRiktigStavet } from "../features/spill/lib/stavebien-regler"
import { gridDisk, gridRing } from "h3-js"
import { avstandKm, MAKS_POENG, NIVAER, nivaaForZoom, rundePoeng, utfallForAvstand } from "../features/spill/lib/heksagon"
import { celleFor, nivaaFor, omriss, sentrum, synligeCeller, vurder } from "../features/spill/lib/heksagon-celler"
import { gjettelosSporsmal } from "../features/spill/data/gjettelos"
import { gjettelosPlan } from "../features/spill/data/gjettelos/plan"
import {
  AARSTALL_REFERANSE,
  ANTALL,
  avstand as gjettelosAvstand,
  avvik,
  formaterFullt,
  formaterPoeng,
  formaterTall,
  GJETTELOS_START,
  grupperInndata,
  kategoriInfo,
  markorEtterGruppering,
  SKILLE,
  poengFor,
  summer,
  tolkAar,
  tolkGjett,
  tolkTall,
} from "../features/spill/lib/gjettelos"
import {
  dagensSporsmal as gjettelosDag,
  dagFor as gjettelosFor,
  erRepris as erGjettelosRepris,
  FASTE_DAGER,
  kanSpillesGjettelos,
  vurder as vurderGjett,
} from "../features/spill/lib/server/gjettelos-logikk"
import { stegernDager } from "../features/spill/data/stegern"
import { sp } from "../features/spill/data/stegern/typer"
import { GJENTA_DM, hoppDm, MAKS_DM, NORMALE, STEGERN_START } from "../features/spill/lib/stegern"
import {
  avstand,
  byggOppgave,
  dagensSporsmal,
  dagFor,
  DUELL_SPERRE_DAGER,
  BANK,
  duellDager,
  duellPulje,
  duellSporsmal,
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
import {
  alleHarSvart,
  duellSum,
  erGyldigKode,
  erNyere,
  godkjennDom,
  godkjenteSvar,
  KODE_LENGDE,
  lagKode,
  lesStatus,
  lesTilstede,
  MAKS_SPILLERE,
  normaliserKode,
  rangering,
  rensNavn,
  startStatus,
  SVAR_MS,
  taImot,
  velgDeltakere,
  vertAv,
  type Status,
} from "../features/spill/lib/stegern-duell"
import { blaFigur, lesFigur, STANDARD_FIGUR, tilfeldigFigur } from "../features/spill/lib/duell/figur"
import {
  barMaks,
  fyllBar,
  gjeldende,
  hoppOver,
  lunteEtterPass,
  MAKS_LIV,
  MIN_LUNTE_MS,
  nesteHolder,
  nyPistol,
  pass,
  pistolPlassering,
  rensInnstillinger,
  smell,
  SMELL_PAUSE_MS,
  STANDARD_INNSTILLINGER,
  SVAR_PER_SPORSMAL,
  trekkLunte,
  vurderPistolsvar,
  type Pistol,
  type PistolInnstillinger,
} from "../features/spill/lib/stegern-pistol"
import { iTide, plasser, SLINGRING_MS } from "../features/spill/lib/duell/rom"
import { apne } from "../features/spill/lib/duell/signatur"
import { erSignert, offentligNokkel, signer } from "../features/spill/lib/server/duell-signatur"
import { erDuellSporsmal, stegernDuellDom } from "../features/spill/lib/server/stegern-logikk"
import { stegernDuellBank } from "../features/spill/data/stegern-duell"
import { gjettelosDuellBank } from "../features/spill/data/gjettelos-duell"
import {
  erGjettelosDuellSporsmal,
  GJ_DUELL_SPERRE_DAGER,
  gjettelosDuellFasit,
  GJ_BANK,
  gjettelosDuellPulje,
  gjettelosDuellSporsmal,
  gjettelosDuellStempel,
} from "../features/spill/lib/server/gjettelos-logikk"
import {
  gjAlleHarSvart,
  gjGodkjente,
  godkjennFasit,
  godkjennGjett,
  GJ_SVAR_MS,
  gjPoeng,
  gjRangering,
  gjStart,
  gjTaImot,
  lesGjStatus,
  type GjStatus,
} from "../features/spill/lib/gjettelos-duell"

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

test("spillsider: Proxy velger datoen og omskriver til en side per dato", () => {
  const iDag = "2026-11-03"
  const rut = (sti: string, dato: string | null = null) => rutSpill(sti, dato, iDag)
  assert.deepEqual(rut("/spill/omriss"), { type: "rewrite", sti: "/spill/omriss/i-dag-2026-11-03" })
  assert.deepEqual(rut("/spill/omriss", "2026-11-03"), { type: "rewrite", sti: "/spill/omriss/i-dag-2026-11-03" })
  assert.deepEqual(rut("/spill/omriss", "2026-10-20"), { type: "rewrite", sti: "/spill/omriss/2026-10-20" })
  // Future, invalid and too early dates show today's puzzle, as before.
  for (const dato of ["2026-11-04", "2099-01-01", "tull", "2026-02-30", "2026-09-30", ""]) {
    assert.deepEqual(rut("/spill/omriss", dato), { type: "rewrite", sti: "/spill/omriss/i-dag-2026-11-03" }, dato)
  }
  // A game that started later sends earlier days to today.
  assert.deepEqual(rut("/spill/67-stegern", "2026-10-05"), { type: "redirect", sti: "/spill/67-stegern" })
  assert.deepEqual(rut("/spill/67-stegern", "2026-11-02"), { type: "rewrite", sti: "/spill/67-stegern/2026-11-02" })
  // The per-date pages are not public addresses.
  assert.deepEqual(rut("/spill/omriss/2026-11-04"), { type: "redirect", sti: "/spill/omriss?dato=2026-11-04" })
  assert.deepEqual(rut("/spill/omriss/i-dag-2026-11-04"), { type: "redirect", sti: "/spill/omriss" })
  assert.deepEqual(rut("/spill/omriss/tull"), { type: "redirect", sti: "/spill/omriss" })
  for (const sti of ["/spill", "/spill/verdens-land", "/spill/api/omriss-form", "/spill/omriss/a/b"]) assert.equal(rut(sti), null, sti)
})

test("spillsider: midnatt i Oslo bytter dag i Proxy, og ingen framtidig side bygges eller vises", () => {
  // November is UTC+1, so the day changes at 23:00 UTC.
  const for_ = iDagOslo(new Date("2026-11-03T22:59:59Z"))
  const etter = iDagOslo(new Date("2026-11-03T23:00:00Z"))
  assert.deepEqual(rutSpill("/spill/omriss", null, for_), { type: "rewrite", sti: "/spill/omriss/i-dag-2026-11-03" })
  assert.deepEqual(rutSpill("/spill/omriss", null, etter), { type: "rewrite", sti: "/spill/omriss/i-dag-2026-11-04" })
  // Yesterday's "today" page is no longer used; the plain date serves it with arrows.
  assert.deepEqual(rutSpill("/spill/omriss", "2026-11-03", etter), { type: "rewrite", sti: "/spill/omriss/2026-11-03" })

  const kl = (utc: string) => Date.parse(utc)
  assert.deepEqual(sidensDag("omriss", "i-dag-2026-11-03", kl("2026-11-03T12:00:00Z")), { dato: "2026-11-03", iDag: true })
  assert.deepEqual(sidensDag("omriss", "2026-10-20", kl("2026-11-03T12:00:00Z")), { dato: "2026-10-20", iDag: false })
  assert.equal(sidensDag("omriss", "i-dag-2026-11-04", kl("2026-11-03T12:00:00Z")), null)
  assert.equal(sidensDag("omriss", "2026-11-04", kl("2026-11-03T22:50:00Z")), null)
  // Only within the clock slack right before midnight.
  assert.ok(KLOKKESLINGRING_MS <= 5 * 60_000)
  assert.deepEqual(sidensDag("omriss", "i-dag-2026-11-04", kl("2026-11-03T22:59:00Z")), { dato: "2026-11-04", iDag: true })
  for (const segment of ["tull", "2026-02-30", "2026-09-30", "i-dag-", "I-DAG-2026-11-03"]) assert.equal(sidensDag("omriss", segment), null, segment)
  assert.equal(sidensDag("67-stegern", "2026-11-01", kl("2026-11-03T12:00:00Z")), null)

  for (const s of spill) {
    for (const { dag } of forhandsbygdeDager(s.id, "2026-11-03")) {
      assert.ok(sidensDag(s.id, dag, kl("2026-11-03T12:00:00Z")), `${s.id} ${dag}`)
    }
  }
  assert.deepEqual(forhandsbygdeDager("67-stegern", "2026-11-03"), [{ dag: "i-dag-2026-11-03" }, { dag: "2026-11-02" }])
  assert.equal(spill.find((s) => s.id === "67-stegern")?.start, STEGERN_START)
})

test("spillsider: Proxy-matcheren dekker nøyaktig de daglige spillene", () => {
  const kilde = readFileSync("proxy.ts", "utf8")
  const liste = /"\/spill\/:spill\(([^)]+)\)\/:dag\?"/.exec(kilde)?.[1]
  assert.ok(liste, "fant ikke spill-matcheren i proxy.ts")
  assert.deepEqual(liste.split("|").sort(), spill.map((s) => s.id).sort())
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
  assert.equal(treff("Henrik VIII | | | | ", "Henrik 8"), "Henrik VIII")
  assert.equal(treff("Henrik VIII | | | | ", "Henrik den åttende"), "Henrik VIII")
  assert.equal(treff(rocky, "Rocky 2"), "Rocky II")
  assert.equal(treff("Apollo 11 | | | | ", "Apollo 13"), null)
  assert.equal(treff("Apollo 11 | | | | ", "Apolo 11"), "Apollo 11")
  assert.equal(treff("Ocean's Eleven | | | | ", "Ocean's 11"), null)
  assert.equal(treff("zorbiker | | | | ", "zorbik"), "zorbiker")

  // Regression checks: drinks & Norwegian royal family / kings.
  const dag25 = stegernDager[24]
  const drikk = byggOppgave(dag25.sporsmal[0])
  for (const s of ["Faxe Kondi", "faxe kondi", "Red Bull", "Monster", "Pepsi Max", "Coca-Cola"]) {
    assert.notEqual(finnAlternativ(drikk, s), null, `drikk: ${s}`)
  }
  const kongefamilie = byggOppgave(dag25.sporsmal[3])
  for (const s of ["Kong Olav den fjerde", "Olav IV", "Olav 4.", "Kong Olav V", "Kong Harald V", "Haakon den sjuende", "Kong Haakon 7."]) {
    assert.notEqual(finnAlternativ(kongefamilie, s), null, `kongefamilie: ${s}`)
  }
  const konger = byggOppgave(stegernDager[8].sporsmal[3])
  for (const s of ["Kong Olav den fjerde", "Olav 4", "Kong Harald Hårfagre", "Christian den 4."]) {
    assert.notEqual(finnAlternativ(konger, s), null, `konger: ${s}`)
  }
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

// Gjetteløs

test("Gjetteløs: poeng på en symmetrisk logaritmisk skala med én desimal", () => {
  assert.equal(poengFor(2469, 2469), 100)
  // The table in the rules and the README.
  const tabell: [number, number][] = [
    [1.25, 74.4],
    [2, 50],
    [5, 26.7],
    [10, 17],
    [30, 7.1],
  ]
  for (const [r, p] of tabell) {
    assert.equal(poengFor(100 * r, 100), p, `${r}× for høyt`)
    assert.equal(poengFor(100 / r, 100), p, `${r}× for lavt`)
  }
  assert.equal(poengFor(10000, 100), 0)
  assert.equal(poengFor(1, 1000), 0)
  // One decimal, and falling all the way out.
  for (let r = 1; r < 120; r *= 1.07) {
    const p = poengFor(r, 1)
    assert.equal(Math.round(p * 10) / 10, p)
    assert.ok(p >= 0 && p <= 100)
    assert.ok(poengFor(r * 1.07, 1) <= p)
  }
  // The same ratio scores the same whether the answer is 8 or 8 billion.
  assert.equal(poengFor(8.8, 8), poengFor(8.8e9, 8e9))
  assert.equal(poengFor(1.1e20, 1e20), poengFor(1.1, 1))
  assert.equal(poengFor(0, 100), 0)
  assert.equal(poengFor(-5, 100), 0)
  assert.equal(poengFor(Number.NaN, 100), 0)
  // Years count from AARSTALL_REFERANSE, and their ratio twice over.
  const ref = AARSTALL_REFERANSE
  assert.equal(poengFor(1905, 1905, true), 100)
  assert.equal(poengFor(ref - 200, ref - 100, true), poengFor(400, 100))
  assert.equal(poengFor(ref - 50, ref - 100, true), poengFor(25, 100))
  // 10 years off something 100 years back is as bad as 1 year off something 10 years back.
  assert.equal(poengFor(ref - 90, ref - 100, true), poengFor(ref - 9, ref - 10, true))
  assert.equal(poengFor(ref, 1905, true), 0)
  assert.equal(poengFor(ref + 10, 1905, true), 0)
  assert.ok(poengFor(1955, 1905, true) < poengFor(1915, 1905, true))
  assert.ok(poengFor(1915, 1905, true) > 75)
  // Too early is to the left of the answer, too late to the right.
  assert.ok(gjettelosAvstand(1800, 1905, true)! < 0 && gjettelosAvstand(1950, 1905, true)! > 0)
  assert.ok(gjettelosAvstand(50, 100)! < 0 && gjettelosAvstand(200, 100)! > 0)
  assert.equal(gjettelosAvstand(2040, 1905, true), null)
  // Scores show with a decimal comma, and sums stay clean.
  assert.equal(formaterPoeng(25), "25,0")
  assert.equal(formaterPoeng(74.6), "74,6")
  assert.equal(summer([0.1, 0.2, 74.6, 26.4, 4.7]), 106)
})

test("Gjetteløs: tall skrevet på norsk tolkes riktig", () => {
  const tilfeller: [string, number | null][] = [
    ["2469", 2469],
    ["1 200 000", 1200000],
    ["1 200 000", 1200000],
    ["1,5 mill", 1500000],
    ["1,5 mill.", 1500000],
    ["2 mrd", 2e9],
    ["2 milliarder", 2e9],
    ["12 tusen", 12000],
    ["1.500", 1500],
    ["1.200.000", 1200000],
    ["3.5", 3.5],
    ["9,58", 9.58],
    ["6e23", 6e23],
    ["43 trillioner", 43e18],
    ["0", null],
    ["", null],
    ["abc", null],
    ["1,2,3", null],
    ["1,234,567", 1234567],
    ["1\u202f500\u202f000", 1500000],
    ["2\u00a0500,5", 2500.5],
    ["5 kilo", null],
  ]
  for (const [tekst, ventet] of tilfeller) assert.equal(tolkTall(tekst), ventet, tekst)
  assert.equal(tolkAar("1905"), 1905)
  assert.equal(tolkAar("1 905"), null)
  assert.equal(tolkAar("19,05"), null)
  assert.equal(tolkGjett("1,5 mill", false), 1500000)
  assert.equal(tolkGjett("1814", true), 1814)
})

test("Gjetteløs: feltet grupperer sifre uten å flytte markøren", () => {
  const vis = (t: string) => t.replaceAll(SKILLE, "_")
  assert.equal(vis(grupperInndata("1500000")), "1_500_000")
  assert.equal(vis(grupperInndata("1 500 0")), "15_000")
  assert.equal(vis(grupperInndata("999")), "999")
  assert.equal(vis(grupperInndata("2500,75")), "2_500,75")
  assert.equal(vis(grupperInndata("1,5 mill")), "1,5 mill")
  assert.equal(vis(grupperInndata("2 mrd")), "2 mrd")
  assert.equal(vis(grupperInndata("2500 m")), "2_500 m")
  assert.equal(vis(grupperInndata("2500 ")), "2_500 ")
  assert.equal(vis(grupperInndata("1.500")), "1.500")
  assert.equal(vis(grupperInndata("6e23")), "6e23")
  assert.equal(grupperInndata(""), "")
  assert.equal(grupperInndata("abc"), "abc")
  // Every grouped form reads back as the same number.
  for (const t of ["1500000", "2500,75", "12345678901", "1 2 3 4"]) assert.equal(tolkTall(grupperInndata(t)), tolkTall(t.replace(/\s/g, "")), t)
  // The caret stays after the same digit: typing 5 in "1 0|00" gives "10 5|00".
  const ny = grupperInndata("1 0500")
  assert.equal(vis(ny), "10_500")
  assert.equal(markorEtterGruppering(ny, "1 05"), 4)
  assert.equal(markorEtterGruppering(ny, ""), 0)
  assert.equal(markorEtterGruppering(ny, "1 0500"), ny.length)
  // A space typed before a word stays before the caret.
  assert.equal(markorEtterGruppering(grupperInndata("2,5 "), "2,5 "), 4)
  assert.equal(markorEtterGruppering(grupperInndata("2500 "), "2500 "), "2_500 ".length)
  // Pasting in the middle.
  const limt = grupperInndata("12000000")
  assert.equal(markorEtterGruppering(limt, "12000"), "12_000".length)
})

test("Gjetteløs: visning av tall og avvik", () => {
  const mellomrom = (s: string) => s.replace(/\s/g, " ")
  assert.equal(formaterTall(1905, true), "1905")
  assert.equal(mellomrom(formaterTall(2469)), "2 469")
  assert.equal(formaterTall(5594340), "5,594 mill.")
  assert.equal(formaterTall(1e6), "1 mill.")
  assert.equal(mellomrom(formaterTall(91000)), "91 000")
  assert.equal(mellomrom(formaterFullt(1.5e6)), "1 500 000")
  assert.equal(formaterTall(149600000), "149,6 mill.")
  assert.equal(mellomrom(formaterTall(19742e9)), "19 742 mrd.")
  assert.equal(formaterTall(0.44), "0,44")
  assert.equal(formaterTall(273.15), "273,15")
  assert.match(formaterTall(1e120), /10¹²⁰$/)
  assert.equal(avvik(100, 100), "Helt riktig")
  assert.equal(avvik(88, 100), "12 % for lavt")
  assert.equal(avvik(320, 100), "3,2× for høyt")
  assert.equal(avvik(1.1e6, 1e5), "11× for høyt")
  assert.equal(avvik(10, 100), "10× for lavt")
  assert.equal(avvik(1905, 1905, true), "Riktig år")
  assert.equal(avvik(1915, 1905, true), "10 år for sent")
})

test("Gjetteløs: spørsmålsbanken er velformet, bred og mest anslag", () => {
  assert.ok(gjettelosSporsmal.length >= 450, `${gjettelosSporsmal.length} spørsmål`)
  const ider = new Set<string>()
  const tekster = new Set<string>()
  for (const s of gjettelosSporsmal) {
    assert.ok(!ider.has(s.id), `dobbel id ${s.id}`)
    assert.ok(!tekster.has(s.tekst), `dobbelt spørsmål ${s.tekst}`)
    ider.add(s.id)
    tekster.add(s.tekst)
    assert.ok(s.id.startsWith(`${s.kategori}:`), s.id)
    assert.match(s.kategori, /^[a-z0-9-]+$/, s.id)
    assert.ok(kategoriInfo(s.kategori).navn.length > 0, s.id)
    assert.ok(s.stil === "anslag" || s.stil === "fakta", s.id)
    assert.ok([1, 2, 3].includes(s.vansk), s.id)
    assert.ok(s.tekst.endsWith("?"), s.id)
    assert.ok(s.kilde.trim().length > 0, `${s.id} mangler kilde`)
    assert.ok(Number.isFinite(s.fasit) && s.fasit > 0, s.id)
    assert.equal(poengFor(s.fasit, s.fasit, s.aarstall), 100, s.id)
    assert.ok(s.per === undefined || /\d{4}/.test(s.per), `${s.id}: per ${s.per}`)
    if (s.aarstall) assert.ok(Number.isInteger(s.fasit) && s.fasit < AARSTALL_REFERANSE, `${s.id}: årstall ${s.fasit}`)
  }
  // Most questions are estimates to reason about, and years are few.
  const anslag = gjettelosSporsmal.filter((s) => s.stil === "anslag").length
  assert.ok(anslag / gjettelosSporsmal.length >= 0.65, `${anslag} anslag`)
  assert.ok(gjettelosSporsmal.filter((s) => s.aarstall).length / gjettelosSporsmal.length <= 0.05)
  // No category dominates, and nature and animals stay a modest share each.
  const perKategori = new Map<string, number>()
  for (const s of gjettelosSporsmal) perKategori.set(s.kategori, (perKategori.get(s.kategori) ?? 0) + 1)
  assert.ok(perKategori.size >= ANTALL, `${perKategori.size} kategorier`)
  for (const [k, n] of perKategori) assert.ok(n / gjettelosSporsmal.length <= 0.15, `${k}: ${n}`)
  assert.ok((perKategori.get("natur") ?? 0) / gjettelosSporsmal.length <= 0.06, `natur: ${perKategori.get("natur")}`)
  const dyr = perKategori.get("dyr") ?? 0
  assert.ok(dyr / gjettelosSporsmal.length >= 0.06 && dyr / gjettelosSporsmal.length <= 0.1, `dyr: ${dyr}`)
})

// Days 0–3 (16–19 November 2026) were played before the bank was last changed. They must stay exactly as they were.
const GJETTELOS_SPILTE_DAGER = [
  ["historie:elizabeth", "rommet:nullpunkt", "sport:paris-ovelser", "verden:sprak", "kultur:sonetter"],
  ["historie:forste-verdenskrig", "norge:preikestolen", "teknologi:bitcoin-maks", "sport:monaco", "kultur:avatar"],
  ["verden:usa-flagg", "historie:fn", "rommet:iss-hoyde", "kultur:undset-nobel", "sport:curlingstein"],
  ["okonomi:gullbarre", "teknologi:e-avfall", "kropp:malaria", "norge:oslo-folketall", "verden:flukt"],
]
const GJETTELOS_SPILTE_SPORSMAL = [
  {"id":"historie:elizabeth","kategori":"historie","vansk":1,"tekst":"Hvor mange år var dronning Elizabeth 2. monark?","enhet":"år","fasit":70,"aarstall":false,"ca":false,"kilde":"Britannica","info":"Fra 1952 til 2022."},
  {"id":"rommet:nullpunkt","kategori":"rommet","vansk":2,"tekst":"Hvor mange minusgrader celsius er det absolutte nullpunktet?","enhet":"minusgrader","fasit":273.15,"aarstall":false,"ca":false,"kilde":"BIPM"},
  {"id":"sport:paris-ovelser","kategori":"sport","vansk":3,"tekst":"Hvor mange øvelser var det i sommer-OL i Paris 2024?","enhet":"øvelser","fasit":329,"aarstall":false,"ca":false,"kilde":"IOC"},
  {"id":"verden:sprak","kategori":"verden","vansk":3,"tekst":"Hvor mange levende språk finnes i verden?","enhet":"språk","fasit":7160,"aarstall":false,"ca":true,"per":"2024","kilde":"Ethnologue"},
  {"id":"kultur:sonetter","kategori":"kultur","vansk":3,"tekst":"Hvor mange sonetter skrev Shakespeare?","enhet":"sonetter","fasit":154,"aarstall":false,"ca":false,"kilde":"Britannica"},
  {"id":"historie:forste-verdenskrig","kategori":"historie","vansk":1,"tekst":"Hvilket år begynte første verdenskrig?","enhet":"årstall","fasit":1914,"aarstall":true,"ca":false,"kilde":"Britannica"},
  {"id":"norge:preikestolen","kategori":"norge","vansk":2,"tekst":"Hvor høyt over Lysefjorden ligger Preikestolen?","enhet":"meter","fasit":604,"aarstall":false,"ca":false,"kilde":"Store norske leksikon"},
  {"id":"teknologi:bitcoin-maks","kategori":"teknologi","vansk":2,"tekst":"Hvor mange bitcoin kan det finnes på det meste?","enhet":"bitcoin","fasit":21000000,"aarstall":false,"ca":false,"kilde":"Bitcoin-protokollen"},
  {"id":"sport:monaco","kategori":"sport","vansk":3,"tekst":"Hvor mange runder kjøres i Formel 1-løpet i Monaco?","enhet":"runder","fasit":78,"aarstall":false,"ca":false,"kilde":"Formula 1"},
  {"id":"kultur:avatar","kategori":"kultur","vansk":3,"tekst":"Hvor mye har «Avatar» (2009) spilt inn på kino, verdens mest innbringende film?","enhet":"dollar","fasit":2923000000,"aarstall":false,"ca":true,"per":"2025","kilde":"Box Office Mojo"},
  {"id":"verden:usa-flagg","kategori":"verden","vansk":1,"tekst":"Hvor mange stjerner er det i USAs flagg?","enhet":"stjerner","fasit":50,"aarstall":false,"ca":false,"kilde":"U.S. Government"},
  {"id":"historie:fn","kategori":"historie","vansk":2,"tekst":"Hvilket år ble FN grunnlagt?","enhet":"årstall","fasit":1945,"aarstall":true,"ca":false,"kilde":"FN"},
  {"id":"rommet:iss-hoyde","kategori":"rommet","vansk":2,"tekst":"Hvor høyt over bakken går Den internasjonale romstasjonen?","enhet":"km","fasit":400,"aarstall":false,"ca":true,"kilde":"NASA"},
  {"id":"kultur:undset-nobel","kategori":"kultur","vansk":3,"tekst":"Hvilket år fikk Sigrid Undset nobelprisen i litteratur?","enhet":"årstall","fasit":1928,"aarstall":true,"ca":false,"kilde":"Nobelprisen"},
  {"id":"sport:curlingstein","kategori":"sport","vansk":3,"tekst":"Hvor mye kan en curlingstein veie på det meste?","enhet":"kg","fasit":19.96,"aarstall":false,"ca":false,"kilde":"World Curling"},
  {"id":"okonomi:gullbarre","kategori":"okonomi","vansk":3,"tekst":"Hvor mye veier en standard gullbarre på verdensmarkedet (400 unser)?","enhet":"kg","fasit":12.4,"aarstall":false,"ca":true,"kilde":"London Bullion Market Association"},
  {"id":"teknologi:e-avfall","kategori":"teknologi","vansk":2,"tekst":"Hvor mange tonn elektronisk avfall ble kastet i verden i 2022?","enhet":"tonn","fasit":62000000,"aarstall":false,"ca":true,"per":"2022","kilde":"Global E-waste Monitor 2024 (FN)","info":"Bare 22 prosent ble dokumentert samlet inn og gjenvunnet."},
  {"id":"kropp:malaria","kategori":"kropp","vansk":3,"tekst":"Hvor mange mennesker døde av malaria i 2023?","enhet":"mennesker","fasit":597000,"aarstall":false,"ca":true,"per":"2023","kilde":"WHO, World Malaria Report 2024","info":"Det var 263 millioner tilfeller. Rundt 95 prosent av dødsfallene var i Afrika."},
  {"id":"norge:oslo-folketall","kategori":"norge","vansk":1,"tekst":"Hvor mange innbyggere har Oslo kommune?","enhet":"innbyggere","fasit":724290,"aarstall":false,"ca":false,"per":"1.1.2025","kilde":"SSB"},
  {"id":"verden:flukt","kategori":"verden","vansk":2,"tekst":"Hvor mange mennesker var på flukt fra hjemmene sine ved utgangen av 2024?","enhet":"mennesker","fasit":123200000,"aarstall":false,"ca":false,"per":"2024","kilde":"UNHCR","info":"Én av 67 mennesker på jorda."},
]

test("Gjetteløs: dagsplanen har fem kategorier, blandet rekkefølge og ingen gjentakelser", () => {
  const etterId = new Map(gjettelosSporsmal.map((s) => [s.id, s]))
  assert.ok(gjettelosPlan.length >= 80, `${gjettelosPlan.length} dager`)
  assert.deepEqual(gjettelosPlan.slice(0, GJETTELOS_SPILTE_DAGER.length), GJETTELOS_SPILTE_DAGER)
  for (const gammel of GJETTELOS_SPILTE_SPORSMAL) {
    const s = etterId.get(gammel.id)
    assert.ok(s, `${gammel.id} mangler`)
    // Every field the questions had then is unchanged; "stil" came with the rewrite.
    assert.deepEqual(Object.fromEntries(Object.keys(gammel).map((k) => [k, s[k as keyof typeof s]])), gammel, gammel.id)
    assert.deepEqual(Object.keys(s).filter((k) => !(k in gammel)), ["stil"], gammel.id)
  }
  const brukt = new Set<string>()
  let sortert = 0
  for (const [i, dag] of gjettelosPlan.entries()) {
    const hvor = `dag ${i}`
    assert.equal(dag.length, ANTALL, hvor)
    const sporsmal = dag.map((id) => {
      const s = etterId.get(id)
      assert.ok(s, `${hvor}: ukjent id ${id}`)
      assert.ok(!brukt.has(id), `${hvor}: ${id} er brukt før`)
      brukt.add(id)
      return s
    })
    assert.equal(new Set(sporsmal.map((s) => s.kategori)).size, ANTALL, `${hvor}: samme kategori to ganger`)
    assert.ok(sporsmal.filter((s) => s.aarstall).length <= 2, `${hvor}: for mange årstall`)
    if (i < 3) continue
    assert.ok(sporsmal.filter((s) => s.vansk === 3).length <= 3, `${hvor}: for mange vanskelige`)
    assert.ok(sporsmal.filter((s) => s.stil === "anslag").length >= 2, `${hvor}: for få anslag`)
    const vansk = sporsmal.map((s) => s.vansk)
    if (vansk.join() === [...vansk].sort().join()) sortert++
  }
  // The new days are not sorted from easy to hard any more (some will be by chance).
  assert.ok(sortert < (gjettelosPlan.length - 3) / 2, `${sortert} dager sortert lett til vanskelig`)
})

test("Gjetteløs: de tre første dagene beholder spørsmål og rekkefølge", () => {
  // Played before the order was mixed; saved answers are keyed by question number.
  const forventet = [
    ["historie:elizabeth", "rommet:nullpunkt", "sport:paris-ovelser", "verden:sprak", "kultur:sonetter"],
    ["historie:forste-verdenskrig", "norge:preikestolen", "teknologi:bitcoin-maks", "sport:monaco", "kultur:avatar"],
    ["verden:usa-flagg", "historie:fn", "rommet:iss-hoyde", "kultur:undset-nobel", "sport:curlingstein"],
  ]
  assert.deepEqual(FASTE_DAGER, forventet)
  for (const [i, ider] of forventet.entries()) {
    const dato = leggTilDager(GJETTELOS_START, i)
    assert.deepEqual(gjettelosFor(dato).map((s) => s.id), ider, dato)
  }
  assert.equal(leggTilDager(GJETTELOS_START, 2), "2026-11-18")
})

test("Gjetteløs: dagens spørsmål, repris og skjult fasit", () => {
  assert.equal(spill.find((s) => s.id === "gjettelos")?.start, GJETTELOS_START)
  assert.deepEqual(rutSpill("/spill/gjettelos", "2026-11-01", "2026-11-20"), { type: "redirect", sti: "/spill/gjettelos" })
  assert.deepEqual(rutSpill("/spill/gjettelos", null, GJETTELOS_START), { type: "rewrite", sti: `/spill/gjettelos/i-dag-${GJETTELOS_START}` })
  assert.equal(kanSpillesGjettelos(leggTilDager(GJETTELOS_START, -1), "2027-01-01"), false)
  assert.equal(kanSpillesGjettelos(GJETTELOS_START, "2027-01-01"), true)
  assert.equal(kanSpillesGjettelos("2027-01-02", "2027-01-01"), false)

  for (let i = 0; i < 140; i++) {
    const dato = leggTilDager(GJETTELOS_START, i)
    const dag = gjettelosDag(dato)
    assert.equal(dag.length, ANTALL)
    assert.deepEqual(gjettelosDag(dato), dag, "deterministisk")
    // The page never gets the answer or the source.
    for (const s of dag) assert.deepEqual(Object.keys(s).sort(), ["aarstall", "enhet", "kategori", "tekst"])
  }
  assert.equal(erGjettelosRepris(leggTilDager(GJETTELOS_START, gjettelosPlan.length - 1)), false)
  assert.equal(erGjettelosRepris(leggTilDager(GJETTELOS_START, gjettelosPlan.length)), true)
  // A replay follows the plan; only the first round of the first days is pinned.
  assert.deepEqual(
    gjettelosFor(leggTilDager(GJETTELOS_START, gjettelosPlan.length)).map((s) => s.id),
    gjettelosPlan[0],
  )

  const [forste] = gjettelosFor(GJETTELOS_START)
  const svar = vurderGjett(GJETTELOS_START, 0, forste.fasit * 2)
  assert.equal(svar.fasit, forste.fasit)
  assert.equal(svar.kilde, forste.kilde)
  assert.equal(svar.poeng, poengFor(forste.fasit * 2, forste.fasit, forste.aarstall))
  assert.equal(vurderGjett(GJETTELOS_START, 0, forste.fasit).poeng, 100)
})

// 6/7-stegern: duel

test("6/7-stegern duell: romkoder", () => {
  let n = 0
  const tall = () => n++ * 7
  const kode = lagKode(tall)
  assert.equal(kode.length, KODE_LENGDE)
  assert.ok(erGyldigKode(kode), kode)
  for (let i = 0; i < 200; i++) assert.ok(erGyldigKode(lagKode()))
  assert.equal(erGyldigKode("BCDF"), true)
  // Vowels, digits and the wrong length are never codes; lower case is fixed by normaliserKode first.
  for (const feil of ["ABCD", "BCD", "BCDFG", "BC1F", "bcdf", "", "BCÆF"]) assert.equal(erGyldigKode(feil), false, feil)
  assert.equal(normaliserKode(" bcdf "), "BCDF")
  assert.equal(rensNavn("  Kari \n  Nordmann med et langt navn "), "Kari Nordmann")
  assert.equal(rensNavn("Ærlige Åse Ø"), "Ærlige Åse Ø")
})

test("6/7-stegern duell: verten er den som har vært lengst i rommet", () => {
  const a = { id: "a", inn: 300 }
  const b = { id: "b", inn: 100 }
  const c = { id: "c", inn: 100 }
  assert.equal(vertAv([a, b, c])?.id, "b")
  assert.equal(vertAv([a, c])?.id, "c")
  assert.equal(vertAv([a])?.id, "a")
  assert.equal(vertAv([]), null)
  // When the host leaves, the next in line takes over, and every client agrees on who that is.
  assert.equal(vertAv([c, a])?.id, vertAv([a, c])?.id)
  const tilstede = [
    { id: "x", navn: "", inn: 5, klar: true, runde: 0, figur: { kropp: 3, hode: 2, oyne: 1, ekstra: 0 } },
    ...Array.from({ length: 7 }, (_, i) => ({ id: `s${i}`, navn: `S${i}`, inn: 10 + i, klar: true, runde: 0, figur: STANDARD_FIGUR })),
  ]
  const deltakere = velgDeltakere(tilstede)
  assert.equal(deltakere.length, MAKS_SPILLERE)
  assert.deepEqual(deltakere.map((d) => d.farge), [0, 1, 2, 3, 4, 5])
  assert.equal(deltakere[0].navn, "Spiller 1")
  assert.deepEqual(deltakere[0].figur, { kropp: 3, hode: 2, oyne: 1, ekstra: 0 }, "figuren følger med inn i runden")
  assert.ok(!deltakere.some((d) => d.id === "s6"), "den sjuende venter til neste runde")
})

test("6/7-stegern duell: duellbanken og tidligere dager, aldri dagens eller kommende", () => {
  const iDag = "2026-11-17"
  const tidligere = duellDager(iDag)
  assert.equal(tidligere.length, 15)
  assert.ok(tidligere.every((d) => d >= STEGERN_START && d < iDag))
  const pulje = duellPulje(iDag)
  assert.equal(pulje.length, stegernDuellBank.length + tidligere.length * NORMALE)
  const tekstFor = (q: { dato: string; nr: number }) => (q.dato === BANK ? stegernDuellBank[q.nr].tekst : dagFor(q.dato).sporsmal[q.nr].tekst)
  const runder = Math.floor(pulje.length / NORMALE)
  const alle = Array.from({ length: runder }, (_, r) => duellSporsmal("BCDF", r, iDag)).flat()
  for (const q of alle) {
    // The text is the one the server judges, and a daily prompt is always from an earlier day.
    assert.equal(q.tekst, tekstFor(q))
    if (q.dato !== BANK) assert.ok(q.dato < iDag && q.dato >= STEGERN_START && kanSpillesStegern(q.dato, iDag), q.dato)
    assert.ok(erDuellSporsmal(q.dato, q.nr, iDag))
  }
  // A room sees every prompt once before any comes back; the same room and round always get the same prompts.
  assert.equal(new Set(alle.map((q) => `${q.dato}:${q.nr}`)).size, alle.length)
  assert.ok(alle.some((q) => q.dato === BANK) && alle.some((q) => q.dato !== BANK))
  assert.deepEqual(duellSporsmal("BCDF", 3, iDag), alle.slice(3 * NORMALE, 4 * NORMALE))
  assert.notDeepEqual(duellSporsmal("ZXWV", 0, iDag), duellSporsmal("BCDF", 0, iDag))
  // Never today's or a future day's prompts; on the first day only the bank.
  for (const dag of [STEGERN_START, leggTilDager(STEGERN_START, 1), leggTilDager(STEGERN_START, 3), leggTilDager(STEGERN_START, stegernDager.length + 2)]) {
    for (let r = 0; r < 40; r++) assert.ok(duellSporsmal("BCDF", r, dag).every((q) => q.dato === BANK || q.dato < dag), dag)
  }
  assert.ok(duellSporsmal("BCDF", 0, STEGERN_START).every((q) => q.dato === BANK))
  assert.equal(erDuellSporsmal(BANK, stegernDuellBank.length, iDag), false)
  assert.equal(erDuellSporsmal(BANK, 0, iDag), true)
  // Startpistolen asks for more prompts at once.
  assert.equal(duellSporsmal("BCDF", 0, iDag, 30).length, 30)
  const etterRunde = leggTilDager(STEGERN_START, stegernDager.length + 5)
  const sperret = new Set(Array.from({ length: DUELL_SPERRE_DAGER + 1 }, (_, k) => dagFor(leggTilDager(etterRunde, k))))
  const brukt = duellDager(etterRunde)
  assert.ok(brukt.every((d) => d < etterRunde && !sperret.has(dagFor(d))))
  assert.equal(new Set(brukt.map(dagFor)).size, brukt.length)
  assert.equal(brukt.length, stegernDager.length - DUELL_SPERRE_DAGER - 1)
})

const tilBytes = (b64: string) => Uint8Array.from(Buffer.from(b64, "base64url"))

test("Duell: figurer leses forsiktig, blas rundt og lagres som tall", () => {
  assert.deepEqual(lesFigur({ kropp: 7, hode: 5, oyne: 3, ekstra: 3 }), { kropp: 7, hode: 5, oyne: 3, ekstra: 3 })
  for (const feil of [null, {}, { kropp: 8, hode: 0, oyne: 0, ekstra: 0 }, { kropp: 0, hode: -1, oyne: 0, ekstra: 0 }, { kropp: 0.5, hode: 0, oyne: 0, ekstra: 0 }]) {
    assert.equal(lesFigur(feil), null, JSON.stringify(feil))
  }
  assert.equal(blaFigur(STANDARD_FIGUR, "kropp", -1).kropp, 7)
  assert.equal(blaFigur({ ...STANDARD_FIGUR, hode: 5 }, "hode", 1).hode, 0)
  let n = 0
  for (let k = 0; k < 50; k++) assert.ok(lesFigur(tilfeldigFigur(() => (n = (n + 0.137) % 1))))
  assert.ok(lesFigur(tilfeldigFigur(() => 0.9999999)))
  // A client from before figures plays as the classic Stegern.
  assert.deepEqual(lesTilstede({ id: "a", navn: "Åse", inn: 1, klar: false, runde: 0 })?.figur, STANDARD_FIGUR)
  assert.deepEqual(lesTilstede({ id: "a", navn: "Åse", inn: 1, klar: false, runde: 0, figur: { kropp: 2, hode: 3, oyne: 0, ekstra: 1 } })?.figur, { kropp: 2, hode: 3, oyne: 0, ekstra: 1 })
})

test("Duell: dommer signeres med Ed25519 og kan sjekkes i nettleseren med den offentlige nøkkelen", async () => {
  const dom = signer({ s: "stegern", k: "BCDF", n: 5 })
  assert.equal(erSignert(dom), true)
  // The browser's check: WebCrypto with the raw public key.
  const nokkel = await crypto.subtle.importKey("raw", tilBytes(offentligNokkel()), { name: "Ed25519" }, false, ["verify"])
  assert.equal(await crypto.subtle.verify("Ed25519", nokkel, tilBytes(dom.s), new TextEncoder().encode(dom.j)), true)
  // A tier changed by hand, or a signature moved to another verdict, fails.
  const juks = { ...dom, j: dom.j.replace('"n":5', '"n":4') }
  assert.equal(erSignert(juks), false)
  assert.equal(await crypto.subtle.verify("Ed25519", nokkel, tilBytes(juks.s), new TextEncoder().encode(juks.j)), false)
  assert.equal(erSignert({ j: dom.j, s: "AAAA" }), false)
})

test("Duell: et svar teller bare innenfor spørsmålets tidsvindu, i servertid", () => {
  const frist = 1_000_000
  assert.equal(iTide(frist, frist, SVAR_MS), true)
  assert.equal(iTide(frist + SLINGRING_MS, frist, SVAR_MS), true, "litt slingring for klokker og nett")
  assert.equal(iTide(frist + SLINGRING_MS + 1, frist, SVAR_MS), false, "for sent")
  assert.equal(iTide(frist - SVAR_MS - SLINGRING_MS - 1, frist, SVAR_MS), false, "fra før spørsmålet åpnet")
  assert.equal(iTide(frist - SVAR_MS / 2, frist, SVAR_MS), true)
  assert.equal(iTide(frist, 0, SVAR_MS), false, "et spørsmål som ikke har åpnet")
  assert.equal(iTide(frist, undefined, SVAR_MS), false)
  assert.deepEqual(plasser([9, 7, 7, 3], (x) => x), [1, 2, 2, 4])
})

test("6/7-stegern duell: bare serverens signerte dom teller, for riktig rom, spørsmål, spiller og tid", () => {
  const iDag = "2026-11-17"
  const sporsmal = duellSporsmal("BCDF", 0, iDag)
  const deltakere = [
    { id: "a", navn: "A", farge: 0, figur: STANDARD_FIGUR },
    { id: "b", navn: "B", farge: 1, figur: STANDARD_FIGUR },
  ]
  const apnet = 5_000_000
  const s: Status = { ...startStatus(), fase: "sporsmal", nr: 0, sporsmal, deltakere, frister: [apnet + SVAR_MS], svar: {} }
  const q = sporsmal[0]
  assert.ok(erDuellSporsmal(q.dato, q.nr, iDag))
  assert.equal(erDuellSporsmal(iDag, 0, iDag), false, "aldri dagens spørsmål")
  const svar = (id: string, tekst: string, na: number, i = 0) =>
    stegernDuellDom({ kode: "BCDF", runde: 0, i, dato: sporsmal[i].dato, nr: sporsmal[i].nr, id, svar: tekst }, na).dom
  const aDom = svar("a", "x", apnet + 4000)
  const data = apne(aDom)
  assert.ok(data)
  assert.equal(data.id, "a")
  assert.deepEqual(godkjennDom(data, "BCDF", s, "a", 0), { t: "x", n: data.n, treff: data.tr, ts: apnet + 4000 })
  // Someone else's verdict, another room or round, too late or from before the question: none of them count.
  assert.equal(godkjennDom(data, "BCDF", s, "b", 0), null)
  assert.equal(godkjennDom(data, "ZXWV", s, "a", 0), null)
  assert.equal(godkjennDom(data, "BCDF", { ...s, runde: 1 }, "a", 0), null)
  assert.equal(godkjennDom(apne(svar("a", "x", apnet + SVAR_MS + SLINGRING_MS + 50)), "BCDF", s, "a", 0), null)
  assert.equal(godkjennDom(apne(svar("a", "x", apnet - 10_000)), "BCDF", s, "a", 0), null)
  // A cheater's own "Unikum": a verdict they wrote without the server, or one whose tier was changed.
  const falsk = { j: JSON.stringify({ ...data, id: "b", n: 5, tr: "Unikum" }), s: aDom.s }
  const endret = { j: aDom.j.replace(/"n":\d/, '"n":5'), s: aDom.s }
  const status: Status = { ...s, svar: { a: { 0: aDom }, b: { 0: falsk } } }
  const godkjent = godkjenteSvar("BCDF", status, erSignert)
  assert.ok(godkjent.a[0])
  assert.equal(godkjent.b[0], undefined)
  if (aDom.j !== endret.j) assert.equal(godkjenteSvar("BCDF", { ...s, svar: { a: { 0: endret } } }, erSignert).a[0], undefined)
  assert.equal(alleHarSvart(status, godkjent, new Set(["a", "b"])), false, "den falske dommen gjør ikke at alle har svart")
  assert.equal(alleHarSvart(status, godkjent, new Set(["a"])), true)
})

test("6/7-stegern duell: status flettes, og pallen rangerer på lengste sum", () => {
  const svar = (n: 0 | 1 | 2 | 3 | 4 | 5) => ({ n })
  const deltakere = ["a", "b", "c", "d"].map((id, i) => ({ id, navn: id.toUpperCase(), farge: i, figur: STANDARD_FIGUR }))
  const alle = {
    a: { 0: svar(3), 1: svar(3), 2: svar(3), 3: svar(3), 4: svar(3) },
    b: { 0: svar(5), 1: svar(1), 2: svar(3), 3: svar(4), 4: svar(2) },
    c: { 0: svar(4), 1: svar(4), 2: svar(4), 3: svar(4), 4: svar(4) },
    // d never answered: five misses.
  }
  assert.equal(duellSum(alle.a), 5 * hoppDm(3))
  assert.equal(duellSum(undefined), 5 * hoppDm(0))
  assert.equal(duellSum(alle.c, 2), 2 * hoppDm(4))
  const r = rangering(deltakere, alle)
  // a and b tie on the sum: b's longer single jump puts b first, but they share second place.
  assert.equal(duellSum(alle.a), duellSum(alle.b))
  assert.deepEqual(r.map((p) => [p.id, p.plass]), [["c", 1], ["b", 2], ["a", 2], ["d", 4]])
  assert.equal(r[0].dm, 5 * hoppDm(4))
  assert.equal(r[3].dm, 5 * hoppDm(0))

  const dom = (s: string) => ({ j: "{}", s })
  const lokal: Status = { ...startStatus(), v: 3, fase: "sporsmal", deltakere: deltakere.slice(0, 2), svar: { a: { 0: dom("a0") } } }
  const ny: Status = { ...lokal, v: 4, svar: { b: { 0: dom("b0") } } }
  const flettet = taImot(lokal, ny)
  assert.equal(flettet.v, 4)
  assert.deepEqual(Object.keys(flettet.svar).sort(), ["a", "b"])
  // An older message only adds answers.
  const gammel = taImot(ny, { ...lokal, v: 2 })
  assert.equal(gammel.v, 4)
  assert.ok(gammel.svar.a?.[0] && gammel.svar.b?.[0])
  // A new round starts clean.
  assert.deepEqual(taImot(ny, { ...startStatus(1) }).svar, {})
  assert.equal(erNyere({ runde: 1, v: 0 }, { runde: 0, v: 99 }), true)
})

test("6/7-stegern duell: meldinger fra andre leses forsiktig", () => {
  const dom = { j: '{"s":"stegern"}', s: "abc" }
  const gyldig = { ...startStatus(), fase: "lobby", deltakere: [{ id: "a", navn: "A", farge: 0 }], svar: { a: { 0: dom, 1: { t: 1 } } } }
  const lest = lesStatus(gyldig)
  assert.ok(lest)
  assert.deepEqual(Object.keys(lest.svar.a ?? {}), ["0"])
  assert.deepEqual(lest.deltakere[0].figur, STANDARD_FIGUR)
  assert.equal(lesStatus({ ...gyldig, fase: "juks" }), null)
  assert.equal(lesStatus({ ...gyldig, fase: "sporsmal" }), null, "en runde trenger fem spørsmål")
  assert.equal(lesStatus({ ...gyldig, deltakere: [{ id: "a", navn: "A", farge: 9 }] }), null)
  assert.equal(lesStatus({ ...gyldig, frister: [-1] }), null)
  assert.equal(lesStatus(null), null)
  assert.deepEqual(lesTilstede({ id: "a", navn: "Åse", inn: 1, klar: false, runde: 0 }), { id: "a", navn: "Åse", inn: 1, klar: false, runde: 0, figur: STANDARD_FIGUR })
  assert.equal(lesTilstede({ id: "", navn: "Åse", inn: 1, klar: false, runde: 0 }), null)
})

// Gjetteløs: duel

test("Gjetteløs duell: spørsmål bare fra tidligere dager, aldri dagens eller de neste to ukenes", () => {
  const datoer = ["2026-11-17", "2026-11-20", "2026-12-24", leggTilDager(GJETTELOS_START, gjettelosPlan.length + 3), leggTilDager(GJETTELOS_START, 2 * gjettelosPlan.length - 5)]
  for (const iDag of datoer) {
    const pulje = gjettelosDuellPulje(iDag)
    const sperret = new Set(Array.from({ length: GJ_DUELL_SPERRE_DAGER + 1 }, (_, k) => gjettelosFor(leggTilDager(iDag, k)).map((s) => s.id)).flat())
    assert.ok(pulje.length > 0, iDag)
    const dager = pulje.filter((p) => p.dato !== GJ_BANK)
    assert.equal(pulje.length - dager.length, gjettelosDuellBank.length, `${iDag}: hele duellbanken`)
    const ider = dager.map((p) => gjettelosFor(p.dato)[p.nr].id)
    assert.equal(new Set(ider).size, ider.length, `${iDag}: hvert spørsmål én gang`)
    for (const p of dager) {
      assert.ok(p.dato < iDag && p.dato >= GJETTELOS_START, `${iDag}: ${p.dato}`)
      assert.ok(!sperret.has(gjettelosFor(p.dato)[p.nr].id), `${iDag}: ${p.dato} #${p.nr} kommer snart igjen`)
    }
    const runde = gjettelosDuellSporsmal("BCDF", 0, iDag)
    assert.equal(runde.length, Math.min(ANTALL, pulje.length))
    assert.equal(new Set(runde.map((q) => `${q.dato}:${q.nr}`)).size, runde.length, "aldri samme spørsmål to ganger i en runde")
    for (const q of runde) {
      assert.ok(erGjettelosDuellSporsmal(q.dato, q.nr, iDag))
      // The page never gets the answer before a guess.
      assert.deepEqual(Object.keys(q).sort(), ["aarstall", "dato", "enhet", "kategori", "nr", "tekst"])
    }
  }
  assert.ok(gjettelosDuellPulje(GJETTELOS_START).every((p) => p.dato === GJ_BANK), "første dag: bare duellbanken")
  assert.equal(gjettelosDuellSporsmal("BCDF", 0, GJETTELOS_START).length, ANTALL)
  assert.ok(erGjettelosDuellSporsmal(GJ_BANK, gjettelosDuellBank.length - 1, "2026-11-17"))
  assert.equal(erGjettelosDuellSporsmal(GJ_BANK, gjettelosDuellBank.length, "2026-11-17"), false)
  assert.equal(erGjettelosDuellSporsmal("2026-11-17", 0, "2026-11-17"), false, "aldri dagens")
  // Today (17 November) only the first day has been played.
  assert.deepEqual(gjettelosDuellPulje("2026-11-17").filter((p) => p.dato !== GJ_BANK).map((p) => p.dato), Array(5).fill(GJETTELOS_START))
  // A room sees (nearly) every question once before any comes back, and a round is the same for everyone.
  const iDag = "2026-12-24"
  const runder = Math.floor(gjettelosDuellPulje(iDag).length / ANTALL)
  const sett = new Set(Array.from({ length: runder }, (_, r) => gjettelosDuellSporsmal("BCDF", r, iDag).map((q) => `${q.dato}:${q.nr}`)).flat())
  assert.ok(sett.size >= (runder - 1) * ANTALL, `${sett.size} av ${runder * ANTALL}`)
  assert.deepEqual(gjettelosDuellSporsmal("BCDF", 2, iDag), gjettelosDuellSporsmal("BCDF", 2, iDag))
})

test("Gjetteløs duell: stempel og fasit signeres, og poengene regnes som i dagens spill", () => {
  const iDag = "2026-12-24"
  const sporsmal = gjettelosDuellSporsmal("BCDF", 0, iDag)
  const deltakere = ["a", "b", "c"].map((id, i) => ({ id, navn: id.toUpperCase(), farge: i, figur: STANDARD_FIGUR }))
  const apnet = 9_000_000
  const s: GjStatus = { ...gjStart(), fase: "sporsmal", sporsmal, deltakere, frister: [apnet + GJ_SVAR_MS] }
  const q = sporsmal[0]
  const ref = { kode: "BCDF", runde: 0, i: 0, dato: q.dato, nr: q.nr }
  const fasit = gjettelosFor(q.dato)[q.nr].fasit
  const aGjett = gjettelosDuellStempel({ ...ref, id: "a", gjett: fasit * 2 }, apnet + 1000)
  const bGjett = gjettelosDuellStempel({ ...ref, id: "b", gjett: fasit }, apnet + 2000)
  // The stamp tells nothing about the answer.
  assert.deepEqual(Object.keys(apne(aGjett)!).sort(), ["d", "g", "i", "id", "k", "nr", "r", "s", "ts"])
  const sent = gjettelosDuellStempel({ ...ref, id: "c", gjett: fasit }, apnet + GJ_SVAR_MS + SLINGRING_MS + 1)
  assert.equal(godkjennGjett(apne(sent), "BCDF", s, "c", 0), null, "for sent")
  assert.equal(godkjennGjett(apne(aGjett), "BCDF", s, "b", 0), null, "en annens stempel")
  const f = gjettelosDuellFasit(ref)
  const fa = godkjennFasit(apne(f), "BCDF", s, 0)
  assert.ok(fa)
  assert.equal(fa.fasit, fasit)
  assert.equal(godkjennFasit(apne(f), "BCDF", s, 1), null)
  assert.equal(godkjennFasit(apne(aGjett), "BCDF", s, 0), null, "et stempel er ikke en fasit")
  // A forged answer (made to suit a guess) has no valid signature.
  const falskFasit = { j: f.j.replace(/"f":[^,]+/, `"f":${fasit * 2}`), s: f.s }
  const status: GjStatus = { ...s, fase: "visning", svar: { a: { 0: aGjett }, b: { 0: bGjett }, c: { 0: sent } }, fasiter: { 0: falskFasit } }
  assert.equal(gjGodkjente("BCDF", status, erSignert).fasiter[0], undefined)
  const { gjett, fasiter } = gjGodkjente("BCDF", { ...status, fasiter: { 0: f } }, erSignert)
  assert.equal(gjett.c[0], undefined)
  assert.equal(gjPoeng(gjett.a[0], fasiter[0]), poengFor(fasit * 2, fasit, q.aarstall))
  assert.equal(gjPoeng(gjett.b[0], fasiter[0]), 100)
  assert.equal(gjPoeng(gjett.c[0], fasiter[0]), 0, "ikke noe svar i tide gir null")
  assert.equal(gjPoeng(gjett.a[0], undefined), null, "ingen poeng før fasit")
  const r = gjRangering(deltakere, gjett, fasiter, 1)
  assert.deepEqual(r.map((p) => [p.id, p.plass]), [["b", 1], ["a", 2], ["c", 3]])
  assert.equal(r[0].poeng, 100)
  assert.equal(gjAlleHarSvart(s, gjett, new Set(["a", "b", "c"])), false)
  assert.equal(gjAlleHarSvart(s, gjett, new Set(["a", "b"])), true)
  // Equal sums share a place.
  const likt = gjRangering(deltakere, { a: { 0: { g: fasit, ts: 0 } }, b: { 0: { g: fasit, ts: 0 } } }, fasiter, 1)
  assert.deepEqual(likt.map((p) => p.plass), [1, 1, 3])
})

test("Gjetteløs duell: status flettes og leses forsiktig, og duellen rører ikke dagens lagring", () => {
  const dom = { j: "{}", s: "x" }
  const deltakere = [{ id: "a", navn: "A", farge: 0, figur: STANDARD_FIGUR }]
  const lokal: GjStatus = { ...gjStart(), v: 2, deltakere, svar: { a: { 0: dom } } }
  const ny: GjStatus = { ...lokal, v: 3, svar: {}, fasiter: { 0: dom } }
  const flettet = gjTaImot(lokal, ny)
  assert.equal(flettet.v, 3)
  assert.ok(flettet.svar.a?.[0] && flettet.fasiter[0])
  assert.ok(lesGjStatus(flettet))
  assert.equal(lesGjStatus({ ...flettet, fase: "sporsmal" }), null, "en runde trenger spørsmål")
  assert.equal(lesGjStatus({ ...flettet, fasiter: { 0: { j: 1 } } })?.fasiter[0], undefined)
  assert.equal(lesGjStatus(null), null)
  const kilde = readFileSync("features/spill/components/gjettelos-duell.tsx", "utf8")
  assert.ok(!/useDagligTilstand|useResultater|lagreResultat/.test(kilde), "duellen bruker ikke dagens lagring")
})

// 6/7-stegern: Startpistolen

const pistolDeltakere = ["a", "b", "c", "d"].map((id, i) => ({ id, navn: id.toUpperCase(), farge: i, figur: STANDARD_FIGUR }))
const alleInne = new Set(["a", "b", "c", "d"])
const pistolSporsmal = duellSporsmal("BCDF", 0, "2026-11-17", 20).map(({ dato, nr, tekst }) => ({ dato, nr, tekst }))
const startPistol = (innst: Partial<PistolInnstillinger> = {}): Pistol => ({
  ...nyPistol(pistolDeltakere, rensInnstillinger(innst), pistolSporsmal, 100_000, () => 0),
  holder: "a",
})
/** A signed answer by the holder to the current prompt, judged at `na`. */
const pistolDom = (p: Pistol, svar: string, na: number, id = p.holder) => {
  const q = gjeldende(p)
  return stegernDuellDom({ kode: "BCDF", runde: 0, i: p.sp, dato: q.dato, nr: q.nr, id, svar }, na).dom
}

test("Startpistolen: innstillinger holdes innenfor grensene", () => {
  assert.deepEqual(rensInnstillinger({}), STANDARD_INNSTILLINGER)
  assert.equal(STANDARD_INNSTILLINGER.livMeter, 30)
  assert.equal(rensInnstillinger({ liv: 9 }).liv, MAKS_LIV)
  assert.equal(rensInnstillinger({ liv: 0 }).liv, 1)
  const smal = rensInnstillinger({ lunteMin: 30, lunteMaks: 10 })
  assert.ok(smal.lunteMaks > smal.lunteMin, "lengste lunte er alltid lengre enn korteste")
  assert.equal(rensInnstillinger({ livMeter: 1 }).livMeter, 10)
  const p = startPistol({ lunteMin: 10, lunteMaks: 30 })
  assert.equal(p.lunte, 100_000 + SMELL_PAUSE_MS + 10_000)
  assert.equal(trekkLunte(p.innst, () => 0.5), 20_000)
  assert.ok(p.spillere.every((s) => s.liv === 2 && s.bar === 0))
})

test("Startpistolen: lunta brenner videre, men settes til 8 s når det er mindre igjen", () => {
  assert.equal(lunteEtterPass(50_000, 10_000), 50_000, "mye igjen: lunta brenner videre")
  assert.equal(lunteEtterPass(15_000, 10_000), 10_000 + MIN_LUNTE_MS, "5 s igjen blir 8 s")
  assert.equal(MIN_LUNTE_MS, 8000)
  const p = { ...startPistol(), lunte: 103_000 }
  const svar = { id: "a", tr: "Pizza", n: 2 as const, dom: { j: "{}", s: "x" } }
  const etter = pass(p, svar, 100_000, alleInne)
  assert.equal(etter.lunte, 108_000)
  assert.equal(etter.holder, "b")
  assert.equal(etter.tur, 100_000)
})

test("Startpistolen: livsmåleren fylles med hopplengden, flyter over og stopper ved tre liv", () => {
  const maks = 300
  assert.equal(hoppDm(1), 30)
  assert.equal(hoppDm(5), 90)
  const s = { id: "a", liv: 2, bar: 0 }
  let r = fyllBar(s, hoppDm(5), maks)
  assert.deepEqual(r, { spiller: { id: "a", liv: 2, bar: 90 }, nyttLiv: false })
  r = fyllBar({ ...s, bar: 270 }, hoppDm(4), maks)
  assert.deepEqual(r, { spiller: { id: "a", liv: 3, bar: 45 }, nyttLiv: true }, "75 dm: 30 fyller måleren, 45 går videre")
  r = fyllBar({ ...s, liv: 3, bar: 270 }, hoppDm(5), maks)
  assert.deepEqual(r, { spiller: { id: "a", liv: 3, bar: 300 }, nyttLiv: false }, "ved tre liv står måleren full")
  r = fyllBar({ ...s, liv: 1, bar: 0 }, 650, maks)
  assert.deepEqual(r, { spiller: { id: "a", liv: 3, bar: 50 }, nyttLiv: true })
  // Through a pass: the heart and the "+1" flash.
  const p = { ...startPistol(), spillere: [{ id: "a", liv: 2, bar: 280 }, ...startPistol().spillere.slice(1)] }
  const etter = pass(p, { id: "a", tr: "Ossobuco", n: 3, dom: { j: "{}", s: "x" } }, 100_500, alleInne)
  assert.deepEqual(etter.spillere[0], { id: "a", liv: 3, bar: 40 })
  assert.deepEqual(etter.pluss, { id: "a", ts: 100_500 })
  assert.equal(barMaks(rensInnstillinger({ livMeter: 45 })), 450)
})

test("Startpistolen: turen hopper over dem som er ute eller borte", () => {
  const p = startPistol()
  const ute = { ...p, spillere: p.spillere.map((s) => (s.id === "b" ? { ...s, liv: 0 } : s)) }
  assert.equal(nesteHolder(ute, "a", alleInne), "c")
  assert.equal(nesteHolder(ute, "a", new Set(["a", "b", "d"])), "d", "c er borte")
  assert.equal(nesteHolder(ute, "d", alleInne), "a", "rundt bordet")
  assert.equal(nesteHolder(ute, "a", new Set(["a"])), "a", "ingen andre kan ta den")
  const borte = hoppOver({ ...ute, holder: "c", lunte: 101_000 }, 100_000, new Set(["a", "d"]))
  assert.equal(borte.holder, "d")
  assert.equal(borte.lunte, 108_000)
  assert.ok(borte.spillere.every((s, i) => s.liv === ute.spillere[i].liv), "ingen mister liv når noen går")
})

test("Startpistolen: smellet tar et liv, ny kategori og lunte, og sist på beina vinner", () => {
  let p: Pistol = { ...startPistol({ liv: 1 }), holder: "b" }
  const tall = () => 0.5
  p = smell(p, 200_000, alleInne, tall)
  assert.deepEqual(p.ute, ["b"])
  assert.equal(p.holder, "c")
  assert.equal(p.sp, 1, "ny kategori etter smellet")
  assert.deepEqual(p.smell, { id: "b", ts: 200_000, ute: true })
  assert.equal(p.lunte, 200_000 + SMELL_PAUSE_MS + trekkLunte(p.innst, tall))
  p = smell(p, 220_000, alleInne, tall)
  assert.deepEqual(p.ute, ["b", "c"])
  assert.equal(p.holder, "d")
  assert.equal(p.vinner, null)
  p = smell({ ...p, holder: "a" }, 240_000, alleInne, tall)
  assert.deepEqual(p.ute, ["b", "c", "a"])
  assert.equal(p.vinner, "d")
  assert.deepEqual(pistolPlassering(p), [
    { id: "d", plass: 1 },
    { id: "a", plass: 2 },
    { id: "c", plass: 3 },
    { id: "b", plass: 4 },
  ])
  // With two hearts, a bang costs one and the player stays in.
  const to = smell({ ...startPistol({ liv: 2 }), holder: "a" }, 300_000, alleInne, tall)
  assert.equal(to.spillere[0].liv, 1)
  assert.deepEqual(to.ute, [])
  assert.equal(to.holder, "b")
})

test("Startpistolen: bare holderens signerte, gyldige og nye svar sender pistolen videre", () => {
  const p = { ...startPistol(), tur: 100_000, lunte: 120_000 }
  assert.equal(gjeldende(p).tekst, pistolSporsmal[0].tekst)
  const q = gjeldende(p)
  // An accepted answer to the first prompt (the most common one, which even a miss is shown), and a wrong one.
  const gyldig = stegernDuellDom({ kode: "BCDF", runde: 0, i: 0, dato: q.dato, nr: q.nr, id: "a", svar: "qqqzzz" }).vurdering.vanligste[0]
  assert.ok(gyldig, q.tekst)
  const ok = vurderPistolsvar(apne(pistolDom(p, gyldig, 105_000)), "BCDF", 0, p)
  assert.ok(ok.ok)
  assert.equal(vurderPistolsvar(apne(pistolDom(p, "qqqzzz", 105_000)), "BCDF", 0, p).ok, false)
  assert.deepEqual(vurderPistolsvar(apne(pistolDom(p, "qqqzzz", 105_000)), "BCDF", 0, p), { ok: false, grunn: "bom" })
  assert.deepEqual(vurderPistolsvar(apne(pistolDom(p, gyldig, 105_000, "b")), "BCDF", 0, p), { ok: false, grunn: "feil-holder" })
  assert.deepEqual(vurderPistolsvar(apne(pistolDom(p, gyldig, 125_000)), "BCDF", 0, p), { ok: false, grunn: "for-sent" })
  assert.deepEqual(vurderPistolsvar(apne(pistolDom(p, gyldig, 90_000)), "BCDF", 0, p), { ok: false, grunn: "for-sent" }, "dømt før turen")
  assert.deepEqual(vurderPistolsvar(apne(pistolDom(p, gyldig, 105_000)), "ZXWV", 0, p), { ok: false, grunn: "ikke-signert" })
  assert.deepEqual(vurderPistolsvar(apne(pistolDom({ ...p, sp: 1 }, gyldig, 105_000)), "BCDF", 0, p), { ok: false, grunn: "feil-sporsmal" })
  if (!ok.ok) return
  // Said once, the same answer (in any of its forms) is taken.
  const etter = pass(p, { ...ok.svar, dom: pistolDom(p, gyldig, 105_000) }, 105_000, alleInne)
  const igjen = { ...etter, holder: "a", tur: 105_000 }
  assert.deepEqual(vurderPistolsvar(apne(pistolDom(igjen, gyldig.toUpperCase(), 106_000)), "BCDF", 0, igjen), { ok: false, grunn: "allerede-sagt" })
  // After SVAR_PER_SPORSMAL answers the prompt changes.
  let full = p
  for (let k = 0; k < SVAR_PER_SPORSMAL; k++) full = pass({ ...full, holder: "a" }, { id: "a", tr: `svar${k}`, n: 1, dom: { j: "{}", s: "x" } }, 101_000 + k, alleInne)
  assert.equal(full.sp, 1)
  assert.deepEqual(full.svar, [])
})

test("Startpistolen: tilstanden leses forsiktig fra nettet", () => {
  const p = startPistol()
  const s: Status = { ...startStatus(), fase: "pistol", modus: "pistol", deltakere: pistolDeltakere, pistol: p }
  const lest = lesStatus(JSON.parse(JSON.stringify(s)))
  assert.ok(lest?.pistol)
  assert.equal(lest.pistol.holder, "a")
  assert.equal(lest.modus, "pistol")
  // After the winner, the fuse is Infinity, which JSON sends as null.
  const ferdig = lesStatus(JSON.parse(JSON.stringify({ ...s, fase: "slutt", pistol: { ...p, lunte: Infinity, vinner: "a" } })))
  assert.equal(ferdig?.pistol?.lunte, Infinity)
  assert.equal(lesStatus({ ...s, pistol: { ...p, holder: "zz" } }), null, "en holder som ikke er med")
  assert.equal(lesStatus({ ...s, pistol: { ...p, spillere: [{ id: "a", liv: 9, bar: 0 }] } }), null)
  assert.equal(lesStatus({ ...s, pistol: null }), null, "pistolfasen trenger en pistol")
  assert.equal(lesStatus({ ...s, fase: "lobby", pistol: null })?.modus, "pistol")
})
