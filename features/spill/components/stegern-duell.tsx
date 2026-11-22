"use client"

import { Share2 } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { figurFarge } from "../lib/duell/figur"
import { MAKS_SPILLERE, SLINGRING_MS, velgDeltakere, type Deltaker } from "../lib/duell/rom"
import { apne, duellPost, lesSignert, serverNa, sjekkSignaturer, type Signert } from "../lib/duell/signatur"
import { lyder } from "../lib/lyd"
import { hoppDm, meter, NIVAAER, NORMALE, SEKUNDER } from "../lib/stegern"
import {
  alleHarSvart,
  duellDm,
  godkjennDom,
  godkjenteSvar,
  lesStatus,
  rangering,
  slaSammenSvar,
  startStatus,
  SVAR_MS,
  taImot,
  VISNING_SEKUNDER,
  type DuellSporsmal,
  type DuellSvar,
  type Status,
  type SvarKart,
} from "../lib/stegern-duell"
import { useDuellrom, type Romkontekst } from "./duell/bruk-duellrom"
import { HarSvart, Lobby, Pall, Romlinje } from "./duell/duell-ui"
import {
  barMaks,
  gjeldende,
  hoppOver,
  nesteHolder,
  nyLunte,
  nyPistol,
  pass,
  smell,
  vurderPistolsvar,
  type PistolSporsmal,
} from "../lib/stegern-pistol"
import { Bane, tidTilLanding, type Hopp, type Loper } from "./stegern-bane"
import { AVSLAG_TEKST, ModusVelger, PistolPanel, PistolRegler, PistolSlutt } from "./stegern-pistol"
import { Startlinje, type Pistolspiller } from "./stegern-pistol-scene"
import { Avsloring, DelKnapp, Klokke, NivaaMerke } from "./stegern-ui"

// The 6/7-stegern duel: up to six friends get the same five prompts at once and jump side by side. The room
// (presence, host, reloads) is the shared duel room (duell/bruk-duellrom.ts). Each player sends their answer to the
// server, which judges it and signs the verdict; the player passes the signed verdict to the room, and every client
// counts only verdicts whose signature, room, round, question, player and time check out (lib/stegern-duell.ts).

const API = "/spill/api/67-stegern"

type MinAvsloring = { vanligste: string[]; sjeldneste: string[]; antall: number }
type DomSvar = { dom: Signert } & MinAvsloring

const signNokkel = (x: Signert) => `${x.s}|${x.j}`

/** An answer from someone else: stored if this client has none for that player and question yet. */
function taImotSvar(payload: unknown, rom: Romkontekst<Status>) {
  const p = payload as { runde?: unknown; i?: unknown; id?: unknown; dom?: unknown }
  const dom = lesSignert(p.dom)
  if (!dom || typeof p.id !== "string" || typeof p.i !== "number" || !Number.isInteger(p.i) || p.i < 0 || p.i >= NORMALE) return
  const id = p.id
  const i = p.i
  rom.settStatus((s) => (s.runde !== p.runde || !s.deltakere.some((d) => d.id === id) || s.svar[id]?.[i] ? s : { ...s, svar: slaSammenSvar(s.svar, { [id]: { [i]: dom } }) }))
}

/** The sender of a status had not heard (or had another version of) some of my answers: say them again. */
function etterMottak(for_: Status, ny: Status, rom: Romkontekst<Status>) {
  const s = rom.status()
  if (!rom.meg || ny.runde !== s.runde || for_.runde !== s.runde) return
  for (const [i, dom] of Object.entries(for_.svar[rom.meg] ?? {})) {
    if (dom && ny.svar[rom.meg]?.[Number(i)]?.s !== dom.s) rom.send("svar", { runde: s.runde, i: Number(i), id: rom.meg, dom })
  }
}

/** Prompts fetched for one game of Startpistolen; a new one comes after every bang. */
const PISTOL_SPORSMAL = 20

export function StegernDuell({
  kode,
  supabaseUrl,
  supabaseNokkel,
  startModus = "runder",
}: {
  kode: string
  supabaseUrl: string
  supabaseNokkel: string
  startModus?: "runder" | "pistol"
}) {
  const lagStartStatus = useCallback((runde: number): Status => ({ ...startStatus(runde), modus: startModus }), [startModus])
  const rom = useDuellrom<Status>({
    kanal: "stegern-duell",
    lagring: "stegern:duell",
    kode,
    supabaseUrl,
    supabaseNokkel,
    start: lagStartStatus,
    les: lesStatus,
    taImot,
    hendelser: {
      svar: taImotSvar,
      // Startpistolen: the holder's signed answer, applied by everyone at once (the host's status confirms it).
      pistolsvar: (payload) => {
        const dom = lesSignert((payload as { dom?: unknown }).dom)
        if (dom) void taImotPistolsvar(dom)
      },
      skriver: (payload) => {
        const p = payload as { id?: unknown; t?: unknown }
        if (typeof p.id === "string" && typeof p.t === "string") setSkriver({ id: p.id, t: p.t.slice(0, 80) })
      },
    },
    etterMottak,
  })
  const { status, statusRef, settStatus, send, meg, erVert, vert, tilkobling, tilstedeIder, iRommet, klare, kanStarte, nyFase, faseStart, kringkast } = rom
  const tilstedeRef = useRef(tilstedeIder)
  const erVertRef = useRef(erVert)
  useEffect(() => {
    tilstedeRef.current = tilstedeIder
    erVertRef.current = erVert
  })

  /** A change from the game itself: the host stamps a new version and tells everyone; others only update their own view. */
  const endreSpill = useCallback(
    (endring: (s: Status) => Status) => {
      const for_ = statusRef.current
      if (!erVertRef.current) return settStatus(endring)
      settStatus((s) => {
        const ny = endring(s)
        return ny === s ? s : { ...ny, v: s.v + 1 }
      })
      if (statusRef.current !== for_) kringkast()
    },
    [settStatus, kringkast, statusRef],
  )

  // ---- Startpistolen ----
  const [skriver, setSkriver] = useState<{ id: string; t: string } | null>(null)
  const [rist, setRist] = useState(0)
  const [pistolMelding, setPistolMelding] = useState<string | null>(null)
  /** Applies a signed answer if it is a valid one by the holder: the pistol moves on. */
  const brukPistolsvar = useCallback(
    (dom: Signert) => {
      const data = apne(dom)
      endreSpill((s) => {
        if (s.fase !== "pistol" || !s.pistol) return s
        const v = vurderPistolsvar(data, kode, s.runde, s.pistol)
        return v.ok ? { ...s, pistol: pass(s.pistol, { ...v.svar, dom }, serverNa(), tilstedeRef.current) } : s
      })
    },
    [endreSpill, kode],
  )
  const taImotPistolsvar = async (dom: Signert) => {
    const [ok] = await sjekkSignaturer([dom]).catch(() => [false])
    if (ok) brukPistolsvar(dom)
  }

  const [tekst, setTekst] = useState("")
  const [opptatt, setOpptatt] = useState(false)
  const [melding, setMelding] = useState<string | null>(null)
  const [avsloringer, setAvsloringer] = useState<Record<string, MinAvsloring>>({})
  const [na, setNa] = useState(() => serverNa())
  const felt = useRef<HTMLInputElement>(null)

  // ---- which answers count: signatures are checked as they come in; the rest is pure (godkjenteSvar) ----
  const [sjekket, setSjekket] = useState<Record<string, boolean>>({})
  const alleDommer = useMemo(() => Object.values(status.svar).flatMap((rad) => Object.values(rad ?? {}).filter((x): x is Signert => !!x)), [status.svar])
  useEffect(() => {
    const nye = alleDommer.filter((x) => !(signNokkel(x) in sjekket))
    if (!nye.length) return
    let aktiv = true
    void sjekkSignaturer(nye)
      .then((ok) => {
        if (aktiv) setSjekket((f) => ({ ...f, ...Object.fromEntries(nye.map((x, i) => [signNokkel(x), ok[i]])) }))
      })
      .catch(() => {})
    return () => {
      aktiv = false
    }
  }, [alleDommer, sjekket])
  const godkjente = useMemo(() => godkjenteSvar(kode, status, (x) => sjekket[signNokkel(x)] === true), [kode, status, sjekket])
  const godkjenteRef = useRef(godkjente)
  useEffect(() => {
    godkjenteRef.current = godkjente
  })

  // A verdict that fails (forged, for another question, or too late) is dropped here, so the real one can take its place.
  useEffect(() => {
    settStatus((s) => {
      let endret = false
      const svar: SvarKart<Signert> = {}
      for (const [id, rad] of Object.entries(s.svar)) {
        svar[id] = {}
        for (const [i, x] of Object.entries(rad ?? {})) {
          if (!x) continue
          const ok = sjekket[signNokkel(x)]
          const forkastet = ok === false || (ok === true && !godkjennDom(apne(x), kode, s, id, Number(i)))
          if (forkastet) endret = true
          else svar[id]![Number(i)] = x
        }
      }
      return endret ? { ...s, svar } : s
    })
  }, [sjekket, kode, settStatus, status.svar])

  // ---- the host's clock: close a question when everyone has answered or time is up, move on after the reveal ----
  const nesteSporsmal = useCallback(() => {
    nyFase((s) => (s.nr < NORMALE - 1 ? { ...s, fase: "sporsmal", nr: s.nr + 1, frister: [...s.frister.slice(0, s.nr + 1), serverNa() + SVAR_MS] } : { ...s, fase: "slutt" }))
  }, [nyFase])

  // Startpistolen's clock, on the host: the bang, a holder who left, the end.
  const borteSiden = useRef<{ id: string; t: number } | null>(null)
  useEffect(() => {
    if (!erVert || tilkobling !== "klar") return
    const id = window.setInterval(() => {
      const s = statusRef.current
      const p = s.pistol
      if (s.fase !== "pistol" || !p) return
      const na = serverNa()
      if (p.vinner) {
        if (na - (p.smell?.ts ?? 0) > 2200) endreSpill((x) => ({ ...x, fase: "slutt" }))
      } else if (na >= p.lunte) {
        endreSpill((x) => (x.pistol && !x.pistol.vinner ? { ...x, pistol: smell(x.pistol, serverNa(), tilstedeRef.current, Math.random) } : x))
      } else if (!tilstedeRef.current.has(p.holder)) {
        // A holder who left the room: the pistol moves on after a moment, with no heart lost.
        if (borteSiden.current?.id !== p.holder) borteSiden.current = { id: p.holder, t: na }
        else if (na - borteSiden.current.t > 1500) endreSpill((x) => (x.pistol ? { ...x, pistol: hoppOver(x.pistol, serverNa(), tilstedeRef.current) } : x))
      } else borteSiden.current = null
    }, 100)
    return () => window.clearInterval(id)
  }, [erVert, tilkobling, statusRef, endreSpill])

  // A new host mid-game lights a fresh fuse, so nobody loses a heart to the handover.
  const varVert = useRef(false)
  useEffect(() => {
    if (tilkobling !== "klar") return
    const ble = erVert && !varVert.current
    varVert.current = erVert
    if (ble && statusRef.current.fase === "pistol" && statusRef.current.pistol && !statusRef.current.pistol.vinner && statusRef.current.v > 0) {
      endreSpill((x) => (x.pistol ? { ...x, pistol: nyLunte(x.pistol, serverNa(), Math.random) } : x))
    }
  }, [erVert, tilkobling, statusRef, endreSpill])

  // Sounds: a steady tick while the pistol is out (the same pace whatever is left), and the bang.
  const pistolPa = status.fase === "pistol" && !!status.pistol && !status.pistol.vinner
  useEffect(() => {
    if (!pistolPa) return
    const id = window.setInterval(() => lyder.tikk(0.35), 900)
    return () => window.clearInterval(id)
  }, [pistolPa])
  const smellTs = status.pistol?.smell?.ts ?? null
  useEffect(() => {
    if (smellTs !== null && serverNa() - smellTs < 1500) lyder.feil()
  }, [smellTs])

  useEffect(() => {
    if (!erVert || tilkobling !== "klar") return
    const id = window.setInterval(() => {
      const s = statusRef.current
      if (s.fase === "sporsmal") {
        const f = s.frister[s.nr] ?? 0
        if (alleHarSvart(s, godkjenteRef.current, tilstedeIder) || serverNa() > f + SLINGRING_MS) nyFase((x) => ({ ...x, fase: "visning" }))
      } else if (s.fase === "visning" && serverNa() - faseStart > VISNING_SEKUNDER * 1000) nesteSporsmal()
    }, 250)
    return () => window.clearInterval(id)
  }, [erVert, tilkobling, tilstedeIder, nyFase, nesteSporsmal, statusRef, faseStart])

  // The visible clock, in server time.
  useEffect(() => {
    if (status.fase !== "sporsmal" && status.fase !== "visning") return
    const id = window.setInterval(() => setNa(serverNa()), 250)
    return () => window.clearInterval(id)
  }, [status.fase])

  // ---- this player's answer ----
  const erDeltaker = !!meg && status.deltakere.some((d) => d.id === meg)
  const mittRaa = meg ? status.svar[meg]?.[status.nr] : undefined
  const mittSvar = meg ? godkjente[meg]?.[status.nr] : undefined
  const sporsmal = status.sporsmal[status.nr]
  const fristNa = status.fase === "sporsmal" ? (status.frister[status.nr] ?? null) : null
  const igjen = fristNa ? Math.max(0, Math.ceil((fristNa - na) / 1000)) : null

  const svarPa = async (verdi: string) => {
    if (opptatt || !erDeltaker || status.fase !== "sporsmal" || mittRaa || !sporsmal || !meg) return
    const svarTekst = verdi.trim().slice(0, 80)
    const { runde, nr } = status
    setOpptatt(true)
    setMelding(null)
    lyder.velg()
    try {
      const v = await duellPost<DomSvar>(API, { type: "duell-svar", kode, runde, i: nr, dato: sporsmal.dato, nr: sporsmal.nr, id: meg, svar: svarTekst })
      settStatus((s) => (s.runde !== runde || s.svar[meg]?.[nr] ? s : { ...s, svar: slaSammenSvar(s.svar, { [meg]: { [nr]: v.dom } }) }))
      setAvsloringer((a) => ({ ...a, [`${runde}:${nr}`]: { vanligste: v.vanligste, sjeldneste: v.sjeldneste, antall: v.antall } }))
      send("svar", { runde, i: nr, id: meg, dom: v.dom })
      setTekst("")
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setOpptatt(false)
    }
  }
  const sendRef = useRef(svarPa)
  useEffect(() => {
    sendRef.current = svarPa
  })
  const tidUte = igjen === 0 && !mittRaa && erDeltaker
  useEffect(() => {
    if (tidUte) void sendRef.current(felt.current?.value ?? "")
  }, [tidUte])
  const sistTikk = useRef<number | null>(null)
  useEffect(() => {
    if (igjen === null || igjen > 5 || igjen === sistTikk.current || mittRaa) return
    sistTikk.current = igjen
    if (igjen > 0) lyder.tikk(1 - igjen / 5)
  }, [igjen, mittRaa])
  useEffect(() => {
    if (status.fase === "sporsmal" && erDeltaker && !mittRaa) felt.current?.focus({ preventScroll: true })
  }, [status.fase, status.nr, erDeltaker, mittRaa])

  // The landing sound for this player's jump when the answers are revealed.
  const visningNokkel = status.fase === "visning" ? `${status.runde}:${status.nr}` : null
  useEffect(() => {
    if (!visningNokkel || !meg) return
    const s = godkjenteRef.current[meg]?.[statusRef.current.nr]
    const n = s?.n ?? 0
    const lyd = n === 0 ? lyder.feil : n >= 4 ? lyder.seier : n >= 2 ? lyder.riktig : () => lyder.naer(0.4)
    const id = window.setTimeout(lyd, tidTilLanding({ dm: hoppDm(n), nivaa: n, type: "vanlig" }))
    return () => window.clearTimeout(id)
  }, [visningNokkel, meg, statusRef])

  // The holder answers: judged and signed by the server, then passed to everyone at once.
  const minTur = status.fase === "pistol" && status.pistol?.holder === meg && !status.pistol?.vinner
  const pistolSvar = async (verdi: string) => {
    const s = statusRef.current
    const p = s.pistol
    const t = verdi.trim().slice(0, 80)
    if (!p || !meg || p.holder !== meg || opptatt || !t) return
    const q = gjeldende(p)
    setOpptatt(true)
    setPistolMelding(null)
    try {
      const v = await duellPost<DomSvar>(API, { type: "duell-svar", kode, runde: s.runde, i: p.sp, dato: q.dato, nr: q.nr, id: meg, svar: t })
      const na = statusRef.current
      const vurd = na.pistol ? vurderPistolsvar(apne(v.dom), kode, na.runde, na.pistol) : null
      if (vurd?.ok) {
        send("pistolsvar", { runde: s.runde, dom: v.dom })
        brukPistolsvar(v.dom)
        setTekst("")
        send("skriver", { id: meg, t: "" })
        lyder.riktig()
      } else {
        setRist((n) => n + 1)
        setPistolMelding(AVSLAG_TEKST[vurd?.grunn ?? "ferdig"])
        lyder.feil()
      }
    } catch (e) {
      setPistolMelding((e as Error).message)
    } finally {
      setOpptatt(false)
    }
  }
  // What the holder types is shown to the others as it is typed.
  useEffect(() => {
    if (!minTur || !meg) return
    const id = window.setTimeout(() => send("skriver", { id: meg, t: tekst }), 90)
    return () => window.clearTimeout(id)
  }, [tekst, minTur, meg, send])
  useEffect(() => {
    if (minTur) felt.current?.focus({ preventScroll: true })
  }, [minTur])

  // ---- host actions: the next round's prompts are fetched while the lobby fills up ----
  const [starter, setStarter] = useState(false)
  const forhand = useRef<{ nokkel: string; sporsmal: Promise<DuellSporsmal[]> } | null>(null)
  const hentSporsmal = useCallback(
    (runde: number, antall: number) => {
      const nokkel = `${runde}:${antall}`
      if (forhand.current?.nokkel !== nokkel) {
        const sporsmal = duellPost<{ sporsmal: DuellSporsmal[] }>(API, { type: "duell", kode, runde, antall }).then((r) => r.sporsmal)
        sporsmal.catch(() => (forhand.current = null))
        forhand.current = { nokkel, sporsmal }
      }
      return forhand.current.sporsmal
    },
    [kode],
  )
  const antallSporsmal = status.modus === "pistol" ? PISTOL_SPORSMAL : NORMALE
  useEffect(() => {
    if (erVert && tilkobling === "klar" && status.fase === "lobby") void hentSporsmal(status.runde, antallSporsmal).catch(() => {})
  }, [erVert, tilkobling, status.fase, status.runde, antallSporsmal, hentSporsmal])

  const start = async () => {
    if (!kanStarte || starter) return
    setStarter(true)
    setMelding(null)
    try {
      const pistol = statusRef.current.modus === "pistol"
      const sporsmal = await hentSporsmal(statusRef.current.runde, pistol ? PISTOL_SPORSMAL : NORMALE)
      lyder.velg()
      const deltakere = velgDeltakere(klare)
      if (pistol) {
        const liste: PistolSporsmal[] = sporsmal.map(({ dato, nr, tekst }) => ({ dato, nr, tekst }))
        nyFase((s) => ({ ...s, fase: "pistol", nr: 0, sporsmal: [], deltakere, svar: {}, frister: [], pistol: nyPistol(deltakere, s.innst, liste, serverNa(), Math.random) }))
      } else nyFase((s) => ({ ...s, fase: "sporsmal", nr: 0, sporsmal, deltakere, svar: {}, frister: [serverNa() + SVAR_MS], pistol: null }))
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setStarter(false)
    }
  }

  // A new round keeps the mode and the settings.
  const spillIgjen = () => {
    lyder.velg()
    settStatus((s) => ({ ...startStatus(s.runde + 1), modus: s.modus, innst: s.innst, v: 1 }))
    kringkast()
  }

  // ---- what the course shows ----
  const synligeSvar = status.fase === "lobby" ? 0 : status.fase === "sporsmal" ? status.nr : status.fase === "visning" ? status.nr + 1 : NORMALE
  const lopere: Loper[] = useMemo(() => {
    if (status.fase === "lobby")
      return iRommet.slice(0, MAKS_SPILLERE).map((t, i) => ({ id: t.id, farge: i, hopp: [], deg: t.id === meg, figur: t.id === meg ? rom.figur : t.figur }))
    return status.deltakere.map((d) => ({
      id: d.id,
      farge: d.farge,
      figur: d.figur,
      deg: d.id === meg,
      hopp: Array.from({ length: synligeSvar }, (_, i): Hopp => {
        const s = godkjente[d.id]?.[i]
        return { dm: duellDm(s), nivaa: s?.n ?? 0, type: "vanlig" }
      }),
    }))
  }, [status, synligeSvar, iRommet, meg, godkjente, rom.figur])

  const lenke = typeof window === "undefined" ? "" : `${window.location.origin}/spill/67-stegern/duell/${kode}`

  if (!rom.klient || !rom.okt) return <div className="px-panel h-[260px] motion-safe:animate-pulse" />

  return (
    <div className="flex flex-col gap-4">
      <Romlinje kode={kode} lenke={lenke} kompakt={status.fase !== "lobby"} delTekst={`Bli med i duellen min på 6/7-stegern! Kode ${kode}`} />

      {status.modus === "pistol" && status.pistol && (status.fase === "pistol" || status.fase === "slutt") ? (
        <div className="px-panel overflow-hidden">
          <Startlinje
            spillere={status.pistol.spillere.map((s): Pistolspiller => {
              const d = status.deltakere.find((x) => x.id === s.id)
              return { id: s.id, figur: d?.figur ?? rom.figur, farge: d?.farge ?? 0, liv: s.liv, bar: s.bar / barMaks(status.pistol!.innst), ute: s.liv === 0, deg: s.id === meg }
            })}
            pistol={status.pistol}
            neste={nesteHolder(status.pistol, status.pistol.holder, tilstedeIder)}
            etikett="Startstreken med alle spillerne"
          >
            <p className="px-etikett pointer-events-none absolute top-2 right-2 bg-[#050817]/70 px-1.5 py-1">Startpistolen</p>
          </Startlinje>
        </div>
      ) : (
      <div className="px-panel overflow-hidden">
        <Bane lopere={lopere.length ? lopere : [{ id: "tom", farge: 0, hopp: [], figur: rom.figur }]} mal={false} oversikt={status.fase === "slutt"} vekker={`${status.fase}|${status.nr}|${tekst}`} etikett="Banen med alle spillerne">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-2">
            {status.fase === "lobby" ? (
              <p className="px-etikett px-blink bg-[#050817]/70 px-1.5 py-1 text-[#ffd0f4]">Venter på spillere</p>
            ) : (
              <ol className="flex gap-1" aria-label="Spørsmål">
                {Array.from({ length: NORMALE }, (_, i) => {
                  const ferdig = i < synligeSvar
                  const aktiv = status.fase === "sporsmal" && i === status.nr
                  return (
                    <li key={i} className={`px-brikke ${ferdig ? "bg-[#38e8ff] text-[#04141a]" : aktiv ? "bg-white text-[#0b1020]" : "bg-[#121a45]/90 text-[#a5b4e8]"}`}>
                      {i + 1}
                    </li>
                  )
                })}
              </ol>
            )}
            <p className="px-etikett bg-[#050817]/70 px-1.5 py-1">
              {status.fase === "lobby" ? `${Math.min(iRommet.length, MAKS_SPILLERE)}/${MAKS_SPILLERE}` : `Runde ${status.runde + 1}`}
            </p>
          </div>
        </Bane>
      </div>
      )}

      {tilkobling === "feil" ? (
        <section className="px-panel px-panel-rosa p-4">
          <p className="text-[18px] font-semibold text-white">Fikk ikke kontakt med rommet.</p>
          <p className="mt-1 text-sm text-[#b9c3ea]">Sjekk nettet og last siden på nytt. Du kommer tilbake på samme plass.</p>
        </section>
      ) : tilkobling === "kobler" ? (
        <section className="px-panel p-4">
          <p className="px-etikett px-blink">Kobler til rommet …</p>
        </section>
      ) : status.fase === "lobby" ? (
        <Lobby
          iRommet={iRommet}
          meg={meg}
          vertId={vert?.id ?? null}
          runde={status.runde}
          navn={rom.navn}
          settNavn={rom.settNavn}
          figur={rom.figur}
          settFigur={rom.settFigur}
          klar={rom.klar}
          settKlar={rom.settKlar}
          antallKlare={klare.length}
          kanStarte={kanStarte}
          starter={starter}
          start={start}
          melding={melding}
          innstillinger={<ModusVelger modus={status.modus} innst={status.innst} erVert={erVert} endre={(modus, innst) => nyFase((s) => ({ ...s, modus, innst }))} />}
          info={
            status.modus === "pistol" ? (
              <PistolRegler innst={status.innst} />
            ) : (
              <p>
                Fem spørsmål, {SEKUNDER} sekunder hver. Sjeldne svar gir lange hopp, og lengste sum vinner. Spørsmålene er fra tidligere dager, og duellen teller
                ikke i statistikken din.
              </p>
            )
          }
        />
      ) : status.fase === "pistol" && status.pistol ? (
        <PistolPanel
          pistol={status.pistol}
          deltakere={status.deltakere}
          meg={meg}
          tilstede={tilstedeIder}
          skriver={skriver?.id === status.pistol.holder ? skriver.t : ""}
          melding={minTur ? pistolMelding : null}
          skjema={
            <form
              key={rist}
              className={`flex gap-2 ${rist ? "px-rist" : ""}`}
              onSubmit={(e) => {
                e.preventDefault()
                void pistolSvar(tekst)
              }}
            >
              <input
                ref={felt}
                value={tekst}
                onChange={(e) => {
                  setTekst(e.target.value)
                  setPistolMelding(null)
                }}
                maxLength={80}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                placeholder="Din tur!"
                aria-label="Svar"
                className="px-felt h-[50px] min-w-0 flex-1 px-3"
              />
              <button type="submit" disabled={opptatt} className="px-knapp h-[50px]">
                Svar
              </button>
            </form>
          }
        />
      ) : status.fase === "slutt" && status.modus === "pistol" && status.pistol ? (
        <PistolSlutt pistol={status.pistol} deltakere={status.deltakere} meg={meg} erVert={erVert} vertNavn={vert?.navn || "Verten"} spillIgjen={spillIgjen} />
      ) : status.fase === "sporsmal" ? (
        <section key={`${status.runde}-${status.nr}`} className="px-panel px-hopp-inn p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="px-etikett">
              Spørsmål {status.nr + 1} av {NORMALE}
            </p>
            {igjen !== null ? <p className={`px-skrift text-[22px] leading-none font-bold tabular-nums ${igjen <= 5 ? "text-[#ff4fd8]" : "text-white"}`}>{igjen}</p> : null}
          </div>
          <p className="mt-2 text-[22px] leading-[1.25] font-semibold tracking-[-0.01em] text-balance text-white sm:text-[24px]">{sporsmal?.tekst}</p>
          {fristNa ? (
            <div className="mt-3">
              <Klokke igjenMs={fristNa - na} />
            </div>
          ) : null}
          {!erDeltaker ? (
            <p className="mt-3 text-sm leading-6 text-[#b9c3ea]">Runden er i gang, så du ser på denne gangen. Du er med fra neste runde.</p>
          ) : mittSvar ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <NivaaMerke n={mittSvar.n} />
              <p className="min-w-0 text-[16px] leading-6 font-semibold text-white">{mittSvar.treff ?? (mittSvar.t ? `«${mittSvar.t}» er ikke på lista.` : "Ikke noe svar.")}</p>
            </div>
          ) : mittRaa ? (
            <p className="px-etikett px-blink mt-3">Sjekker svaret …</p>
          ) : (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void svarPa(tekst)
              }}
            >
              <input
                ref={felt}
                value={tekst}
                onChange={(e) => setTekst(e.target.value)}
                maxLength={80}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                placeholder="Skriv et svar"
                aria-label="Svar"
                className="px-felt h-[50px] min-w-0 flex-1 px-3"
              />
              <button type="submit" disabled={opptatt} className="px-knapp h-[50px]">
                Hopp!
              </button>
            </form>
          )}
          {melding ? <p className="mt-2 text-[13px] font-medium text-[#fda4af]">{melding}</p> : null}
          <HarSvart deltakere={status.deltakere} har={(id) => !!godkjente[id]?.[status.nr]} tilstede={tilstedeIder} />
        </section>
      ) : status.fase === "visning" ? (
        <Visning
          status={status}
          svar={godkjente}
          meg={meg}
          avsloring={avsloringer[`${status.runde}:${status.nr}`]}
          erVert={erVert}
          sekunderIgjen={Math.max(0, Math.ceil(VISNING_SEKUNDER - (na - faseStart) / 1000))}
          neste={nesteSporsmal}
        />
      ) : (
        <Slutt status={status} svar={godkjente} meg={meg} erVert={erVert} vertNavn={vert?.navn || "Verten"} spillIgjen={spillIgjen} />
      )}
    </div>
  )
}

function Visning({
  status,
  svar,
  meg,
  avsloring,
  erVert,
  sekunderIgjen,
  neste,
}: {
  status: Status
  svar: SvarKart<DuellSvar>
  meg: string | null
  avsloring: MinAvsloring | undefined
  erVert: boolean
  sekunderIgjen: number
  neste: () => void
}) {
  const stilling = rangering(status.deltakere, svar, status.nr + 1)
  const sporsmal = status.sporsmal[status.nr]
  const siste = status.nr === NORMALE - 1
  return (
    <section key={`${status.runde}-${status.nr}`} className="px-panel px-hopp-inn p-4">
      <p className="px-etikett">
        Spørsmål {status.nr + 1} av {NORMALE} · svarene
      </p>
      <p className="mt-1.5 text-[19px] leading-snug font-semibold text-balance text-white">{sporsmal?.tekst}</p>
      <ol className="mt-3 grid gap-1.5">
        {stilling.map((p) => {
          const s = svar[p.id]?.[status.nr]
          return (
            <li key={p.id} className={`px-panel px-panel-dempet flex items-center gap-2 py-1.5 pr-2 pl-1 ${p.id === meg ? "bg-[#14205a]" : ""}`}>
              <span className="px-skrift w-6 shrink-0 text-center text-[16px] text-[#a5b4e8]">{p.plass}</span>
              <span className="h-3 w-3 shrink-0" style={{ background: figurFarge(p.figur) }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[#d7defa]">{p.navn}</p>
                <p className="truncate text-[15px] leading-tight font-semibold text-white">{s ? (s.treff ?? (s.t ? `«${s.t}»` : "Ikke noe svar")) : "For sent"}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <NivaaMerke n={s?.n ?? 0} />
                <span className="text-[13px] leading-none font-semibold tabular-nums text-[#c7d2fe]">{meter(p.dm)}</span>
              </div>
            </li>
          )
        })}
      </ol>
      {avsloring ? (
        <div className="mt-3">
          <Avsloring {...avsloring} />
        </div>
      ) : null}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="px-etikett">
          {siste ? "Pallen" : "Neste"} om {sekunderIgjen} s
        </p>
        {erVert ? (
          <button type="button" className="px-knapp" onClick={neste}>
            {siste ? "Til pallen ▶" : "Neste ▶"}
          </button>
        ) : null}
      </div>
    </section>
  )
}

function Slutt({
  status,
  svar,
  meg,
  erVert,
  vertNavn,
  spillIgjen,
}: {
  status: Status
  svar: SvarKart<DuellSvar>
  meg: string | null
  erVert: boolean
  vertNavn: string
  spillIgjen: () => void
}) {
  const stilling = rangering(status.deltakere, svar)
  const min = stilling.find((p) => p.id === meg)
  const delTekst = [
    `6/7-stegern · duell · ${min ? `${min.plass}. plass av ${stilling.length}` : `${stilling.length} spillere`}`,
    ...stilling.slice(0, 3).map((p) => `${["🥇", "🥈", "🥉"][p.plass - 1] ?? `${p.plass}.`} ${p.navn} ${meter(p.dm)}`),
    "thodh.com/spill/67-stegern",
  ].join("\n")
  return (
    <div className="px-hopp-inn flex flex-col gap-4">
      <section className="px-panel px-panel-rosa p-4">
        <p className="px-etikett text-center text-[#ffb3ee]">Duellen er over</p>
        <div className="mt-3">
          <Pall rader={stilling.map((p) => ({ id: p.id, navn: p.navn, figur: p.figur, plass: p.plass, verdi: meter(p.dm) }))} />
        </div>
        {min ? (
          <p className="mt-4 text-center text-[17px] font-semibold text-white">
            Du ble nummer <span className="px-neon px-neon-liten">{min.plass}</span> med {meter(min.dm)}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {erVert ? (
            <button type="button" className="px-knapp px-knapp-rosa" onClick={spillIgjen}>
              Spill igjen ▶
            </button>
          ) : (
            <p className="px-etikett w-full text-center">Venter på at {vertNavn} starter en ny runde</p>
          )}
          <DelKnapp tekst={delTekst}>
            <Share2 className="h-4 w-4" />
            Del
          </DelKnapp>
        </div>
      </section>
      <ol className="grid gap-1.5">
        {stilling.map((p) => (
          <Plassrad key={p.id} p={p} status={status} svar={svar} meg={meg} />
        ))}
      </ol>
      <p className="text-center text-[13px] text-[#a5b4e8]">
        <Link href="/spill/67-stegern" className="underline decoration-dotted underline-offset-4 hover:text-white">
          Til dagens 6/7-stegern
        </Link>
      </p>
    </div>
  )
}

function Plassrad({ p, status, svar, meg }: { p: Deltaker & { dm: number; plass: number }; status: Status; svar: SvarKart<DuellSvar>; meg: string | null }) {
  return (
    <li className={`px-panel px-panel-dempet p-2.5 ${p.id === meg ? "bg-[#14205a]" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="px-skrift w-6 shrink-0 text-center text-[18px] text-[#a5b4e8]">{p.plass}</span>
        <span className="h-3 w-3 shrink-0" style={{ background: figurFarge(p.figur) }} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-[16px] font-semibold text-white">{p.navn}</span>
        <span className="px-skrift text-[17px] font-semibold tabular-nums text-white">{meter(p.dm)}</span>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1 pl-8" aria-label="Svarene">
        {status.sporsmal.map((q, i) => {
          const s = svar[p.id]?.[i]
          return (
            <li key={i} className="px-merke normal-case" style={{ background: NIVAAER[s?.n ?? 0].farge }} title={q.tekst}>
              <span className="max-w-[96px] truncate font-normal">{s ? (s.treff ?? (s.t || "–")) : "–"}</span>
            </li>
          )
        })}
      </ul>
    </li>
  )
}
