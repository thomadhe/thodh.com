import "server-only"

import { kanSpilles } from "../dag"
import { landEtterId } from "../geografi-svar"
import { ANTALL as GJ_ANTALL, formaterPoeng, MAKS_SUM, summer } from "../gjettelos"
import { MAKS_POENG, rundePoeng } from "../heksagon"
import { nivaaFor } from "../heksagon-celler"
import { dagensMerEllerMindre } from "../mer-eller-mindre"
import { forsteDag } from "../ruting"
import { erLost, mellomland } from "../rusle"
import { SANG_KATEGORIER, TRINN } from "../sanglos"
import { normaliserSok, SOKET_FORSOK, vurderOrd } from "../soket"
import { erServerSpill } from "../sosial"
import type { SpillId } from "../spill"
import { dagensStavebien } from "../stavebien"
import { erRiktigStavet, LIV as STAVE_LIV } from "../stavebien-regler"
import { GJENTA_DM, hoppDm, meter, NORMALE } from "../stegern"
import { fasit as anelseslosFasit, normaliser as normaliserAnelseslos } from "./anelseslos"
import { dagensFlagg } from "./canvas"
import { dagensFilm, enkelTittel } from "./emovi"
import { kanSpillesGjettelos, vurder as vurderGjettelos } from "./gjettelos"
import { dagensHavet } from "./havet"
import { STEDER_PER_DAG, vurderGjetning as vurderHeks } from "./heksagonal-jakt"
import { dagensOmriss } from "./omriss"
import { lesBevis } from "./resultat-signatur"
import { dagensTur } from "./rusle"
import { dagensSang, finnSang, vurderGjett as vurderSang } from "./sanglos"
import { dagensSok } from "./soket"
import { erGjentatt, kanSpillesStegern, sjetteNr, vurderSvar } from "./stegern"
import { dagensTilkoblinger } from "./tilkoblinger"

export type VerifisertLagring = {
  spillId: SpillId
  dato: string
  status: "vunnet" | "tapt" | "ferdig"
  etikett: string
  poeng: number | null
  forsok: number | null
  hintAntall: number
  tidSek: number | null
  /** True only when backed by server-signed proof from a server-judged game. */
  verifisert: boolean
  detaljer: Record<string, unknown>
}

const erObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x)

/**
 * Verifies a client-submitted daily game state (used for client-checked games and offline->login sync):
 * - Server-judged games with a valid Ed25519 `bevis` token -> `verifisert: true` (counts for leaderboards).
 * - Client-checked games & unsigned legacy local saves -> recomputed server-side from raw moves for personal
 *   history with `verifisert: false` (never enters leaderboards).
 */
export function verifiserKlientResultat(
  spillId: SpillId,
  dato: string,
  tilstand: unknown,
  bevis?: unknown,
): VerifisertLagring | null {
  if (!kanSpilles(dato) || dato < forsteDag(spillId)) return null

  // 1. Server-judged game with a valid server-signed receipt (`bevis`): trusted for leaderboards!
  if (erServerSpill(spillId) && bevis) {
    const b = lesBevis(bevis)
    if (b && b.sp === spillId && b.d === dato) {
      return {
        spillId,
        dato,
        status: b.status,
        etikett: b.etikett,
        poeng: b.poeng,
        forsok: b.forsok,
        hintAntall: b.hint,
        tidSek: b.tidSek,
        verifisert: true,
        detaljer: {},
      }
    }
  }

  if (!erObj(tilstand)) return null

  // 2. Recompute from raw moves/guesses on the server (history-only, `verifisert: false`).
  switch (spillId) {
    case "mer-eller-mindre": {
      const svar = tilstand.svar
      if (!Array.isArray(svar)) return null
      const runder = dagensMerEllerMindre(dato).flatMap((k) => k.runder)
      if (svar.length !== runder.length || !svar.every((x) => x === 0 || x === 1)) return null
      const poeng = svar.filter((x, i) => x === runder[i].fasit).length
      return {
        spillId,
        dato,
        status: "ferdig",
        etikett: `${poeng}/${runder.length}`,
        poeng,
        forsok: runder.length,
        hintAntall: 0,
        tidSek: null,
        verifisert: false,
        detaljer: { totalt: runder.length },
      }
    }

    case "stavebien": {
      const svar = tilstand.svar
      if (!Array.isArray(svar) || !svar.every((s) => typeof s === "string" && s.length <= 80)) return null
      const ord = dagensStavebien(dato)
      if (svar.length === 0 || svar.length > ord.length) return null
      let riktige = 0
      let feil = 0
      for (let i = 0; i < svar.length; i++) {
        if (erRiktigStavet(svar[i], ord[i])) riktige++
        else feil++
      }
      if (svar.length < ord.length && feil < STAVE_LIV) return null
      return {
        spillId,
        dato,
        status: riktige === ord.length ? "vunnet" : "ferdig",
        etikett: `${riktige}/${ord.length}`,
        poeng: riktige,
        forsok: svar.length,
        hintAntall: 0,
        tidSek: null,
        verifisert: false,
        detaljer: { totalt: ord.length },
      }
    }

    case "omriss":
    case "canvas": {
      const gjetninger = tilstand.gjetninger
      if (!Array.isArray(gjetninger) || gjetninger.length === 0 || gjetninger.length > 6) return null
      if (!gjetninger.every((id) => typeof id === "string" && landEtterId.has(id))) return null
      if (new Set(gjetninger).size !== gjetninger.length) return null
      const fasitId = spillId === "omriss" ? dagensOmriss(dato).id : dagensFlagg(dato).id
      const treffIdx = gjetninger.indexOf(fasitId)
      if (treffIdx >= 0 && treffIdx !== gjetninger.length - 1) return null
      const vunnet = treffIdx === gjetninger.length - 1
      if (!vunnet && gjetninger.length < 6) return null
      const n = gjetninger.length
      return {
        spillId,
        dato,
        status: vunnet ? "vunnet" : "tapt",
        etikett: vunnet ? `${n}/6` : "X/6",
        poeng: vunnet ? 7 - n : 0,
        forsok: n,
        hintAntall: 0,
        tidSek: null,
        verifisert: false,
        detaljer: {},
      }
    }

    case "rusle": {
      const gjetninger = tilstand.gjetninger
      const hint = Array.isArray(tilstand.hint) ? tilstand.hint : []
      if (!Array.isArray(gjetninger) || gjetninger.length === 0 || gjetninger.length > 30) return null
      if (!gjetninger.every((id) => typeof id === "string" && landEtterId.has(id))) return null
      if (new Set(gjetninger).size !== gjetninger.length) return null
      const { fra, til } = dagensTur(dato)
      if (gjetninger.includes(fra) || gjetninger.includes(til)) return null
      const minst = mellomland(fra, til)
      const maks = minst + 5
      if (gjetninger.length > maks) return null
      const lost = erLost(fra, til, gjetninger)
      if (!lost && gjetninger.length < maks) return null
      const hintAntall = Math.min(3, hint.filter((x) => typeof x === "string").length)
      return {
        spillId,
        dato,
        status: lost ? "vunnet" : "tapt",
        etikett: lost ? `+${gjetninger.length - minst}` : "X",
        poeng: lost ? Math.max(0, 6 - (gjetninger.length - minst)) : 0,
        forsok: gjetninger.length,
        hintAntall,
        tidSek: null,
        verifisert: false,
        detaljer: { minst },
      }
    }

    case "havet": {
      const plassert = tilstand.plassert
      const oppgave = dagensHavet(dato)
      const n = oppgave.land.length
      if (!Array.isArray(plassert) || plassert.length !== n) return null
      const settLand = new Set<number>()
      const settKat = new Set<number>()
      let sum = 0
      for (const par of plassert) {
        if (!Array.isArray(par) || par.length !== 2) return null
        const [l, k] = par
        if (!Number.isInteger(l) || !Number.isInteger(k) || l < 0 || l >= n || k < 0 || k >= n) return null
        if (settLand.has(l) || settKat.has(k)) return null
        settLand.add(l)
        settKat.add(k)
        sum += oppgave.poeng[l][k]
      }
      return {
        spillId,
        dato,
        status: "ferdig",
        etikett: `${sum}/${oppgave.maks}`,
        poeng: sum,
        forsok: n,
        hintAntall: 0,
        tidSek: null,
        verifisert: false,
        detaljer: { maks: oppgave.maks },
      }
    }

    // ---- Legacy / unsigned local saves of server-judged games (history-only, `verifisert: false`) ----

    case "anelseslos": {
      const gjetninger = tilstand.gjetninger
      const res = erObj(tilstand.resultat) ? tilstand.resultat : null
      if (!Array.isArray(gjetninger) || gjetninger.length === 0 || gjetninger.length > 2000) return null
      const status = res?.status
      if (status !== "vunnet" && status !== "tapt") return null
      const ordListe = gjetninger
        .filter((g): g is { ord: string; hint?: boolean } => erObj(g) && typeof g.ord === "string")
        .map((g) => ({ ord: normaliserAnelseslos(g.ord), hint: Boolean(g.hint) }))
      const fasitOrd = anelseslosFasit(dato).ord
      const fant = ordListe.some((g) => g.ord === fasitOrd)
      if (status === "vunnet" && !fant) return null
      const forsok = ordListe.filter((g) => !g.hint).length
      const hintAntall = ordListe.length - forsok
      return {
        spillId,
        dato,
        status,
        etikett: status === "vunnet" ? `${forsok} gjetninger` : "Ga opp",
        poeng: status === "vunnet" ? forsok : null,
        forsok,
        hintAntall,
        tidSek: null,
        verifisert: false,
        detaljer: {},
      }
    }

    case "soket": {
      const rader = tilstand.rader
      if (!Array.isArray(rader) || rader.length === 0 || rader.length > SOKET_FORSOK) return null
      const sok = dagensSok(dato)
      let vunnet = false
      for (const r of rader) {
        if (!erObj(r) || typeof r.ord !== "string") return null
        const ord = normaliserSok(r.ord)
        if ([...ord].length !== [...sok.svar].length) return null
        if (vurderOrd(sok.svar, ord).every((f) => f === "riktig")) vunnet = true
      }
      if (!vunnet && rader.length < SOKET_FORSOK) return null
      const n = rader.length
      return {
        spillId,
        dato,
        status: vunnet ? "vunnet" : "tapt",
        etikett: vunnet ? `${n}/${SOKET_FORSOK}` : `X/${SOKET_FORSOK}`,
        poeng: vunnet ? SOKET_FORSOK + 1 - n : 0,
        forsok: n,
        hintAntall: 0,
        tidSek: null,
        verifisert: false,
        detaljer: {},
      }
    }

    case "emovi": {
      const gjetninger = tilstand.gjetninger
      const hint = tilstand.hint
      const res = erObj(tilstand.resultat) ? tilstand.resultat : null
      if (!Array.isArray(gjetninger) || !Array.isArray(hint) || hint.length > 3) return null
      const film = dagensFilm(dato)
      let vunnet = false
      let feil = 0
      for (const g of gjetninger) {
        if (!erObj(g) || typeof g.tittel !== "string" || typeof g.aar !== "number") return null
        const t = enkelTittel(g.tittel)
        const riktig = g.aar === film.aar && [film.tittel, film.originaltittel].some((x) => x && enkelTittel(x) === t)
        if (riktig) vunnet = true
        else feil++
      }
      const status = vunnet ? "vunnet" : res?.status === "tapt" ? "tapt" : null
      if (!status) return null
      const viaHint = Math.max(0, hint.length - feil)
      return {
        spillId,
        dato,
        status,
        etikett: status === "vunnet" ? `${hint.length + 1}/3` : "X/3",
        poeng: status === "vunnet" ? Math.max(1, 3 - hint.length) : 0,
        forsok: gjetninger.length,
        hintAntall: viaHint,
        tidSek: null,
        verifisert: false,
        detaljer: {},
      }
    }

    case "tilkoblinger": {
      const forsok = tilstand.forsok
      if (!Array.isArray(forsok) || forsok.length === 0 || forsok.length > 10) return null
      const { grupper } = dagensTilkoblinger(dato)
      const funnet = new Set<number>()
      let feil = 0
      for (const f of forsok) {
        if (!Array.isArray(f) || f.length !== 4 || !f.every((id) => typeof id === "string")) return null
        const sett = new Set(f)
        const gIdx = grupper.findIndex((g) => g.ider.every((id) => sett.has(id)))
        if (gIdx >= 0) funnet.add(gIdx)
        else feil++
      }
      const vunnet = funnet.size === 4
      if (!vunnet && feil < 4) return null
      return {
        spillId,
        dato,
        status: vunnet ? "vunnet" : "tapt",
        etikett: vunnet ? `${feil} feil` : `${funnet.size}/4`,
        poeng: vunnet ? Math.max(0, 4 - feil) : 0,
        forsok: forsok.length,
        hintAntall: 0,
        tidSek: null,
        verifisert: false,
        detaljer: { feil },
      }
    }

    case "sanglos": {
      const runder = tilstand.runder
      if (!erObj(runder)) return null
      let klart = 0
      let totalForsok = 0
      for (const { id } of SANG_KATEGORIER) {
        const r = runder[id]
        if (!erObj(r) || !Array.isArray(r.forsok) || r.forsok.length === 0 || r.forsok.length > TRINN.length) return null
        const sang = dagensSang(dato, id)
        let vunnet = false
        for (const f of r.forsok) {
          totalForsok++
          if (f === null) continue
          if (!erObj(f) || typeof f.id !== "string") return null
          const kjent = finnSang(f.id)
          const tittel = kjent?.title ?? (typeof f.tittel === "string" ? f.tittel : "")
          const artist = kjent?.artist ?? (typeof f.artist === "string" ? f.artist : "")
          if (kjent?.id === sang.id || (tittel && artist && vurderSang(sang, tittel, artist).riktig)) vunnet = true
        }
        if (!vunnet && r.forsok.length < TRINN.length) return null
        if (vunnet) klart++
      }
      const n = SANG_KATEGORIER.length
      return {
        spillId,
        dato,
        status: klart === n ? "vunnet" : klart > 0 ? "ferdig" : "tapt",
        etikett: `${klart}/${n}`,
        poeng: klart,
        forsok: totalForsok,
        hintAntall: 0,
        tidSek: null,
        verifisert: false,
        detaljer: {},
      }
    }

    case "heksagonal-jakt": {
      const runder = tilstand.runder
      if (!Array.isArray(runder) || runder.length !== STEDER_PER_DAG) return null
      let sum = 0
      let forsok = 0
      for (let i = 0; i < STEDER_PER_DAG; i++) {
        const r = runder[i]
        if (!erObj(r) || !Array.isArray(r.g) || r.g.length === 0 || r.g.length > 3) return null
        let rundeSum = 0
        let avsluttet = false
        for (let j = 0; j < r.g.length; j++) {
          const g = r.g[j]
          if (!erObj(g) || typeof g.c !== "string") return null
          const nivaa = nivaaFor(g.c)
          if (nivaa === null) return null
          forsok++
          const { utfall } = vurderHeks(dato, i, g.c)
          if (utfall === "funnet" || j === r.g.length - 1) {
            rundeSum = rundePoeng(utfall, nivaa, j)
            avsluttet = utfall === "funnet" || r.g.length === 3
          }
        }
        if (!avsluttet) return null
        sum += rundeSum
      }
      return {
        spillId,
        dato,
        status: "ferdig",
        etikett: `${sum}/${STEDER_PER_DAG * MAKS_POENG}`,
        poeng: sum,
        forsok,
        hintAntall: 0,
        tidSek: null,
        verifisert: false,
        detaljer: {},
      }
    }

    case "67-stegern": {
      if (!kanSpillesStegern(dato)) return null
      const svar = tilstand.svar
      if (!Array.isArray(svar) || svar.length !== NORMALE) return null
      let dm = 0
      const tekster: string[] = []
      for (let i = 0; i < NORMALE; i++) {
        const s = svar[i]
        if (!erObj(s) || typeof s.t !== "string") return null
        const t = s.t.slice(0, 80)
        tekster.push(t)
        dm += hoppDm(vurderSvar(dato, i, t).nivaa)
      }
      const sjette = tilstand.sjette
      if (!erObj(sjette) || typeof sjette.t !== "string") return null
      const sjNr = sjetteNr(dato) - 1
      const ok = erGjentatt(dato, tekster[sjNr], sjette.t)
      dm += ok ? GJENTA_DM : hoppDm(0)
      if (ok) {
        const fin = tilstand.finaleSvar
        if (!erObj(fin) || typeof fin.t !== "string") return null
        dm += hoppDm(vurderSvar(dato, 6, fin.t.slice(0, 80)).nivaa, true)
      }
      return {
        spillId,
        dato,
        status: ok ? "vunnet" : "ferdig",
        etikett: meter(dm),
        poeng: dm / 10,
        forsok: ok ? 7 : 6,
        hintAntall: 0,
        tidSek: null,
        verifisert: false,
        detaljer: {},
      }
    }

    case "gjettelos": {
      if (!kanSpillesGjettelos(dato)) return null
      const svar = tilstand.svar
      if (!Array.isArray(svar) || svar.length !== GJ_ANTALL) return null
      const poengListe: number[] = []
      for (let i = 0; i < GJ_ANTALL; i++) {
        const s = svar[i]
        if (!erObj(s) || typeof s.g !== "number" || !Number.isFinite(s.g) || s.g <= 0) return null
        poengListe.push(vurderGjettelos(dato, i, s.g).poeng)
      }
      const poeng = summer(poengListe)
      return {
        spillId,
        dato,
        status: "ferdig",
        etikett: `${formaterPoeng(poeng)}/${MAKS_SUM}`,
        poeng,
        forsok: GJ_ANTALL,
        hintAntall: 0,
        tidSek: null,
        verifisert: false,
        detaljer: {},
      }
    }
  }
}
