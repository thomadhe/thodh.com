// Pure leaderboard aggregation, tie-breaking, signature verification and client-game replay helpers.
// Kept free of "server-only" so unit tests can import and verify every rule directly.

import { formaterTidSek, TAVLE_META, type ServerSpillId, type TavleMetrikk, type TavleOppforing } from "../sosial"
import { verifiserResultatRad } from "./resultat-signatur"

export type RaTavleRad = {
  bruker_id: string
  visningsnavn: string
  dato: string
  status: "vunnet" | "tapt" | "ferdig"
  poeng: number | string | null
  forsok: number | null
  hint_antall: number
  tid_sek: number | null
  signatur: string | null
}

function tilTall(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function avrund(n: number, desimaler = 1): number {
  const f = 10 ** desimaler
  return Math.round(n * f) / f
}

function formaterDesimal(n: number, maks = 1): string {
  return n.toLocaleString("nb-NO", { minimumFractionDigits: 0, maximumFractionDigits: maks })
}

export function aggregerLedertavle(
  spillId: ServerSpillId,
  rader: RaTavleRad[],
  megId: string | null,
  metrikk: TavleMetrikk,
  krevSignatur: boolean,
): TavleOppforing[] {
  const meta = TAVLE_META[spillId]
  const valgtMetrikk: TavleMetrikk = meta.metrikker.includes(metrikk) ? metrikk : meta.standard

  type Samler = {
    brukerId: string
    visningsnavn: string
    lost: number
    fullfort: number
    tidSum: number
    tidAntall: number
    hintSum: number
    hintAntall: number
    forsokSum: number
    forsokAntall: number
    feilSum: number
    feilAntall: number
    poengSum: number
    poengAntall: number
  }

  const perBruker = new Map<string, Samler>()
  const settDag = new Set<string>()

  for (const r of rader) {
    const poeng = tilTall(r.poeng)
    if (krevSignatur) {
      const ok = verifiserResultatRad(
        {
          userId: r.bruker_id,
          spillId,
          dato: String(r.dato).slice(0, 10),
          status: r.status,
          poeng,
          forsok: r.forsok,
          hintAntall: r.hint_antall,
          tidSek: r.tid_sek,
        },
        r.signatur,
      )
      if (!ok) continue
    }
    const dagNokkel = `${r.bruker_id}:${String(r.dato).slice(0, 10)}`
    if (settDag.has(dagNokkel)) continue
    settDag.add(dagNokkel)

    let s = perBruker.get(r.bruker_id)
    if (!s) {
      s = {
        brukerId: r.bruker_id,
        visningsnavn: r.visningsnavn,
        lost: 0,
        fullfort: 0,
        tidSum: 0,
        tidAntall: 0,
        hintSum: 0,
        hintAntall: 0,
        forsokSum: 0,
        forsokAntall: 0,
        feilSum: 0,
        feilAntall: 0,
        poengSum: 0,
        poengAntall: 0,
      }
      perBruker.set(r.bruker_id, s)
    }

    const erFullfort = r.status === "vunnet" || r.status === "ferdig"
    const erLost = meta.lostRegel === "vunnet" ? r.status === "vunnet" : erFullfort

    if (erFullfort) s.fullfort++
    if (erLost) s.lost++

    if (r.status === "vunnet") {
      if (r.tid_sek !== null && r.tid_sek > 0) {
        s.tidSum += r.tid_sek
        s.tidAntall++
      }
      s.hintSum += r.hint_antall
      s.hintAntall++
      if (r.forsok !== null && r.forsok > 0) {
        s.forsokSum += r.forsok
        s.forsokAntall++
        if (spillId === "tilkoblinger") {
          s.feilSum += Math.max(0, r.forsok - 4)
          s.feilAntall++
        }
      }
    }

    if (erFullfort && poeng !== null) {
      s.poengSum += poeng
      s.poengAntall++
    }
  }

  type Kandidat = Omit<TavleOppforing, "plass"> & { sortVerdi: number }

  const kandidater: Kandidat[] = []
  for (const s of perBruker.values()) {
    const snittTidSek = s.tidAntall > 0 ? avrund(s.tidSum / s.tidAntall, 1) : null
    const snittHint = s.hintAntall > 0 ? avrund(s.hintSum / s.hintAntall, 2) : null
    const snittForsok = s.forsokAntall > 0 ? avrund(s.forsokSum / s.forsokAntall, 1) : null
    const snittFeil = s.feilAntall > 0 ? avrund(s.feilSum / s.feilAntall, 2) : null
    const snittPoeng = s.poengAntall > 0 ? avrund(s.poengSum / s.poengAntall, 1) : null

    let sortVerdi: number | null = null
    let verdiTekst = ""

    switch (valgtMetrikk) {
      case "lost":
        if (s.lost <= 0) continue
        sortVerdi = s.lost
        verdiTekst = meta.lostRegel === "vunnet" ? `${s.lost} løst` : `${s.lost} ${s.lost === 1 ? "dag" : "dager"}`
        break
      case "tid":
        if (snittTidSek === null) continue
        sortVerdi = snittTidSek
        verdiTekst = formaterTidSek(snittTidSek)
        break
      case "hint":
        if (snittHint === null) continue
        sortVerdi = snittHint
        verdiTekst = `${formaterDesimal(snittHint, 2)} hint`
        break
      case "forsok":
        if (snittForsok === null) continue
        sortVerdi = snittForsok
        verdiTekst = `${formaterDesimal(snittForsok, 1)} ${spillId === "anelseslos" ? "gjett" : "forsøk"}`
        break
      case "feil":
        if (snittFeil === null) continue
        sortVerdi = snittFeil
        verdiTekst = `${formaterDesimal(snittFeil, 2)} feil`
        break
      case "poeng":
        if (snittPoeng === null) continue
        sortVerdi = snittPoeng
        verdiTekst = `${formaterDesimal(snittPoeng, 1)}${meta.poengEnhet ? (meta.poengEnhet.startsWith("/") ? meta.poengEnhet : ` ${meta.poengEnhet}`) : ""}`
        break
    }

    kandidater.push({
      brukerId: s.brukerId,
      visningsnavn: s.visningsnavn,
      erMeg: megId !== null && s.brukerId === megId,
      lost: s.lost,
      fullfort: s.fullfort,
      snittTidSek,
      snittHint,
      snittForsok,
      snittFeil,
      snittPoeng,
      verdiTekst,
      sortVerdi,
    })
  }

  const hoyestBest = valgtMetrikk === "lost" || valgtMetrikk === "poeng"
  kandidater.sort((a, b) => {
    const primar = hoyestBest ? b.sortVerdi - a.sortVerdi : a.sortVerdi - b.sortVerdi
    if (primar !== 0) return primar
    // Secondary tie-breaker: more solved days, then fewer hints, then faster time, then display name.
    if (b.lost !== a.lost) return b.lost - a.lost
    if (a.snittHint !== null && b.snittHint !== null && a.snittHint !== b.snittHint) return a.snittHint - b.snittHint
    if (a.snittTidSek !== null && b.snittTidSek !== null && a.snittTidSek !== b.snittTidSek) return a.snittTidSek - b.snittTidSek
    return a.visningsnavn.localeCompare(b.visningsnavn, "nb")
  })

  return kandidater.map((k, i) => {
    const forste = kandidater.findIndex((x) => x.sortVerdi === k.sortVerdi)
    const { sortVerdi: _, ...rest } = k
    void _
    return { ...rest, plass: forste >= 0 ? forste + 1 : i + 1 }
  })
}
