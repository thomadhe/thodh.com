"use client"

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js"
import { Check, Copy, Crown, Share2 } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useErKlient } from "../lib/lagring"
import { lyder } from "../lib/lyd"
import { hoppDm, meter, NIVAAER, NORMALE, SEKUNDER, type Vurdering } from "../lib/stegern"
import {
  alleHarSvart,
  DUELL_FARGER,
  duellDm,
  iRekkefolge,
  lesStatus,
  lesSvar,
  lesTilstede,
  MAKS_SPILLERE,
  MIN_SPILLERE,
  NAVN_MAKS,
  rangering,
  rensNavn,
  SLINGRING_MS,
  slaSammenSvar,
  startStatus,
  taImot,
  velgDeltakere,
  vertAv,
  VISNING_SEKUNDER,
  type Deltaker,
  type DuellSvar,
  type Status,
  type Tilstede,
} from "../lib/stegern-duell"
import { Bane, Figur, tidTilLanding, type Hopp, type Loper } from "./stegern-bane"
import { Avsloring, DelKnapp, Klokke, NivaaMerke } from "./stegern-ui"

// The duel: a room of 2–6 friends on Supabase Realtime. Presence says who is in the room (name, ready, when they
// came); the one who has been there longest is host and drives the game by broadcasting the shared status. Every
// player sends their own answer to the server to be judged, then broadcasts the verdict. Nothing is stored on a
// server: a reload picks the game up from this tab's session storage and from the others in the room.

const NAVN_NOKKEL = "stegern:duell:navn"
const oktNokkel = (kode: string) => `stegern:duell:${kode}`

type Okt = { id: string; inn: number; status?: Status }

/** This tab's seat in the room: kept in session storage, so a reload comes back as the same player. */
function lesOkt(kode: string): Okt {
  try {
    const lagret = JSON.parse(sessionStorage.getItem(oktNokkel(kode)) ?? "null") as Okt | null
    if (lagret && typeof lagret.id === "string" && typeof lagret.inn === "number") return { ...lagret, status: lesStatus(lagret.status) ?? undefined }
  } catch {}
  const ny = { id: crypto.randomUUID().slice(0, 12), inn: Date.now() }
  try {
    sessionStorage.setItem(oktNokkel(kode), JSON.stringify(ny))
  } catch {}
  return ny
}

function lagreOkt(kode: string, okt: Okt) {
  try {
    sessionStorage.setItem(oktNokkel(kode), JSON.stringify(okt))
  } catch {}
}

function lesNavn() {
  try {
    return rensNavn(localStorage.getItem(NAVN_NOKKEL) ?? "")
  } catch {
    return ""
  }
}

async function spor<T>(body: unknown): Promise<T> {
  const svar = await fetch("/spill/api/67-stegern", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  const data = await svar.json().catch(() => ({ melding: "Noe gikk galt." }))
  if (!svar.ok) throw new Error(data.melding ?? "Noe gikk galt.")
  return data as T
}

type Tilkobling = "kobler" | "klar" | "feil"
type MinAvsloring = { vanligste: string[]; sjeldneste: string[]; antall: number }

export function StegernDuell({ kode, supabaseUrl, supabaseNokkel }: { kode: string; supabaseUrl: string; supabaseNokkel: string }) {
  const klient = useErKlient()
  const okt = useMemo(() => (klient ? lesOkt(kode) : null), [klient, kode])
  const meg = okt?.id ?? null

  const [status, setStatusState] = useState<Status>(() => startStatus())
  const statusRef = useRef(status)
  useEffect(() => {
    // The game this tab was in before a reload, until the room tells us more.
    if (!okt?.status) return
    statusRef.current = okt.status
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusState(okt.status)
  }, [okt])

  const [tilstede, setTilstede] = useState<Tilstede[]>([])
  const [tilkobling, setTilkobling] = useState<Tilkobling>("kobler")
  const [navnUtkast, setNavnUtkast] = useState<string | null>(null)
  const lagretNavn = useMemo(() => (klient ? lesNavn() : ""), [klient])
  const navn = navnUtkast ?? lagretNavn
  const [klarRunde, setKlarRunde] = useState<number | null>(null)
  const [tekst, setTekst] = useState("")
  const [opptatt, setOpptatt] = useState(false)
  const [melding, setMelding] = useState<string | null>(null)
  const [avsloringer, setAvsloringer] = useState<Record<string, MinAvsloring>>({})
  const [na, setNa] = useState(() => Date.now())
  const kanal = useRef<RealtimeChannel | null>(null)
  const felt = useRef<HTMLInputElement>(null)
  /** Local deadline of the open question (epoch ms), and the question it belongs to. */
  const [fristTilstand, setFrist] = useState<{ nokkel: string; tid: number } | null>(null)
  const frist = useRef(fristTilstand)
  const settFrist = useCallback((f: { nokkel: string; tid: number } | null) => {
    frist.current = f
    setFrist(f)
  }, [])
  /** When this client saw the current phase begin. */
  const [faseStartTid, setFaseStart] = useState(0)
  const faseStart = useRef(faseStartTid)

  const klar = klarRunde === status.runde

  /** Changes the shared status here (and in this tab's storage). */
  const settStatus = useCallback(
    (endring: (s: Status) => Status) => {
      const gammel = statusRef.current
      const ny = endring(gammel)
      if (ny === gammel) return
      if (ny.runde !== gammel.runde || ny.fase !== gammel.fase || ny.nr !== gammel.nr) {
        faseStart.current = Date.now()
        setFaseStart(faseStart.current)
      }
      statusRef.current = ny
      setStatusState(ny)
      if (meg) lagreOkt(kode, { ...lesOkt(kode), status: ny })
    },
    [kode, meg],
  )

  const igjenMs = useCallback(() => {
    const s = statusRef.current
    const f = frist.current
    if (s.fase !== "sporsmal" || !f || f.nokkel !== `${s.runde}:${s.nr}`) return 0
    return Math.max(0, Math.min(SEKUNDER * 1000, f.tid - Date.now()))
  }, [])

  const kringkast = useCallback(() => {
    void kanal.current?.send({ type: "broadcast", event: "status", payload: { ...statusRef.current, igjenMs: igjenMs() } })
  }, [igjenMs])

  const sendSvar = useCallback(
    (runde: number, nr: number, svar: DuellSvar) => {
      if (meg) void kanal.current?.send({ type: "broadcast", event: "svar", payload: { runde, nr, id: meg, svar } })
    },
    [meg],
  )

  /** A status from someone else in the room. */
  const motta = useCallback(
    (ny: Status) => {
      const for_ = statusRef.current
      settStatus((s) => taImot(s, ny))
      const s = statusRef.current
      if (s.fase === "sporsmal" && s.runde === ny.runde && s.nr === ny.nr && ny.fase === "sporsmal") {
        const nokkel = `${s.runde}:${s.nr}`
        if (frist.current?.nokkel !== nokkel) settFrist({ nokkel, tid: Date.now() + ny.igjenMs })
      }
      // The sender had not heard some of my answers: say them again.
      if (meg && ny.runde === s.runde) {
        const mine = for_.runde === s.runde ? for_.svar[meg] : undefined
        for (const [nr, svar] of Object.entries(mine ?? {})) if (svar && !ny.svar[meg]?.[Number(nr)]) sendSvar(s.runde, Number(nr), svar)
      }
    },
    [meg, sendSvar, settStatus, settFrist],
  )

  // ---- the room on Realtime ----
  useEffect(() => {
    if (!okt) return
    let lukket = false
    let supabase: SupabaseClient | null = null
    let ch: RealtimeChannel | null = null
    void (async () => {
      const { createClient } = await import("@supabase/supabase-js")
      if (lukket) return
      supabase = createClient(supabaseUrl, supabaseNokkel, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
      ch = supabase.channel(`stegern-duell:${kode}`, { config: { broadcast: { self: false }, presence: { key: okt.id } } })
      kanal.current = ch
      ch.on("presence", { event: "sync" }, () => {
        const liste = Object.values(ch!.presenceState())
          .map((metas) => lesTilstede(metas[0]))
          .filter((t): t is Tilstede => t !== null)
        setTilstede(liste)
      })
      ch.on("broadcast", { event: "status" }, ({ payload }) => {
        const s = lesStatus(payload)
        if (s) motta(s)
      })
      ch.on("broadcast", { event: "svar" }, ({ payload }) => {
        const p = payload as { runde?: unknown; nr?: unknown; id?: unknown }
        const svar = lesSvar((payload as { svar?: unknown }).svar)
        if (!svar || typeof p.id !== "string" || typeof p.nr !== "number" || p.nr < 0 || p.nr >= NORMALE) return
        const id = p.id
        const nr = p.nr
        settStatus((s) => (s.runde !== p.runde || !s.deltakere.some((d) => d.id === id) || s.svar[id]?.[nr] ? s : { ...s, svar: slaSammenSvar(s.svar, { [id]: { [nr]: svar } }) }))
      })
      // Someone came in or back: everyone who knows the game tells them where it is.
      ch.on("broadcast", { event: "hei" }, () => {
        const s = statusRef.current
        if (s.v > 0 || s.runde > 0) kringkast()
      })
      ch.subscribe((tilstand) => {
        if (lukket) return
        if (tilstand === "SUBSCRIBED") {
          setTilkobling("klar")
          void ch!.send({ type: "broadcast", event: "hei", payload: {} })
        } else if (tilstand === "CHANNEL_ERROR" || tilstand === "TIMED_OUT") setTilkobling("feil")
      })
    })()
    return () => {
      lukket = true
      kanal.current = null
      if (supabase && ch) void supabase.removeChannel(ch)
    }
  }, [okt, kode, supabaseUrl, supabaseNokkel, motta, settStatus, kringkast])

  // What this player tells the room: name, ready, and when they came (which decides the host).
  useEffect(() => {
    if (tilkobling !== "klar" || !okt) return
    const id = window.setTimeout(() => {
      const t: Tilstede = { id: okt.id, navn: rensNavn(navn), inn: okt.inn, klar, runde: status.runde }
      void kanal.current?.track(t)
    }, 250)
    return () => window.clearTimeout(id)
  }, [tilkobling, okt, navn, klar, status.runde])

  // ---- the host's clock: close a question when everyone has answered or time is up, move on after the reveal ----
  const vert = vertAv(tilstede)
  const erVert = !!meg && vert?.id === meg
  const tilstedeIder = useMemo(() => new Set(tilstede.map((t) => t.id)), [tilstede])

  const nyFase = useCallback(
    (endring: (s: Status) => Status) => {
      settStatus((s) => ({ ...endring(s), v: s.v + 1 }))
      const s = statusRef.current
      if (s.fase === "sporsmal") settFrist({ nokkel: `${s.runde}:${s.nr}`, tid: Date.now() + SEKUNDER * 1000 })
      kringkast()
    },
    [kringkast, settStatus, settFrist],
  )

  const nesteSporsmal = useCallback(() => {
    nyFase((s) => (s.nr < NORMALE - 1 ? { ...s, fase: "sporsmal", nr: s.nr + 1 } : { ...s, fase: "slutt" }))
  }, [nyFase])

  useEffect(() => {
    if (!erVert || tilkobling !== "klar") return
    const id = window.setInterval(() => {
      const s = statusRef.current
      if (s.fase === "sporsmal") {
        const f = frist.current
        // A host that just came back without a clock gives the question its full time from now.
        if (!f || f.nokkel !== `${s.runde}:${s.nr}`) settFrist({ nokkel: `${s.runde}:${s.nr}`, tid: Date.now() + Math.max(s.igjenMs, 5000) })
        else if (alleHarSvart(s, tilstedeIder) || Date.now() > f.tid + SLINGRING_MS) nyFase((x) => ({ ...x, fase: "visning" }))
      } else if (s.fase === "visning" && Date.now() - faseStart.current > VISNING_SEKUNDER * 1000) nesteSporsmal()
    }, 250)
    return () => window.clearInterval(id)
  }, [erVert, tilkobling, tilstedeIder, nyFase, nesteSporsmal, settFrist])

  // The visible clock.
  useEffect(() => {
    if (status.fase !== "sporsmal" && status.fase !== "visning") return
    const id = window.setInterval(() => setNa(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [status.fase])

  // ---- this player's answer ----
  const erDeltaker = !!meg && status.deltakere.some((d) => d.id === meg)
  const mittSvar = meg ? status.svar[meg]?.[status.nr] : undefined
  const sporsmal = status.sporsmal[status.nr]
  const fristNa = fristTilstand?.nokkel === `${status.runde}:${status.nr}` ? fristTilstand.tid : null
  const igjen = status.fase === "sporsmal" && fristNa ? Math.max(0, Math.ceil((fristNa - na) / 1000)) : null

  const send = async (verdi: string) => {
    if (opptatt || !erDeltaker || status.fase !== "sporsmal" || mittSvar || !sporsmal || !meg) return
    const svarTekst = verdi.trim().slice(0, 80)
    const { runde, nr } = status
    setOpptatt(true)
    setMelding(null)
    lyder.velg()
    try {
      const v = await spor<Vurdering>({ type: "svar", dato: sporsmal.dato, nr: sporsmal.nr, svar: svarTekst })
      const svar: DuellSvar = { t: svarTekst, n: v.nivaa, treff: v.treff }
      settStatus((s) => (s.runde !== runde || s.svar[meg]?.[nr] ? s : { ...s, svar: slaSammenSvar(s.svar, { [meg]: { [nr]: svar } }) }))
      setAvsloringer((a) => ({ ...a, [`${runde}:${nr}`]: { vanligste: v.vanligste, sjeldneste: v.sjeldneste, antall: v.antall } }))
      sendSvar(runde, nr, svar)
      setTekst("")
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setOpptatt(false)
    }
  }
  const sendRef = useRef(send)
  useEffect(() => {
    sendRef.current = send
  })
  const tidUte = igjen === 0 && !mittSvar && erDeltaker
  useEffect(() => {
    if (tidUte) void sendRef.current(felt.current?.value ?? "")
  }, [tidUte])
  const sistTikk = useRef<number | null>(null)
  useEffect(() => {
    if (igjen === null || igjen > 5 || igjen === sistTikk.current || mittSvar) return
    sistTikk.current = igjen
    if (igjen > 0) lyder.tikk(1 - igjen / 5)
  }, [igjen, mittSvar])
  useEffect(() => {
    if (status.fase === "sporsmal" && erDeltaker && !mittSvar) felt.current?.focus({ preventScroll: true })
  }, [status.fase, status.nr, erDeltaker, mittSvar])

  // The landing sound for this player's jump when the answers are revealed.
  const visningNokkel = status.fase === "visning" ? `${status.runde}:${status.nr}` : null
  useEffect(() => {
    if (!visningNokkel || !meg) return
    const s = statusRef.current.svar[meg]?.[statusRef.current.nr]
    const n = s?.n ?? 0
    const lyd = n === 0 ? lyder.feil : n >= 4 ? lyder.seier : n >= 2 ? lyder.riktig : () => lyder.naer(0.4)
    const id = window.setTimeout(lyd, tidTilLanding({ dm: hoppDm(n), nivaa: n, type: "vanlig" }))
    return () => window.clearTimeout(id)
  }, [visningNokkel, meg])

  // ---- host actions ----
  const iRommet = iRekkefolge(tilstede)
  const klare = iRommet.filter((t) => t.id === vert?.id || (t.klar && t.runde === status.runde))
  const kanStarte = erVert && status.fase === "lobby" && klare.length >= MIN_SPILLERE
  const [starter, setStarter] = useState(false)

  const start = async () => {
    if (!kanStarte || starter) return
    setStarter(true)
    setMelding(null)
    try {
      const { sporsmal } = await spor<{ sporsmal: Status["sporsmal"] }>({ type: "duell", kode, runde: statusRef.current.runde })
      lyder.velg()
      nyFase((s) => ({ ...s, fase: "sporsmal", nr: 0, sporsmal, deltakere: velgDeltakere(klare), svar: {}, igjenMs: SEKUNDER * 1000 }))
    } catch (e) {
      setMelding((e as Error).message)
    } finally {
      setStarter(false)
    }
  }

  const spillIgjen = () => {
    lyder.velg()
    settStatus((s) => ({ ...startStatus(s.runde + 1), v: 1 }))
    settFrist(null)
    kringkast()
  }

  // ---- what the course shows ----
  const synligeSvar = status.fase === "lobby" ? 0 : status.fase === "sporsmal" ? status.nr : status.fase === "visning" ? status.nr + 1 : NORMALE
  const lopere: Loper[] = useMemo(() => {
    if (status.fase === "lobby") return iRommet.slice(0, MAKS_SPILLERE).map((t, i) => ({ id: t.id, farge: i, hopp: [], deg: t.id === meg }))
    return status.deltakere.map((d) => ({
      id: d.id,
      farge: d.farge,
      deg: d.id === meg,
      hopp: Array.from({ length: synligeSvar }, (_, i): Hopp => {
        const s = status.svar[d.id]?.[i]
        return { dm: duellDm(s), nivaa: s?.n ?? 0, type: "vanlig" }
      }),
    }))
  }, [status, synligeSvar, iRommet, meg])

  const lenke = typeof window === "undefined" ? "" : `${window.location.origin}/spill/67-stegern/duell/${kode}`
  const minFarge = status.deltakere.find((d) => d.id === meg)?.farge ?? Math.max(0, iRommet.findIndex((t) => t.id === meg))

  if (!klient || !okt) return <div className="px-panel h-[260px] animate-pulse" />

  return (
    <div className="flex flex-col gap-4">
      <Romlinje kode={kode} lenke={lenke} kompakt={status.fase !== "lobby"} />

      <div className="px-panel overflow-hidden">
        <Bane lopere={lopere.length ? lopere : [{ id: "tom", farge: 0, hopp: [] }]} mal={false} oversikt={status.fase === "slutt"} vekker={`${status.fase}|${status.nr}|${tekst}`} etikett="Banen med alle spillerne">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-2">
            {status.fase === "lobby" ? (
              <p className="px-etikett px-blink bg-[#050817]/70 px-1.5 py-1 text-[#ffd0f4]">Venter på spillere</p>
            ) : (
              <ol className="flex gap-1" aria-label="Spørsmål">
                {Array.from({ length: NORMALE }, (_, i) => {
                  const ferdig = i < synligeSvar
                  const aktiv = status.fase === "sporsmal" && i === status.nr
                  return (
                    <li key={i} className={`px-brikke ${ferdig ? "bg-[#38e8ff] text-[#04141a]" : aktiv ? "px-blink bg-white text-[#0b1020]" : "bg-[#121a45]/90 text-[#6b7bb0]"}`}>
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

      {tilkobling === "feil" ? (
        <section className="px-panel px-panel-rosa p-4">
          <p className="px-skrift text-[20px] text-white">Fikk ikke kontakt med rommet.</p>
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
          navn={navn}
          settNavn={(n) => {
            const ren = n.slice(0, NAVN_MAKS)
            setNavnUtkast(ren)
            try {
              localStorage.setItem(NAVN_NOKKEL, rensNavn(ren))
            } catch {}
          }}
          klar={klar}
          settKlar={(k) => {
            lyder.velg()
            setKlarRunde(k ? status.runde : null)
          }}
          antallKlare={klare.length}
          kanStarte={kanStarte}
          starter={starter}
          start={start}
          melding={melding}
        />
      ) : status.fase === "sporsmal" ? (
        <section key={`${status.runde}-${status.nr}`} className="px-panel px-hopp-inn p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="px-etikett">
              Spørsmål {status.nr + 1} av {NORMALE}
            </p>
            {igjen !== null ? <p className={`px-skrift text-[22px] leading-none font-bold tabular-nums ${igjen <= 5 ? "text-[#ff4fd8]" : "text-white"}`}>{igjen}</p> : null}
          </div>
          <p className="px-skrift mt-2 text-[26px] leading-[1.15] font-semibold text-white">{sporsmal?.tekst}</p>
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
              <p className="px-skrift min-w-0 text-[17px] text-white">{mittSvar.treff ?? (mittSvar.t ? `«${mittSvar.t}» er ikke på lista.` : "Ikke noe svar.")}</p>
            </div>
          ) : (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void send(tekst)
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
          {melding ? <p className="px-etikett mt-2 text-[#fb7185]">{melding}</p> : null}
          <HarSvart status={status} tilstede={tilstedeIder} />
        </section>
      ) : status.fase === "visning" ? (
        <Visning
          status={status}
          meg={meg}
          avsloring={avsloringer[`${status.runde}:${status.nr}`]}
          erVert={erVert}
          sekunderIgjen={Math.max(0, Math.ceil(VISNING_SEKUNDER - (na - faseStartTid) / 1000))}
          neste={nesteSporsmal}
        />
      ) : (
        <Slutt status={status} meg={meg} minFarge={minFarge} erVert={erVert} vertNavn={vert?.navn || "Verten"} spillIgjen={spillIgjen} />
      )}
    </div>
  )
}

/** The room code, big, with the invite link. */
function Romlinje({ kode, lenke, kompakt }: { kode: string; lenke: string; kompakt: boolean }) {
  const [kopiert, setKopiert] = useState(false)
  const del = async () => {
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "6/7-stegern · duell", text: `Bli med i duellen min på 6/7-stegern! Kode ${kode}`, url: lenke })
        return
      }
      await navigator.clipboard.writeText(lenke)
      setKopiert(true)
      setTimeout(() => setKopiert(false), 1800)
    } catch {}
  }
  return (
    <section className={`px-panel flex items-center justify-between gap-3 ${kompakt ? "px-3 py-2" : "p-3.5"}`}>
      <div className="min-w-0">
        <p className="px-etikett">Romkode</p>
        <p className={`px-neon leading-none tracking-[0.2em] ${kompakt ? "mt-1 text-[22px]" : "mt-1.5 text-[34px]"}`}>{kode}</p>
      </div>
      <button type="button" onClick={del} className="px-knapp px-knapp-cyan px-knapp-liten">
        {kopiert ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {kopiert ? "Kopiert!" : "Kopier lenke"}
      </button>
    </section>
  )
}

function Lobby({
  iRommet,
  meg,
  vertId,
  runde,
  navn,
  settNavn,
  klar,
  settKlar,
  antallKlare,
  kanStarte,
  starter,
  start,
  melding,
}: {
  iRommet: Tilstede[]
  meg: string | null
  vertId: string | null
  runde: number
  navn: string
  settNavn: (n: string) => void
  klar: boolean
  settKlar: (k: boolean) => void
  antallKlare: number
  kanStarte: boolean
  starter: boolean
  start: () => void
  melding: string | null
}) {
  const erVert = meg === vertId
  const plasser = Math.max(MAKS_SPILLERE, iRommet.length)
  return (
    <section className="px-panel px-hopp-inn p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="px-skrift text-[22px] leading-none font-bold text-white">Spillere</h2>
        <p className={`px-etikett ${antallKlare >= MIN_SPILLERE ? "text-[#a3e635]" : ""}`}>
          Klar {antallKlare}/{Math.min(iRommet.length, MAKS_SPILLERE)}
        </p>
      </div>
      <ul className="mt-3 grid gap-1.5">
        {Array.from({ length: plasser }, (_, i) => {
          const t = iRommet[i]
          if (!t)
            return (
              <li key={`ledig-${i}`} className="flex h-[30px] items-center gap-3 border-2 border-dashed border-[#1d2757] px-3">
                <span className="px-etikett text-[#3b4a85]">Ledig plass</span>
              </li>
            )
          const deg = t.id === meg
          const tilskuer = i >= MAKS_SPILLERE
          const erKlar = t.id === vertId || (t.klar && t.runde === runde)
          return (
            <li key={t.id} className={`px-panel px-panel-dempet flex h-[46px] items-center gap-2.5 pr-2 pl-1 ${deg ? "bg-[#14205a]" : ""}`}>
              <Figur farge={tilskuer ? 0 : i} sover={!erKlar} className="h-10 w-[33px] shrink-0" />
              <span className="h-3 w-3 shrink-0" style={{ background: DUELL_FARGER[i % DUELL_FARGER.length].farge }} aria-hidden="true" />
              <span className="px-skrift min-w-0 flex-1 truncate text-[17px] text-white">
                {t.navn || `Spiller ${i + 1}`}
                {deg ? <span className="text-[#8b9bd0]"> (deg)</span> : null}
              </span>
              {t.id === vertId ? (
                <span className="px-merke bg-[#facc15]">
                  <Crown className="h-3 w-3" />
                  Vert
                </span>
              ) : tilskuer ? (
                <span className="px-merke bg-[#263370] text-[#c7d2fe]">Ser på</span>
              ) : (
                <span className={`px-merke ${erKlar ? "bg-[#a3e635]" : "bg-[#263370] text-[#8b9bd0]"}`}>{erKlar ? "Klar" : "Venter"}</span>
              )}
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex gap-2">
        <input
          value={navn}
          onChange={(e) => settNavn(e.target.value)}
          maxLength={NAVN_MAKS}
          autoComplete="nickname"
          placeholder="Ditt navn"
          aria-label="Ditt navn"
          className="px-felt h-[46px] min-w-0 flex-1 px-3"
        />
        {erVert ? null : (
          <button type="button" className={`px-knapp ${klar ? "px-knapp-mork" : ""}`} disabled={!navn.trim()} onClick={() => settKlar(!klar)} aria-pressed={klar}>
            {klar ? "Ikke klar" : "Klar ✓"}
          </button>
        )}
      </div>
      {erVert ? (
        <div className="mt-3 space-y-2">
          <button type="button" className="px-knapp px-knapp-rosa w-full" disabled={!kanStarte || starter} onClick={start}>
            {starter ? "Starter …" : "Start duellen ▶"}
          </button>
          <p className="text-[13px] leading-5 text-[#8b9bd0]">
            {antallKlare < MIN_SPILLERE ? "Del lenken eller koden. Du kan starte når minst én til har trykket klar." : "De som er klare, er med. De andre ser på og blir med i neste runde."}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-[13px] leading-5 text-[#8b9bd0]">{klar ? "Venter på at verten starter." : "Skriv navnet ditt og trykk klar."}</p>
      )}
      {melding ? <p className="px-etikett mt-2 text-[#fb7185]">{melding}</p> : null}
      <p className="mt-4 border-t-[3px] border-dotted border-[#1d2757] pt-3 text-[13px] leading-5 text-[#8b9bd0]">
        Fem spørsmål, {SEKUNDER} sekunder hver. Sjeldne svar gir lange hopp, og lengste sum vinner. Spørsmålene er fra tidligere dager, og duellen teller ikke i
        statistikken din.
      </p>
    </section>
  )
}

/** Who has answered the open question, as small chips in their colours. */
function HarSvart({ status, tilstede }: { status: Status; tilstede: ReadonlySet<string> }) {
  const svarte = status.deltakere.filter((d) => status.svar[d.id]?.[status.nr]).length
  return (
    <div className="mt-4 flex items-center justify-between gap-2 border-t-[3px] border-dotted border-[#1d2757] pt-3">
      <ul className="flex min-w-0 flex-wrap gap-1.5">
        {status.deltakere.map((d) => {
          const har = !!status.svar[d.id]?.[status.nr]
          const borte = !tilstede.has(d.id)
          return (
            <li key={d.id} className={`px-merke ${har ? "" : "opacity-45"}`} style={{ background: DUELL_FARGER[d.farge].farge }} title={borte ? `${d.navn} er borte` : undefined}>
              {har ? <Check className="h-3 w-3" /> : null}
              <span className="max-w-[72px] truncate normal-case">{d.navn}</span>
            </li>
          )
        })}
      </ul>
      <p className="px-etikett shrink-0">
        {svarte}/{status.deltakere.length} svar
      </p>
    </div>
  )
}

function Visning({
  status,
  meg,
  avsloring,
  erVert,
  sekunderIgjen,
  neste,
}: {
  status: Status
  meg: string | null
  avsloring: MinAvsloring | undefined
  erVert: boolean
  sekunderIgjen: number
  neste: () => void
}) {
  const stilling = rangering(status.deltakere, status.svar, status.nr + 1)
  const sporsmal = status.sporsmal[status.nr]
  const siste = status.nr === NORMALE - 1
  return (
    <section key={`${status.runde}-${status.nr}`} className="px-panel px-hopp-inn p-4">
      <p className="px-etikett">
        Spørsmål {status.nr + 1} av {NORMALE} · svarene
      </p>
      <p className="px-skrift mt-1.5 text-[20px] leading-tight font-semibold text-white">{sporsmal?.tekst}</p>
      <ol className="mt-3 grid gap-1.5">
        {stilling.map((p) => {
          const s = status.svar[p.id]?.[status.nr]
          return (
            <li key={p.id} className={`px-panel px-panel-dempet flex items-center gap-2 py-1.5 pr-2 pl-1 ${p.id === meg ? "bg-[#14205a]" : ""}`}>
              <span className="px-skrift w-6 shrink-0 text-center text-[16px] text-[#8b9bd0]">{p.plass}</span>
              <span className="h-3 w-3 shrink-0" style={{ background: DUELL_FARGER[p.farge].farge }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[#d7defa]">{p.navn}</p>
                <p className="px-skrift truncate text-[16px] leading-tight text-white">{s ? (s.treff ?? (s.t ? `«${s.t}»` : "Ikke noe svar")) : "For sent"}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <NivaaMerke n={s?.n ?? 0} />
                <span className="px-skrift text-[14px] leading-none tabular-nums text-[#c7d2fe]">{meter(p.dm)}</span>
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
        <p className="px-etikett">{siste ? "Pallen" : "Neste"} om {sekunderIgjen} s</p>
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
  meg,
  minFarge,
  erVert,
  vertNavn,
  spillIgjen,
}: {
  status: Status
  meg: string | null
  minFarge: number
  erVert: boolean
  vertNavn: string
  spillIgjen: () => void
}) {
  const stilling = rangering(status.deltakere, status.svar)
  const min = stilling.find((p) => p.id === meg)
  // Second, first, third, as on a real podium.
  const pall = [stilling[1], stilling[0], stilling[2]]
  const hoyde = (plass: number) => [76, 52, 36][plass - 1] ?? 28
  const delTekst = [
    `6/7-stegern · duell · ${min ? `${min.plass}. plass av ${stilling.length}` : `${stilling.length} spillere`}`,
    ...stilling.slice(0, 3).map((p) => `${["🥇", "🥈", "🥉"][p.plass - 1] ?? `${p.plass}.`} ${p.navn} ${meter(p.dm)}`),
    "thodh.com/spill/67-stegern",
  ].join("\n")
  return (
    <div className="px-hopp-inn flex flex-col gap-4">
      <section className="px-panel px-panel-rosa p-4">
        <p className="px-etikett text-center text-[#ffb3ee]">Duellen er over</p>
        <div className="mt-3 grid grid-cols-3 items-end gap-2">
          {pall.map((p, i) =>
            p ? (
              <div key={p.id} className="flex min-w-0 flex-col items-center">
                {p.plass === 1 ? <Crown className="px-svev mb-0.5 h-5 w-5 text-[#facc15]" aria-hidden="true" /> : null}
                <Figur farge={p.farge} className="h-14 w-[46px]" />
                <p className="px-skrift mt-1 w-full truncate text-center text-[15px] text-white">{p.navn}</p>
                <p className="px-skrift text-[14px] tabular-nums text-[#c7d2fe]">{meter(p.dm)}</p>
                <div
                  className="mt-1 flex w-full items-start justify-center pt-1.5"
                  style={{ height: hoyde(p.plass), background: `linear-gradient(180deg, ${DUELL_FARGER[p.farge].farge}, ${DUELL_FARGER[p.farge].farge}99)`, boxShadow: "inset 0 3px 0 rgb(255 255 255 / 0.4), inset 0 -4px 0 rgb(0 0 0 / 0.25)" }}
                >
                  <span className="px-skrift text-[24px] leading-none font-bold text-[#0b1020]">{p.plass}</span>
                </div>
              </div>
            ) : (
              <div key={`tom-${i}`} />
            ),
          )}
        </div>
        {min ? (
          <p className="px-skrift mt-4 text-center text-[18px] text-white">
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
          <Plassrad key={p.id} p={p} status={status} meg={meg} />
        ))}
      </ol>
      <p className="text-center text-[13px] text-[#8b9bd0]">
        <Link href="/spill/67-stegern" className="underline decoration-dotted underline-offset-4 hover:text-white">
          Til dagens 6/7-stegern
        </Link>
        <span className="sr-only"> (din farge: {DUELL_FARGER[minFarge]?.navn})</span>
      </p>
    </div>
  )
}

function Plassrad({ p, status, meg }: { p: Deltaker & { dm: number; plass: number }; status: Status; meg: string | null }) {
  return (
    <li className={`px-panel px-panel-dempet p-2.5 ${p.id === meg ? "bg-[#14205a]" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="px-skrift w-6 shrink-0 text-center text-[18px] text-[#8b9bd0]">{p.plass}</span>
        <span className="h-3 w-3 shrink-0" style={{ background: DUELL_FARGER[p.farge].farge }} aria-hidden="true" />
        <span className="px-skrift min-w-0 flex-1 truncate text-[17px] text-white">{p.navn}</span>
        <span className="px-skrift text-[17px] font-semibold tabular-nums text-white">{meter(p.dm)}</span>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1 pl-8" aria-label="Svarene">
        {status.sporsmal.map((q, i) => {
          const s = status.svar[p.id]?.[i]
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
