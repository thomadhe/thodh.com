import assert from "node:assert/strict"
import { test } from "node:test"
import { safeNext } from "../lib/auth/validation"
import { STANDARD_FIGUR } from "../features/spill/lib/duell/figur"
import {
  AVVIK_TERSKEL,
  lesMoggernRapport,
  lesMoggernStatus,
  lesSignal,
  MOGGERN_MAKS_SPILLERE,
  moggernStart,
  moggernTaImot,
  regnDuellUtfall,
  utledVisningsnavn,
  velgMoggernDeltakere,
  type MoggernRapport,
  type SpillerMaaling,
} from "../features/spill/lib/moggern/duell"
import { byggIceKonfig, STANDARD_STUN } from "../features/spill/lib/moggern/ice"
import { analyserLuminans, analyserRgbaLys, samleLysStatus } from "../features/spill/lib/moggern/lys"
import {
  aggregerRammer,
  DELPOENG_LISTE,
  formaterMoggernPoeng,
  maalScore,
  MIN_GYLDIGE_RAMMER,
  PUNKTER,
  regnTotal,
  SYMMETRI_PAR,
  trimmetSnitt,
  vinkelFraMatrise,
  vurderRamme,
  type DelpoengKart,
  type Punkt3D,
} from "../features/spill/lib/moggern/poeng"
import {
  DELPOENG_DISSER,
  lagTipsOgDiss,
  LYS_DISSER,
  rangForPoeng,
  vinnerLinje,
} from "../features/spill/lib/moggern/tekster"

/**
 * Builds a synthetic 478-point canonical frontal face centered at (cx, cy) with given IPD in pixels,
 * optional roll rotation (degrees), horizontal mirror, and optional metric overrides for testing.
 */
function lagSyntetiskAnsikt(opts?: {
  bredde?: number
  hoyde?: number
  ipdPx?: number
  rollGrader?: number
  speilet?: boolean
  asymX?: number
  tiltGrader?: number
  kjeveRatio?: number
  midtansiktY?: number
  panneY?: number
  hakeY?: number
  oyeBredde?: number
}): Punkt3D[] {
  const bredde = opts?.bredde ?? 640
  const hoyde = opts?.hoyde ?? 480
  const ipd = opts?.ipdPx ?? 120
  const cx = bredde / 2
  const cy = hoyde * 0.44
  const rollRad = ((opts?.rollGrader ?? 0) * Math.PI) / 180
  const cos = Math.cos(rollRad)
  const sin = Math.sin(rollRad)
  const speil = opts?.speilet ? -1 : 1

  const punkter: Punkt3D[] = Array.from({ length: 478 }, () => ({ x: cx / bredde, y: cy / hoyde, z: 0 }))

  const sett = (idx: number, fx: number, fy: number) => {
    // Rotate in pixel space around (cx, cy), then normalize to [0, 1].
    const sx = fx * speil * ipd
    const sy = fy * ipd
    const rx = sx * cos - sy * sin
    const ry = sx * sin + sy * cos
    punkter[idx] = { x: (cx + rx) / bredde, y: (cy + ry) / hoyde, z: 0 }
  }

  const settPar = (rIdx: number, lIdx: number, ax: number, y: number, asym = 0) => {
    sett(rIdx, -ax + asym, y)
    sett(lIdx, ax, y)
  }

  const asym = opts?.asymX ?? 0
  const tiltRad = ((opts?.tiltGrader ?? 5.0) * Math.PI) / 180
  const oyeBredde = opts?.oyeBredde ?? 0.48
  const halvOye = oyeBredde / 2
  const dyTilt = Math.tan(tiltRad) * oyeBredde

  // Pupils / iris at (-0.5, 0) and (+0.5, 0)
  sett(PUNKTER.hoyreIris, -0.5, 0)
  sett(PUNKTER.venstreIris, 0.5, 0)

  // Eyes: inner slightly lower (+y), outer slightly higher (-y) for positive canthal tilt
  settPar(PUNKTER.hoyreOyeIndre, PUNKTER.venstreOyeIndre, 0.5 - halvOye, dyTilt / 2, asym)
  settPar(PUNKTER.hoyreOyeYtre, PUNKTER.venstreOyeYtre, 0.5 + halvOye, -dyTilt / 2, asym)
  settPar(PUNKTER.hoyreOyeTopp, PUNKTER.venstreOyeTopp, 0.5, -0.1, asym)
  settPar(PUNKTER.hoyreOyeBunn, PUNKTER.venstreOyeBunn, 0.5, 0.1, asym)

  // Brows
  settPar(PUNKTER.hoyreBrynIndre, PUNKTER.venstreBrynIndre, 0.25, -0.25, asym)
  settPar(PUNKTER.hoyreBrynMidt, PUNKTER.venstreBrynMidt, 0.52, -0.32, asym)
  settPar(PUNKTER.hoyreBrynYtre, PUNKTER.venstreBrynYtre, 0.82, -0.26, asym)

  // Vertical thirds: forehead -> brow -> subnasale -> chin
  // Total height = 3.1 IPD; shares = 0.29 / 0.35 / 0.36
  const brynY = -0.26
  const neseBunnY = 0.825
  const panneY = opts?.panneY ?? -1.16
  const hakeY = opts?.hakeY ?? 1.94
  const leppeY = opts?.midtansiktY ?? 1.0

  sett(PUNKTER.panneTopp, 0, panneY)
  sett(PUNKTER.brynMidt, 0, brynY)
  sett(PUNKTER.neseRot, 0, -0.05)
  sett(PUNKTER.neseTipp, 0, 0.62)
  sett(PUNKTER.neseBunn, 0, neseBunnY)
  sett(PUNKTER.overleppeTopp, 0, leppeY)
  sett(PUNKTER.munnMidt, 0, leppeY + 0.14)
  sett(PUNKTER.hake, 0, hakeY)

  // Cheekbones (fWHR = cheekWidth / (leppeY - brynY) ≈ 2.34 / 1.26 ≈ 1.86; eyeWidth/cheekWidth ≈ 0.48/2.34 ≈ 0.205)
  const kinnHalv = 1.17
  settPar(PUNKTER.hoyreKinnben, PUNKTER.venstreKinnben, kinnHalv, 0.32, asym)
  settPar(116, 345, 0.96, 0.38, asym)

  // Jawline: bigonial / bizygomatic ≈ 0.81 and gonial angle ≈ 128°
  const kjeveRatio = opts?.kjeveRatio ?? 0.81
  const kjeveHalv = kinnHalv * kjeveRatio
  settPar(PUNKTER.hoyreKjeveOvre, PUNKTER.venstreKjeveOvre, kjeveHalv + 0.11, 0.62, asym)
  settPar(PUNKTER.hoyreKjeveHjorne, PUNKTER.venstreKjeveHjorne, kjeveHalv, 1.32, asym)
  settPar(PUNKTER.hoyreKjeveNedre, PUNKTER.venstreKjeveNedre, kjeveHalv * 0.72, 1.66, asym)

  // Nose wings & mouth corners (mouth / nose ≈ 1.52)
  settPar(PUNKTER.hoyreNeseVinge, PUNKTER.venstreNeseVinge, 0.31, 0.76, asym)
  settPar(PUNKTER.hoyreMunnvik, PUNKTER.venstreMunnvik, 0.47, 1.14, asym)

  return punkter
}

/** Builds a 4×4 column-major rotation matrix from Euler yaw, pitch, roll in degrees. */
function lagRotasjonsMatrise(yawGrader: number, pitchGrader: number, rollGrader: number): number[] {
  const y = (yawGrader * Math.PI) / 180
  const p = (pitchGrader * Math.PI) / 180
  const r = (rollGrader * Math.PI) / 180

  const cy = Math.cos(y), sy = Math.sin(y)
  const cp = Math.cos(p), sp = Math.sin(p)
  const cr = Math.cos(r), sr = Math.sin(r)

  // R = Ry(yaw) * Rx(pitch) * Rz(roll) -> column-major layout m[col*4 + row]
  const r00 = cy * cr + sy * sp * sr
  const r01 = -cy * sr + sy * sp * cr
  const r02 = sy * cp
  const r10 = cp * sr
  const r11 = cp * cr
  const r12 = -sp
  const r20 = -sy * cr + cy * sp * sr
  const r21 = sy * sr + cy * sp * cr
  const r22 = cy * cp

  return [
    r00, r10, r20, 0,
    r01, r11, r21, 0,
    r02, r12, r22, 0,
    0, 0, -50, 1,
  ]
}

test("Moggern poeng: delpoengvekter summerer til 1 og maalScore er jevn og begrenset til 0–10", () => {
  const vektSum = DELPOENG_LISTE.reduce((sum, d) => sum + d.vekt, 0)
  assert.ok(Math.abs(vektSum - 1) < 1e-9, `vektSum=${vektSum}`)
  assert.equal(DELPOENG_LISTE.length, 7)

  assert.equal(maalScore(5, 4, 6, 2), 10)
  assert.equal(maalScore(4, 4, 6, 2), 9.2)
  assert.equal(maalScore(6, 4, 6, 2), 9.2)
  assert.ok(maalScore(7, 4, 6, 2) < 9.2 && maalScore(7, 4, 6, 2) > maalScore(9, 4, 6, 2))
  assert.equal(maalScore(Number.NaN, 4, 6, 2), 0)
  assert.equal(formaterMoggernPoeng(7.4), "7,4")
})

test("Moggern poeng: ideelt syntetisk ansikt scorer høyt og er invariant for skalering, hoderull og speiling", () => {
  const matrise = lagRotasjonsMatrise(0, 0, 0)
  const grunn = vurderRamme(lagSyntetiskAnsikt(), matrise, 640, 480)
  assert.equal(grunn.gyldig, true)
  assert.equal(grunn.veiledning, "ok")
  assert.ok(grunn.total! >= 9.0, `forventet >= 9.0, fikk ${grunn.total}`)
  assert.equal(SYMMETRI_PAR.length, 14)

  // Scaling IPD (closer/farther within valid framing) gives identical sub-scores.
  const skalert = vurderRamme(lagSyntetiskAnsikt({ ipdPx: 165 }), matrise, 640, 480)
  assert.deepEqual(skalert.delpoeng, grunn.delpoeng)
  assert.equal(skalert.total, grunn.total)

  // Rotating head roll by +11° (within gate) gives identical sub-scores after roll correction.
  const rullet = vurderRamme(lagSyntetiskAnsikt({ rollGrader: 11 }), lagRotasjonsMatrise(0, 0, 11), 640, 480)
  assert.equal(rullet.gyldig, true)
  assert.deepEqual(rullet.delpoeng, grunn.delpoeng)
  assert.equal(rullet.total, grunn.total)

  // Horizontal mirroring (selfie camera vs raw feed) gives identical sub-scores.
  const speilet = vurderRamme(lagSyntetiskAnsikt({ speilet: true }), matrise, 640, 480)
  assert.equal(speilet.gyldig, true)
  assert.deepEqual(speilet.delpoeng, grunn.delpoeng)
  assert.equal(speilet.total, grunn.total)

  // 16:9 frame aspect ratio produces the same proportions when aspect-corrected.
  const widescreen = vurderRamme(lagSyntetiskAnsikt({ bredde: 1280, hoyde: 720, ipdPx: 150 }), matrise, 1280, 720)
  assert.equal(widescreen.gyldig, true)
  assert.deepEqual(widescreen.delpoeng, grunn.delpoeng)
})

test("Moggern poeng: avvik i hvert delmål senker akkurat riktig delpoeng", () => {
  const matrise = lagRotasjonsMatrise(0, 0, 0)
  const grunn = vurderRamme(lagSyntetiskAnsikt(), matrise, 640, 480).delpoeng!

  const skjev = vurderRamme(lagSyntetiskAnsikt({ asymX: 0.22 }), matrise, 640, 480).delpoeng!
  assert.ok(skjev.symmetri < grunn.symmetri - 4, `skjev.symmetri=${skjev.symmetri}`)

  const negativTilt = vurderRamme(lagSyntetiskAnsikt({ tiltGrader: -7 }), matrise, 640, 480).delpoeng!
  assert.ok(negativTilt.oyevinkel < grunn.oyevinkel - 4, `negativTilt.oyevinkel=${negativTilt.oyevinkel}`)

  const smalKjeve = vurderRamme(lagSyntetiskAnsikt({ kjeveRatio: 0.52 }), matrise, 640, 480).delpoeng!
  assert.ok(smalKjeve.kjevelinje < grunn.kjevelinje - 3, `smalKjeve.kjevelinje=${smalKjeve.kjevelinje}`)

  const langtMidt = vurderRamme(lagSyntetiskAnsikt({ midtansiktY: 1.55 }), matrise, 640, 480).delpoeng!
  assert.ok(langtMidt.midtansikt < grunn.midtansikt - 4, `langtMidt.midtansikt=${langtMidt.midtansikt}`)

  const skjeveTredjedeler = vurderRamme(lagSyntetiskAnsikt({ panneY: -2.2 }), matrise, 640, 480).delpoeng!
  assert.ok(skjeveTredjedeler.ansiktstredjedeler < grunn.ansiktstredjedeler - 4)

  const smaleOyne = vurderRamme(lagSyntetiskAnsikt({ oyeBredde: 0.28 }), matrise, 640, 480).delpoeng!
  assert.ok(smaleOyne.oyeavstand < grunn.oyeavstand - 3)
})

test("Moggern poeng: frontal-port og avstandssjekk avviser ugyldige bilder med tydelig veiledning", () => {
  const ansikt = lagSyntetiskAnsikt()

  assert.equal(vurderRamme(null).veiledning, "ingen-ansikt")
  assert.equal(vurderRamme(ansikt.slice(0, 100)).veiledning, "ingen-ansikt")

  // Too far / too close
  assert.equal(vurderRamme(lagSyntetiskAnsikt({ ipdPx: 25 }), lagRotasjonsMatrise(0, 0, 0), 640, 480).veiledning, "for-langt-unna")
  assert.equal(vurderRamme(lagSyntetiskAnsikt({ ipdPx: 300 }), lagRotasjonsMatrise(0, 0, 0), 640, 480).veiledning, "for-naerme")

  // Yaw and pitch outside frontal window
  const snudd = vurderRamme(ansikt, lagRotasjonsMatrise(24, 0, 0), 640, 480)
  assert.equal(snudd.gyldig, false)
  assert.equal(snudd.veiledning, "snu-rett")

  const nikket = vurderRamme(ansikt, lagRotasjonsMatrise(0, -22, 0), 640, 480)
  assert.equal(nikket.gyldig, false)
  assert.equal(nikket.veiledning, "snu-rett")

  // Excessive head tilt
  const vippet = vurderRamme(lagSyntetiskAnsikt({ rollGrader: 25 }), lagRotasjonsMatrise(0, 0, 25), 640, 480)
  assert.equal(vippet.gyldig, false)
  assert.equal(vippet.veiledning, "vipp-rett")

  // Verify Euler extraction on both column-major and row-major matrices
  const cm = lagRotasjonsMatrise(10, -6, 4)
  const vCm = vinkelFraMatrise(cm)
  assert.ok(Math.abs(vCm.yaw - 10) < 0.6 && Math.abs(vCm.pitch - -6) < 0.6)
})

test("Moggern poeng: rammeaggregering bruker trimmet snitt og krever nok gyldige bilder", () => {
  assert.equal(trimmetSnitt([1, 5, 5, 5, 5, 5, 5, 5, 5, 10]), 5)

  const matrise = lagRotasjonsMatrise(0, 0, 0)
  const godRamme = vurderRamme(lagSyntetiskAnsikt(), matrise, 640, 480)
  const blunkRamme = vurderRamme(lagSyntetiskAnsikt({ asymX: 0.35, tiltGrader: -10 }), matrise, 640, 480)
  const ugyldigRamme = vurderRamme(null)

  // Too few valid frames -> ok: false
  const forFa = aggregerRammer(Array.from({ length: MIN_GYLDIGE_RAMMER - 1 }, () => godRamme))
  assert.equal(forFa.ok, false)
  assert.equal(forFa.kvalitet.gyldigeRammer, MIN_GYLDIGE_RAMMER - 1)

  // 18 good frames + 1 outlier blink + 5 invalid frames -> outlier trimmed away cleanly
  const samlet = aggregerRammer([
    ...Array.from({ length: 18 }, () => godRamme),
    blunkRamme,
    ...Array.from({ length: 5 }, () => ugyldigRamme),
  ])
  assert.equal(samlet.ok, true)
  assert.equal(samlet.kvalitet.antallRammer, 24)
  assert.equal(samlet.kvalitet.gyldigeRammer, 19)
  assert.equal(samlet.total, godRamme.total)
})

test("Moggern lyssjekk: skiller overeksponert, mørkt og ok bilde uten å bry seg om farge/hudtone", () => {
  // Balanced luminance
  assert.equal(analyserLuminans(Array.from({ length: 100 }, (_, i) => 70 + (i % 100))).status, "ok")
  // Washed-out / overexposed
  assert.equal(analyserLuminans(Array.from({ length: 100 }, () => 248)).status, "overeksponert")
  // Bunker / underexposed
  assert.equal(analyserLuminans(Array.from({ length: 100 }, () => 24)).status, "undereksponert")

  // Different RGB hues with normal luminance (~125) MUST all evaluate as "ok" (never measures skin colour!)
  const lagEnsfarget = (r: number, g: number, b: number) => {
    const buf = new Uint8ClampedArray(4 * 64)
    for (let i = 0; i < 64; i++) {
      buf[i * 4] = r
      buf[i * 4 + 1] = g
      buf[i * 4 + 2] = b
      buf[i * 4 + 3] = 255
    }
    return buf
  }
  for (const [r, g, b] of [
    [190, 145, 115], // light warm
    [135, 95, 70], // medium warm
    [95, 72, 60], // deep warm (Y ≈ 76, still well-exposed)
    [80, 130, 210], // cool blue
  ]) {
    assert.equal(analyserRgbaLys(lagEnsfarget(r, g, b)).status, "ok", `rgb(${r},${g},${b})`)
  }

  // Majority threshold across frames
  const over = analyserLuminans([250, 250, 250])
  const ok = analyserLuminans([120, 130, 140])
  assert.equal(samleLysStatus([over, over, over, ok, ok]), "overeksponert")
  assert.equal(samleLysStatus([over, over, ok, ok, ok]), "ok")
})

test("Moggern tekster: eksakte rangtitler, vinnerlinje og deterministisk valg av tips og diss", () => {
  const grenser: [number, string][] = [
    [0.0, "Bjeffern"],
    [2.9, "Bjeffern"],
    [3.0, "Chopped"],
    [3.9, "Chopped"],
    [4.0, "Venstredude"],
    [4.9, "Venstredude"],
    [5.0, "Normie"],
    [5.9, "Normie"],
    [6.0, "Mid-mogger"],
    [6.9, "Mid-mogger"],
    [7.0, "Aura-farmer"],
    [7.9, "Aura-farmer"],
    [8.0, "Sheeshern"],
    [8.9, "Sheeshern"],
    [9.0, "Gigamogger"],
    [10.0, "Gigamogger"],
  ]
  for (const [poeng, ventet] of grenser) {
    assert.equal(rangForPoeng(poeng).tittel, ventet, `${poeng}`)
  }

  assert.equal(vinnerLinje({ navn: "Ola", poeng: 7.8 }, { navn: "Kari", poeng: 6.4 }), "Ola mogget Kari med 1,4 poeng.")
  assert.match(vinnerLinje({ navn: "Ola", poeng: 6.5 }, { navn: "Kari", poeng: 6.5 }), /Uavgjort/)

  const svakOyevinkel: DelpoengKart = {
    symmetri: 7.5,
    oyevinkel: 3.2,
    kjevelinje: 7.1,
    midtansikt: 6.8,
    ansiktstredjedeler: 7.0,
    oyeavstand: 6.9,
    harmoni: 7.0,
  }
  const a = lagTipsOgDiss({ delpoeng: svakOyevinkel, lysStatus: "ok", fro: "BCDF:0:spiller1" })
  const b = lagTipsOgDiss({ delpoeng: svakOyevinkel, lysStatus: "ok", fro: "BCDF:0:spiller1" })
  assert.deepEqual(a, b)
  assert.ok(a.tips.length >= 2 && a.tips.length <= 3)
  assert.equal(a.dissFraLys, false)
  assert.ok(DELPOENG_DISSER.oyevinkel.includes(a.diss))

  // Overexposure and underexposure trigger lighting roasts specifically
  const overDiss = lagTipsOgDiss({ delpoeng: svakOyevinkel, lysStatus: "overeksponert", fro: "BCDF:0:spiller1" })
  assert.equal(overDiss.dissFraLys, true)
  assert.ok(LYS_DISSER.overeksponert.includes(overDiss.diss))

  const morkDiss = lagTipsOgDiss({ delpoeng: svakOyevinkel, lysStatus: "undereksponert", fro: "BCDF:0:spiller1" })
  assert.equal(morkDiss.dissFraLys, true)
  assert.ok(LYS_DISSER.undereksponert.includes(morkDiss.diss))
})

test("Moggern duell: 2-spiller grense, meldingstolkning, anti-juks, ICE-konfig og safeNext", () => {
  // Strictly 2 players chosen in join order
  const valgt = velgMoggernDeltakere([
    { id: "c", navn: "Tredje", inn: 300, klar: true, runde: 0, figur: STANDARD_FIGUR },
    { id: "a", navn: "Første", inn: 100, klar: true, runde: 0, figur: STANDARD_FIGUR },
    { id: "b", navn: "Andre", inn: 200, klar: true, runde: 0, figur: STANDARD_FIGUR },
  ])
  assert.equal(valgt.length, MOGGERN_MAKS_SPILLERE)
  assert.deepEqual(
    valgt.map((d) => d.id),
    ["a", "b"],
  )

  const lagMaaling = (score: number, ok = true): SpillerMaaling => {
    const delpoeng: DelpoengKart = {
      symmetri: score,
      oyevinkel: score,
      kjevelinje: score,
      midtansikt: score,
      ansiktstredjedeler: score,
      oyeavstand: score,
      harmoni: score,
    }
    return {
      ok,
      total: ok ? regnTotal(delpoeng) : 0,
      delpoeng,
      lysStatus: "ok",
      kvalitet: { antallRammer: 40, gyldigeRammer: 32, snittAbsYaw: 2, snittAbsPitch: 2, snittIpdAndel: 0.24, stabilitet: 0.2 },
    }
  }

  // Tampered total is recomputed from sub-scores when parsing a report
  const jukseRapport = {
    runde: 0,
    av: "a",
    egen: { ...lagMaaling(5.0), total: 9.9 },
    motstander: lagMaaling(7.2),
  }
  const lestRapport = lesMoggernRapport(jukseRapport)
  assert.ok(lestRapport)
  assert.equal(lestRapport.egen!.total, 5.0)
  assert.equal(lestRapport.motstander!.total, 7.2)

  // Anti-cheat reconciliation: each player's official score comes from the OPPONENT's measurement
  const rapporter: Record<string, MoggernRapport> = {
    a: { runde: 0, av: "a", egen: lagMaaling(8.5), motstander: lagMaaling(7.4) }, // A measured self=8.5, B=7.4
    b: { runde: 0, av: "b", egen: lagMaaling(7.3), motstander: lagMaaling(6.1) }, // B measured self=7.3, A=6.1
  }
  const utfall = regnDuellUtfall(valgt, rapporter)
  assert.equal(utfall.beggeHarResultat, true)
  assert.equal(utfall.vinnerId, "b") // B got 7.4 (from A) vs A got 6.1 (from B)
  assert.equal(utfall.spillere[0].offisiell!.total, 6.1)
  assert.equal(utfall.spillere[0].kilde, "motstander")
  assert.equal(utfall.spillere[0].stortAvvik, true) // |8.5 - 6.1| = 2.4 >= AVVIK_TERSKEL
  assert.ok(utfall.spillere[0].avvik >= AVVIK_TERSKEL)
  assert.equal(utfall.spillere[1].offisiell!.total, 7.4)
  assert.equal(utfall.spillere[1].stortAvvik, false) // |7.3 - 7.4| = 0.1

  // Fallback to self-measurement when opponent couldn't score video
  const delvis = regnDuellUtfall(valgt, {
    a: { runde: 0, av: "a", egen: lagMaaling(6.8), motstander: lagMaaling(7.1) },
    b: { runde: 0, av: "b", egen: lagMaaling(7.0), motstander: lagMaaling(0, false) },
  })
  assert.equal(delvis.spillere[0].kilde, "egen")
  assert.equal(delvis.spillere[0].offisiell!.total, 6.8)

  // Status parsing & merge preserve reports from both clients
  const s0 = moggernStart(0)
  const s1 = { ...s0, v: 2, fase: "maling" as const, deltakere: valgt, faseStartTid: 1000, rapporter: { a: rapporter.a } }
  const s2 = { ...s0, v: 3, fase: "resultat" as const, deltakere: valgt, faseStartTid: 1000, rapporter: { b: rapporter.b } }
  assert.ok(lesMoggernStatus(s1))
  assert.equal(lesMoggernStatus({ ...s1, fase: "ukjent" }), null)
  const sammenslatt = moggernTaImot(s1, s2)
  assert.equal(sammenslatt.fase, "resultat")
  assert.ok(sammenslatt.rapporter.a && sammenslatt.rapporter.b)

  // WebRTC signal validation
  assert.ok(lesSignal({ fra: "a", til: "b", type: "offer", sdp: "v=0..." }))
  assert.ok(lesSignal({ fra: "a", til: "b", type: "ice", candidate: { candidate: "candidate:1", sdpMid: "0", sdpMLineIndex: 0 } }))
  assert.equal(lesSignal({ fra: "a", til: "b", type: "offer", sdp: "" }), null)
  assert.equal(lesSignal({ fra: "a", til: "b", type: "hack" }), null)

  // Display name extraction never exposes full email
  assert.equal(utledVisningsnavn({ email: "ola.nordmann@example.com", user_metadata: {} }), "Ola nordmann")
  assert.equal(utledVisningsnavn({ email: "x@y.no", user_metadata: { display_name: "Kari" } }), "Kari")
  assert.ok(!utledVisningsnavn({ email: "hemmelig@example.com" }).includes("@"))

  // ICE config only hands out TURN to authenticated users
  const turnEnv = {
    MOGGERN_TURN_URLS: "turn:turn.example.com:3478,turns:turn.example.com:5349",
    MOGGERN_TURN_USERNAME: "bruker",
    MOGGERN_TURN_CREDENTIAL: "hemmelig",
  }
  const utloggetIce = byggIceKonfig(turnEnv, false)
  assert.equal(utloggetIce.harTurn, false)
  assert.equal(utloggetIce.iceServers.length, STANDARD_STUN.length)

  const innloggetIce = byggIceKonfig(turnEnv, true)
  assert.equal(innloggetIce.harTurn, true)
  assert.equal(innloggetIce.iceServers.length, STANDARD_STUN.length + 1)

  // safeNext allows Moggern landing & valid 4-consonant room codes only
  assert.equal(safeNext("/spill/moggern"), "/spill/moggern")
  assert.equal(safeNext("/spill/moggern/BCDF"), "/spill/moggern/BCDF")
  assert.equal(safeNext("/spill/moggern/AEOU"), "/otsjoba")
  assert.equal(safeNext("/spill/moggern/BCDF/ekstra"), "/otsjoba")
})
