"use client"

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { lagreFigur, lesLagretFigur, STANDARD_FIGUR, tilfeldigFigur, type Figur } from "../../lib/duell/figur"
import { iRekkefolge, lesTilstede, MIN_SPILLERE, NAVN_MAKS, rensNavn, vertAv, type GrunnStatus, type Tilstede } from "../../lib/duell/rom"
import { forberedDuell, serverNa } from "../../lib/duell/signatur"
import { useErKlient } from "../../lib/lagring"

// A duel room on Supabase Realtime, shared by every duel. Presence says who is in the room (name, figure, ready,
// when they came); the one who has been there longest is host and drives the game by broadcasting the shared
// status, which each game defines for itself. Nothing is stored on a server: a reload picks the game up from this
// tab's session storage and from the others in the room, and a late joiner hears where the game is and looks on.

const NAVN_NOKKEL = "stegern:duell:navn"

type Okt<S> = { id: string; inn: number; status?: S }

/** What a game's handlers get to work with. */
export type Romkontekst<S> = {
  meg: string | null
  status: () => S
  settStatus: (endring: (s: S) => S) => void
  send: (hendelse: string, payload: Record<string, unknown>) => void
}

export type Romvalg<S extends GrunnStatus> = {
  /** The Realtime channel's prefix, e.g. "stegern-duell"; the room is `<kanal>:<KODE>`. */
  kanal: string
  /** Session storage prefix for this tab's seat, e.g. "stegern:duell". */
  lagring: string
  kode: string
  supabaseUrl: string
  supabaseNokkel: string
  start: (runde: number) => S
  les: (x: unknown) => S | null
  taImot: (lokal: S, ny: S) => S
  /** The game's own broadcast events (answers and so on). */
  hendelser?: Record<string, (payload: unknown, rom: Romkontekst<S>) => void>
  /** After a status from someone else has been taken in: `for_` is what this client had before. */
  etterMottak?: (for_: S, ny: S, rom: Romkontekst<S>) => void
}

export type Tilkobling = "kobler" | "klar" | "feil"

function lesOkt<S>(nokkel: string, les: (x: unknown) => S | null): Okt<S> {
  try {
    const lagret = JSON.parse(sessionStorage.getItem(nokkel) ?? "null") as Okt<unknown> | null
    if (lagret && typeof lagret.id === "string" && typeof lagret.inn === "number") return { id: lagret.id, inn: lagret.inn, status: les(lagret.status) ?? undefined }
  } catch {}
  const ny = { id: crypto.randomUUID().slice(0, 12), inn: Date.now() }
  try {
    sessionStorage.setItem(nokkel, JSON.stringify(ny))
  } catch {}
  return ny
}

function lesNavn() {
  try {
    return rensNavn(localStorage.getItem(NAVN_NOKKEL) ?? "")
  } catch {
    return ""
  }
}

/** The figure saved on this device, or a fresh one in a random colour the first time (saved straight away). */
function forsteFigur(): Figur {
  const lagret = lesLagretFigur()
  if (lagret) return lagret
  const ny = { ...STANDARD_FIGUR, kropp: tilfeldigFigur().kropp }
  lagreFigur(ny)
  return ny
}

export function useDuellrom<S extends GrunnStatus>(valg: Romvalg<S>) {
  const { kanal: prefiks, lagring, kode, supabaseUrl, supabaseNokkel, start, les } = valg
  const oktNokkel = `${lagring}:${kode}`
  const klient = useErKlient()
  const okt = useMemo(() => (klient ? lesOkt<S>(oktNokkel, les) : null), [klient, oktNokkel, les])
  const meg = okt?.id ?? null
  const handlere = useRef(valg)
  useEffect(() => {
    handlere.current = valg
  })

  const [status, setStatusState] = useState<S>(() => start(0))
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
  const [figurUtkast, setFigurUtkast] = useState<Figur | null>(null)
  const lagretFigur = useMemo(() => (klient ? forsteFigur() : STANDARD_FIGUR), [klient])
  const figur = figurUtkast ?? lagretFigur
  const [klarRunde, setKlarRunde] = useState<number | null>(null)
  const kanal = useRef<RealtimeChannel | null>(null)
  /** When this client saw the current phase begin (server time, epoch ms). */
  const [faseStart, setFaseStart] = useState(0)

  const klar = klarRunde === status.runde

  /** Changes the shared status here (and in this tab's storage). */
  const settStatus = useCallback(
    (endring: (s: S) => S) => {
      const gammel = statusRef.current
      const ny = endring(gammel)
      if (ny === gammel) return
      const g = gammel as GrunnStatus & { nr?: unknown }
      const n = ny as GrunnStatus & { nr?: unknown }
      if (n.runde !== g.runde || n.fase !== g.fase || n.nr !== g.nr) setFaseStart(serverNa())
      statusRef.current = ny
      setStatusState(ny)
      if (meg && okt) {
        try {
          sessionStorage.setItem(oktNokkel, JSON.stringify({ id: okt.id, inn: okt.inn, status: ny }))
        } catch {}
      }
    },
    [meg, okt, oktNokkel],
  )

  const send = useCallback((hendelse: string, payload: Record<string, unknown>) => {
    void kanal.current?.send({ type: "broadcast", event: hendelse, payload })
  }, [])

  const kringkast = useCallback(() => send("status", statusRef.current as unknown as Record<string, unknown>), [send])

  const kontekst = useMemo<Romkontekst<S>>(() => ({ meg, status: () => statusRef.current, settStatus, send }), [meg, settStatus, send])

  /** A status from someone else in the room. */
  const motta = useCallback(
    (ny: S) => {
      const for_ = statusRef.current
      settStatus((s) => handlere.current.taImot(s, ny))
      handlere.current.etterMottak?.(for_, ny, kontekst)
    },
    [settStatus, kontekst],
  )

  // The key and the server clock first, in parallel with the channel: the first answer then needs no extra trip.
  useEffect(() => {
    if (klient) void forberedDuell().catch(() => {})
  }, [klient])

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
      ch = supabase.channel(`${prefiks}:${kode}`, { config: { broadcast: { self: false }, presence: { key: okt.id } } })
      kanal.current = ch
      ch.on("presence", { event: "sync" }, () => {
        const liste = Object.values(ch!.presenceState())
          .map((metas) => lesTilstede(metas[0]))
          .filter((t): t is Tilstede => t !== null)
        setTilstede(liste)
      })
      ch.on("broadcast", { event: "status" }, ({ payload }) => {
        const s = handlere.current.les(payload)
        if (s) motta(s)
      })
      // Someone came in or back: everyone who knows the game tells them where it is.
      ch.on("broadcast", { event: "hei" }, () => {
        const s = statusRef.current
        if (s.v > 0 || s.runde > 0) kringkast()
      })
      for (const hendelse of Object.keys(handlere.current.hendelser ?? {})) {
        ch.on("broadcast", { event: hendelse }, ({ payload }) => handlere.current.hendelser?.[hendelse]?.(payload, kontekst))
      }
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
  }, [okt, kode, prefiks, supabaseUrl, supabaseNokkel, motta, kringkast, kontekst])

  // What this player tells the room: name, figure, ready, and when they came (which decides the host).
  useEffect(() => {
    if (tilkobling !== "klar" || !okt) return
    const id = window.setTimeout(() => {
      const t: Tilstede = { id: okt.id, navn: rensNavn(navn), inn: okt.inn, klar, runde: status.runde, figur }
      void kanal.current?.track(t)
    }, 250)
    return () => window.clearTimeout(id)
  }, [tilkobling, okt, navn, klar, status.runde, figur])

  const vert = vertAv(tilstede)
  const erVert = !!meg && vert?.id === meg
  const tilstedeIder = useMemo(() => new Set(tilstede.map((t) => t.id)), [tilstede])
  const iRommet = useMemo(() => iRekkefolge(tilstede), [tilstede])
  const klare = iRommet.filter((t) => t.id === vert?.id || (t.klar && t.runde === status.runde))
  const kanStarte = erVert && status.fase === "lobby" && klare.length >= MIN_SPILLERE

  /** The host moves the game on: a new version, sent to everyone. */
  const nyFase = useCallback(
    (endring: (s: S) => S) => {
      settStatus((s) => ({ ...endring(s), v: s.v + 1 }))
      kringkast()
    },
    [kringkast, settStatus],
  )

  const spillIgjen = useCallback(() => {
    settStatus((s) => ({ ...handlere.current.start(s.runde + 1), v: 1 }))
    kringkast()
  }, [kringkast, settStatus])

  const settNavn = useCallback((n: string) => {
    const ren = n.slice(0, NAVN_MAKS)
    setNavnUtkast(ren)
    try {
      localStorage.setItem(NAVN_NOKKEL, rensNavn(ren))
    } catch {}
  }, [])

  const settFigur = useCallback((f: Figur) => {
    setFigurUtkast(f)
    lagreFigur(f)
  }, [])

  const settKlar = useCallback((k: boolean) => setKlarRunde(k ? statusRef.current.runde : null), [])

  return {
    klient,
    okt,
    meg,
    status,
    statusRef,
    settStatus,
    send,
    kringkast,
    nyFase,
    spillIgjen,
    tilstede,
    iRommet,
    tilstedeIder,
    tilkobling,
    vert,
    erVert,
    klare,
    kanStarte,
    navn,
    settNavn,
    figur,
    settFigur,
    klar,
    settKlar,
    faseStart,
  }
}

export type Duellrom<S extends GrunnStatus> = ReturnType<typeof useDuellrom<S>>
