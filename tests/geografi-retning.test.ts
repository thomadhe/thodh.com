import assert from "node:assert/strict"
import { test } from "node:test"
import { avstand, landEtterId, naerhet, PILER, retning, retningsPil } from "../features/spill/lib/geografi-svar"

const sted = (id: string) => {
  const l = landEtterId.get(id)
  if (!l) throw new Error(`Ukjent id ${id}`)
  return l
}
const pil = (fra: string, til: string) => retningsPil(retning(sted(fra), sted(til)))

test("retning følger verdenskartet, ikke storsirkelen", () => {
  // Storsirkel-start pekte nordvest/nord/sør på disse; på kartet ligger de vest, øst, sørøst osv.
  assert.equal(pil("NO", "MX"), "↙️")
  assert.equal(pil("NO", "US"), "⬅️")
  assert.equal(pil("ES", "MX"), "⬅️")
  assert.equal(pil("SE", "CA"), "⬅️")
  assert.equal(pil("NO", "JP"), "➡️")
  assert.equal(pil("GB", "JP"), "➡️")
  assert.equal(pil("FR", "CN"), "➡️")
  assert.equal(pil("NO", "AU"), "↘️")
  assert.equal(pil("DE", "IN"), "↘️")
  assert.equal(pil("ZA", "AU"), "➡️")
  assert.equal(pil("DK", "PE"), "↙️")
})

test("retning går korteste vei over datolinjen", () => {
  assert.equal(pil("JP", "US"), "➡️")
  assert.equal(pil("US", "JP"), "⬅️")
  assert.equal(pil("NZ", "CL"), "➡️")
  assert.equal(pil("AU", "AR"), "➡️")
  // New Zealand ligger vest for datolinjen og Tonga/Samoa øst for den: pila skal ikke gå rundt jorda.
  assert.equal(pil("NZ", "TO"), "↗️")
  assert.equal(pil("TO", "NZ"), "↙️")
  assert.equal(pil("FJ", "WS"), "➡️")
  assert.equal(retning({ lat: 0, lng: 179 }, { lat: 0, lng: -179 }), 90)
  assert.equal(retning({ lat: 0, lng: -179 }, { lat: 0, lng: 179 }), 270)
})

test("retning er motsatt vei tilbake og nær polene gir ingen tullverdier", () => {
  for (const [a, b] of [
    ["NO", "MX"],
    ["SJ", "GL"],
    ["IS", "RU"],
    ["CL", "NZ"],
    ["GS", "ZA"],
  ]) {
    const frem = retning(sted(a), sted(b))
    const tilbake = retning(sted(b), sted(a))
    assert.ok(Number.isFinite(frem) && frem >= 0 && frem < 360, `${a}→${b} ${frem}`)
    assert.ok(Math.abs(((tilbake - frem + 360) % 360) - 180) < 1e-9, `${a}↔${b}`)
  }
  assert.equal(retning({ lat: 90, lng: 0 }, { lat: -90, lng: 0 }), 180)
  assert.equal(retning({ lat: 10, lng: 20 }, { lat: 10, lng: 20 }), 0)
})

test("kompassretninger mellom naboer", () => {
  // Sveriges midtpunkt ligger sørøst for Norges (Norge uten Svalbard og Jan Mayen).
  assert.equal(pil("NO", "SE"), "↘️")
  assert.equal(pil("SE", "NO"), "↖️")
  assert.equal(pil("FI", "EE"), "⬇️")
  assert.equal(pil("ES", "FR"), "↗️")
  assert.equal(pil("PT", "ES"), "➡️")
  assert.equal(pil("CA", "US"), "⬇️")
  assert.equal(pil("AR", "CL"), "⬅️")
})

test("retningsPil runder til nærmeste av åtte piler med klokka", () => {
  assert.deepEqual(
    [0, 45, 90, 135, 180, 225, 270, 315].map(retningsPil),
    [...PILER],
  )
  assert.equal(retningsPil(22.4), "⬆️")
  assert.equal(retningsPil(22.6), "↗️")
  assert.equal(retningsPil(337.6), "⬆️")
  assert.equal(retningsPil(359.9), "⬆️")
  assert.equal(retningsPil(360), "⬆️")
  assert.equal(retningsPil(-45), "↖️")
  assert.deepEqual(PILER, ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"])
})

test("avstand og nærhet er uendret", () => {
  assert.equal(Math.round(avstand(sted("NO"), sted("SE"))), 268)
  assert.equal(Math.round(avstand(sted("NO"), sted("MX"))), 8738)
  assert.equal(naerhet(avstand(sted("NO"), sted("MX"))), 56)
})
