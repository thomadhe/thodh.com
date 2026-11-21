import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import {
  byggRangering,
  ekstraPlass,
  erSammeOrdfamilie,
  erStavetvilling,
  gjettMot,
  lastModell,
  rangering,
  stavavstand,
} from "../features/spill/lib/server/anelseslos-logikk"

// The secret list is read as text (its module is server-only). Messages below never name a secret word.
const kilde = readFileSync("features/spill/lib/server/hemmelige-ord.ts", "utf8")
const hemmelige = [...kilde.slice(kilde.indexOf("["), kilde.lastIndexOf("]")).matchAll(/"([a-z]+)"/g)].map((m) => m[1])
const erHemmelig = new Set(hemmelige)
const m = lastModell()
const indeks = (ord: string) => {
  const i = m.indeks.get(ord)
  assert.ok(i !== undefined, `«${ord}» mangler i ordlisten`)
  return i
}

test("Anelsesløs: stavetvillinger og ordfamilier", () => {
  assert.equal(stavavstand("server", "sever"), 1)
  assert.equal(stavavstand("form", "from"), 1) // transposition counts as one edit
  assert.equal(stavavstand("gee", "wee"), 1)
  assert.equal(stavavstand("abcdef", "uvwxyz"), 3) // capped
  assert.ok(erStavetvilling("server", "sever"))
  assert.ok(erStavetvilling("plan", "plane"))
  assert.ok(!erStavetvilling("gee", "gum"), "two edits in a three-letter word is a different word")
  assert.ok(!erStavetvilling("ox", "on"), "two-letter words are never twins")
  for (const [a, b] of [["happy", "happiness"], ["bake", "baker"], ["bake", "baking"], ["stop", "stopping"], ["care", "careful"], ["compress", "compressor"], ["lift", "uplift"], ["deep", "deepen"], ["intolerant", "intolerance"], ["silk", "silky"]]) {
    assert.ok(erSammeOrdfamilie(a, b) && erSammeOrdfamilie(b, a), `${a}/${b} er samme ordfamilie`)
  }
  for (const [a, b] of [["server", "sever"], ["gee", "wee"], ["bead", "beard"], ["bar", "bare"], ["dim", "dime"], ["plan", "plane"]]) {
    assert.ok(!erSammeOrdfamilie(a, b), `${a}/${b} er ikke samme ordfamilie`)
  }
})

test("Anelsesløs: en stavetvilling uten støtte flyttes ned, ekte slektninger blir stående", () => {
  // Neither word is on the secret list; the twin is in the top five before and out of the top ten after.
  for (const [svar, tvilling] of [["server", "sever"], ["complementary", "complimentary"]]) {
    assert.ok(!erHemmelig.has(svar))
    const h = indeks(svar)
    const t = indeks(tvilling)
    assert.ok(byggRangering(m, h, { demp: false }).plass[t] <= 6, `${tvilling} ligger høyt uten demping`)
    assert.ok(rangering(h).plass[t] > 10, `${tvilling} er flyttet ut av topp 10`)
  }
  // Same-family words keep their place exactly.
  for (const [svar, slekt] of [["happy", "happiness"], ["bake", "baker"], ["unlock", "locker"]]) {
    const h = indeks(svar)
    const s = indeks(slekt)
    const for_ = byggRangering(m, h, { demp: false }).plass[s]
    assert.ok(rangering(h).plass[s] <= for_, `${slekt} flyttes ikke ned`)
  }
})

test("Anelsesløs: dempingen over hele den hemmelige listen er forsiktig", () => {
  let flyttet = 0
  for (const ord of hemmelige) {
    const h = indeks(ord)
    const r = rangering(h)
    const svar = m.ord[h]
    assert.equal(r.rekkefolge[0], h, "svaret er alltid #1")
    assert.equal(new Set(r.rekkefolge).size, m.ord.length, "rekkefølgen er en permutasjon")
    for (const d of r.nedflyttet) {
      const o = m.ord[d.ord]
      assert.ok(erStavetvilling(svar, o), "bare stavetvillinger flyttes")
      assert.ok(!erSammeOrdfamilie(svar, o), "ordfamilien flyttes aldri")
      assert.ok(m.former.get(o) !== h, "bøyningsformer flyttes aldri")
      assert.ok(d.til >= 2 * d.fra, "en flytting er minst en dobling av plassen")
    }
    // Forms of the answer (plurals, British spellings) still land on the answer itself.
    for (const [form, i] of m.former) {
      if (i !== h) continue
      const g = gjettMot(h, form)
      assert.ok(g.ok && g.avstand === 1, "en bøyningsform av svaret gir #1")
    }
    flyttet += r.nedflyttet.length
  }
  // A handful across ~400 answers, not a reshuffle.
  assert.ok(flyttet < hemmelige.length / 10, `for mange nedflyttinger: ${flyttet}`)
})

test("Anelsesløs: ekstraord fra extra-words.tsv", () => {
  const tekst = readFileSync("features/spill/data/anelseslos/extra-words.tsv", "utf8")
  assert.ok(!tekst.includes("\r"), "extra-words.tsv har fått Windows-linjeskift")
  assert.ok(m.ekstra.size > 0)
  for (const [form, { ord }] of m.ekstra) {
    assert.ok(!m.indeks.has(form) && !m.former.has(form), `${form} finnes fra før`)
    assert.ok(!erHemmelig.has(ord), "et ekstraord kan ikke være et hemmelig ord")
  }
  // duvet is guessable with its plural, and scores among its anchors.
  const linje = tekst.split("\n").find((l) => l.startsWith("duvet\t"))!
  const ankre = linje.split("\t")[1].split(" ").map(indeks)
  for (const svar of ["mattress", "curtain", "carpet", "linen", "music"]) {
    const h = indeks(svar)
    const g = gjettMot(h, "Duvets ")
    assert.ok(g.ok && g.ord === "duvet")
    const plass = ekstraPlass(m, rangering(h), m.ekstra.get("duvet")!.vektor)
    assert.equal(g.avstand, plass)
    const ankerplasser = ankre.map((a) => rangering(h).plass[a])
    assert.ok(plass >= Math.min(...ankerplasser) && plass <= Math.max(...ankerplasser) + 1, `duvet ligger blant ankrene for ${svar}`)
  }
  assert.equal(gjettMot(indeks("music"), "qwzx").ok, false)
})
