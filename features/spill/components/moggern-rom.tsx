"use client"

import type { FaceLandmarker } from "@mediapipe/tasks-vision"
import {
  Camera,
  CameraOff,
  Check,
  Copy,
  Crown,
  Loader2,
  Lock,
  LogOut,
  Play,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Wifi,
  WifiOff,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { lagKode } from "../lib/duell/rom"
import { serverNa } from "../lib/duell/signatur"
import { lyder } from "../lib/lyd"
import {
  lesMoggernRapport,
  lesMoggernStatus,
  MALING_MS,
  MOGGERN_MAKS_SPILLERE,
  moggernStart,
  moggernTaImot,
  NEDTELLING_MS,
  velgMoggernDeltakere,
  type MoggernRapport,
  type MoggernStatus,
  type SpillerMaaling,
  type WebRtcSignal,
} from "../lib/moggern/duell"
import { analyserVideoRamme, hentLandmarker } from "../lib/moggern/landmarker"
import { samleLysStatus, type LysAnalyse } from "../lib/moggern/lys"
import {
  aggregerRammer,
  MIN_GYLDIGE_RAMMER,
  type RammeResultat,
  type Veiledning,
} from "../lib/moggern/poeng"
import { hentKameraStrom, kameraFeilTekst, stoppStrom, useMoggernWebRtc } from "../lib/moggern/webrtc"
import { useDuellrom, type Romkontekst } from "./duell/bruk-duellrom"
import { SlikRegnesDet, TullSkjerm, useHarGodkjentTull } from "./moggern-forklaring"
import type { MoggernBruker } from "./moggern-inngang"
import { MoggernResultat } from "./moggern-resultat"
import { Knapp, Kort } from "./spill-ramme"

const VEILEDNING_TEKST: Record<Veiledning, string> = {
  "ingen-ansikt": "Ingen ansikt i bildet — flytt deg inn i rammen",
  "for-langt-unna": "Kom litt nærmere kameraet",
  "for-naerme": "Gå et lite steg bakover",
  "snu-rett": "Se rett inn i kameraet",
  "vipp-rett": "Hold hodet rett",
  ok: "Perfekt! Hold blikket rolig",
}

const MAALING_INTERVALL_MS = 160
const FORHANDSVISNING_INTERVALL_MS = 380

export function MoggernRom({
  kode,
  bruker,
  supabaseUrl,
  supabaseNokkel,
}: {
  kode: string
  bruker: MoggernBruker | null
  supabaseUrl: string
  supabaseNokkel: string
}) {
  const { godkjent, lastet } = useHarGodkjentTull()
  const [lokalGodkjent, setLokalGodkjent] = useState(false)
  const harGodkjent = godkjent || lokalGodkjent

  if (!lastet) {
    return (
      <div className="mx-auto w-full max-w-xl py-12 text-center font-mono text-xs text-neutral-500">
        Laster rom {kode} …
      </div>
    )
  }

  if (!harGodkjent) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <TullSkjerm onGodkjenn={() => setLokalGodkjent(true)} />
      </div>
    )
  }

  if (!bruker) {
    const neste = encodeURIComponent(`/spill/moggern/${kode}`)
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <Kort className="border-white/10 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">Rom {kode}</p>
              <h2 className="font-[family-name:var(--font-visning)] text-2xl font-extrabold text-neutral-950">
                Logg inn for å slå på kameraet
              </h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-neutral-700">
            Moggern krever innlogging for å bruke kameraet, slik at bare kjente brukere kan delta i kameraduellen. Når du har logget inn, kommer du
            rett tilbake til rom <strong className="font-mono text-neutral-950">{kode}</strong>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/logg-inn?neste=${neste}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-lime-400 px-6 text-sm font-bold text-neutral-950 transition hover:bg-lime-300"
            >
              Logg inn og bli med
            </Link>
            <Link
              href={`/registrer?neste=${neste}`}
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-medium text-neutral-900 transition hover:bg-white/10"
            >
              Opprett konto
            </Link>
          </div>
        </Kort>
        <SlikRegnesDet />
      </div>
    )
  }

  return <AktivtMoggernRom kode={kode} bruker={bruker} supabaseUrl={supabaseUrl} supabaseNokkel={supabaseNokkel} />
}

function AktivtMoggernRom({
  kode,
  bruker,
  supabaseUrl,
  supabaseNokkel,
}: {
  kode: string
  bruker: MoggernBruker
  supabaseUrl: string
  supabaseNokkel: string
}) {
  const router = useRouter()

  const signalHandtererRef = useRef<(payload: unknown) => void>(() => {})
  const [motstanderKameraPa, setMotstanderKameraPa] = useState(false)
  const [forlattVarsel, setForlattVarsel] = useState<string | null>(null)

  const hendelser = useMemo(
    () => ({
      signal: (payload: unknown) => {
        signalHandtererRef.current(payload)
      },
      kamera: (payload: unknown, romCtx: Romkontekst<MoggernStatus>) => {
        const p = payload as { id?: unknown; pa?: unknown }
        if (typeof p?.id === "string" && p.id !== romCtx.meg && typeof p.pa === "boolean") {
          setMotstanderKameraPa(p.pa)
        }
      },
      rapport: (payload: unknown, romCtx: Romkontekst<MoggernStatus>) => {
        const rapport = lesMoggernRapport(payload)
        if (!rapport) return
        romCtx.settStatus((s) => {
          if (s.runde !== rapport.runde || !s.deltakere.some((d) => d.id === rapport.av)) return s
          if (s.rapporter[rapport.av]) return s
          return { ...s, rapporter: { ...s.rapporter, [rapport.av]: rapport } }
        })
      },
      forlat: (payload: unknown, romCtx: Romkontekst<MoggernStatus>) => {
        const p = payload as { id?: unknown; navn?: unknown }
        if (typeof p?.id === "string" && p.id !== romCtx.meg) {
          const hvem = typeof p.navn === "string" && p.navn ? p.navn : "Motstanderen"
          setForlattVarsel(`${hvem} forlot rommet.`)
          setMotstanderKameraPa(false)
          if (romCtx.erVert() && romCtx.status().fase !== "lobby") {
            romCtx.settStatus((s) => ({ ...moggernStart(s.runde + 1), v: 1 }))
            romCtx.kringkast()
          }
        }
      },
    }),
    [],
  )

  const rom = useDuellrom<MoggernStatus>({
    kanal: "moggern-duell",
    lagring: "moggern:duell",
    kode,
    supabaseUrl,
    supabaseNokkel,
    start: moggernStart,
    les: lesMoggernStatus,
    taImot: moggernTaImot,
    hendelser,
  })

  const { status, settStatus, send, meg, erVert, tilkobling, iRommet, klar, settKlar, nyFase, spillIgjen, settNavn } = rom

  // Always present the authenticated account's display name in the duel room.
  useEffect(() => {
    settNavn(bruker.visningsnavn)
  }, [bruker.visningsnavn, settNavn])

  const aktiveSpillere = useMemo(() => iRommet.slice(0, MOGGERN_MAKS_SPILLERE), [iRommet])
  const erDeltaker = !!meg && aktiveSpillere.some((s) => s.id === meg)
  const erFullt = !!meg && iRommet.length > MOGGERN_MAKS_SPILLERE && !erDeltaker
  const motstander = useMemo(() => aktiveSpillere.find((s) => s.id !== meg) ?? null, [aktiveSpillere, meg])
  const motstanderId = motstander?.id ?? null

  // Clear "left" notice when a friend joins back.
  useEffect(() => {
    if (motstanderId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForlattVarsel(null)
    } else {
      setMotstanderKameraPa(false)
    }
  }, [motstanderId])

  // ---- Local camera & lazy MediaPipe Face Landmarker ----
  const [lokalStrom, setLokalStrom] = useState<MediaStream | null>(null)
  const [starterKamera, setStarterKamera] = useState(false)
  const [kameraFeil, setKameraFeil] = useState<string | null>(null)
  const [landmarkerKlar, setLandmarkerKlar] = useState(false)
  const [landmarkerFeil, setLandmarkerFeil] = useState<string | null>(null)
  const [kopiert, setKopiert] = useState(false)
  const [egenVeiledning, setEgenVeiledning] = useState<Veiledning | null>(null)
  const [gyldigeEgen, setGyldigeEgen] = useState(0)
  const [gyldigeMot, setGyldigeMot] = useState(0)
  const [na, setNa] = useState(() => serverNa())

  const lokalStromRef = useRef<MediaStream | null>(null)
  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const egenVideoRef = useRef<HTMLVideoElement | null>(null)
  const fjernVideoRef = useRef<HTMLVideoElement | null>(null)
  const lerretRef = useRef<HTMLCanvasElement | null>(null)

  const egenRammerRef = useRef<RammeResultat[]>([])
  const egenLysRef = useRef<LysAnalyse[]>([])
  const motRammerRef = useRef<RammeResultat[]>([])
  const motLysRef = useRef<LysAnalyse[]>([])
  const sendtRapportRundeRef = useRef<number | null>(null)
  const sisteTickRef = useRef<number | null>(null)

  const sendSignal = useCallback(
    (sig: WebRtcSignal) => {
      send("signal", sig as unknown as Record<string, unknown>)
    },
    [send],
  )

  const webrtc = useMoggernWebRtc({
    meg,
    motstanderId,
    lokalStrom,
    sendSignal,
    aktiv: !erFullt && tilkobling === "klar",
  })

  useEffect(() => {
    signalHandtererRef.current = webrtc.mottaSignal
  }, [webrtc.mottaSignal])

  // Broadcast camera-on status whenever it changes or when an opponent arrives.
  useEffect(() => {
    if (!meg || tilkobling !== "klar") return
    send("kamera", { id: meg, pa: !!lokalStrom })
  }, [meg, tilkobling, lokalStrom, motstanderId, send])

  // Attach streams to <video> elements.
  useEffect(() => {
    const el = egenVideoRef.current
    if (!el) return
    el.srcObject = lokalStrom
    if (lokalStrom) void el.play().catch(() => {})
  }, [lokalStrom, status.fase])

  useEffect(() => {
    const el = fjernVideoRef.current
    if (!el) return
    el.srcObject = webrtc.fjernStrom
    if (webrtc.fjernStrom) void el.play().catch(() => {})
  }, [webrtc.fjernStrom, status.fase])

  // Always stop camera tracks on unmount.
  useEffect(() => {
    return () => {
      stoppStrom(lokalStromRef.current)
      lokalStromRef.current = null
    }
  }, [])

  const skruPaKamera = useCallback(async () => {
    if (starterKamera || lokalStromRef.current) return
    setStarterKamera(true)
    setKameraFeil(null)
    setLandmarkerFeil(null)
    let nyStrom: MediaStream | null = null
    let modellFeilet = false
    try {
      const [strom, lm] = await Promise.all([
        hentKameraStrom().then((s) => {
          nyStrom = s
          return s
        }),
        hentLandmarker().catch((err) => {
          modellFeilet = true
          setLandmarkerFeil("Klarte ikke å laste ansiktsmodellen (MediaPipe). Sjekk internett og prøv igjen.")
          throw err
        }),
      ])
      lokalStromRef.current = strom
      landmarkerRef.current = lm
      setLokalStrom(strom)
      setLandmarkerKlar(true)
      lyder.velg()
    } catch (err) {
      if (!modellFeilet) {
        setKameraFeil(kameraFeilTekst(err))
      }
      stoppStrom(nyStrom)
      stoppStrom(lokalStromRef.current)
      lokalStromRef.current = null
      setLokalStrom(null)
    } finally {
      setStarterKamera(false)
    }
  }, [starterKamera])

  const skruAvKamera = useCallback(() => {
    stoppStrom(lokalStromRef.current)
    lokalStromRef.current = null
    setLokalStrom(null)
    setEgenVeiledning(null)
    settKlar(false)
    if (meg) send("kamera", { id: meg, pa: false })
  }, [meg, send, settKlar])

  const blokkerOgForlat = useCallback(() => {
    stoppStrom(lokalStromRef.current)
    lokalStromRef.current = null
    setLokalStrom(null)
    webrtc.lukkForbindelse()
    if (meg) send("forlat", { id: meg, navn: bruker.visningsnavn })
    router.push("/spill/moggern")
  }, [bruker.visningsnavn, meg, router, send, webrtc])

  // ---- Countdown & measurement clock ----
  useEffect(() => {
    if (status.fase !== "nedtelling" && status.fase !== "maling") return
    const id = window.setInterval(() => setNa(serverNa()), 100)
    return () => window.clearInterval(id)
  }, [status.fase])

  const gjenstarMs = useMemo(() => {
    if (status.fase === "nedtelling") {
      return Math.max(0, status.faseStartTid + NEDTELLING_MS - na)
    }
    if (status.fase === "maling") {
      return Math.max(0, status.faseStartTid + MALING_MS - na)
    }
    return 0
  }, [status.fase, status.faseStartTid, na])

  // Countdown ticks (3, 2, 1) and host transition to "maling".
  useEffect(() => {
    if (status.fase !== "nedtelling") {
      sisteTickRef.current = null
      return
    }
    const sek = Math.ceil(gjenstarMs / 1000)
    if (sek >= 1 && sek <= 3 && sisteTickRef.current !== sek) {
      sisteTickRef.current = sek
      lyder.tikk((3 - sek) / 3)
    }
    if (erVert && gjenstarMs <= 0) {
      nyFase((s) => (s.fase === "nedtelling" ? { ...s, fase: "maling", faseStartTid: serverNa() } : s))
    }
  }, [status.fase, gjenstarMs, erVert, nyFase])

  // Live preview framing guidance during lobby & countdown (own camera only).
  useEffect(() => {
    if ((status.fase !== "lobby" && status.fase !== "nedtelling") || !lokalStrom || !landmarkerKlar) return
    const lerret = (lerretRef.current ??= document.createElement("canvas"))
    const id = window.setInterval(() => {
      const lm = landmarkerRef.current
      const video = egenVideoRef.current
      if (!lm || !video) return
      try {
        const ut = analyserVideoRamme(lm, video, lerret)
        if (ut) setEgenVeiledning(ut.ramme.veiledning)
      } catch {
        // Ignore single-frame inference hiccup.
      }
    }, FORHANDSVISNING_INTERVALL_MS)
    return () => window.clearInterval(id)
  }, [status.fase, lokalStrom, landmarkerKlar])

  // ---- 10-second live dual-face measurement ----
  const lagRapport = useCallback((): MoggernRapport | null => {
    if (!meg) return null
    const bygg = (rammer: RammeResultat[], lys: LysAnalyse[]): SpillerMaaling => {
      const samlet = aggregerRammer(rammer)
      return {
        ok: samlet.ok,
        total: samlet.total,
        delpoeng: samlet.delpoeng,
        lysStatus: samleLysStatus(lys),
        kvalitet: samlet.kvalitet,
      }
    }
    return {
      runde: status.runde,
      av: meg,
      egen: egenRammerRef.current.length ? bygg(egenRammerRef.current, egenLysRef.current) : null,
      motstander: motRammerRef.current.length ? bygg(motRammerRef.current, motLysRef.current) : null,
    }
  }, [meg, status.runde])

  useEffect(() => {
    if (status.fase !== "maling") return
    egenRammerRef.current = []
    egenLysRef.current = []
    motRammerRef.current = []
    motLysRef.current = []
    sendtRapportRundeRef.current = null
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGyldigeEgen(0)
    setGyldigeMot(0)

    const lerret = (lerretRef.current ??= document.createElement("canvas"))
    const id = window.setInterval(() => {
      const lm = landmarkerRef.current
      if (!lm) return

      const egenVideo = egenVideoRef.current
      if (egenVideo) {
        try {
          const ut = analyserVideoRamme(lm, egenVideo, lerret)
          if (ut) {
            egenRammerRef.current.push(ut.ramme)
            egenLysRef.current.push(ut.lys)
            setEgenVeiledning(ut.ramme.veiledning)
            if (ut.ramme.gyldig) setGyldigeEgen((n) => n + 1)
          }
        } catch {}
      }

      const fjernVideo = fjernVideoRef.current
      if (fjernVideo) {
        try {
          const ut = analyserVideoRamme(lm, fjernVideo, lerret)
          if (ut) {
            motRammerRef.current.push(ut.ramme)
            motLysRef.current.push(ut.lys)
            if (ut.ramme.gyldig) setGyldigeMot((n) => n + 1)
          }
        } catch {}
      }
    }, MAALING_INTERVALL_MS)

    return () => window.clearInterval(id)
  }, [status.fase, status.runde])

  // Send measurement report as soon as the 10 seconds finish.
  useEffect(() => {
    if (status.fase !== "maling" || !meg || gjenstarMs > 0) return
    if (sendtRapportRundeRef.current === status.runde) return
    sendtRapportRundeRef.current = status.runde

    const rapport = lagRapport()
    if (!rapport) return
    settStatus((s) =>
      s.runde === rapport.runde && !s.rapporter[rapport.av]
        ? { ...s, rapporter: { ...s.rapporter, [rapport.av]: rapport } }
        : s,
    )
    send("rapport", rapport as unknown as Record<string, unknown>)

    // Re-send once after 1 s in case the first broadcast raced with phase change.
    const reprise = window.setTimeout(() => {
      send("rapport", rapport as unknown as Record<string, unknown>)
    }, 1000)
    return () => window.clearTimeout(reprise)
  }, [status.fase, status.runde, meg, gjenstarMs, lagRapport, settStatus, send])

  // Host transitions from "maling" to "resultat" once both reports are in (or after 4.5 s timeout).
  useEffect(() => {
    if (!erVert || status.fase !== "maling") return
    const alleHarSendt =
      status.deltakere.length === MOGGERN_MAKS_SPILLERE &&
      status.deltakere.every((d) => !!status.rapporter[d.id])
    const utlopt = na >= status.faseStartTid + MALING_MS + 4500

    if (alleHarSendt || utlopt) {
      nyFase((s) => (s.fase === "maling" ? { ...s, fase: "resultat" } : s))
    }
  }, [erVert, status.fase, status.deltakere, status.rapporter, status.faseStartTid, na, nyFase])

  // ---- Start duel / rematch actions ----
  const motstanderKlar = !!motstander && motstander.klar && motstander.runde === status.runde
  const motstanderHarVideo = !!webrtc.fjernStrom || motstanderKameraPa
  const kanStarteDuell =
    erVert &&
    status.fase === "lobby" &&
    aktiveSpillere.length === MOGGERN_MAKS_SPILLERE &&
    !!lokalStrom &&
    landmarkerKlar &&
    motstanderHarVideo &&
    motstanderKlar

  const startDuell = useCallback(() => {
    if (!kanStarteDuell) return
    const deltakere = velgMoggernDeltakere(aktiveSpillere)
    if (deltakere.length !== MOGGERN_MAKS_SPILLERE) return
    lyder.velg()
    nyFase((s) => ({
      ...s,
      fase: "nedtelling",
      deltakere,
      faseStartTid: serverNa(),
      rapporter: {},
    }))
  }, [kanStarteDuell, aktiveSpillere, nyFase])

  const kopierLenke = useCallback(async () => {
    const lenke = typeof window !== "undefined" ? window.location.href : ""
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "Moggern · thodh.com", text: `Bli med i Moggern-duell (${kode})!`, url: lenke })
        return
      }
      await navigator.clipboard.writeText(lenke)
      setKopiert(true)
      window.setTimeout(() => setKopiert(false), 1800)
    } catch {}
  }, [kode])

  if (erFullt) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <Kort className="border-white/10 p-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-rose-400">Rom {kode} er fullt</p>
          <h2 className="mt-2 font-[family-name:var(--font-visning)] text-2xl font-extrabold text-neutral-950">
            Maks 2 spillere per duell
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            Det er allerede to venner i dette rommet. Lag ditt eget rom for å starte en ny 1v1-duell.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Knapp
              onClick={() => router.push(`/spill/moggern/${lagKode()}`)}
              className="!bg-lime-400 !font-bold !text-neutral-950 hover:!bg-lime-300"
            >
              Lag nytt rom
            </Knapp>
            <Link
              href="/spill/moggern"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-medium text-neutral-900 hover:bg-white/10"
            >
              Tilbake
            </Link>
          </div>
        </Kort>
      </div>
    )
  }

  const nedtellingTall = Math.max(1, Math.min(3, Math.ceil(gjenstarMs / 1000)))
  const maalingSek = (gjenstarMs / 1000).toFixed(1).replace(".", ",")
  const maalingFremdrift = Math.min(100, Math.max(0, ((MALING_MS - gjenstarMs) / MALING_MS) * 100))

  const lobbyHint = !lokalStrom
    ? "Slå på kameraet ditt først for å gjøre deg klar."
    : !motstander
      ? "Del lenken eller koden med én venn for å starte."
      : !motstanderHarVideo
        ? `Venter på at ${motstander.navn || "motstanderen"} slår på kameraet.`
        : !motstanderKlar
          ? `Venter på at ${motstander.navn || "motstanderen"} trykker «Klar».`
          : "Begge er klare — trykk Start for 3-2-1 og 10 sekunders måling!"

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      {/* Top room bar: room code, invite link, auth badge & quick leave/block */}
      <Kort className="flex flex-wrap items-center justify-between gap-3 border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">Romkode (1v1)</p>
            <p className="font-mono text-2xl leading-none font-bold tracking-[0.2em] text-lime-400">{kode}</p>
          </div>
          <button
            type="button"
            onClick={kopierLenke}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 text-xs font-medium text-neutral-900 transition hover:bg-white/10"
          >
            {kopiert ? <Check className="h-3.5 w-3.5 text-lime-400" /> : <Copy className="h-3.5 w-3.5" />}
            {kopiert ? "Kopiert!" : "Kopier lenke"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 font-mono text-[11px] text-neutral-700">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            {bruker.visningsnavn}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 font-mono text-[11px] text-neutral-700">
            {tilkobling === "klar" ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                {aktiveSpillere.length}/2 i rommet
              </>
            ) : tilkobling === "feil" ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                Tilkoblingsfeil
              </>
            ) : (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" aria-hidden="true" />
                Kobler til …
              </>
            )}
          </span>
          <button
            type="button"
            onClick={blokkerOgForlat}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/10 px-3.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Blokker / forlat
          </button>
        </div>
      </Kort>

      {forlattVarsel ? (
        <div role="status" className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-xs text-amber-100">
          {forlattVarsel}
        </div>
      ) : null}

      {/* Result reveal screen */}
      {status.fase === "resultat" ? (
        <MoggernResultat
          kode={kode}
          runde={status.runde}
          deltakere={status.deltakere}
          rapporter={status.rapporter}
          meg={meg}
          erVert={erVert}
          onOmkamp={() => {
            lyder.velg()
            settKlar(false)
            spillIgjen()
          }}
        />
      ) : null}

      {/* Live 1v1 camera stage (kept mounted during lobby, countdown & measurement; hidden only if needed) */}
      {status.fase !== "resultat" ? (
        <section className="flex flex-col gap-4">
          {/* Countdown or measurement progress banner */}
          {status.fase === "nedtelling" ? (
            <Kort className="border-lime-400/40 bg-lime-400/10 p-4 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-lime-300">Se rett inn i kameraet!</p>
              <p className="mel-pop mt-1 font-[family-name:var(--font-visning)] text-6xl leading-none font-black tabular-nums text-lime-400">
                {nedtellingTall}
              </p>
            </Kort>
          ) : null}

          {status.fase === "maling" ? (
            <Kort className="border-lime-400/35 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-[family-name:var(--font-visning)] text-lg font-extrabold text-neutral-950">
                  {gjenstarMs > 0 ? "Måler — se rett inn i kameraet!" : "Beregner resultat …"}
                </p>
                <span className="font-mono text-lg font-bold tabular-nums text-lime-400">{maalingSek} s</span>
              </div>
              <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-lime-400 transition-[width] duration-100"
                  style={{ width: `${maalingFremdrift}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-neutral-600">
                <span>
                  Dine gyldige bilder: <strong className="text-neutral-950">{gyldigeEgen}</strong> (minst {MIN_GYLDIGE_RAMMER})
                </span>
                <span>
                  Motstander målt: <strong className="text-neutral-950">{gyldigeMot}</strong> bilder
                </span>
              </div>
            </Kort>
          ) : null}

          {/* Side-by-side 1v1 camera feeds */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Local player video card */}
            <Kort className="overflow-hidden border-white/10 p-3">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/50">
                {lokalStrom ? (
                  <video
                    ref={egenVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full -scale-x-100 object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-neutral-500">
                      <CameraOff className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-medium text-neutral-800">Kameraet ditt er av</p>
                    <p className="max-w-xs text-xs leading-5 text-neutral-500">
                      Ingenting sendes eller måles før du selv trykker på knappen under.
                    </p>
                  </div>
                )}

                {/* Top-left name badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {erVert ? <Crown className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" /> : null}
                  <span>{bruker.visningsnavn} (deg)</span>
                </div>

                {/* Live pose guidance pill */}
                {lokalStrom && egenVeiledning ? (
                  <div
                    className={`absolute inset-x-3 bottom-3 rounded-xl px-3 py-1.5 text-center text-xs font-semibold backdrop-blur-sm ${
                      egenVeiledning === "ok"
                        ? "bg-emerald-500/80 text-neutral-950"
                        : "bg-black/75 text-amber-200"
                    }`}
                  >
                    {VEILEDNING_TEKST[egenVeiledning]}
                  </div>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                {!lokalStrom ? (
                  <Knapp
                    onClick={() => void skruPaKamera()}
                    disabled={starterKamera}
                    className="!h-10 !bg-lime-400 !px-4 !text-xs !font-bold !text-neutral-950 hover:!bg-lime-300"
                  >
                    {starterKamera ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    {starterKamera ? "Starter kamera & modell …" : "Slå på kamera"}
                  </Knapp>
                ) : (
                  <Knapp variant="sekundar" onClick={skruAvKamera} className="!h-10 !px-4 !text-xs">
                    <CameraOff className="h-4 w-4" />
                    Skru av kamera
                  </Knapp>
                )}

                {status.fase === "lobby" && !erVert && lokalStrom && landmarkerKlar ? (
                  <Knapp
                    onClick={() => {
                      lyder.velg()
                      settKlar(!klar)
                    }}
                    className={`!h-10 !px-4 !text-xs !font-bold ${
                      klar ? "!bg-emerald-400 !text-neutral-950 hover:!bg-emerald-300" : "!bg-neutral-950 !text-neutral-50"
                    }`}
                  >
                    <UserCheck className="h-4 w-4" />
                    {klar ? "Klar ✓ (trykk for å angre)" : "Klar til duell"}
                  </Knapp>
                ) : null}
              </div>

              {kameraFeil ? <p className="mt-2 text-xs text-rose-400">{kameraFeil}</p> : null}
              {landmarkerFeil ? <p className="mt-2 text-xs text-rose-400">{landmarkerFeil}</p> : null}
            </Kort>

            {/* Opponent video card */}
            <Kort className="overflow-hidden border-white/10 p-3">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/50">
                {webrtc.fjernStrom ? (
                  <video
                    ref={fjernVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-neutral-500">
                      {motstander ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-6 w-6" />}
                    </span>
                    <p className="text-sm font-medium text-neutral-800">
                      {!motstander
                        ? "Venter på motstander …"
                        : motstanderKameraPa
                          ? `Kobler video til ${motstander.navn || "motstanderen"} …`
                          : `${motstander.navn || "Motstanderen"} har kameraet av`}
                    </p>
                    <p className="max-w-xs text-xs leading-5 text-neutral-500">
                      {!motstander
                        ? `Send romkoden ${kode} eller lenken over til én venn.`
                        : "Videoen går direkte mellom nettleserne deres (peer-to-peer)."}
                    </p>
                  </div>
                )}

                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {motstander && !erVert ? <Crown className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" /> : null}
                  <span>{motstander ? motstander.navn || "Motstander" : "Ledig plass"}</span>
                </div>

                {motstander ? (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 font-mono text-[10px] text-neutral-200 backdrop-blur-sm">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        webrtc.status === "tilkoblet"
                          ? "bg-emerald-400"
                          : webrtc.status === "feil"
                            ? "bg-rose-400"
                            : "bg-amber-300"
                      }`}
                    />
                    {webrtc.status === "tilkoblet" ? "P2P live" : webrtc.status === "feil" ? "Video-feil" : "Kobler…"}
                  </div>
                ) : null}
              </div>

              <div className="mt-3 flex min-h-10 flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
                <span>
                  {!motstander
                    ? "Ingen motstander i rommet ennå."
                    : motstanderKlar
                      ? `${motstander.navn || "Motstanderen"} er klar ✓`
                      : erVert
                        ? `Venter på at ${motstander.navn || "motstanderen"} blir klar`
                        : `${motstander.navn || "Verten"} starter duellen`}
                </span>
                {webrtc.status === "feil" && motstander ? (
                  <button
                    type="button"
                    onClick={webrtc.koblePaaNytt}
                    className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-neutral-900 hover:bg-white/10"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Koble til på nytt
                  </button>
                ) : null}
              </div>

              {webrtc.feil ? <p className="mt-2 text-xs text-rose-400">{webrtc.feil}</p> : null}
            </Kort>
          </div>

          {/* Lobby action bar */}
          {status.fase === "lobby" ? (
            <Kort className="flex flex-col items-start justify-between gap-3 border-white/10 p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-neutral-950">
                  {erVert ? "Du er vert for duellen" : "Klar for 10 sekunders måling?"}
                </p>
                <p className="text-xs leading-5 text-neutral-600">
                  {erVert
                    ? lobbyHint
                    : !lokalStrom
                      ? "Slå på kameraet ditt og trykk «Klar til duell»."
                      : klar
                        ? `Du er klar! Venter på at ${motstander?.navn || "verten"} starter.`
                        : "Trykk «Klar til duell» når du sitter i godt lys og ser rett i kameraet."}
                </p>
              </div>
              {erVert ? (
                <Knapp
                  onClick={startDuell}
                  disabled={!kanStarteDuell}
                  className="w-full shrink-0 !bg-lime-400 !font-bold !text-neutral-950 hover:!bg-lime-300 disabled:!bg-neutral-300 disabled:!text-neutral-600 sm:w-auto"
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  Start duell (10 s)
                </Knapp>
              ) : null}
            </Kort>
          ) : null}
        </section>
      ) : null}

      <SlikRegnesDet />
    </div>
  )
}
