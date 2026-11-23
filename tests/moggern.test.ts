import assert from "node:assert/strict"
import { test } from "node:test"
import { safeNext } from "../lib/auth/validation"
import { STANDARD_FIGUR } from "../features/spill/lib/duell/figur"
import {
  AVVIK_TERSKEL,
  lesMoggernRapport,
  lesMoggernStatus,
  lesSignal,
  MALING_MS,
  MOGGERN_MAKS_SPILLERE,
  moggernStart,
  moggernTaImot,
  oppdaterStilling,
  regnDuellUtfall,
  utledVisningsnavn,
  velgMoggernDeltakere,
  type MoggernRapport,
  type SpillerMaaling,
} from "../features/spill/lib/moggern/duell"
import { lesDagensBesteFraTekst, lesRelayRamme, oppdaterDagensBesteVerdi } from "../features/spill/lib/moggern/duell-kort"
import { byggIceKonfig, hentIceKonfig, normaliserIceTjenere, STANDARD_STUN } from "../features/spill/lib/moggern/ice"
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
import { hentKameraStrom, hentMikrofonStrom, KAMERA_ONSKER, KAMERA_RESERVE, MIKROFON_ONSKER } from "../features/spill/lib/moggern/kamera"
import {
  erRizzlerPose,
  lesFinisherBonus,
  lesRizzlerHendelse,
  RIZZLER_BONUS,
  RIZZLER_FEIL_STRAFF,
} from "../features/spill/lib/moggern/rizzler"
import { kartleggPunktTilVisning } from "../features/spill/lib/moggern/sporing-tegner"
import {
  COOKED_DISSER,
  DELPOENG_DISSER,
  lagTipsOgDiss,
  LYS_DISSER,
  rangForPoeng,
  uttrykkDom,
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

  // Wearing a cap/bangs compresses forehead landmark 10 downward — score must stay nearly unchanged
  const barHode = vurderRamme(lagSyntetiskAnsikt(), matrise, 640, 480)
  const medCaps = vurderRamme(lagSyntetiskAnsikt({ panneY: -0.7 }), matrise, 640, 480)
  assert.ok(Math.abs(medCaps.total! - barHode.total!) < 0.3, `bar=${barHode.total} caps=${medCaps.total}`)
  assert.equal(medCaps.delpoeng!.symmetri, barHode.delpoeng!.symmetri)

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

  // Yaw and pitch outside 3D-compensated frontal window (30° yaw / 26° pitch)
  const snudd = vurderRamme(ansikt, lagRotasjonsMatrise(32, 0, 0), 640, 480)
  assert.equal(snudd.gyldig, false)
  assert.equal(snudd.veiledning, "snu-rett")

  const nikket = vurderRamme(ansikt, lagRotasjonsMatrise(0, -28, 0), 640, 480)
  assert.equal(nikket.gyldig, false)
  assert.equal(nikket.veiledning, "snu-rett")

  // Excessive head tilt (> 24°)
  const vippet = vurderRamme(lagSyntetiskAnsikt({ rollGrader: 27 }), lagRotasjonsMatrise(0, 0, 27), 640, 480)
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
  // Monotonic across 0–10, and strictly increasing across the entire practical range [2, 10]
  let forrige = -1
  for (let raa = 0; raa <= 10; raa += 0.25) {
    const k = kalibrerPoeng(raa)
    assert.ok(raa >= 2 ? k > forrige : k >= forrige, `raa=${raa}`)
    assert.ok(k >= 0 && k <= 10)
    forrige = k
  }
  // A 1-point raw gap in the crowded middle becomes a much bigger visible gap
  assert.ok(kalibrerPoeng(7.3) - kalibrerPoeng(6.3) > 3.0)
  // Spread across the rank ladder: weak → Bjeffern, typical webcam raw ~6.8 → 5.0 (Normie), strong ~7.8 → ~8.1, elite 9.0 → 9+
  const lik = (n: number): DelpoengKart => ({
    symmetri: n,
    oyevinkel: n,
    kjevelinje: n,
    midtansikt: n,
    ansiktstredjedeler: n,
    oyeavstand: n,
    harmoni: n,
  })
  assert.equal(rangForPoeng(regnTotal(lik(4.8))).tittel, "Bjeffern")
  assert.ok(regnTotal(lik(6.8)) >= 4.9 && regnTotal(lik(6.8)) <= 5.1, `snitt=${regnTotal(lik(6.8))}`)
  assert.ok(regnTotal(lik(7.8)) >= 7.5 && regnTotal(lik(7.8)) < 8.8, `sterk=${regnTotal(lik(7.8))}`)
  assert.ok(regnTotal(lik(9.0)) >= 9, `elite=${regnTotal(lik(9.0))}`)
  assert.equal(regnRaaPoeng(lik(7)), 7)
  // Bonus is added after calibration and the final total is clamped to [0, 10]
  assert.equal(regnTotal(lik(10), 2.45), 10)
  assert.equal(regnTotal(lik(0), -3), 0)
  assert.ok(regnTotal(lik(6.8), 0.8) > regnTotal(lik(6.8)))

  // Slightly non-ideal realistic face shouldn't get pinned near 10 on the 5 tightened sub-scores
  const normieAnsikt = vurderRamme(
    lagSyntetiskAnsikt({ asymX: 0.04, tiltGrader: 1.5, oyeHoyde: 0.18, kinnHalv: 1.24, midtansiktY: 1.12, hakeY: 1.98 }),
    lagRotasjonsMatrise(0, 0, 0),
    640,
    480,
  )
  assert.ok(normieAnsikt.delpoeng)
  assert.ok(normieAnsikt.delpoeng.symmetri < 9.0, `symmetri=${normieAnsikt.delpoeng.symmetri}`)
  assert.ok(normieAnsikt.delpoeng.oyevinkel < 8.0, `oyevinkel=${normieAnsikt.delpoeng.oyevinkel}`)
  assert.ok(normieAnsikt.delpoeng.midtansikt < 8.5, `midtansikt=${normieAnsikt.delpoeng.midtansikt}`)
  assert.ok(normieAnsikt.delpoeng.oyeavstand < 8.5, `oyeavstand=${normieAnsikt.delpoeng.oyeavstand}`)
  assert.ok(normieAnsikt.delpoeng.ansiktstredjedeler < 8.5, `tredjedeler=${normieAnsikt.delpoeng.ansiktstredjedeler}`)
})

test("Moggern mog-uttrykk: hvilende ansikt gir 0, posering gir moderat bonus og grimaser senker scoren gradvis", () => {
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

  // The Rock: one eyebrow raised (difference ≥ 0.62 → smooth ~+0.52)
  const rock = regnMogUttrykk({ ...hvile, browOuterUpLeft: 0.85, browOuterUpRight: 0.1 })
  assert.equal(rock.styrker["the-rock"], 1)
  assert.ok(rock.bonus > 0.48 && rock.bonus <= 0.55, `rock=${rock.bonus}`)
  // Both eyebrows up is NOT The Rock
  assert.equal(regnMogUttrykk({ ...hvile, browOuterUpLeft: 0.85, browOuterUpRight: 0.8 }).styrker["the-rock"], 0)

  // Jegerøyne: squint without blinking; closing the eyes cancels it
  const jeger = regnMogUttrykk({ ...hvile, eyeSquintLeft: 0.9, eyeSquintRight: 0.88 })
  assert.ok(jeger.bonus > 0.4 && jeger.bonus <= 0.45, `jeger=${jeger.bonus}`)
  assert.equal(regnMogUttrykk({ ...hvile, eyeSquintLeft: 0.9, eyeSquintRight: 0.88, eyeBlinkLeft: 0.9, eyeBlinkRight: 0.85 }).bonus, 0)

  // Innsugde kinn: pucker with closed mouth and no smile; open jaw cancels it and triggers Munn-puster penalty
  const kinn = regnMogUttrykk({ ...hvile, mouthPucker: 0.9 })
  assert.ok(kinn.bonus > 0.35 && kinn.bonus <= 0.4, `kinn=${kinn.bonus}`)
  const gapPucker = regnMogUttrykk({ ...hvile, mouthPucker: 0.9, jawOpen: 0.5 })
  assert.equal(gapPucker.styrker["innsugde-kinn"], 0)
  assert.ok(gapPucker.bonus < -1.0 && gapPucker.bonus > -2.0, `gapPucker=${gapPucker.bonus}`)

  // Mewing: jaw forward counts double, or pressed lips
  const mew = regnMogUttrykk({ ...hvile, jawForward: 0.36 })
  assert.ok(mew.bonus > 0.3 && mew.bonus <= 0.35, `mew=${mew.bonus}`)
  assert.ok(regnMogUttrykk({ ...hvile, mouthPressLeft: 0.6, mouthPressRight: 0.6 }).bonus > 0.15)

  // Gradual anti-mog penalties: each pulls down noticeably without instantly slamming a normie (5.0) to 0.0
  const smil = regnMogUttrykk({ ...hvile, mouthSmileLeft: 0.9, mouthSmileRight: 0.85 })
  const ballong = regnMogUttrykk({ ...hvile, cheekPuff: 0.8 })
  const gap = regnMogUttrykk({ ...hvile, jawOpen: 0.7 })
  const grimase = regnMogUttrykk({ ...hvile, noseSneerLeft: 0.8 })
  const bytte = regnMogUttrykk({ ...hvile, eyeWideLeft: 0.8, eyeWideRight: 0.8 })
  const geip = regnMogUttrykk({ ...hvile, mouthFrownLeft: 0.8, mouthFrownRight: 0.8 })
  assert.ok(smil.bonus < -0.8 && smil.bonus > -1.2, `smil=${smil.bonus}`)
  assert.ok(ballong.bonus < -1.1 && ballong.bonus > -1.6, `ballong=${ballong.bonus}`)
  assert.ok(gap.bonus < -1.3 && gap.bonus > -1.9, `gap=${gap.bonus}`)
  assert.ok(grimase.bonus < -1.5 && grimase.bonus > -2.2, `grimase=${grimase.bonus}`)
  assert.ok(bytte.bonus < -1.1 && bytte.bonus > -1.6, `bytte=${bytte.bonus}`)
  assert.ok(geip.bonus < -1.0 && geip.bonus > -1.4, `geip=${geip.bonus}`)

  // Making a grimace cancels ALL positive mog bonuses and stacks smoothly with diminishing returns
  const styggGrimase = regnMogUttrykk({
    ...hvile,
    eyeSquintLeft: 0.9,
    eyeSquintRight: 0.9,
    mouthPucker: 0.9,
    jawOpen: 0.65,
    noseSneerLeft: 0.85,
    eyeWideLeft: 0.75,
    eyeWideRight: 0.75,
    cheekPuff: 0.7,
    mouthFrownLeft: 0.75,
    mouthFrownRight: 0.75,
  })
  assert.equal(styggGrimase.styrker.jegeroyne, 0)
  assert.equal(styggGrimase.styrker["innsugde-kinn"], 0)
  // Soft-capped well above -4.2 so a normie (5.0) lands in Bjeffern (~1.3) rather than instantly hitting 0.0
  assert.ok(styggGrimase.bonus <= -3.3 && styggGrimase.bonus >= MIN_UTTRYKK_BONUS, `styggGrimase=${styggGrimase.bonus}`)
  const normieDelpoeng: DelpoengKart = {
    symmetri: 6.8,
    oyevinkel: 6.8,
    kjevelinje: 6.8,
    midtansikt: 6.8,
    ansiktstredjedeler: 6.8,
    oyeavstand: 6.8,
    harmoni: 6.8,
  }
  const normieGrimaseScore = regnTotal(normieDelpoeng, styggGrimase.bonus)
  assert.equal(rangForPoeng(normieGrimaseScore).tittel, "Bjeffern")
  assert.ok(normieGrimaseScore >= 0.8 && normieGrimaseScore <= 2.2, `normieGrimase=${normieGrimaseScore}`)

  // Ramp is smooth and monotonic between thresholds
  assert.equal(rampe(0.3, 0.3, 0.65), 0)
  assert.equal(rampe(0.65, 0.3, 0.65), 1)
  assert.ok(Math.abs(rampe(0.475, 0.3, 0.65) - 0.5) < 1e-9)

  // Everything positive at once stays smoothly below the soft cap (natural bone structure remains primary)
  const alt = regnMogUttrykk({
    browOuterUpLeft: 1,
    eyeSquintLeft: 1,
    eyeSquintRight: 1,
    mouthPucker: 1,
    jawForward: 1,
  })
  assert.ok(alt.bonus > 1.0 && alt.bonus <= MAKS_UTTRYKK_BONUS, `alt=${alt.bonus}`)
  assert.equal(MAKS_UTTRYKK_BONUS, 1.4)
  assert.equal(MIN_UTTRYKK_BONUS, -4.2)
  assert.equal(formaterBonus(0.55), "+0,6")
  assert.equal(formaterBonus(-1.6), "−1,6")
})

test("Moggern live-poeng og duell: eksponentiell glatting og bonus som må holdes gjennom målingen", () => {
  assert.equal(glattEksponentielt(null, 5, 0.3), 5)
  assert.ok(Math.abs(glattEksponentielt(5, 10, 0.3) - 6.5) < 1e-9)
  const blandet = bonusForStyrker({
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
  })
  assert.ok(blandet < -0.3 && blandet > -0.6, `blandet=${blandet}`)

  const matrise = lagRotasjonsMatrise(0, 0, 0)
  const ansikt = lagSyntetiskAnsikt()
  const rolig = vurderRamme(ansikt, matrise, 640, 480)
  const rock = vurderRamme(ansikt, matrise, 640, 480, { browOuterUpLeft: 0.9, browOuterUpRight: 0.05 })
  assert.equal(rolig.uttrykk!.bonus, 0)
  assert.ok(rock.uttrykk!.bonus > 0.48 && rock.uttrykk!.bonus <= 0.55, `rock=${rock.uttrykk!.bonus}`)
  assert.deepEqual(rock.delpoeng, rolig.delpoeng)

  // Live HUD reacts smoothly across frames without snapping instantaneously
  const tilstand: LivePoengTilstand = { struktur: null, styrker: null }
  const forste = oppdaterLivePoeng(tilstand, vurderRamme(lagSyntetiskAnsikt({ asymX: 0.2 }), matrise, 640, 480))!
  assert.ok(forste)
  assert.equal(forste.bonus, 0)
  const etterEn = oppdaterLivePoeng(tilstand, rock)!
  assert.ok(etterEn.bonus > 0 && etterEn.bonus < rock.uttrykk!.bonus)
  let siste = etterEn
  for (let i = 0; i < 30; i++) siste = oppdaterLivePoeng(tilstand, rock)!
  assert.ok(siste.bonus > 0.48, `bonus=${siste.bonus}`)
  assert.ok(siste.total > forste.total)
  assert.ok(siste.total <= 10)
  // Missing-face frames never update the live score
  assert.equal(oppdaterLivePoeng(tilstand, vurderRamme(null)), null)

  // Normal laptop/monitor webcam angle (e.g. 18° yaw, -18° pitch) counts as valid
  const normalVinkel = vurderRamme(ansikt, lagRotasjonsMatrise(18, -18, 0), 640, 480)
  assert.equal(normalVinkel.gyldig, true)
  assert.equal(normalVinkel.veiledning, "ok")

  // Extreme off-angle detected face (> 30° yaw) still initializes the live HUD, while official duel aggregation ignores it
  const skraTilstand: LivePoengTilstand = { struktur: null, styrker: null }
  const skraRamme = vurderRamme(ansikt, lagRotasjonsMatrise(34, 0, 0), 640, 480)
  assert.equal(skraRamme.gyldig, false)
  assert.equal(skraRamme.veiledning, "snu-rett")
  assert.ok(oppdaterLivePoeng(skraTilstand, skraRamme) !== null)
  assert.equal(aggregerRammer(Array.from({ length: 20 }, () => skraRamme)).ok, false)

  // Duel aggregation: holding The Rock all 10 s earns the bonus; a 2-frame flash does not
  const holdt = aggregerRammer(Array.from({ length: 30 }, () => rock))
  assert.equal(holdt.ok, true)
  assert.ok(holdt.uttrykkBonus > 0.45, `holdt=${holdt.uttrykkBonus}`)
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

  // Camera switcher passes exact deviceId first and falls back on OverconstrainedError
  const byttKall: MediaStreamConstraints[] = []
  await hentKameraStrom(async (c) => {
    byttKall.push(c)
    return strom
  }, "cam-2")
  assert.deepEqual(byttKall, [{ video: { deviceId: { exact: "cam-2" }, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }])

  // Opt-in microphone requests audio-only constraints with echo cancellation
  const mikKall: MediaStreamConstraints[] = []
  const mik = await hentMikrofonStrom(async (c) => {
    mikKall.push(c)
    return strom
  })
  assert.equal(mik, strom)
  assert.deepEqual(mikKall, [MIKROFON_ONSKER])
})

test("Moggern 15s-oppgradering: uttrykkSnitt, uttrykkDom, rom-stilling og dagens beste", () => {
  assert.equal(MALING_MS, 15_000)

  // uttrykkSnitt aggregates dominant expression cleanly and drives uttrykkDom
  const matrise = lagRotasjonsMatrise(0, 0, 0)
  const ansikt = lagSyntetiskAnsikt()
  const jegerRamme = vurderRamme(ansikt, matrise, 640, 480, { eyeSquintLeft: 0.9, eyeSquintRight: 0.88 })
  const samlet = aggregerRammer(Array.from({ length: 24 }, () => jegerRamme))
  assert.equal(samlet.ok, true)
  assert.ok(samlet.uttrykkSnitt.jegeroyne >= 0.8, `jegeroyne=${samlet.uttrykkSnitt.jegeroyne}`)
  const domPos = uttrykkDom(samlet.uttrykkSnitt)
  assert.ok(domPos && domPos.id === "jegeroyne" && domPos.positiv === true)
  assert.match(domPos.tekst, /Jegerøyne/)

  const smilDom = uttrykkDom({ smiler: 0.72 })
  assert.ok(smilDom && smilDom.id === "smiler" && smilDom.positiv === false)
  assert.match(smilDom.tekst, /glise/)
  assert.equal(uttrykkDom({ jegeroyne: 0.1 }), null)
  assert.equal(uttrykkDom(null), null)

  // uttrykkSnitt survives report serialization and rejects out-of-range values
  const baseMaaling: SpillerMaaling = {
    ok: true,
    total: 7.5,
    delpoeng: { symmetri: 8, oyevinkel: 8, kjevelinje: 8, midtansikt: 8, ansiktstredjedeler: 8, oyeavstand: 8, harmoni: 8 },
    uttrykkBonus: 0.4,
    uttrykkSnitt: { jegeroyne: 0.82, smiler: 0 },
    lysStatus: "ok",
    kvalitet: { antallRammer: 40, gyldigeRammer: 32, snittAbsYaw: 2, snittAbsPitch: 2, snittIpdAndel: 0.24, stabilitet: 0.2 },
  }
  const lest = lesMoggernRapport({ runde: 0, av: "a", egen: baseMaaling, motstander: null })
  assert.ok(lest?.egen?.uttrykkSnitt)
  assert.equal(lest.egen.uttrykkSnitt.jegeroyne, 0.82)
  assert.equal(lest.egen.uttrykkSnitt.smiler, undefined)
  assert.equal(lesMoggernRapport({ runde: 0, av: "a", egen: { ...baseMaaling, uttrykkSnitt: { jegeroyne: 5 } }, motstander: null }), null)

  // Running room series tally increments winner, preserves across rematches, and parses cleanly
  const s0 = moggernStart(0)
  assert.deepEqual(s0.stilling, {})
  const st1 = oppdaterStilling(s0.stilling, { spillere: [], vinnerId: "a", uavgjort: false, beggeHarResultat: true })
  const st2 = oppdaterStilling(st1, { spillere: [], vinnerId: "a", uavgjort: false, beggeHarResultat: true })
  const st3 = oppdaterStilling(st2, { spillere: [], vinnerId: null, uavgjort: true, beggeHarResultat: true })
  assert.deepEqual(st3, { a: 2 })
  const nesteRunde = moggernStart(1, st3)
  assert.deepEqual(nesteRunde.stilling, { a: 2 })
  assert.deepEqual(lesMoggernStatus(nesteRunde)?.stilling, { a: 2 })
  // Backwards compatibility when older status has no stilling field
  const { stilling: _utenStilling, ...gammelStatus } = s0
  void _utenStilling
  assert.deepEqual(lesMoggernStatus(gammelStatus)?.stilling, {})

  // Daily best score helper keeps highest per Oslo date and resets next day
  const dag1 = "2026-11-23"
  const dag2 = "2026-11-24"
  const r1 = oppdaterDagensBesteVerdi(null, 6.8, "solo", dag1)
  assert.equal(r1.nyRekord, true)
  assert.deepEqual(r1.verdi, { dato: dag1, poeng: 6.8, modus: "solo" })
  const r2 = oppdaterDagensBesteVerdi(r1.verdi, 6.2, "duell", dag1)
  assert.equal(r2.nyRekord, false)
  assert.equal(r2.verdi.poeng, 6.8)
  const r3 = oppdaterDagensBesteVerdi(r2.verdi, 8.1, "duell", dag1)
  assert.equal(r3.nyRekord, true)
  assert.deepEqual(r3.verdi, { dato: dag1, poeng: 8.1, modus: "duell" })
  assert.deepEqual(lesDagensBesteFraTekst(JSON.stringify(r3.verdi), dag1), r3.verdi)
  assert.equal(lesDagensBesteFraTekst(JSON.stringify(r3.verdi), dag2), null)
  const r4 = oppdaterDagensBesteVerdi(r3.verdi, 5.4, "solo", dag2)
  assert.equal(r4.nyRekord, true)
  assert.deepEqual(r4.verdi, { dato: dag2, poeng: 5.4, modus: "solo" })
})

test("Moggern 3D-kompensering: rotasjon i yaw, pitch og roll bevarer alle 7 delpoeng og speiling", () => {
  const bredde = 640
  const hoyde = 480
  const roter3D = (punkter: readonly Punkt3D[], yaw: number, pitch: number, roll: number): Punkt3D[] => {
    const m = lagRotasjonsMatrise(yaw, pitch, roll)
    const cx = bredde / 2
    const cy = hoyde * 0.44
    return punkter.map((p) => {
      const dx = p.x * bredde - cx
      const dy = p.y * hoyde - cy
      const dz = (p.z ?? 0) * bredde
      // Column-major R * [dx, dy, dz]
      const rx = m[0] * dx + m[4] * dy + m[8] * dz
      const ry = m[1] * dx + m[5] * dy + m[9] * dz
      const rz = m[2] * dx + m[6] * dy + m[10] * dz
      return { x: (cx + rx) / bredde, y: (cy + ry) / hoyde, z: rz / bredde }
    })
  }

  const rett = lagSyntetiskAnsikt({ bredde, hoyde })
  const grunn = vurderRamme(rett, lagRotasjonsMatrise(0, 0, 0), bredde, hoyde)
  assert.equal(grunn.gyldig, true)

  // Simultaneous 3D head turn (yaw 22°, pitch -16°, roll 11°) inside the new 30°/26°/24° gate
  const rotert = roter3D(rett, 22, -16, 11)
  const res3D = vurderRamme(rotert, lagRotasjonsMatrise(22, -16, 11), bredde, hoyde)
  assert.equal(res3D.gyldig, true)
  assert.equal(res3D.veiledning, "ok")
  assert.deepEqual(res3D.delpoeng, grunn.delpoeng)
  assert.equal(res3D.total, grunn.total)

  // Mirrored + rotated in 3D also recovers identical canonical scores
  const speilet3D = roter3D(lagSyntetiskAnsikt({ bredde, hoyde, speilet: true }), -24, 18, -9)
  const resSpeilet3D = vurderRamme(speilet3D, lagRotasjonsMatrise(-24, 18, -9), bredde, hoyde)
  assert.equal(resSpeilet3D.gyldig, true)
  assert.deepEqual(resSpeilet3D.delpoeng, grunn.delpoeng)
  assert.equal(resSpeilet3D.total, grunn.total)

  // Once live HUD is initialized, an extreme off-angle frame freezes structural score instead of tanking it
  const tilstand: LivePoengTilstand = { struktur: null, styrker: null }
  const start = oppdaterLivePoeng(tilstand, grunn)!
  const ekstrem = vurderRamme(lagSyntetiskAnsikt({ asymX: 0.25 }), lagRotasjonsMatrise(38, 0, 0), bredde, hoyde)
  assert.equal(ekstrem.gyldig, false)
  const etterEkstrem = oppdaterLivePoeng(tilstand, ekstrem)!
  assert.equal(etterEkstrem.strukturPoeng, start.strukturPoeng)
})

test("Moggern Rizzler Finisher: peke-på-hake-gest, åpen hånd avvises og finisherBonus verifiseres i rapport", () => {
  const ansikt = lagSyntetiskAnsikt()
  const hake = ansikt[PUNKTER.hake]

  const lagHand = (opts: { pekeTipp: Punkt3D; aapenHand?: boolean }): Punkt3D[] => {
    const hand: Punkt3D[] = Array.from({ length: 21 }, () => ({ x: hake.x, y: hake.y + 0.28, z: 0 }))
    // Wrist below chin
    hand[0] = { x: hake.x, y: hake.y + 0.3, z: 0 }
    // Index finger pointing toward pekeTipp
    hand[6] = { x: (hand[0].x + opts.pekeTipp.x) / 2, y: (hand[0].y + opts.pekeTipp.y) / 2, z: 0 }
    hand[8] = opts.pekeTipp
    // Middle/ring/pinky either curled near wrist or stretched out (open palm)
    for (const tipIdx of [12, 16, 20]) {
      hand[tipIdx] = opts.aapenHand
        ? { x: opts.pekeTipp.x + 0.02, y: opts.pekeTipp.y, z: 0 }
        : { x: hand[0].x + 0.02, y: hand[0].y - 0.08, z: 0 }
    }
    return hand
  }

  // Index finger pointing right at the chin -> active!
  const treff = erRizzlerPose([lagHand({ pekeTipp: { x: hake.x + 0.01, y: hake.y - 0.01, z: 0 } })], ansikt, 640, 480)
  assert.equal(treff.aktiv, true)
  assert.ok(treff.avstandAndel !== null && treff.avstandAndel < 0.1)

  // Open palm near chin -> rejected (prevents accidental wave triggers)
  const aapen = erRizzlerPose([lagHand({ pekeTipp: hake, aapenHand: true })], ansikt, 640, 480)
  assert.equal(aapen.aktiv, false)

  // Index finger far away from the face -> rejected
  const langtUnna = erRizzlerPose([lagHand({ pekeTipp: { x: 0.05, y: 0.05, z: 0 } })], ansikt, 640, 480)
  assert.equal(langtUnna.aktiv, false)

  // Strict finisherBonus & Realtime event parsing
  assert.equal(lesFinisherBonus(undefined), 0)
  assert.equal(lesFinisherBonus(0), 0)
  assert.equal(lesFinisherBonus(RIZZLER_BONUS), RIZZLER_BONUS)
  assert.equal(lesFinisherBonus(RIZZLER_FEIL_STRAFF), RIZZLER_FEIL_STRAFF)
  assert.equal(lesFinisherBonus(0.9), null)
  assert.equal(lesFinisherBonus(-1.0), null)

  assert.deepEqual(lesRizzlerHendelse({ runde: 1, av: "spiller-1", type: "utlost", navn: "Ola" }), {
    runde: 1,
    av: "spiller-1",
    type: "utlost",
    navn: "Ola",
  })
  assert.equal(lesRizzlerHendelse({ runde: 1, av: "spiller-1", type: "jukse", navn: "Ola" }), null)

  // Report parsing includes finisherBonus in recomputed total and rejects tampered bonuses
  const delpoeng: DelpoengKart = {
    symmetri: 7,
    oyevinkel: 7,
    kjevelinje: 7,
    midtansikt: 7,
    ansiktstredjedeler: 7,
    oyeavstand: 7,
    harmoni: 7,
  }
  const grunnMaaling: SpillerMaaling = {
    ok: true,
    total: 0,
    delpoeng,
    uttrykkBonus: 0.2,
    finisherBonus: RIZZLER_BONUS,
    lysStatus: "ok",
    kvalitet: { antallRammer: 40, gyldigeRammer: 32, snittAbsYaw: 4, snittAbsPitch: 3, snittIpdAndel: 0.22, stabilitet: 0.2 },
  }
  const lest = lesMoggernRapport({ runde: 0, av: "a", egen: grunnMaaling, motstander: null })
  assert.ok(lest?.egen)
  assert.equal(lest.egen.finisherBonus, RIZZLER_BONUS)
  assert.equal(lest.egen.total, regnTotal(delpoeng, 0.2, RIZZLER_BONUS))
  assert.equal(
    lesMoggernRapport({ runde: 0, av: "a", egen: { ...grunnMaaling, finisherBonus: 2.5 }, motstander: null }),
    null,
  )
})

test("Moggern kurerte disser: riktig utvalg og nedprioritering av ansiktstredjedeler", () => {
  assert.equal(LYS_DISSER.overeksponert.length, 5)
  assert.equal(LYS_DISSER.undereksponert.length, 3)
  assert.equal(DELPOENG_DISSER.oyevinkel.length, 5)
  assert.equal(DELPOENG_DISSER.symmetri.length, 3)
  assert.equal(DELPOENG_DISSER.midtansikt.length, 2)
  assert.equal(DELPOENG_DISSER.oyeavstand.length, 2)
  assert.equal(DELPOENG_DISSER.harmoni.length, 1)
  assert.ok(DELPOENG_DISSER.symmetri.includes("Picasso ringte — karakteren fra maleriet hans har rømt."))
  assert.ok(DELPOENG_DISSER.oyeavstand.includes("Den øyeavstanden … bruk solbriller du."))
  assert.ok(DELPOENG_DISSER.kjevelinje.some((d) => d.includes("dårlig for moggen")))

  // When ansiktstredjedeler is only slightly weakest (< 1.8 gap), pick the second-weakest sub-score instead
  const littSvakTredjedeler: DelpoengKart = {
    symmetri: 7.5,
    oyevinkel: 7.2,
    kjevelinje: 6.1,
    midtansikt: 7.4,
    ansiktstredjedeler: 5.5,
    oyeavstand: 7.3,
    harmoni: 7.1,
  }
  const td1 = lagTipsOgDiss({ delpoeng: littSvakTredjedeler, lysStatus: "ok", fro: "TEST:1" })
  assert.ok(DELPOENG_DISSER.kjevelinje.includes(td1.diss), `forventet kjevelinje-diss, fikk: ${td1.diss}`)

  // Only when ansiktstredjedeler is dramatically weakest (>= 1.8 gap) does it roast thirds
  const veldigSvakTredjedeler: DelpoengKart = { ...littSvakTredjedeler, ansiktstredjedeler: 3.2 }
  const td2 = lagTipsOgDiss({ delpoeng: veldigSvakTredjedeler, lysStatus: "ok", fro: "TEST:2" })
  assert.ok(DELPOENG_DISSER.ansiktstredjedeler.includes(td2.diss), `forventet tredjedel-diss, fikk: ${td2.diss}`)

  // General cooked roasts only trigger on low total (< 4.5) or getting mogged hard (>= 1.5)
  assert.equal(COOKED_DISSER.length, 4)
  assert.ok(COOKED_DISSER.includes("Du er cooked … kom deg på seminar med Datingcoach Norge."))

  const lavScoreDiss = lagTipsOgDiss({ delpoeng: littSvakTredjedeler, lysStatus: "ok", total: 3.8, fro: "COOK:1" })
  assert.equal(lavScoreDiss.dissFraLys, false)
  assert.ok(COOKED_DISSER.includes(lavScoreDiss.diss), `forventet cooked-diss ved lav score, fikk: ${lavScoreDiss.diss}`)

  const hardtMoggetDiss = lagTipsOgDiss({
    delpoeng: littSvakTredjedeler,
    lysStatus: "ok",
    total: 6.2,
    moggetMed: 1.8,
    fro: "COOK:2",
  })
  assert.ok(COOKED_DISSER.includes(hardtMoggetDiss.diss), `forventet cooked-diss når mogget hardt, fikk: ${hardtMoggetDiss.diss}`)

  // Regular rounds (not cooked) always roast a specific sub-score
  for (let i = 0; i < 25; i++) {
    const mid = lagTipsOgDiss({ delpoeng: littSvakTredjedeler, lysStatus: "ok", total: 6.1, moggetMed: 0.4, fro: `MID:${i}` })
    assert.ok(DELPOENG_DISSER.kjevelinje.includes(mid.diss), `forventet spesifikk diss, fikk: ${mid.diss}`)
  }
})

test("Moggern 5G/Wi-Fi: Cloudflare/Metered TURN-støtte, port-53-filtrering og WSS relay-validering", async () => {
  // Port 53 URLs are stripped because browsers block them
  const norm = normaliserIceTjenere([
    {
      urls: [
        "turn:turn.cloudflare.com:53?transport=udp",
        "turn:turn.cloudflare.com:3478?transport=udp",
        "turns:turn.cloudflare.com:443?transport=tcp",
        "javascript:alert(1)",
      ],
      username: "cf-user",
      credential: "cf-pass",
    },
  ])
  assert.equal(norm.harTurn, true)
  assert.deepEqual(norm.tjenere[0].urls, [
    "turn:turn.cloudflare.com:3478?transport=udp",
    "turns:turn.cloudflare.com:443?transport=tcp",
  ])

  // Cloudflare Realtime TURN is only called for logged-in users
  let cfKall = 0
  const cfFetch = (async () => {
    cfKall++
    return new Response(
      JSON.stringify({
        iceServers: [
          {
            urls: ["turn:turn.cloudflare.com:3478?transport=udp", "turns:turn.cloudflare.com:443?transport=tcp"],
            username: "u1",
            credential: "p1",
          },
        ],
      }),
      { status: 201 },
    )
  }) as typeof fetch

  const utlogget = await hentIceKonfig(
    { MOGGERN_CF_TURN_KEY_ID: "kid", MOGGERN_CF_TURN_API_TOKEN: "tok" },
    false,
    cfFetch,
  )
  assert.equal(utlogget.harTurn, false)
  assert.equal(cfKall, 0)

  const innloggetCf = await hentIceKonfig(
    { MOGGERN_CF_TURN_KEY_ID: "kid", MOGGERN_CF_TURN_API_TOKEN: "tok" },
    true,
    cfFetch,
  )
  assert.equal(innloggetCf.harTurn, true)
  assert.equal(cfKall, 1)
  assert.equal(innloggetCf.iceServers.length, STANDARD_STUN.length + 1)

  // Metered TURN API fallback works when Cloudflare is not configured
  const meteredFetch = (async () =>
    new Response(
      JSON.stringify([
        { urls: "turns:global.relay.metered.ca:443?transport=tcp", username: "m-user", credential: "m-pass" },
      ]),
      { status: 200 },
    )) as typeof fetch
  const innloggetMetered = await hentIceKonfig(
    { MOGGERN_METERED_DOMAIN: "demo.metered.live", MOGGERN_METERED_API_KEY: "m-key" },
    true,
    meteredFetch,
  )
  assert.equal(innloggetMetered.harTurn, true)
  assert.equal(innloggetMetered.iceServers.length, STANDARD_STUN.length + 1)

  // Relay frame validator accepts valid compact JPEGs and rejects oversized/non-JPEG payloads
  const okRamme = lesRelayRamme({ av: "spiller-2", dataUrl: "data:image/jpeg;base64,AAAA", w: 240, h: 180 })
  assert.deepEqual(okRamme, { av: "spiller-2", dataUrl: "data:image/jpeg;base64,AAAA", w: 240, h: 180 })
  assert.equal(lesRelayRamme({ av: "spiller-2", dataUrl: "data:image/png;base64,AAAA", w: 240, h: 180 }), null)
  assert.equal(lesRelayRamme({ av: "spiller-2", dataUrl: "data:image/jpeg;base64," + "A".repeat(60_000), w: 240, h: 180 }), null)
  assert.equal(lesRelayRamme({ av: "spiller-2", dataUrl: "data:image/jpeg;base64,AAAA", w: 1200, h: 900 }), null)
})
