import assert from "node:assert/strict"
import { test } from "node:test"
import { gjettelosSporsmal } from "../features/spill/data/gjettelos"
import { gjettelosDuellBank } from "../features/spill/data/gjettelos-duell"
import { AARSTALL_REFERANSE, erKjentKategori, poengFor } from "../features/spill/lib/gjettelos"

/** Lower case, letters and digits only, so that punctuation and spacing cannot hide a repeat. */
const normaliser = (tekst: string) => tekst.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()

test("Gjetteløs-duell: banken har minst 200 spørsmål", () => {
  assert.ok(gjettelosDuellBank.length >= 200, `${gjettelosDuellBank.length} spørsmål`)
})

test("Gjetteløs-duell: id-ene er unike, har d-prefiks og kolliderer ikke med dagsbanken", () => {
  const dagsIder = new Set(gjettelosSporsmal.map((s) => s.id))
  const ider = new Set<string>()
  for (const s of gjettelosDuellBank) {
    assert.ok(!ider.has(s.id), `dobbel id ${s.id}`)
    ider.add(s.id)
    assert.ok(s.id.startsWith(`${s.kategori}:d-`), `${s.id} mangler d-prefiks`)
    assert.match(s.id, /^[a-z]+:d-[a-z0-9-]+$/, s.id)
    assert.ok(!dagsIder.has(s.id), `${s.id} finnes i dagsbanken`)
  }
})

test("Gjetteløs-duell: ingen spørsmålstekst gjentas, verken i banken eller fra dagsbanken", () => {
  const dagsTekster = new Set(gjettelosSporsmal.map((s) => normaliser(s.tekst)))
  const tekster = new Set<string>()
  for (const s of gjettelosDuellBank) {
    const t = normaliser(s.tekst)
    assert.ok(!dagsTekster.has(t), `${s.id} finnes i dagsbanken: ${s.tekst}`)
    assert.ok(!tekster.has(t), `${s.id} er dobbelt: ${s.tekst}`)
    tekster.add(t)
  }
})

test("Gjetteløs-duell: hvert spørsmål er velformet, har positiv fasit, kilde og gyldig kategori", () => {
  for (const s of gjettelosDuellBank) {
    assert.ok(erKjentKategori(s.kategori), `${s.id}: ukjent kategori ${s.kategori}`)
    assert.ok(s.stil === "anslag" || s.stil === "fakta", s.id)
    assert.ok([1, 2, 3].includes(s.vansk), s.id)
    assert.ok(s.tekst.endsWith("?"), s.id)
    assert.ok(s.enhet.trim().length > 0, `${s.id} mangler enhet`)
    assert.ok(Number.isFinite(s.fasit) && s.fasit > 0, `${s.id}: fasit ${s.fasit}`)
    assert.ok(s.kilde.trim().length > 0, `${s.id} mangler kilde`)
    assert.ok(s.per === undefined || /\d{4}/.test(s.per), `${s.id}: per ${s.per}`)
    assert.ok(s.info === undefined || s.info.trim().length > 0, `${s.id}: tom info`)
    assert.equal(poengFor(s.fasit, s.fasit, s.aarstall), 100, s.id)
    if (s.aarstall) assert.ok(Number.isInteger(s.fasit) && s.fasit < AARSTALL_REFERANSE, `${s.id}: årstall ${s.fasit}`)
  }
})

test("Gjetteløs-duell: minst 60 prosent er anslag", () => {
  const anslag = gjettelosDuellBank.filter((s) => s.stil === "anslag").length
  assert.ok(anslag / gjettelosDuellBank.length >= 0.6, `${anslag} av ${gjettelosDuellBank.length} er anslag`)
})
