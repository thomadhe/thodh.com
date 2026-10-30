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
