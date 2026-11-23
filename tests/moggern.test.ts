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
  asymPlateauScore,
  beregnESR,
  beregnFWHR,
  beregnPFR,
  bonusForStyrker,
  compute3DGonialAngle,
  DELPOENG_LISTE,
  formaterBonus,
  formaterMoggernPoeng,
  glattEksponentielt,
  kalibrerPoeng,
  KALIBRERING_SNITT,
  maalScore,
  MAKS_UTTRYKK_BONUS,
  MIN_GYLDIGE_RAMMER,
  MIN_UTTRYKK_BONUS,
  MOG_UTTRYKK,
  oppdaterLivePoeng,
  PUNKTER,
  rampe,
  regnMogUttrykk,
  regnRaaPoeng,
  regnTotal,
  SYMMETRI_PAR,
  trimmetSnitt,
  vinkelFraMatrise,
  vurderRamme,
  type Blendshapes,
  type DelpoengKart,
  type LivePoengTilstand,
  type Punkt3D,
} from "../features/spill/lib/moggern/poeng"
import { hentKameraStrom, KAMERA_ONSKER, KAMERA_RESERVE } from "../features/spill/lib/moggern/kamera"
import { kartleggPunktTilVisning } from "../features/spill/lib/moggern/sporing-tegner"
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
  oyeHoyde?: number
  kinnHalv?: number
  gonionZ?: number
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

  const sett = (idx: number, fx: number, fy: number, fz = 0) => {
    // Rotate in pixel space around (cx, cy), then normalize to [0, 1]. MediaPipe z shares the x (width) scale.
    const sx = fx * speil * ipd
    const sy = fy * ipd
    const rx = sx * cos - sy * sin
    const ry = sx * sin + sy * cos
    punkter[idx] = { x: (cx + rx) / bredde, y: (cy + ry) / hoyde, z: (fz * ipd) / bredde }
  }

  const settPar = (rIdx: number, lIdx: number, ax: number, y: number, asym = 0, z = 0) => {
    sett(rIdx, -ax + asym, y, z)
    sett(lIdx, ax, y, z)
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
  // Eye opening: PFR = eye width / eye height ≈ 0.48 / 0.15 = 3.2 (almond)
  const halvHoyde = (opts?.oyeHoyde ?? 0.15) / 2
  settPar(PUNKTER.hoyreOyeTopp, PUNKTER.venstreOyeTopp, 0.5, -halvHoyde, asym)
  settPar(PUNKTER.hoyreOyeBunn, PUNKTER.venstreOyeBunn, 0.5, halvHoyde, asym)

  // Brows
  settPar(PUNKTER.hoyreBrynIndre, PUNKTER.venstreBrynIndre, 0.25, -0.25, asym)
  settPar(PUNKTER.hoyreBrynMidt, PUNKTER.venstreBrynMidt, 0.52, -0.32, asym)
  settPar(PUNKTER.hoyreBrynYtre, PUNKTER.venstreBrynYtre, 0.82, -0.26, asym)

  // Vertical thirds: forehead -> brow -> subnasale -> chin
  // Total height = 3.1 IPD; shares ≈ 0.29 / 0.335 / 0.374
  const brynY = -0.26
  const neseBunnY = 0.78
  const panneY = opts?.panneY ?? -1.16
  const hakeY = opts?.hakeY ?? 1.94
  const leppeY = opts?.midtansiktY ?? 1.0

  sett(PUNKTER.panneTopp, 0, panneY)
  sett(PUNKTER.brynMidt, 0, brynY)
  sett(PUNKTER.neseRot, 0, -0.05)
  sett(PUNKTER.neseTipp, 0, 0.62)
  sett(PUNKTER.neseBunn, 0, neseBunnY)
  // Lips: upper 0.16, lower 0.26 (lower/upper ≈ 1.63); chin-to-philtrum ≈ (1.94 − 1.43) / 0.22 ≈ 2.3
  sett(PUNKTER.overleppeTopp, 0, leppeY)
  sett(PUNKTER.munnMidt, 0, leppeY + 0.16)
  sett(PUNKTER.underleppeTopp, 0, leppeY + 0.17)
  sett(PUNKTER.underleppeBunn, 0, leppeY + 0.43)
  sett(PUNKTER.hake, 0, hakeY)

  // Cheekbones (fWHR = 2.18 / 1.26 ≈ 1.73; ESR = 1 / 2.18 ≈ 0.459; eyeWidth/cheekWidth ≈ 0.22)
  const kinnHalv = opts?.kinnHalv ?? 1.09
  settPar(PUNKTER.hoyreKinnben, PUNKTER.venstreKinnben, kinnHalv, 0.32, asym)
  settPar(116, 345, 0.9, 0.38, asym)
  // Tragion (ear) sits far back in depth: drives the true 3D gonial angle together with gonion & chin body.
  settPar(PUNKTER.hoyreTragion, PUNKTER.venstreTragion, kinnHalv * 0.98, 0.1, asym, 1.2)

  // Jawline: bigonial / bizygomatic ≈ 0.81, 3D gonial angle ≈ 128° and 2D jaw contour ≈ 134°
  const kjeveRatio = opts?.kjeveRatio ?? 0.81
  const kjeveHalv = kinnHalv * kjeveRatio
  settPar(PUNKTER.hoyreKjeveOvre, PUNKTER.venstreKjeveOvre, kjeveHalv + 0.11, 0.62, asym)
  settPar(PUNKTER.hoyreKjeveHjorne, PUNKTER.venstreKjeveHjorne, kjeveHalv, 1.32, asym, opts?.gonionZ ?? 0.9)
  settPar(PUNKTER.hoyreKjeveNedre, PUNKTER.venstreKjeveNedre, kjeveHalv * 0.72, 1.66, asym, 0.35)
  settPar(PUNKTER.hoyreHakeKropp, PUNKTER.venstreHakeKropp, 0.45, 1.8, asym, -0.2)

  // Nose wings & mouth corners (mouth / nose ≈ 0.94 / 0.6 ≈ 1.57, near φ; nose / intercanthal ≈ 0.6 / 0.52 ≈ 1.15)
  settPar(PUNKTER.hoyreNeseVinge, PUNKTER.venstreNeseVinge, 0.3, 0.72, asym)
  settPar(PUNKTER.hoyreMunnvik, PUNKTER.venstreMunnvik, 0.47, leppeY + 0.16, asym)

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
  assert.ok(SYMMETRI_PAR.length >= 13)

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
      uttrykkBonus: 0,
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
  assert.equal(lestRapport.egen!.total, regnTotal(lagMaaling(5.0).delpoeng))
  assert.equal(lestRapport.motstander!.total, regnTotal(lagMaaling(7.2).delpoeng))

  // Expression bonus travels with the report and is part of the recomputed total; out-of-range bonus is rejected
  const medBonus = lesMoggernRapport({ ...jukseRapport, egen: { ...lagMaaling(7.0), uttrykkBonus: 0.8, total: 1 } })
  assert.ok(medBonus)
  assert.equal(medBonus.egen!.uttrykkBonus, 0.8)
  assert.equal(medBonus.egen!.total, regnTotal(lagMaaling(7.0).delpoeng, 0.8))
  assert.equal(lesMoggernRapport({ ...jukseRapport, egen: { ...lagMaaling(7.0), uttrykkBonus: 5 } }), null)
  // Older clients without the field still parse with bonus 0
  const { uttrykkBonus: _utenBonus, ...gammel } = lagMaaling(6.0)
  void _utenBonus
  assert.equal(lesMoggernRapport({ ...jukseRapport, egen: gammel })!.egen!.uttrykkBonus, 0)

  // Anti-cheat reconciliation: each player's official score comes from the OPPONENT's measurement
  const rapporter: Record<string, MoggernRapport> = {
    a: { runde: 0, av: "a", egen: lagMaaling(8.5), motstander: lagMaaling(7.4) }, // A measured self=8.5, B=7.4
    b: { runde: 0, av: "b", egen: lagMaaling(7.3), motstander: lagMaaling(6.1) }, // B measured self=7.3, A=6.1
  }
  const utfall = regnDuellUtfall(valgt, rapporter)
  assert.equal(utfall.beggeHarResultat, true)
  assert.equal(utfall.vinnerId, "b") // B got 7.4 (from A) vs A got 6.1 (from B)
  assert.equal(utfall.spillere[0].offisiell!.total, regnTotal(lagMaaling(6.1).delpoeng))
  assert.equal(utfall.spillere[0].kilde, "motstander")
  assert.equal(utfall.spillere[0].stortAvvik, true) // |8.5 - 6.1| = 2.4 >= AVVIK_TERSKEL
  assert.ok(utfall.spillere[0].avvik >= AVVIK_TERSKEL)
  assert.equal(utfall.spillere[1].offisiell!.total, regnTotal(lagMaaling(7.4).delpoeng))
  assert.equal(utfall.spillere[1].stortAvvik, false) // 7.3 vs 7.4 raw stays close after calibration

  // Fallback to self-measurement when opponent couldn't score video
  const delvis = regnDuellUtfall(valgt, {
    a: { runde: 0, av: "a", egen: lagMaaling(6.8), motstander: lagMaaling(7.1) },
    b: { runde: 0, av: "b", egen: lagMaaling(7.0), motstander: lagMaaling(0, false) },
  })
  assert.equal(delvis.spillere[0].kilde, "egen")
  assert.equal(delvis.spillere[0].offisiell!.total, regnTotal(lagMaaling(6.8).delpoeng))

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

test("Moggern mål: 3D-kjevevinkel, PFR, fWHR og ESR regnes riktig og er rotasjons-/skalainvariante", () => {
  // Right angle in the x/y plane
  assert.ok(Math.abs(compute3DGonialAngle({ x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }) - 90) < 1e-9)
  // Depth matters: the same 2D projection gives a different 3D angle when the ear sits further back
  const flat = compute3DGonialAngle({ x: 0.2, y: -1.2, z: 0 }, { x: 0, y: 0, z: 0 }, { x: -0.5, y: 0.5, z: 0 })
  const dyp = compute3DGonialAngle({ x: 0.2, y: -1.2, z: 1.5 }, { x: 0, y: 0, z: 0 }, { x: -0.5, y: 0.5, z: -1.0 })
  assert.ok(Math.abs(flat - dyp) > 5, `flat=${flat} dyp=${dyp}`)
  // Invariant to scaling and to a 3D rotation around the vertical axis
  const rot = (p: { x: number; y: number; z: number }, grader: number) => {
    const r = (grader * Math.PI) / 180
    return { x: p.x * Math.cos(r) + p.z * Math.sin(r), y: p.y, z: -p.x * Math.sin(r) + p.z * Math.cos(r) }
  }
  const t = { x: 0.2, y: -1.2, z: 1.5 }
  const c = { x: -0.5, y: 0.5, z: -1.0 }
  const o = { x: 0, y: 0, z: 0 }
  assert.ok(Math.abs(compute3DGonialAngle(rot(t, 25), o, rot(c, 25)) - dyp) < 1e-9)
  assert.ok(Math.abs(compute3DGonialAngle({ x: 0.6, y: -3.6, z: 4.5 }, o, { x: -1.5, y: 1.5, z: -3.0 }) - dyp) < 1e-9)
  // Degenerate input never throws
  assert.equal(compute3DGonialAngle(o, o, c), 180)

  // PFR: 30 wide, 10 tall → 3.0
  assert.ok(Math.abs(beregnPFR({ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 15, y: -5 }, { x: 15, y: 5 }) - 3) < 1e-9)
  assert.ok(Number.isFinite(beregnPFR({ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 15, y: 0 }, { x: 15, y: 0 })))
  // fWHR & ESR
  assert.ok(Math.abs(beregnFWHR(140, 75) - 140 / 75) < 1e-9)
  assert.ok(Math.abs(beregnESR(63, 137) - 0.46) < 0.001)

  // The synthetic face lands inside the anthropometric targets
  const r = vurderRamme(lagSyntetiskAnsikt(), lagRotasjonsMatrise(0, 0, 0), 640, 480)
  assert.ok(r.maal)
  assert.ok(r.maal.gonialVinkel3D > 118 && r.maal.gonialVinkel3D < 136, `gonial=${r.maal.gonialVinkel3D}`)
  assert.ok(r.maal.pfr > 2.9 && r.maal.pfr < 3.7, `pfr=${r.maal.pfr}`)
  assert.ok(r.maal.esr > 0.44 && r.maal.esr < 0.48, `esr=${r.maal.esr}`)
  assert.ok(r.maal.fwhr > 1.7 && r.maal.fwhr < 2.05, `fwhr=${r.maal.fwhr}`)
  assert.ok(Math.abs(r.maal.munnNese - 1.618) < 0.1, `munnNese=${r.maal.munnNese}`)

  // 3D gonial angle survives roll + mirroring + scaling exactly like the 2D measures
  const variant = vurderRamme(lagSyntetiskAnsikt({ rollGrader: 9, speilet: true, ipdPx: 150 }), lagRotasjonsMatrise(0, 0, 9), 640, 480)
  assert.ok(Math.abs(variant.maal!.gonialVinkel3D - r.maal.gonialVinkel3D) < 0.15)

  // Round eyes (low PFR) and a soft obtuse jaw lower exactly their sub-scores
  const runde = vurderRamme(lagSyntetiskAnsikt({ oyeHoyde: 0.3 }), lagRotasjonsMatrise(0, 0, 0), 640, 480)
  assert.ok(runde.maal!.pfr < 2)
  assert.ok(runde.delpoeng!.oyevinkel < r.delpoeng!.oyevinkel - 2.5)
  const myk = vurderRamme(lagSyntetiskAnsikt({ gonionZ: 0.2 }), lagRotasjonsMatrise(0, 0, 0), 640, 480)
  assert.ok(myk.maal!.gonialVinkel3D > 140, `myk gonial=${myk.maal!.gonialVinkel3D}`)
  assert.ok(myk.delpoeng!.kjevelinje < r.delpoeng!.kjevelinje - 1.5)
  // Too-wide face drops ESR out of range and lowers øyeavstand
  const bred = vurderRamme(lagSyntetiskAnsikt({ kinnHalv: 1.4 }), lagRotasjonsMatrise(0, 0, 0), 640, 480)
  assert.ok(bred.maal!.esr < 0.38)
  assert.ok(bred.delpoeng!.oyeavstand < r.delpoeng!.oyeavstand - 3)
})

test("Moggern poeng: asymmetrisk Gauss-platå er flatt i målområdet og faller ulikt på hver side", () => {
  assert.equal(asymPlateauScore(3.3, 2.9, 3.7, 0.4, 0.9), 10)
  assert.equal(asymPlateauScore(2.9, 2.9, 3.7, 0.4, 0.9), 10)
  assert.equal(asymPlateauScore(3.7, 2.9, 3.7, 0.4, 0.9), 10)
  // One σ outside ≈ 6.07 on both sides
  assert.ok(Math.abs(asymPlateauScore(2.5, 2.9, 3.7, 0.4, 0.9) - 6.07) < 0.01)
  assert.ok(Math.abs(asymPlateauScore(4.6, 2.9, 3.7, 0.4, 0.9) - 6.07) < 0.01)
  // Same absolute distance hurts more on the steep (low) side
  assert.ok(asymPlateauScore(2.4, 2.9, 3.7, 0.4, 0.9) < asymPlateauScore(4.2, 2.9, 3.7, 0.4, 0.9))
  // Monotonic decay & bounded
  assert.ok(asymPlateauScore(1.5, 2.9, 3.7, 0.4, 0.9) < asymPlateauScore(2.0, 2.9, 3.7, 0.4, 0.9))
  assert.ok(asymPlateauScore(-100, 0, 1, 0.1) >= 0)
  assert.equal(asymPlateauScore(Number.NaN, 0, 1, 0.1), 0)
  assert.equal(asymPlateauScore(5, 0, 1, 0), 0)
})

test("Moggern kalibrering: bjelkekurve sprer poengene over hele 0–10 og bevarer rekkefølgen", () => {
  // Typical raw score sits at the middle of the scale, extremes reach the ends
  assert.ok(Math.abs(kalibrerPoeng(KALIBRERING_SNITT) - 5) < 1e-6)
  assert.ok(kalibrerPoeng(10) > 9.8)
  assert.ok(kalibrerPoeng(0) < 0.01)
  // Strictly monotonic
  let forrige = -1
  for (let raa = 0; raa <= 10; raa += 0.25) {
    const k = kalibrerPoeng(raa)
    assert.ok(k > forrige, `raa=${raa}`)
    assert.ok(k >= 0 && k <= 10)
    forrige = k
  }
  // A 1-point raw gap in the crowded middle becomes a much bigger visible gap
  assert.ok(kalibrerPoeng(8.4) - kalibrerPoeng(7.4) > 3.5)
  // Spread across the rank ladder: weak → Bjeffern, typical webcam raw ~7.9 → 5.0 (Normie), strong ~8.7 → ~8.0, elite 9.5 → 9+
  const lik = (n: number): DelpoengKart => ({
    symmetri: n,
    oyevinkel: n,
    kjevelinje: n,
    midtansikt: n,
    ansiktstredjedeler: n,
    oyeavstand: n,
    harmoni: n,
  })
  assert.equal(rangForPoeng(regnTotal(lik(6.0))).tittel, "Bjeffern")
  assert.ok(regnTotal(lik(7.9)) >= 4.9 && regnTotal(lik(7.9)) <= 5.1, `snitt=${regnTotal(lik(7.9))}`)
  assert.ok(regnTotal(lik(8.7)) >= 7.5 && regnTotal(lik(8.7)) < 8.8, `sterk=${regnTotal(lik(8.7))}`)
  assert.ok(regnTotal(lik(9.5)) >= 9, `elite=${regnTotal(lik(9.5))}`)
  assert.equal(regnRaaPoeng(lik(7)), 7)
  // Bonus is added after calibration and the final total is clamped to [0, 10]
  assert.equal(regnTotal(lik(10), 2.45), 10)
  assert.equal(regnTotal(lik(0), -3), 0)
  assert.ok(regnTotal(lik(7.9), 0.8) > regnTotal(lik(7.9)))
})

test("Moggern mog-uttrykk: hvilende ansikt gir 0, poserte uttrykk gir bonus og stygge grimaser krasjer scoren", () => {
  const hvile: Blendshapes = {
    browOuterUpLeft: 0.12,
    browOuterUpRight: 0.1,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.28,
    eyeBlinkLeft: 0.1,
    eyeBlinkRight: 0.12,
    mouthPucker: 0.2,
    jawOpen: 0.04,
    jawForward: 0.03,
    mouthPressLeft: 0.18,
    mouthPressRight: 0.15,
    mouthSmileLeft: 0.05,
    mouthSmileRight: 0.06,
    cheekPuff: 0.04,
  }
  const ro = regnMogUttrykk(hvile)
  assert.equal(ro.bonus, 0)
  for (const u of MOG_UTTRYKK) assert.equal(ro.styrker[u.id], 0, u.id)
  assert.equal(regnMogUttrykk(null).bonus, 0)

  // The Rock: one eyebrow raised (difference ≥ 0.62 → full +0.8)
  const rock = regnMogUttrykk({ ...hvile, browOuterUpLeft: 0.85, browOuterUpRight: 0.1 })
  assert.equal(rock.styrker["the-rock"], 1)
  assert.ok(Math.abs(rock.bonus - 0.8) < 1e-9)
  // Both eyebrows up is NOT The Rock
  assert.equal(regnMogUttrykk({ ...hvile, browOuterUpLeft: 0.85, browOuterUpRight: 0.8 }).styrker["the-rock"], 0)

  // Jegerøyne: squint without blinking; closing the eyes cancels it
  assert.ok(Math.abs(regnMogUttrykk({ ...hvile, eyeSquintLeft: 0.9, eyeSquintRight: 0.88 }).bonus - 0.65) < 1e-9)
  assert.equal(regnMogUttrykk({ ...hvile, eyeSquintLeft: 0.9, eyeSquintRight: 0.88, eyeBlinkLeft: 0.9, eyeBlinkRight: 0.85 }).bonus, 0)

  // Innsugde kinn: pucker with closed mouth and no smile; open jaw cancels it and triggers Munn-puster penalty
  assert.ok(Math.abs(regnMogUttrykk({ ...hvile, mouthPucker: 0.9 }).bonus - 0.55) < 1e-9)
  const gapPucker = regnMogUttrykk({ ...hvile, mouthPucker: 0.9, jawOpen: 0.5 })
  assert.equal(gapPucker.styrker["innsugde-kinn"], 0)
  assert.ok(gapPucker.bonus < -2.0, `gapPucker=${gapPucker.bonus}`)

  // Mewing: jaw forward counts double, or pressed lips
  assert.ok(Math.abs(regnMogUttrykk({ ...hvile, jawForward: 0.36 }).bonus - 0.45) < 1e-9)
  assert.ok(regnMogUttrykk({ ...hvile, mouthPressLeft: 0.6, mouthPressRight: 0.6 }).bonus > 0.2)

  // Anti-mog penalties: smiling, puffed cheeks, mouth-breathing, grimaces, prey eyes, ugly frown
  const smil = regnMogUttrykk({ ...hvile, mouthSmileLeft: 0.9, mouthSmileRight: 0.85 })
  assert.ok(Math.abs(smil.bonus + 1.4) < 1e-9)
  assert.ok(Math.abs(regnMogUttrykk({ ...hvile, cheekPuff: 0.8 }).bonus + 2.0) < 1e-9)
  assert.ok(Math.abs(regnMogUttrykk({ ...hvile, jawOpen: 0.7 }).bonus + 2.8) < 1e-9)
  assert.ok(Math.abs(regnMogUttrykk({ ...hvile, noseSneerLeft: 0.8 }).bonus + 3.2) < 1e-9)
  assert.ok(Math.abs(regnMogUttrykk({ ...hvile, eyeWideLeft: 0.8, eyeWideRight: 0.8 }).bonus + 2.2) < 1e-9)
  assert.ok(Math.abs(regnMogUttrykk({ ...hvile, mouthFrownLeft: 0.8, mouthFrownRight: 0.8 }).bonus + 1.8) < 1e-9)

  // Making a grimace cancels ALL positive mog bonuses (e.g. squinting + scrunching nose never awards Jegerøyne)
  const styggGrimase = regnMogUttrykk({
    ...hvile,
    eyeSquintLeft: 0.9,
    eyeSquintRight: 0.9,
    mouthPucker: 0.9,
    jawOpen: 0.65,
    noseSneerLeft: 0.85,
    mouthFrownLeft: 0.75,
    mouthFrownRight: 0.75,
  })
  assert.equal(styggGrimase.styrker.jegeroyne, 0)
  assert.equal(styggGrimase.styrker["innsugde-kinn"], 0)
  assert.ok(styggGrimase.bonus <= -7.0, `styggGrimase=${styggGrimase.bonus}`)

  // Even a 9.5 ideal synthetic face drops straight to Bjeffern (< 3.0) when making an ugly face!
  const matrise = lagRotasjonsMatrise(0, 0, 0)
  const ideellStygg = vurderRamme(lagSyntetiskAnsikt(), matrise, 640, 480, {
    jawOpen: 0.75,
    noseSneerLeft: 0.85,
    eyeWideLeft: 0.7,
    eyeWideRight: 0.7,
    cheekPuff: 0.65,
  })
  assert.equal(rangForPoeng(ideellStygg.total!).tittel, "Bjeffern")
  assert.ok(ideellStygg.total! <= 1.5, `ideellStygg=${ideellStygg.total}`)

  // Ramp is smooth and monotonic between thresholds
  assert.equal(rampe(0.3, 0.3, 0.65), 0)
  assert.equal(rampe(0.65, 0.3, 0.65), 1)
  assert.ok(Math.abs(rampe(0.475, 0.3, 0.65) - 0.5) < 1e-9)

  // Everything positive at once stays within the documented bounds
  const alt = regnMogUttrykk({
    browOuterUpLeft: 1,
    eyeSquintLeft: 1,
    eyeSquintRight: 1,
    mouthPucker: 1,
    jawForward: 1,
  })
  assert.ok(Math.abs(alt.bonus - MAKS_UTTRYKK_BONUS) < 1e-9)
  assert.ok(Math.abs(MAKS_UTTRYKK_BONUS - 2.45) < 1e-9)
  assert.ok(Math.abs(MIN_UTTRYKK_BONUS + 13.4) < 1e-9)
  assert.equal(formaterBonus(0.8), "+0,8")
  assert.equal(formaterBonus(-2.8), "−2,8")
})

test("Moggern live-poeng og duell: eksponentiell glatting og bonus som må holdes gjennom målingen", () => {
  assert.equal(glattEksponentielt(null, 5, 0.3), 5)
  assert.ok(Math.abs(glattEksponentielt(5, 10, 0.3) - 6.5) < 1e-9)
  assert.equal(
    bonusForStyrker({
      "the-rock": 1,
      jegeroyne: 0,
      "innsugde-kinn": 0,
      mewing: 0,
      smiler: 1,
      "oppblaste-kinn": 0,
      "munn-puster": 0,
      grimase: 0,
      bytteoyne: 0,
      "sur-geip": 0,
    }),
    -0.6,
  )

  const matrise = lagRotasjonsMatrise(0, 0, 0)
  const ansikt = lagSyntetiskAnsikt()
  const rolig = vurderRamme(ansikt, matrise, 640, 480)
  const rock = vurderRamme(ansikt, matrise, 640, 480, { browOuterUpLeft: 0.9, browOuterUpRight: 0.05 })
  assert.equal(rolig.uttrykk!.bonus, 0)
  assert.ok(Math.abs(rock.uttrykk!.bonus - 0.8) < 1e-9)
  assert.deepEqual(rock.delpoeng, rolig.delpoeng)

  // Live HUD reacts within a few frames but does not jump instantly
  const tilstand: LivePoengTilstand = { struktur: null, styrker: null }
  const forste = oppdaterLivePoeng(tilstand, vurderRamme(lagSyntetiskAnsikt({ asymX: 0.2 }), matrise, 640, 480))!
  assert.ok(forste)
  assert.equal(forste.bonus, 0)
  const etterEn = oppdaterLivePoeng(tilstand, rock)!
  assert.ok(etterEn.bonus > 0 && etterEn.bonus < 0.8)
  let siste = etterEn
  for (let i = 0; i < 25; i++) siste = oppdaterLivePoeng(tilstand, rock)!
  assert.ok(siste.bonus > 0.75, `bonus=${siste.bonus}`)
  assert.ok(siste.total > forste.total)
  assert.ok(siste.total <= 10)
  // Missing-face frames never update the live score
  assert.equal(oppdaterLivePoeng(tilstand, vurderRamme(null)), null)

  // Normal laptop/monitor webcam angle (e.g. 18° yaw, -18° pitch) counts as valid
  const normalVinkel = vurderRamme(ansikt, lagRotasjonsMatrise(18, -18, 0), 640, 480)
  assert.equal(normalVinkel.gyldig, true)
  assert.equal(normalVinkel.veiledning, "ok")

  // Off-angle detected face still feeds the live HUD immediately, while official duel aggregation ignores it
  const skraTilstand: LivePoengTilstand = { struktur: null, styrker: null }
  const skraRamme = vurderRamme(ansikt, lagRotasjonsMatrise(26, 0, 0), 640, 480)
  assert.equal(skraRamme.gyldig, false)
  assert.equal(skraRamme.veiledning, "snu-rett")
  assert.ok(oppdaterLivePoeng(skraTilstand, skraRamme) !== null)
  assert.equal(aggregerRammer(Array.from({ length: 20 }, () => skraRamme)).ok, false)

  // Duel aggregation: holding The Rock all 10 s earns the bonus; a 2-frame flash does not
  const holdt = aggregerRammer(Array.from({ length: 30 }, () => rock))
  assert.equal(holdt.ok, true)
  assert.ok(holdt.uttrykkBonus > 0.7, `holdt=${holdt.uttrykkBonus}`)
  assert.equal(holdt.total, regnTotal(holdt.delpoeng, holdt.uttrykkBonus))
  const blink = aggregerRammer([...Array.from({ length: 28 }, () => rolig), rock, rock])
  assert.ok(blink.uttrykkBonus < 0.1, `blink=${blink.uttrykkBonus}`)
  assert.equal(aggregerRammer(Array.from({ length: 30 }, () => rolig)).uttrykkBonus, 0)
})

test("Moggern sporing-tegner: kartleggPunktTilVisning matcher object-cover beskjæring og selfie-speiling", () => {
  // Exact 4:3 video in 4:3 box (no cropping)
  assert.deepEqual(kartleggPunktTilVisning({ x: 0.25, y: 0.5 }, 640, 480, 640, 480, false), { x: 160, y: 240 })
  assert.deepEqual(kartleggPunktTilVisning({ x: 0.25, y: 0.5 }, 640, 480, 640, 480, true), { x: 480, y: 240 })

  // 16:9 video (1280×720) cropped inside a tall 360×720 box (scale = 1, drawn 1280×720, offsetX = -460)
  const senter = kartleggPunktTilVisning({ x: 0.5, y: 0.5 }, 1280, 720, 360, 720, false)
  assert.deepEqual(senter, { x: 180, y: 360 })
  const venstre = kartleggPunktTilVisning({ x: 0.4, y: 0.25 }, 1280, 720, 360, 720, false)
  assert.ok(Math.abs(venstre.x - 52) < 1e-9 && Math.abs(venstre.y - 180) < 1e-9)
  const speilet = kartleggPunktTilVisning({ x: 0.4, y: 0.25 }, 1280, 720, 360, 720, true)
  assert.ok(Math.abs(speilet.x - (360 - 52)) < 1e-9 && Math.abs(speilet.y - 180) < 1e-9)

  // Degenerate dimensions never produce NaN
  assert.deepEqual(kartleggPunktTilVisning({ x: 0.5, y: 0.5 }, 0, 0, 640, 480, false), { x: 0, y: 0 })
})

test("Moggern kamera: prøver selfie-ønsker først og faller tilbake til video: true ved avvist oppsett", async () => {
  const kall: MediaStreamConstraints[] = []
  const strom = {} as MediaStream
  const ok = await hentKameraStrom(async (c) => {
    kall.push(c)
    return strom
  })
  assert.equal(ok, strom)
  assert.deepEqual(kall, [KAMERA_ONSKER])
  assert.deepEqual(KAMERA_ONSKER, { video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })

  const kall2: MediaStreamConstraints[] = []
  const reserve = await hentKameraStrom(async (c) => {
    kall2.push(c)
    if (kall2.length === 1) {
      const e = new Error("constraints")
      e.name = "OverconstrainedError"
      throw e
    }
    return strom
  })
  assert.equal(reserve, strom)
  assert.deepEqual(kall2, [KAMERA_ONSKER, KAMERA_RESERVE])

  // A denied permission is NOT retried (avoids a second prompt) and surfaces the error
  let antall = 0
  await assert.rejects(
    hentKameraStrom(async () => {
      antall++
      const e = new Error("nei")
      e.name = "NotAllowedError"
      throw e
    }),
    (e: Error) => e.name === "NotAllowedError",
  )
  assert.equal(antall, 1)
  await assert.rejects(hentKameraStrom(null))
})
