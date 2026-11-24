import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { aggregerLedertavle, aggregerSeierherre, type RaTavleRad } from "../features/spill/lib/server/ledertavle-logikk"
import {
  beregnTidSek,
  lesBevis,
  lesOkt,
  signerBevis,
  signerOkt,
  signerResultatRad,
  verifiserResultatRad,
} from "../features/spill/lib/server/resultat-signatur"
import {
  duellRomLenke,
  erGyldigManed,
  erGyldigVennekode,
  erIRom,
  flyttManed,
  formaterTavleDato,
  formaterTidSek,
  KLIENT_SPILL,
  klemTidSek,
  lagVennekode,
  manedGrenser,
  normaliserVennekode,
  SERVER_SPILL,
  TAVLE_META,
  TAVLE_SPILL,
  TID_MAKS_SEK,
  TID_MIN_SEK,
  validerVisningsnavn,
  velgSynligeUtfordringVarsler,
  type DuellUtfordring,
} from "../features/spill/lib/sosial"
import { spill } from "../features/spill/lib/spill"
import { safeNext } from "../lib/auth/validation"

test("vennekoder genereres og valideres strengt", () => {
  for (let i = 0; i < 30; i++) {
    const k = lagVennekode()
    assert.equal(k.length, 6)
    assert.ok(erGyldigVennekode(k), `ugyldig generert vennekode: ${k}`)
  }
  assert.equal(normaliserVennekode(" k7p-3mx "), "K7P3MX")
  assert.ok(erGyldigVennekode("K7P3MX"))
  assert.ok(!erGyldigVennekode("AEIOU2")) // vokaler er utelatt
  assert.ok(!erGyldigVennekode("K7P01X")) // 0 og 1 er utelatt
  assert.ok(!erGyldigVennekode("K7P3M")) // for kort
})

test("visningsnavn avviser e-post, kontrolltegn og ugyldige lengder", () => {
  assert.deepEqual(validerVisningsnavn("  Ola   Nordmann "), { ok: true, navn: "Ola Nordmann" })
  assert.equal(validerVisningsnavn("A").ok, false)
  assert.equal(validerVisningsnavn("A".repeat(30)).ok, false)
  assert.equal(validerVisningsnavn("ola@example.com").ok, false)
  assert.deepEqual(validerVisningsnavn("Kari\u0007\nTest"), { ok: true, navn: "Kari Test" })
})

test("tid klemmes til rimelig intervall og formateres pent", () => {
  assert.equal(klemTidSek(null), null)
  assert.equal(klemTidSek(0), null)
  assert.equal(klemTidSek(-5), null)
  assert.equal(klemTidSek(0.4), TID_MIN_SEK)
  assert.equal(klemTidSek(999_999), TID_MAKS_SEK)
  assert.equal(beregnTidSek(10_000, 10_000), TID_MIN_SEK)
  assert.equal(beregnTidSek(10_000, 10_000 + 85_000), 85)
  assert.equal(beregnTidSek(10_000, 10_000 + 99_999_000), TID_MAKS_SEK)
  assert.equal(formaterTidSek(null), "–")
  assert.equal(formaterTidSek(42), "42 s")
  assert.equal(formaterTidSek(125), "2 m 05 s")
  assert.equal(formaterTidSek(3665), "1 t 01 m")
})

test("månedsfunksjoner og duell-lenker", () => {
  assert.ok(erGyldigManed("2026-11"))
  assert.ok(!erGyldigManed("2020-01"))
  assert.ok(!erGyldigManed("2026-13"))
  assert.deepEqual(manedGrenser("2026-11"), { fra: "2026-11-01", til: "2026-11-30" })
  assert.deepEqual(manedGrenser("2028-02"), { fra: "2028-02-01", til: "2028-02-29" })
  assert.equal(flyttManed("2026-12", 1), "2027-01")
  assert.equal(flyttManed("2027-01", -1), "2026-12")
  assert.equal(duellRomLenke("67-stegern", "KPMG", "runder"), "/spill/67-stegern/duell/KPMG")
  assert.equal(duellRomLenke("67-stegern", "KPMG", "pistol"), "/spill/67-stegern/duell/KPMG?modus=pistol")
  assert.equal(duellRomLenke("gjettelos", "KPMG", "pistol"), "/spill/gjettelos/duell/KPMG")
  assert.equal(duellRomLenke("moggern", "KPMG", "runder"), "/spill/moggern/KPMG")
  assert.equal(duellRomLenke("moggern", "KPMG", "pistol"), "/spill/moggern/KPMG")
})

test("alle 14 daglige spill er klassifisert som enten server- eller klientsjekket uten overlapp", () => {
  const serverSett = new Set<string>(SERVER_SPILL)
  const klientSett = new Set<string>(KLIENT_SPILL)
  for (const id of SERVER_SPILL) {
    assert.ok(!klientSett.has(id), `${id} kan ikke være både server og klient`)
    assert.ok(TAVLE_META[id].metrikker.includes(TAVLE_META[id].standard))
  }
  for (const s of spill) {
    assert.ok(serverSett.has(s.id) || klientSett.has(s.id), `${s.id} mangler i SERVER_SPILL/KLIENT_SPILL`)
  }
  assert.deepEqual([...TAVLE_SPILL], ["anelseslos", "67-stegern", "gjettelos"])
})

test("Ed25519 økt-, bevis- og radsignaturer oppdager manipulering", () => {
  const okt = signerOkt({ sp: "anelseslos", d: "2026-11-20", st: 1_700_000_000_000, f: 4, h: 1 })
  const lest = lesOkt(okt, "anelseslos", "2026-11-20")
  assert.ok(lest)
  assert.equal(lest.f, 4)
  assert.equal(lest.h, 1)
  // Feil spill eller feil dato avvises
  assert.equal(lesOkt(okt, "soket", "2026-11-20"), null)
  assert.equal(lesOkt(okt, "anelseslos", "2026-11-21"), null)
  // Manipulert JSON avvises
  assert.equal(lesOkt({ j: okt.j.replace('"f":4', '"f":1'), s: okt.s }, "anelseslos", "2026-11-20"), null)

  const bevis = signerBevis({
    sp: "anelseslos",
    d: "2026-11-20",
    status: "vunnet",
    etikett: "12 gjetninger",
    poeng: 12,
    forsok: 12,
    hint: 0,
    tidSek: 95,
  })
  const b = lesBevis(bevis)
  assert.ok(b)
  assert.equal(b.tidSek, 95)
  assert.equal(lesBevis({ j: bevis.j.replace('"tidSek":95', '"tidSek":5'), s: bevis.s }), null)

  const rad = {
    userId: "11111111-1111-4111-8111-111111111111",
    spillId: "anelseslos",
    dato: "2026-11-20",
    status: "vunnet" as const,
    poeng: 12,
    forsok: 12,
    hintAntall: 1,
    tidSek: 95,
  }
  const sig = signerResultatRad(rad)
  assert.ok(verifiserResultatRad(rad, sig))
  // Endring i bruker, tid eller hint ødelegger signaturen
  assert.equal(verifiserResultatRad({ ...rad, userId: "22222222-2222-4222-8222-222222222222" }, sig), false)
  assert.equal(verifiserResultatRad({ ...rad, tidSek: 10 }, sig), false)
  assert.equal(verifiserResultatRad({ ...rad, hintAntall: 0 }, sig), false)
})

function lagSignertRad(del: Omit<RaTavleRad, "signatur">): RaTavleRad {
  return {
    ...del,
    signatur: signerResultatRad({
      userId: del.bruker_id,
      spillId: "anelseslos",
      dato: del.dato,
      status: del.status,
      poeng: typeof del.poeng === "number" ? del.poeng : null,
      forsok: del.forsok,
      hintAntall: del.hint_antall,
      tidSek: del.tid_sek,
    }),
  }
}

test("ledertavle-aggregering verifiserer signaturer, rangerer og håndterer delte plasser", () => {
  const u1 = "11111111-1111-4111-8111-111111111111"
  const u2 = "22222222-2222-4222-8222-222222222222"
  const u3 = "33333333-3333-4333-8333-333333333333"
  const juks = "44444444-4444-4444-8444-444444444444"

  const rader: RaTavleRad[] = [
    lagSignertRad({ bruker_id: u1, visningsnavn: "Ada", dato: "2026-11-01", status: "vunnet", poeng: 10, forsok: 10, hint_antall: 0, tid_sek: 60 }),
    lagSignertRad({ bruker_id: u1, visningsnavn: "Ada", dato: "2026-11-02", status: "vunnet", poeng: 20, forsok: 20, hint_antall: 2, tid_sek: 120 }),
    lagSignertRad({ bruker_id: u2, visningsnavn: "Bjørn", dato: "2026-11-01", status: "vunnet", poeng: 15, forsok: 15, hint_antall: 0, tid_sek: 45 }),
    lagSignertRad({ bruker_id: u2, visningsnavn: "Bjørn", dato: "2026-11-02", status: "tapt", poeng: null, forsok: 40, hint_antall: 3, tid_sek: null }),
    lagSignertRad({ bruker_id: u3, visningsnavn: "Celine", dato: "2026-11-01", status: "vunnet", poeng: 15, forsok: 15, hint_antall: 0, tid_sek: 45 }),
    // Forfalsket rad (ugyldig signatur) skal forkastes når krevSignatur=true
    { bruker_id: juks, visningsnavn: "Jukser", dato: "2026-11-01", status: "vunnet", poeng: 1, forsok: 1, hint_antall: 0, tid_sek: 1, signatur: "ugyldig" },
  ]

  const flest = aggregerLedertavle("anelseslos", rader, u2, "lost", true)
  assert.equal(flest.length, 3)
  assert.equal(flest[0].visningsnavn, "Ada")
  assert.equal(flest[0].plass, 1)
  assert.equal(flest[0].lost, 2)
  assert.equal(flest[1].plass, 2)
  assert.equal(flest[2].plass, 2) // delt 2. plass mellom Bjørn og Celine
  assert.ok(flest.some((r) => r.brukerId === u2 && r.erMeg))
  assert.ok(!flest.some((r) => r.brukerId === juks))

  const raskest = aggregerLedertavle("anelseslos", rader, u1, "tid", true)
  assert.equal(raskest[0].snittTidSek, 45)
  assert.equal(raskest[1].snittTidSek, 45)
  assert.equal(raskest[0].plass, 1)
  assert.equal(raskest[1].plass, 1)
  assert.equal(raskest[2].visningsnavn, "Ada")
  assert.equal(raskest[2].plass, 3) // delt 1. plass hopper over 2. plass
  assert.equal(raskest[2].snittTidSek, 90)

  const faerrestHint = aggregerLedertavle("anelseslos", rader, u1, "hint", true)
  assert.equal(faerrestHint[0].snittHint, 0)
  assert.equal(faerrestHint[2].visningsnavn, "Ada")
  assert.equal(faerrestHint[2].snittHint, 1)
})

test("safeNext godtar nye spillsider og avviser åpne viderekoblinger", () => {
  for (const sti of [
    "/spill",
    "/spill/historikk",
    "/spill/ledertavle",
    "/spill/venner",
    "/spill/venner?kode=K7P3MX",
    "/spill/dueller",
  ]) {
    assert.equal(safeNext(sti), sti)
  }
  assert.equal(safeNext("/spill/venner?kode=AEIOU2"), "/otsjoba")
  assert.equal(safeNext("/spill/venner?kode=K7P3MX&ond=1"), "/otsjoba")
  assert.equal(safeNext("//ond.example"), "/otsjoba")
  assert.equal(safeNext("/spill/ukjent"), "/otsjoba")
})

test("SQL-migrasjonen har streng RLS og lekker ikke e-post", () => {
  const sql = readFileSync("supabase/migrations/20261123120000_spill_historikk_venner.sql", "utf8")
  for (const tabell of ["spill_profiler", "spill_okter", "spill_resultater", "spill_vennskap", "spill_duell_utfordringer"]) {
    assert.ok(sql.includes(`alter table public.${tabell} enable row level security`), `mangler RLS på ${tabell}`)
  }
  assert.ok(!/\bemail\b/i.test(sql), "migrasjonen skal ikke referere til e-post")
  assert.ok(!/for update\b[\s\S]{0,60}on public\.spill_resultater/i.test(sql), "spill_resultater skal være uforanderlig")
  assert.ok(!/for delete\b[\s\S]{0,60}on public\.spill_resultater/i.test(sql), "spill_resultater skal ikke kunne slettes")

  // API-ruter skal matche eksakte kolonne- og parameternavn i Supabase-RPC-ene
  const vennerRute = readFileSync("app/(site)/spill/api/venner/route.ts", "utf8")
  assert.match(sql, /create function public\.spill_finn_profil_ved_kode\(p_kode text\)\s+returns table \(user_id uuid, visningsnavn text\)/)
  assert.match(vennerRute, /mottaker_id:\s*maal\.user_id/)
  assert.doesNotMatch(vennerRute, /maal\.bruker_id/)

  const ledertavleRute = readFileSync("app/(site)/spill/api/ledertavle/route.ts", "utf8")
  assert.match(sql, /create function public\.spill_ledertavle_rader\([\s\S]{0,120}p_omfang text/)
  assert.match(ledertavleRute, /p_omfang:\s*omfang/)
  assert.doesNotMatch(ledertavleRute, /p_kun_venner/)
})

test("visningsnavn: eierens ønskede navn godtas, og profil-API-et tar imot POST fra inline-redigering", () => {
  for (const navn of ["thomasheesh", "tommogger", "Tom Mogger 67", "Ø·Å"]) {
    const vurdert = validerVisningsnavn(navn)
    assert.equal(vurdert.ok, true, navn)
  }
  assert.equal(validerVisningsnavn("tom.mogger@example.com").ok, false)
  assert.equal(validerVisningsnavn("x".repeat(25)).ok, false)
  assert.equal(validerVisningsnavn("xy").ok, true)

  const rute = readFileSync("app/(site)/spill/api/profil/route.ts", "utf8")
  assert.match(rute, /export async function PUT/)
  assert.match(rute, /export const POST = PUT/)

  // Camera policy: one site-wide header so App Router soft navigation into Moggern is never blocked
  const konfig = readFileSync("next.config.ts", "utf8")
  assert.match(konfig, /source: "\/:path\*"[\s\S]*camera=\(self\)/)
  assert.doesNotMatch(konfig, /camera=\(\)/)
})

test("daglig ledertavle og dagens seierherre kårer vinner per dag og per spill", () => {
  assert.ok(formaterTavleDato("2026-11-23", "2026-11-23").startsWith("I dag · "))
  assert.ok(formaterTavleDato("2026-11-22", "2026-11-23").startsWith("I går · "))
  assert.ok(!formaterTavleDato("2026-11-20", "2026-11-23").includes("2026"))
  assert.ok(formaterTavleDato("2025-11-20", "2026-11-23").includes("2025"))

  const u1 = "11111111-1111-4111-8111-111111111111"
  const u2 = "22222222-2222-4222-8222-222222222222"
  const u3 = "33333333-3333-4333-8333-333333333333"

  const lag = (spillId: "anelseslos" | "gjettelos", del: Omit<RaTavleRad, "signatur">): RaTavleRad => ({
    ...del,
    signatur: signerResultatRad({
      userId: del.bruker_id,
      spillId,
      dato: del.dato,
      status: del.status,
      poeng: typeof del.poeng === "number" ? del.poeng : null,
      forsok: del.forsok,
      hintAntall: del.hint_antall,
      tidSek: del.tid_sek,
    }),
  })

  // Dag 1 (2026-11-23): Ada vinner begge spill (4+4=8 p), Bjørn nr 2 i begge (3+3=6 p), Celine forfalsket rad forkastes
  const perSpill = {
    anelseslos: [
      lag("anelseslos", { bruker_id: u1, visningsnavn: "Ada", dato: "2026-11-23", status: "vunnet", poeng: 6, forsok: 6, hint_antall: 0, tid_sek: 40 }),
      lag("anelseslos", { bruker_id: u2, visningsnavn: "Bjørn", dato: "2026-11-23", status: "vunnet", poeng: 11, forsok: 11, hint_antall: 1, tid_sek: 70 }),
      { bruker_id: u3, visningsnavn: "Jukser", dato: "2026-11-23", status: "vunnet" as const, poeng: 1, forsok: 1, hint_antall: 0, tid_sek: 5, signatur: "ugyldig" },
      // Dag 2 (2026-11-22): Bjørn vinner alene
      lag("anelseslos", { bruker_id: u2, visningsnavn: "Bjørn", dato: "2026-11-22", status: "vunnet", poeng: 5, forsok: 5, hint_antall: 0, tid_sek: 35 }),
    ],
    gjettelos: [
      lag("gjettelos", { bruker_id: u1, visningsnavn: "Ada", dato: "2026-11-23", status: "ferdig", poeng: 420, forsok: 5, hint_antall: 0, tid_sek: 90 }),
      lag("gjettelos", { bruker_id: u2, visningsnavn: "Bjørn", dato: "2026-11-23", status: "ferdig", poeng: 380, forsok: 5, hint_antall: 0, tid_sek: 85 }),
    ],
  }

  // Enkeltdag (2026-11-23)
  const dagRes = aggregerSeierherre(perSpill, u1, true, "2026-11-23")
  assert.equal(dagRes.rader.length, 2)
  assert.equal(dagRes.rader[0].visningsnavn, "Ada")
  assert.equal(dagRes.rader[0].plass, 1)
  assert.equal(dagRes.rader[0].poeng, 8)
  assert.equal(dagRes.rader[0].seiere, 2)
  assert.equal(dagRes.rader[0].dagsseiere, 1)
  assert.equal(dagRes.rader[0].erMeg, true)
  assert.equal(dagRes.rader[1].visningsnavn, "Bjørn")
  assert.equal(dagRes.rader[1].poeng, 6)
  assert.equal(dagRes.rader[1].dagsseiere, 0)
  assert.equal(dagRes.spillVinnere.length, 2)
  assert.equal(dagRes.spillVinnere[0].spillId, "anelseslos")
  assert.equal(dagRes.spillVinnere[0].vinnere[0].visningsnavn, "Ada")
  assert.equal(dagRes.spillVinnere[0].verdiTekst, "6 gjett")

  // Hele måneden: Bjørn har 6 + 4 = 10 p og 1 dagsseier, Ada har 8 p og 1 dagsseier
  const mndRes = aggregerSeierherre(perSpill, u2, true)
  assert.equal(mndRes.rader[0].visningsnavn, "Bjørn")
  assert.equal(mndRes.rader[0].poeng, 10)
  assert.equal(mndRes.rader[0].dagsseiere, 1)
  assert.equal(mndRes.rader[1].visningsnavn, "Ada")
  assert.equal(mndRes.rader[1].poeng, 8)
  assert.equal(mndRes.rader[1].dagsseiere, 1)
})

test("utfordringsvarsler filtrerer ut utløpte, skjulte og nåværende rom", () => {
  assert.equal(erIRom("/spill/moggern/BCDF", "BCDF"), true)
  assert.equal(erIRom("/spill/67-stegern/duell/bcdf/", "BCDF"), true)
  assert.equal(erIRom("/spill/moggern", "BCDF"), false)

  const na = Date.parse("2026-11-23T12:00:00Z")
  const lag = (del: Partial<DuellUtfordring> & { id: string; romkode: string }): DuellUtfordring => ({
    avsenderId: "u1",
    avsenderNavn: "Ada",
    mottakerId: "u2",
    mottakerNavn: "Bjørn",
    spillId: "moggern",
    modus: "runder",
    status: "venter",
    opprettetKl: "2026-11-23T11:55:00Z",
    utloperKl: "2026-11-24T11:55:00Z",
    ...del,
  })

  const innkommende = [
    lag({ id: "aktiv-ny", romkode: "BCDF", opprettetKl: "2026-11-23T11:59:00Z" }),
    lag({ id: "utlopt", romkode: "GHJK", utloperKl: "2026-11-23T11:00:00Z" }),
    lag({ id: "skjult", romkode: "LMNP" }),
    lag({ id: "i-rom", romkode: "QRST" }),
    lag({ id: "aktiv-eldre", romkode: "VWXZ", opprettetKl: "2026-11-23T11:50:00Z" }),
  ]
  const utgaende = [
    lag({ id: "godtatt-live", romkode: "BCHG", status: "godtatt", opprettetKl: "2026-11-23T11:58:00Z" }),
    lag({ id: "godtatt-gammel", romkode: "JKLM", status: "godtatt", opprettetKl: "2026-11-23T11:40:00Z" }),
  ]

  // Skjult på /spill/dueller (selve innboksen)
  assert.equal(
    velgSynligeUtfordringVarsler({
      pathname: "/spill/dueller",
      innkommende,
      utgaende,
      godtatteVarselIder: new Set(["godtatt-live"]),
      skjulteIder: new Set(),
      naMs: na,
    }).synlige.length,
    0,
  )

  // På /spill/moggern/QRST: QRST, utløpt, skjult og ikke-live godtatt filtreres ut
  const res = velgSynligeUtfordringVarsler({
    pathname: "/spill/moggern/QRST",
    innkommende,
    utgaende,
    godtatteVarselIder: new Set(["godtatt-live"]),
    skjulteIder: new Set(["skjult"]),
    naMs: na,
    maks: 2,
  })
  assert.equal(res.synlige.length, 2)
  assert.equal(res.skjulteFlere, 1)
  assert.equal(res.synlige[0].type, "innkommende")
  assert.equal(res.synlige[0].utfordring.id, "aktiv-ny")
  assert.equal(res.synlige[1].type, "godtatt")
  assert.equal(res.synlige[1].utfordring.id, "godtatt-live")
})
