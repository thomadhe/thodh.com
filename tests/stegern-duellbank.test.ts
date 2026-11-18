import assert from "node:assert/strict"
import test from "node:test"
import { stegernDager } from "../features/spill/data/stegern"
import { stegernDuellBank } from "../features/spill/data/stegern-duell"
import { byggOppgave, finnAlternativ, konflikter, normaliser } from "../features/spill/lib/server/stegern-logikk"

// Case and whitespace only, as the brief asks, plus a looser key that also drops punctuation, accents and the
// "Nevn en/et/ei/noe" opening, so a trivially reworded copy of a daily prompt is caught too.
const enkel = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim()
const lost = (s: string) => normaliser(s.replace(/^\s*nevn\s+(?:en|et|ei|noe)\s+/i, ""))

const daglige = stegernDager.flatMap((d) => [...d.sporsmal, d.finale])

test("6/7-stegern duellbank: minst 150 spørsmål", () => {
  assert.ok(stegernDuellBank.length >= 150, `${stegernDuellBank.length}`)
})

test("6/7-stegern duellbank: ingen dubletter mot dagsbanken eller i banken", () => {
  const dagEnkel = new Set(daglige.map((s) => enkel(s.tekst)))
  const dagLost = new Set(daglige.map((s) => lost(s.tekst)))
  const sett = new Set<string>()
  const settLost = new Set<string>()
  for (const s of stegernDuellBank) {
    assert.ok(!dagEnkel.has(enkel(s.tekst)), `finnes i dagsbanken: ${s.tekst}`)
    assert.ok(!dagLost.has(lost(s.tekst)), `nesten lik et daglig spørsmål: ${s.tekst}`)
    assert.ok(!sett.has(enkel(s.tekst)), `to like spørsmål: ${s.tekst}`)
    assert.ok(!settLost.has(lost(s.tekst)), `nesten like spørsmål: ${s.tekst}`)
    sett.add(enkel(s.tekst))
    settLost.add(lost(s.tekst))
  }
})

test("6/7-stegern duellbank: hvert spørsmål kan leses og er velformet", () => {
  for (const s of stegernDuellBank) {
    const hvor = s.tekst
    assert.ok(!s.svar.includes("?"), `usikkert svar: ${hvor}`)
    const o = byggOppgave(s)
    assert.ok(o.alternativer.some((a) => a.nivaa === 1), `${hvor}: ingen svar på nivå 1`)
    assert.ok(o.alternativer.length >= 15, `${hvor}: bare ${o.alternativer.length} svar`)
    assert.ok(o.alternativer.every((a) => a.nokler.length > 0), hvor)
    assert.deepEqual(konflikter(s), [], hvor)
    // A listed wrong answer is never also a right one, and no answer is listed twice.
    assert.deepEqual([...o.nei].filter((k) => o.indeks.has(k)), [], hvor)
    const viste = o.alternativer.map((a) => normaliser(a.vis))
    assert.deepEqual(viste.filter((v, i) => viste.indexOf(v) !== i), [], `${hvor}: samme svar to ganger`)
    // Every answer is found from its own name, and a wrong answer never slips through.
    for (const [j, a] of o.alternativer.entries()) assert.equal(finnAlternativ(o, a.vis), j, `${hvor}: ${a.vis}`)
    assert.equal(finnAlternativ(o, "xqzv"), null, hvor)
  }
})
